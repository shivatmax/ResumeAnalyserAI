/// <reference lib="webworker" />

import { createClient } from '@supabase/supabase-js';

declare const self: DedicatedWorkerGlobalScope;

let supabaseClient;

// Worker for processing resumes in parallel
self.onmessage = async (e) => {
  const { file, userId, jobId, supabaseConfig } = e.data;

  if (!supabaseClient) {
    supabaseClient = createClient(
      supabaseConfig.url,
      supabaseConfig.serviceRoleKey
    );
  }

  try {
    const result = await processResume(file, userId, jobId);
    self.postMessage({ success: true, result });
  } catch (error) {
    self.postMessage({ success: false, error: error.message });
  }
};

const processResume = async (file, userId, jobId) => {
  try {
    const fileExt = file.name.split('.').pop();
    const filePath = `${userId}/${crypto.randomUUID()}.${fileExt}`;

    // Upload resume
    const { error: uploadError } = await supabaseClient.storage
      .from('resumes')
      .upload(filePath, file);

    if (uploadError) throw new Error(`Upload error: ${uploadError.message}`);

    const {
      data: { publicUrl },
    } = supabaseClient.storage.from('resumes').getPublicUrl(filePath);

    // Process resume using Edge Functions
    const { data: parsedResponse, error: parseError } =
      await supabaseClient.functions.invoke('parse-resume', {
        body: { resumeUrl: publicUrl },
      });

    if (parseError || !parsedResponse?.data) {
      throw new Error(
        `Parse error: ${parseError?.message || 'No parsed data received'}`
      );
    }

    // Get job analysis
    const { data: jobData, error: jobError } = await supabaseClient
      .from('jobs')
      .select('ai_analysis')
      .eq('id', jobId)
      .single();

    if (jobError || !jobData?.ai_analysis) {
      throw new Error(
        `Job data error: ${jobError?.message || 'No job analysis found'}`
      );
    }

    // Score application
    const { data: scoringResult, error: scoringError } =
      await supabaseClient.functions.invoke('score-application', {
        body: {
          jobAnalysis: jobData.ai_analysis,
          resumeData: parsedResponse.data,
        },
      });

    if (scoringError || !scoringResult) {
      throw new Error(
        `Scoring error: ${
          scoringError?.message || 'No scoring result received'
        }`
      );
    }

    return {
      job_id: jobId,
      applicant_id: userId,
      resume_url: publicUrl,
      status: 'pending',
      parsed_data: parsedResponse.data,
      score: scoringResult.overall_score,
      scoring_breakdown: scoringResult.scoring_breakdown,
      strengths: scoringResult.analysis.strengths,
      gaps: scoringResult.analysis.gaps,
      recommendation: scoringResult.recommendation,
    };
  } catch (error) {
    console.error(`Error processing resume ${file.name}:`, error);
    throw error;
  }
};
