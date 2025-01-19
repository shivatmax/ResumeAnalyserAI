import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const parseResume = async (resume) => {
  const { data, error } = await supabase.functions.invoke('parse-resume', {
    body: { resumeUrl: resume.url },
  });
  if (error) throw error;
  return data;
};

const scoreApplication = async (parsedData) => {
  const { data, error } = await supabase.functions.invoke('score-application', {
    body: parsedData,
  });
  if (error) throw error;
  return data;
};

const BATCH_SIZE = 5;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const processWithRetry = async (resume, retries = 0) => {
  try {
    const parsed = await parseResume(resume);
    const scored = await scoreApplication(parsed);
    return { success: true, data: scored };
  } catch (error) {
    if (retries < MAX_RETRIES) {
      await sleep(RETRY_DELAY * (retries + 1));
      return processWithRetry(resume, retries + 1);
    }
    return { success: false, error: error.message };
  }
};

interface ProcessResult {
  success: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;
  error?: string;
}

const results: ProcessResult[] = [];

serve(async (req) => {
  const { resumes } = await req.json();

  for (let i = 0; i < resumes.length; i += BATCH_SIZE) {
    const batch = resumes.slice(i, Math.min(i + BATCH_SIZE, resumes.length));

    const batchPromises = batch.map((resume) => processWithRetry(resume));
    const batchResults = await Promise.all(batchPromises);
    results.push(...(batchResults as ProcessResult[]));

    // Rate limiting pause between batches
    if (i + BATCH_SIZE < resumes.length) {
      await sleep(1000);
    }
  }

  return new Response(
    JSON.stringify({
      results,
      summary: {
        total: resumes.length,
        successful: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
      },
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );
});
