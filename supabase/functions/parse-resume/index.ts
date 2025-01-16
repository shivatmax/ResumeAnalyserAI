import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const UNSTRUCTURED_API_KEY = Deno.env.get('UNSTRUCTURED_API_KEY');
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!UNSTRUCTURED_API_KEY) {
  throw new Error('Missing UNSTRUCTURED_API_KEY');
}

if (!OPENAI_API_KEY) {
  throw new Error('Missing OPENAI_API_KEY');
}

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase environment variables');
}

async function extractStructuredData(text: string) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert at extracting structured information from resumes. Extract the information in a consistent format."
        },
        {
          role: "user",
          content: text
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          type: "object",
          properties: {
            personal_information: {
              type: "object",
              properties: {
                name: { type: "string" },
                email: { type: "string" },
                phone: { type: "string" }
              },
              required: ["name"]
            },
            education: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  university: { type: "string" },
                  graduation_year: { type: "string" },
                  course: { type: "string" },
                  gpa: { type: "string" }
                },
                required: ["university", "course"]
              }
            },
            professional_experience: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  company: { type: "string" },
                  position: { type: "string" },
                  duration: { type: "string" },
                  responsibilities: {
                    type: "array",
                    items: { type: "string" }
                  }
                },
                required: ["company", "position"]
              }
            },
            skills: {
              type: "array",
              items: { type: "string" }
            },
            certifications: {
              type: "array",
              items: { type: "string" }
            },
            projects: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  technologies: {
                    type: "array",
                    items: { type: "string" }
                  }
                },
                required: ["name"]
              }
            }
          },
          required: ["personal_information", "education", "skills"]
        }
      }
    })
  });

  const data = await response.json();
  return data.choices[0].message.content;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { resumeUrl } = await req.json();
    if (!resumeUrl) {
      throw new Error('No resume URL provided');
    }

    console.log('Received resume URL:', resumeUrl);

    const url = new URL(resumeUrl);
    const pathParts = url.pathname.split('/');
    const bucket = pathParts[pathParts.length - 3];
    const filePath = pathParts.slice(-2).join('/');

    console.log('Bucket:', bucket, 'File path:', filePath);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: fileData, error: downloadError } = await supabase.storage
      .from(bucket)
      .download(filePath);

    if (downloadError) {
      console.error('Error downloading file:', downloadError);
      throw new Error(`Failed to download resume: ${downloadError.message}`);
    }

    if (!fileData) {
      throw new Error('No file data received');
    }

    console.log('Successfully downloaded resume, size:', fileData.size);

    const formData = new FormData();
    const blob = new Blob([fileData], { type: 'application/pdf' });
    formData.append('files', blob, 'resume.pdf');
    formData.append('strategy', 'hi_res');

    console.log('Sending request to Unstructured API...');
    const unstructuredResponse = await fetch('https://api.unstructured.io/general/v0.2.0/general', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'unstructured-api-key': UNSTRUCTURED_API_KEY,
      },
      body: formData,
    });

    if (!unstructuredResponse.ok) {
      const errorText = await unstructuredResponse.text();
      console.error('Unstructured API error:', {
        status: unstructuredResponse.status,
        statusText: unstructuredResponse.statusText,
        body: errorText,
      });
      throw new Error(
        `Unstructured API error: ${unstructuredResponse.statusText}. Details: ${errorText}`
      );
    }

    const extractedText = await unstructuredResponse.json();
    console.log('Successfully extracted text from resume');

    // Process the parsed data to extract only the text
    const processedText = extractedText.map((item: any) => item.text).join('\n');
    
    // Use OpenAI to extract structured information
    const structuredData = await extractStructuredData(processedText);
    console.log('Successfully parsed resume structure');

    return new Response(
      JSON.stringify({
        success: true,
        data: structuredData,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});