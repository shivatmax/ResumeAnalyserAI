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
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileUp, Briefcase, CheckCircle2, AlertCircle } from 'lucide-react';

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
      <div className='flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 via-white to-orange-50'>
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent" />
      </div>
    );

  return (
    <div className='min-h-screen overflow-hidden bg-gradient-to-br from-purple-50 via-white to-orange-50'>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className='container mx-auto p-6 space-y-8'
      >
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className='bg-white/80 backdrop-blur-lg rounded-xl shadow-lg overflow-hidden'
        >
          <div className='p-6 space-y-4'>
            <div className='flex items-center gap-3 mb-4'>
              <Upload className='w-8 h-8 text-primary animate-bounce' />
              <h2 className='text-2xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent'>
                Upload Multiple Resumes
              </h2>
            </div>
            <div className='relative group'>
              <Input
                type='file'
                accept='.pdf'
                multiple
                onChange={handleFileChange}
                className='cursor-pointer mb-4 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-dark'
                disabled={isUploading}
              />
              <div className='absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-lg' />
            </div>
            <p className='text-sm text-gray-500 mb-2 flex items-center gap-2'>
              <FileUp className='w-4 h-4' />
              Selected: {selectedFiles ? selectedFiles.length : 0} resumes
            </p>
            {isUploading && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className='space-y-2'
              >
                <Progress
                  value={progress}
                  className='h-2 bg-gray-100'
                />
                <p className='text-sm text-gray-600 flex items-center gap-2'>
                  <span className='animate-pulse'>
                    <CheckCircle2 className='w-4 h-4 text-primary' />
                  </span>
                  Processing: {processedCount} of {totalFiles} resumes
                </p>
              </motion.div>
            )}
          </div>
        </motion.div>

        <div className='flex justify-between items-center mb-6 bg-white/80 backdrop-blur-lg rounded-lg p-4 shadow-lg'>
          <div className='flex items-center gap-3'>
            <Briefcase className='w-8 h-8 text-primary' />
            <h1 className='text-3xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent'>
              Select a Job
            </h1>
          </div>
          <Button
            onClick={handleMassApply}
            disabled={!selectedJob || !selectedFiles || isUploading}
            className='group relative overflow-hidden hover:shadow-xl transition-all duration-300'
          >
            <span className='relative z-10 flex items-center gap-2'>
              {isUploading ? (
                <>
                  <span className='animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent' />
                  Processing {processedCount}/{totalFiles} Resumes...
                </>
              ) : (
                <>
                  <Upload className='w-5 h-5' />
                  Apply with {selectedFiles?.length || 0} Resumes
                </>
              )}
            </span>
            <div className='absolute inset-0 bg-gradient-to-r from-primary-light via-primary to-primary-dark opacity-0 group-hover:opacity-100 transition-opacity duration-300' />
          </Button>
        </div>

        <RadioGroup
          value={selectedJob || ''}
          onValueChange={(value) => setSelectedJob(value)}
          className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
        >
          <AnimatePresence>
            {jobs?.map((job, index) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className='relative'
              >
                <RadioGroupItem
                  value={job.id}
                  id={job.id}
                  className='peer sr-only'
                />
                <Label
                  htmlFor={job.id}
                  className='flex flex-col p-6 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg cursor-pointer border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 peer-data-[state=checked]:border-primary peer-data-[state=checked]:shadow-primary/20'
                >
                  <h2 className='text-xl font-semibold text-gray-900 mb-2'>{job.title}</h2>
                  <p className='text-primary font-medium mb-2'>{job.company_name}</p>
                  <p className='text-sm text-gray-600 mb-2 flex items-center gap-2'>
                    <AlertCircle className='w-4 h-4' />
                    {job.location}
                  </p>
                  <p className='text-sm text-gray-600 mb-4'>{job.employment_type}</p>
                  <div className='absolute top-2 right-2'>
                    <CheckCircle2 className='w-6 h-6 text-primary opacity-0 peer-data-[state=checked]:opacity-100 transition-opacity duration-300' />
                  </div>
                </Label>
              </motion.div>
            ))}
          </AnimatePresence>
        </RadioGroup>
      </motion.div>
    </div>
  );
};

export default MassApplier;
