import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
            content: `Please analyze this job information and extract key details for scoring candidates. 
            Job Title: ${jobData.title}
            Job Description: ${jobData.description}
            Additional Info: ${jobData.additional_info || ''}
            Required Skills: ${jobData.skills.join(', ')}`
          }
        ],
        temperature: 0.7,
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

    const analysis = {
      required_skills: data.choices[0].message.content.match(/\b\w+\b/g) || [],
      experience_requirements: {
        minimum_years: parseInt(data.choices[0].message.content.match(/\d+/)?.[0] || '0'),
        level: jobData.experience_level.toUpperCase()
      },
      education_requirements: jobData.education_requirements || 'Not specified',
      key_responsibilities: data.choices[0].message.content.split('\n').filter(line => line.trim()),
      scoring_criteria: {
        technical_skills_weight: 0.4,
        experience_weight: 0.3,
        education_weight: 0.3
      }
    };

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-job function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});