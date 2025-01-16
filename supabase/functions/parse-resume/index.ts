import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

const UNSTRUCTURED_API_KEY = Deno.env.get('UNSTRUCTURED_API_KEY')
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { resumeUrl } = await req.json()
    console.log('Processing resume URL:', resumeUrl)

    // Download resume content
    const response = await fetch(resumeUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch resume: ${response.statusText}`)
    }
    const blob = await response.blob()
    console.log('Successfully downloaded resume')

    // Parse resume with Unstructured
    const formData = new FormData()
    formData.append('files', blob, 'resume.pdf')

    const unstructuredResponse = await fetch('https://api.unstructured.io/general/v0.2.0/general', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'unstructured-api-key': UNSTRUCTURED_API_KEY!,
      },
      body: formData,
    })

    if (!unstructuredResponse.ok) {
      throw new Error(`Unstructured API error: ${unstructuredResponse.statusText}`)
    }

    const parsedData = await unstructuredResponse.json()
    console.log('Unstructured API response:', JSON.stringify(parsedData))

    // Structure data with OpenAI
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
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