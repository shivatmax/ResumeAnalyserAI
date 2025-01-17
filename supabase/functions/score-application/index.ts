import 'https://deno.land/x/xhr@0.1.0/mod.ts';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { jobAnalysis, resumeData } = await req.json();

    if (!jobAnalysis || !resumeData) {
      throw new Error('Missing required data for scoring');
    }

    console.log('Scoring application with data:', {
      jobAnalysis,
      resumeData,
    });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert AI recruiter that scores job applications based on how well they match the job requirements. 
            You will analyze both the job requirements and the candidate's resume to provide a detailed scoring breakdown.
            You must follow the scoring rubric provided in the job analysis exactly.`,
          },
          {
            role: 'user',
            content: `Please score this application based on the following data:

Job Analysis:
${JSON.stringify(jobAnalysis, null, 2)}

Resume Data:
${JSON.stringify(resumeData, null, 2)}

Provide a structured response with:
1. Overall score (0-100)
2. Detailed breakdown following the job's scoring rubric
3. Strengths and gaps analysis
4. Brief recommendation

The response must be valid JSON with these exact fields.`,
          },
        ],
        temperature: 0.1,
        max_tokens: 1000,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('OpenAI response:', data);

    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from OpenAI');
    }

    const scoringResult = JSON.parse(data.choices[0].message.content);
    console.log('Parsed scoring result:', scoringResult);

    return new Response(JSON.stringify(scoringResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in score-application function:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
        details: error.stack,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});