import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const UNSTRUCTURED_API_KEY = Deno.env.get('UNSTRUCTURED_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

if (!UNSTRUCTURED_API_KEY) {
  throw new Error('Missing UNSTRUCTURED_API_KEY')
}

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase environment variables')
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { resumeUrl } = await req.json()
    if (!resumeUrl) {
      throw new Error('No resume URL provided')
    }

    console.log('Received resume URL:', resumeUrl)

    // Extract bucket and file path from the URL
    const url = new URL(resumeUrl)
    const pathParts = url.pathname.split('/')
    const bucket = pathParts[pathParts.length - 3]
    const filePath = pathParts.slice(-2).join('/')

    console.log('Bucket:', bucket, 'File path:', filePath)

    // Initialize Supabase client with service role key
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Download the file from Supabase storage
    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from(bucket)
      .download(filePath)

    if (downloadError) {
      console.error('Error downloading file:', downloadError)
      throw new Error(`Failed to download resume: ${downloadError.message}`)
    }

    if (!fileData) {
      throw new Error('No file data received')
    }

    console.log('Successfully downloaded resume, size:', fileData.size)

    // Create form data with the PDF file
    const formData = new FormData()
    formData.append('files', new Blob([fileData], { type: 'application/pdf' }), 'resume.pdf')

    console.log('Sending request to Unstructured API...')
    const unstructuredResponse = await fetch('https://api.unstructured.io/general/v0.2.0/general', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'unstructured-api-key': UNSTRUCTURED_API_KEY,
      },
      body: formData,
    })

    if (!unstructuredResponse.ok) {
      const errorText = await unstructuredResponse.text()
      console.error('Unstructured API error:', {
        status: unstructuredResponse.status,
        statusText: unstructuredResponse.statusText,
        body: errorText
      })
      throw new Error(`Unstructured API error: ${unstructuredResponse.statusText}. Details: ${errorText}`)
    }

    const parsedData = await unstructuredResponse.json()
    console.log('Successfully parsed resume')

    // Process the parsed data to extract relevant information
    const processedData = {
      text: parsedData.map((item: any) => item.text).join('\n'),
      metadata: {
        parsed_at: new Date().toISOString(),
        source: 'unstructured-api'
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: processedData
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    )
  } catch (error) {
    console.error('Error:', error)
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
      },
    )
  }
})