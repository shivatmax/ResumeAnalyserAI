import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const UNSTRUCTURED_API_KEY = Deno.env.get('UNSTRUCTURED_API_KEY')
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { resumeUrl } = await req.json()
    console.log('Processing resume URL:', resumeUrl)

    if (!resumeUrl) {
      throw new Error('Resume URL is required')
    }

    // Initialize Supabase client with service role key
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Extract bucket and path from URL
    const url = new URL(resumeUrl)
    const pathSegments = url.pathname.split('/')
    const bucketIndex = pathSegments.findIndex(segment => segment === 'object') + 2
    const bucket = pathSegments[bucketIndex]
    const path = pathSegments.slice(bucketIndex + 1).join('/')

    console.log('Fetching file from storage:', { bucket, path })

    // Download file using Supabase client
    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from(bucket)
      .download(path)

    if (downloadError) {
      console.error('Failed to download file:', downloadError)
      throw new Error(`Failed to download file: ${downloadError.message}`)
    }

    if (!fileData) {
      throw new Error('No file data received')
    }

    console.log('Successfully downloaded resume, size:', fileData.size)

    // Generate a unique boundary string for multipart/form-data
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);

    // Create the multipart form-data manually
    const formData = new FormData();
    formData.append('files', fileData, 'resume.pdf');

    console.log('Sending request to Unstructured API...')
    const unstructuredResponse = await fetch('https://api.unstructured.io/general/v0.2.0/general', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'unstructured-api-key': UNSTRUCTURED_API_KEY!,
        // Let the browser set the Content-Type with boundary
      },
      body: formData,
    })

    if (!unstructuredResponse.ok) {
      console.error('Unstructured API error:', {
        status: unstructuredResponse.status,
        statusText: unstructuredResponse.statusText,
        body: await unstructuredResponse.text()
      })
      throw new Error(`Unstructured API error: ${unstructuredResponse.statusText}`)
    }

    const parsedData = await unstructuredResponse.json()
    console.log('Unstructured API response:', JSON.stringify(parsedData))

    // Structure data with OpenAI
    console.log('Sending request to OpenAI API...')
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{
          role: "system",
          content: "Extract structured information from this resume text. Return a JSON object with the following fields: fullName, email, phone, education (array), experience (array), skills (array)."
        }, {
          role: "user",
          content: JSON.stringify(parsedData)
        }],
        response_format: { type: "json_object" }
      })
    })

    if (!openAIResponse.ok) {
      const errorData = await openAIResponse.json()
      console.error('OpenAI API error:', errorData)
      throw new Error(`OpenAI API error: ${JSON.stringify(errorData)}`)
    }

    const openAIData = await openAIResponse.json()
    console.log('OpenAI API response:', JSON.stringify(openAIData))

    if (!openAIData.choices || !openAIData.choices[0] || !openAIData.choices[0].message) {
      throw new Error('Invalid response format from OpenAI')
    }

    const structuredData = openAIData.choices[0].message.content
    
    // Validate that the structured data is valid JSON
    try {
      JSON.parse(structuredData)
    } catch (e) {
      throw new Error('OpenAI returned invalid JSON')
    }

    return new Response(
      JSON.stringify({ success: true, data: structuredData }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error in parse-resume function:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        stack: error.stack 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})