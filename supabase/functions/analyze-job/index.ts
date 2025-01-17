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
    const { jobData } = await req.json();

    if (!jobData) {
      throw new Error('No job data provided');
    }

    console.log('Analyzing job data:', JSON.stringify(jobData));

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
            content: `You are an expert AI recruiter specializing in analyzing job postings and creating standardized candidate evaluation criteria. Your task is to carefully analyze job requirements and create clear, structured evaluation guidelines.`,
          },
          {
            role: 'user',
            content: `Please analyze this job posting and create detailed candidate evaluation criteria:

Job Title: ${jobData.title}
Job Description: ${jobData.description}
Additional Info: ${jobData.additional_info || ''}
Required Skills: ${jobData.skills.join(', ')}

Please provide a structured response but in text format with:

1. Experience Requirements
- Years of experience needed
- Type of experience required
- Specific domain expertise

2. Education Requirements  
- Minimum degree level
- Relevant fields of study
- Any certifications needed

3. Technical Skills
- Must-have technical skills
- Nice-to-have technical skills
- Technology stack requirements

4. Soft Skills & Other Requirements
- Communication requirements
- Team collaboration abilities
- Location/remote work requirements
- Language proficiency needs

5. Scoring Rubric (Total 100 points)
- Experience (0-35 points): Break down scoring for years and relevance
- Education (0-20 points): Break down by degree level and field relevance  
- Technical Skills (0-30 points): Break down for must-have vs nice-to-have skills
- Soft Skills (0-15 points): Break down for communication, teamwork, etc.

Please be specific and quantitative in your analysis while maintaining flexibility where appropriate. 
There must not be any ambiguity in the response. 
Never Greet or say anything else just the structured response.`,
          },
        ],
        temperature: 0.1,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('OpenAI response:', JSON.stringify(data));

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response format from OpenAI');
    }

    const analysis = data.choices[0].message.content;

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in analyze-job function:', error);
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
