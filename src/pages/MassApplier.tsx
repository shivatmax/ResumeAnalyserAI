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
import {
  Upload,
  FileUp,
  Briefcase,
  CheckCircle2,
  Clock,
  MapPin,
  Loader2,
  DollarSign,
  GraduationCap,
  ListChecks,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type ApplicationStatus = Database['public']['Enums']['application_status'];

const MassApplier = () => {
  const navigate = useNavigate();
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processedCount, setProcessedCount] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);
  const [jobDetailsOpen, setJobDetailsOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedJobDetails, setSelectedJobDetails] = useState<any>(null);

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

  const {
    data: jobs,
    isLoading,
    refetch,
  } = useQuery({
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

  const resetFormState = () => {
    setSelectedFiles(null);
    setSelectedJob(null);
    setProgress(0);
    setProcessedCount(0);
    setTotalFiles(0);
    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const allPdfs = Array.from(files).every(
        (file) => file.type === 'application/pdf'
      );
      if (!allPdfs) {
        toast.error('Please upload only PDF files');
        event.target.value = '';
        return;
      }
      if (files.length > 100) {
        toast.error('Maximum 100 resumes allowed');
        event.target.value = '';
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

        // Refresh the jobs data and reset form state
        await refetch();
        resetFormState();
      } else {
        toast.error('No applications were processed successfully');
      }
    } catch (error) {
      console.error('Failed to submit applications:', error);
      toast.error('Failed to submit applications');
    } finally {
      setIsUploading(false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleJobClick = (job: any) => {
    setSelectedJobDetails(job);
    setJobDetailsOpen(true);
  };

  if (isLoading)
    return (
      <div className='flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 via-white to-orange-50'>
        <div className='h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent' />
      </div>
    );

  return (
    <div className='container mx-auto p-6 overflow-hidden'>
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className='text-4xl font-display font-bold mb-8 bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent'
      >
        Mass Apply
      </motion.h1>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className='space-y-8'
      >
        <Card className='p-8 backdrop-blur-sm border border-gray-200/50 hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white/50 to-transparent'>
          <div className='space-y-4'>
            <div className='flex items-center space-x-3'>
              <Upload className='w-6 h-6 text-primary' />
              <h2 className='text-xl font-display font-semibold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent'>
                Upload Multiple Resumes
              </h2>
            </div>

            <div className='relative'>
              <Input
                type='file'
                accept='.pdf'
                multiple
                onChange={handleFileChange}
                className='cursor-pointer bg-white/50 border-gray-200/50 hover:border-primary/50 transition-colors duration-300'
                disabled={isUploading}
              />
              <Upload className='absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400' />
            </div>

            <p className='flex items-center space-x-2 text-gray-600'>
              <FileUp className='w-4 h-4' />
              <span className='text-sm'>
                Selected: {selectedFiles ? selectedFiles.length : 0} resumes
              </span>
            </p>

            {isUploading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className='space-y-2'
              >
                <Progress value={progress} />
                <p className='flex items-center space-x-2 text-gray-600'>
                  <CheckCircle2 className='w-4 h-4 text-primary animate-pulse' />
                  <span className='text-sm'>
                    Processing: {processedCount} of {totalFiles} resumes
                  </span>
                </p>
              </motion.div>
            )}

            <Button
              onClick={handleMassApply}
              disabled={!selectedJob || !selectedFiles || isUploading}
              className='w-full bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 text-white'
            >
              {isUploading ? (
                <motion.div
                  className='flex items-center'
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Processing {processedCount}/{totalFiles} Resumes...
                </motion.div>
              ) : (
                <div className='flex items-center justify-center'>
                  <Upload className='mr-2 h-4 w-4' />
                  Apply with {selectedFiles?.length || 0} Resumes
                </div>
              )}
            </Button>
          </div>
        </Card>

        <RadioGroup
          value={selectedJob || ''}
          onValueChange={(value) => setSelectedJob(value)}
          className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
        >
          <AnimatePresence>
            {jobs?.map((job) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className='overflow-hidden'
                onClick={() => handleJobClick(job)}
              >
                <RadioGroupItem
                  value={job.id}
                  id={job.id}
                  className='peer sr-only'
                />
                <Label
                  htmlFor={job.id}
                  className='block cursor-pointer'
                >
                  <Card className='p-8 backdrop-blur-sm border border-gray-200/50 hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white/50 to-transparent peer-data-[state=checked]:border-primary'>
                    <div className='space-y-4'>
                      <div className='flex items-center space-x-3'>
                        <Briefcase className='w-6 h-6 text-primary' />
                        <h2 className='text-xl font-display font-semibold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent'>
                          {job.title}
                        </h2>
                      </div>

                      <p className='text-lg font-medium text-primary/80'>
                        {job.company_name}
                      </p>

                      <div className='flex items-center space-x-2 text-gray-600'>
                        <MapPin className='w-4 h-4' />
                        <p className='text-sm'>{job.location}</p>
                      </div>

                      <div className='flex items-center space-x-2 text-gray-600'>
                        <Clock className='w-4 h-4' />
                        <p className='text-sm'>{job.employment_type}</p>
                      </div>
                    </div>
                  </Card>
                </Label>
              </motion.div>
            ))}
          </AnimatePresence>
        </RadioGroup>
      </motion.div>

      <Dialog
        open={jobDetailsOpen}
        onOpenChange={setJobDetailsOpen}
      >
        <DialogContent className='max-w-3xl max-h-[80vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle className='text-2xl font-display font-bold'>
              {selectedJobDetails?.title}
            </DialogTitle>
          </DialogHeader>
          <div className='space-y-6 py-4'>
            <div className='space-y-4'>
              <div className='flex items-center space-x-2'>
                <Briefcase className='w-5 h-5 text-primary' />
                <span className='font-medium'>
                  {selectedJobDetails?.company_name}
                </span>
              </div>
              <div className='flex items-center space-x-2'>
                <MapPin className='w-5 h-5 text-primary' />
                <span>{selectedJobDetails?.location}</span>
              </div>
              <div className='flex items-center space-x-2'>
                <Clock className='w-5 h-5 text-primary' />
                <span>{selectedJobDetails?.employment_type}</span>
              </div>
              <div className='flex items-center space-x-2'>
                <DollarSign className='w-5 h-5 text-primary' />
                <span>
                  {selectedJobDetails?.salary_min &&
                  selectedJobDetails?.salary_max
                    ? `$${selectedJobDetails.salary_min.toLocaleString()} - $${selectedJobDetails.salary_max.toLocaleString()}`
                    : 'Salary not specified'}
                </span>
              </div>
            </div>

            <div className='space-y-4'>
              <h3 className='text-lg font-semibold'>Description</h3>
              <p className='text-gray-700 whitespace-pre-wrap'>
                {selectedJobDetails?.description}
              </p>
            </div>

            {selectedJobDetails?.education_requirements && (
              <div className='space-y-2'>
                <div className='flex items-center space-x-2'>
                  <GraduationCap className='w-5 h-5 text-primary' />
                  <h3 className='text-lg font-semibold'>
                    Education Requirements
                  </h3>
                </div>
                <p className='text-gray-700'>
                  {selectedJobDetails.education_requirements}
                </p>
              </div>
            )}

            {selectedJobDetails?.skills?.length > 0 && (
              <div className='space-y-2'>
                <div className='flex items-center space-x-2'>
                  <ListChecks className='w-5 h-5 text-primary' />
                  <h3 className='text-lg font-semibold'>Required Skills</h3>
                </div>
                <div className='flex flex-wrap gap-2'>
                  {selectedJobDetails.skills.map((skill: string) => (
                    <span
                      key={skill}
                      className='px-3 py-1 bg-primary/10 text-primary rounded-full text-sm'
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MassApplier;
