import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';

type ApplicationStatus = Database['public']['Enums']['application_status'];

const MassApplier = () => {
  const navigate = useNavigate();
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processedCount, setProcessedCount] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
      }
    };
    checkAuth();
  }, [navigate]);

  const { data: jobs, isLoading } = useQuery({
    queryKey: ['mass-apply-jobs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const allPdfs = Array.from(files).every(
        (file) => file.type === 'application/pdf'
      );
      if (!allPdfs) {
        toast.error('Please upload only PDF files');
        return;
      }
      if (files.length > 100) {
        toast.error('Maximum 100 resumes allowed');
        return;
      }
      setSelectedFiles(files);
      setTotalFiles(files.length);
    }
  };

  const processResume = async (file: File, userId: string, jobId: string) => {
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${userId}/${crypto.randomUUID()}.${fileExt}`;

      // Upload resume
      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(filePath, file);

      if (uploadError) throw new Error(`Upload error: ${uploadError.message}`);

      const {
        data: { publicUrl },
      } = supabase.storage.from('resumes').getPublicUrl(filePath);

      // Parse resume using Edge Function
      const { data: parsedResponse, error: parseError } =
        await supabase.functions.invoke('parse-resume', {
          body: { resumeUrl: publicUrl },
        });

      if (parseError || !parsedResponse?.data) {
        throw new Error(
          `Parse error: ${parseError?.message || 'No parsed data received'}`
        );
      }

      // Get job analysis data
      const { data: jobData, error: jobError } = await supabase
        .from('jobs')
        .select('ai_analysis')
        .eq('id', jobId)
        .single();

      if (jobError || !jobData?.ai_analysis) {
        throw new Error(
          `Job data error: ${jobError?.message || 'No job analysis found'}`
        );
      }

      // Score the application
      const { data: scoringResult, error: scoringError } =
        await supabase.functions.invoke('score-application', {
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
        status: 'pending' as ApplicationStatus,
        parsed_data: parsedResponse.data,
        score: scoringResult.overall_score,
        scoring_breakdown: scoringResult.scoring_breakdown,
        strengths: scoringResult.analysis.strengths,
        gaps: scoringResult.analysis.gaps,
        recommendation: scoringResult.recommendation,
      };
    } catch (error) {
      console.error(`Error processing resume ${file.name}:`, error);
      throw new Error(
        `Failed to process resume ${file.name}: ${error.message}`
      );
    }
  };

  const handleMassApply = async () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      toast.error('Please select resumes to upload');
      return;
    }

    if (!selectedJob) {
      toast.error('Please select a job to apply to');
      return;
    }

    try {
      setIsUploading(true);
      setProgress(0);
      setProcessedCount(0);

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }

      const userId = session.user.id;
      const files = Array.from(selectedFiles);
      const batchSize = 3; // Reduced batch size for better reliability
      const applications = [];
      const totalFiles = files.length;

      // Process files in sequential batches
      for (let i = 0; i < files.length; i += batchSize) {
        const batch = files.slice(i, i + batchSize);
        const batchResults = [];

        // Process each file in the batch sequentially
        for (const file of batch) {
          try {
            const result = await processResume(file, userId, selectedJob);
            if (result) {
              batchResults.push(result);
              // Update progress after each successful processing
              setProcessedCount((prev) => {
                const newCount = prev + 1;
                setProgress((newCount / totalFiles) * 100);
                return newCount;
              });
            }
          } catch (error) {
            console.error(`Error processing ${file.name}:`, error);
            toast.error(`Failed to process ${file.name}: ${error.message}`);
            // Continue with next file even if current one fails
            setProcessedCount((prev) => {
              const newCount = prev + 1;
              setProgress((newCount / totalFiles) * 100);
              return newCount;
            });
          }
        }

        // Add successful results to applications array
        if (batchResults.length > 0) {
          applications.push(...batchResults);
        }

        // Optional: Add a small delay between batches to prevent rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      // Submit all successful applications to database
      if (applications.length > 0) {
        const { error: applicationError } = await supabase
          .from('applications')
          .insert(applications);

        if (applicationError) throw applicationError;

        toast.success(
          `Successfully submitted ${applications.length} out of ${totalFiles} applications!`
        );
      } else {
        toast.error('No applications were processed successfully');
      }

      // Reset form state
      setSelectedFiles(null);
      setSelectedJob(null);
      setProgress(0);
      setProcessedCount(0);
      setTotalFiles(0);
    } catch (error) {
      console.error('Failed to submit applications:', error);
      toast.error('Failed to submit applications');
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading)
    return (
      <div className='flex items-center justify-center min-h-screen'>
        Loading...
      </div>
    );

  return (
    <div className='container mx-auto p-6'>
      <div className='flex flex-col gap-6'>
        <div className='bg-white p-6 rounded-lg shadow'>
          <h2 className='text-xl font-semibold mb-4'>
            Upload Multiple Resumes
          </h2>
          <Input
            type='file'
            accept='.pdf'
            multiple
            onChange={handleFileChange}
            className='cursor-pointer mb-4'
            disabled={isUploading}
          />
          <p className='text-sm text-gray-500 mb-2'>
            Selected: {selectedFiles ? selectedFiles.length : 0} resumes
          </p>
          {isUploading && (
            <div className='space-y-2'>
              <Progress
                value={progress}
                className='w-full'
              />
              <p className='text-sm text-gray-600'>
                Processing: {processedCount} of {totalFiles} resumes
              </p>
            </div>
          )}
        </div>

        <div className='flex justify-between items-center mb-6'>
          <h1 className='text-3xl font-bold'>Select a Job</h1>
          <Button
            onClick={handleMassApply}
            disabled={!selectedJob || !selectedFiles || isUploading}
          >
            {isUploading
              ? `Processing ${processedCount}/${totalFiles} Resumes...`
              : `Apply with ${selectedFiles?.length || 0} Resumes`}
          </Button>
        </div>

        <RadioGroup
          value={selectedJob || ''}
          onValueChange={(value) => setSelectedJob(value)}
          className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
        >
          {jobs?.map((job) => (
            <div
              key={job.id}
              className='relative'
            >
              <RadioGroupItem
                value={job.id}
                id={job.id}
                className='peer sr-only'
              />
              <Label
                htmlFor={job.id}
                className='flex flex-col p-6 bg-white rounded-lg shadow cursor-pointer border-2 peer-data-[state=checked]:border-primary'
              >
                <h2 className='text-xl font-semibold mb-2'>{job.title}</h2>
                <p className='text-gray-600 mb-2'>{job.company_name}</p>
                <p className='text-sm mb-2'>{job.location}</p>
                <p className='text-sm mb-4'>{job.employment_type}</p>
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>
    </div>
  );
};

export default MassApplier;
