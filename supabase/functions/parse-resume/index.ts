import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const UNSTRUCTURED_API_KEY = Deno.env.get('UNSTRUCTURED_API_KEY')
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { resumeUrl } = await req.json()

    // Download resume content
    const response = await fetch(resumeUrl)
    const blob = await response.blob()

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

    const parsedData = await unstructuredResponse.json()

    // Structure data with OpenAI
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4",
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

    const structuredData = await openAIResponse.json()

    return new Response(
      JSON.stringify({ success: true, data: structuredData.choices[0].message.content }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})