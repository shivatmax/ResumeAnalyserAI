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
        model: 'gpt-4o-2024-08-06',
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
${jobAnalysis}

Resume Data:
${resumeData}`,
          },
        ],
        temperature: 0.1,
        max_tokens: 1000,
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'application_scoring',
            schema: {
              type: 'object',
              properties: {
                overall_score: {
                  type: 'number',
                  description: 'Overall score from 0-100',
                },
                scoring_breakdown: {
                  type: 'object',
                  description:
                    "Detailed scoring breakdown following job's rubric",
                },
                analysis: {
                  type: 'object',
                  properties: {
                    strengths: {
                      type: 'array',
                      items: { type: 'string' },
                    },
                    gaps: {
                      type: 'array',
                      items: { type: 'string' },
                    },
                  },
                  required: ['strengths', 'gaps'],
                },
                recommendation: {
                  type: 'string',
                  description: 'Brief hiring recommendation',
                },
              },
              additionalProperties: false,
            },
          },
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status} ${errorData}`);
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
