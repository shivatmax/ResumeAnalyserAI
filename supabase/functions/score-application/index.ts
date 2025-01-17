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
            content: `You are an expert ATS (Applicant Tracking System) recruiter responsible for evaluating and scoring job applications with precision and consistency. Your scoring system must:

1. Keyword Analysis (30%)
- Identify and match required skills, technologies, and qualifications
- Weight core requirements higher than preferred qualifications
- Consider semantic variations and related terms
- Analyze keyword frequency and context

2. Experience Alignment (25%)
- Evaluate years of relevant experience
- Assess role seniority matches
- Compare industry/domain expertise
- Validate project scope and impact

3. Education & Certifications (20%)
- Match degree requirements and relevant fields
- Verify professional certifications
- Consider continuing education
- Evaluate academic achievements if relevant

4. Role-Specific Achievements (15%)
- Quantifiable results and metrics
- Leadership and management experience
- Project deliverables and outcomes
- Innovation and problem-solving examples

5. Additional Factors (10%)
- Writing clarity and communication
- Career progression
- Technical proficiency levels
- Soft skills indicators

Instructions:
Assign a numerical score (0–30% for Keyword Analysis, 0–25% for Experience Alignment, etc.) for each main category, then sum for a total out of 100%.
Provide clear justifications for each category’s score, citing specific evidence from the resume (e.g., “Mentioned ‘Project Manager’ three times under experience, aligning well with the job’s requirements”).
Be objective and adhere strictly to the job’s rubric. Resumes scoring above a certain threshold (e.g., 80%) proceed to the next selection stage 1.
Use this framework to produce a comprehensive, transparent ATS evaluation and overall score, ensuring the highest relevance to the specific job description.`,
          },
          {
            role: 'user',
            content: `Please perform a comprehensive ATS evaluation and scoring based on:

Job Requirements posted by the employer:
${jobAnalysis}

Resume Data (parsed and cleaned) of the candidate:
${JSON.stringify(resumeData)}

Provide detailed scoring breakdown with specific evidence from the resume supporting each score according to the mentioned job requirements.`,
          },
        ],
        temperature: 0.2,
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
