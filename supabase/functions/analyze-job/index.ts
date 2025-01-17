import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { jobData } = await req.json();

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at analyzing job descriptions and extracting key information in a structured format for scoring candidates.'
          },
          {
            role: 'user',
            content: `Please analyze this job information and extract key details for scoring candidates. Job Description: ${jobData.description}, Additional Info: ${jobData.additional_info || ''}, Required Skills: ${jobData.skills.join(', ')}`
          }
        ],
        response_format: {
          type: "json_schema",
          schema: {
            type: "object",
            properties: {
              required_skills: {
                type: "array",
                items: { type: "string" },
                description: "List of required technical skills"
              },
              experience_requirements: {
                type: "object",
                properties: {
                  minimum_years: { type: "number" },
                  level: { 
                    type: "string",
                    enum: ["ENTRY", "MID", "SENIOR", "EXECUTIVE"]
                  }
                }
              },
              education_requirements: { type: "string" },
              key_responsibilities: {
                type: "array",
                items: { type: "string" }
              },
              scoring_criteria: {
                type: "object",
                properties: {
                  technical_skills_weight: { type: "number" },
                  experience_weight: { type: "number" },
                  education_weight: { type: "number" }
                }
              }
            },
            required: ["required_skills", "experience_requirements", "education_requirements", "key_responsibilities", "scoring_criteria"]
          }
        }
      }),
    });

    const data = await response.json();
    return new Response(JSON.stringify(data.choices[0].message.content), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in analyze-job function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});