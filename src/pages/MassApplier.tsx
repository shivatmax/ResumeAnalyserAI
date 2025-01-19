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
  X,
  Info,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { WorkerPool } from '@/utils/workerPool';

type ApplicationStatus = Database['public']['Enums']['application_status'];

const WORKER_POOL_SIZE = navigator.hardwareConcurrency || 4;
const BATCH_SIZE = 10;

const MassApplier = () => {
  const navigate = useNavigate();
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
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
    setSelectedFiles([]);
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
      const newFiles = Array.from(files);
      const invalidFiles = newFiles.filter(
        (file) => file.type !== 'application/pdf'
      );

      if (invalidFiles.length > 0) {
        toast.error('Please upload only PDF files');
        return;
      }

      const totalNewCount = selectedFiles.length + newFiles.length;
      if (totalNewCount > 100) {
        toast.error('Maximum 100 resumes allowed');
        return;
      }

      setSelectedFiles((prev) => [...prev, ...newFiles]);
      setTotalFiles(totalNewCount);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => {
      const newFiles = [...prev];
      newFiles.splice(index, 1);
      setTotalFiles(newFiles.length);
      return newFiles;
    });
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const submitApplications = async (applications: any[]) => {
    const { error } = await supabase.from('applications').insert(
      applications.map((app) => ({
        job_id: app.job_id,
        applicant_id: app.applicant_id,
        resume_url: app.resume_url,
        status: app.status,
        parsed_data: app.parsed_data,
        score: app.score,
        scoring_breakdown: app.scoring_breakdown,
        strengths: app.strengths,
        gaps: app.gaps,
        recommendation: app.recommendation,
      }))
    );

    if (error) throw new Error(`Failed to save applications: ${error.message}`);
  };

  const handleMassApply = async () => {
    if (selectedFiles.length === 0 || !selectedJob) {
      toast.error('Please select files and job');
      return;
    }

    try {
      setIsUploading(true);
      const files = selectedFiles;
      const totalFiles = files.length;
      const workerPool = new WorkerPool(
        WORKER_POOL_SIZE,
        '/src/workers/resumeProcessor.ts',
        { type: 'module' }
      );

      // Process files in batches
      const results = [];
      for (let i = 0; i < files.length; i += BATCH_SIZE) {
        const batch = files.slice(i, Math.min(i + BATCH_SIZE, files.length));

        const session = await supabase.auth.getSession();
        const userId = session?.data?.session?.user.id;
        const supabaseConfig = {
          url: import.meta.env.VITE_SUPABASE_URL,
          serviceRoleKey: import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
        };
        // Process batch in parallel
        const batchPromises = batch.map((file) =>
          workerPool
            .process(file, userId, selectedJob, supabaseConfig)
            .catch((error) => {
              console.error(`Error processing ${file.name}:`, error);
              return null;
            })
            .finally(() => {
              setProcessedCount((prev) => {
                const newCount = prev + 1;
                setProgress((newCount / totalFiles) * 100);
                return newCount;
              });
            })
        );

        // Wait for batch to complete
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults.filter(Boolean));

        // Optional: Add delay between batches to prevent rate limiting
        if (i + BATCH_SIZE < files.length) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      // Submit successful applications
      if (results.length > 0) {
        await submitApplications(results);
        toast.success(
          `Successfully processed ${results.length} out of ${totalFiles} applications`
        );
      }
    } catch (error) {
      console.error('Mass apply error:', error);
      toast.error('Failed to process applications');
    } finally {
      setIsUploading(false);
      resetFormState();
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

            <div className='space-y-2'>
              <p className='flex items-center space-x-2 text-gray-600'>
                <FileUp className='w-4 h-4' />
                <span className='text-sm'>
                  Selected: {selectedFiles.length} resumes
                </span>
              </p>

              <div className='max-h-40 overflow-y-auto space-y-2'>
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className='flex items-center justify-between bg-gray-50 p-2 rounded'
                  >
                    <span className='text-sm truncate'>{file.name}</span>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => removeFile(index)}
                      disabled={isUploading}
                    >
                      <X className='w-4 h-4 text-gray-500 hover:text-red-500' />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

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
              disabled={
                !selectedJob || selectedFiles.length === 0 || isUploading
              }
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
                  Apply with {selectedFiles.length} Resumes
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
                  <Card
                    className={`p-8 backdrop-blur-sm border hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white/50 to-transparent ${
                      selectedJob === job.id
                        ? 'border-black border-2'
                        : 'border-gray-200/50'
                    }`}
                  >
                    <div className='space-y-4'>
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center space-x-3'>
                          <Briefcase className='w-6 h-6 text-primary' />
                          <h2 className='text-xl font-display font-semibold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent'>
                            {job.title}
                          </h2>
                        </div>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleJobClick(job);
                          }}
                        >
                          <Info className='w-5 h-5 text-primary' />
                        </Button>
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
