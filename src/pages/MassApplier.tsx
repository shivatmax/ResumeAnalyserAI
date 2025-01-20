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
  ArrowLeft,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const MassApplier = () => {
  const navigate = useNavigate();
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processedCount, setProcessedCount] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);
  const [jobDetailsOpen, setJobDetailsOpen] = useState(false);
  const [showServiceEndedDialog, setShowServiceEndedDialog] = useState(false);
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

  const handleFileChange = () => {
    setShowServiceEndedDialog(true);
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => {
      const newFiles = [...prev];
      newFiles.splice(index, 1);
      setTotalFiles(newFiles.length);
      return newFiles;
    });
  };

  const handleMassApply = () => {
    setShowServiceEndedDialog(true);
  };

  const handleJobClick = () => {
    setShowServiceEndedDialog(true);
  };

  if (isLoading)
    return (
      <div className='flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 via-white to-orange-50'>
        <div className='h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent' />
      </div>
    );

  return (
    <div className='container mx-auto p-6 overflow-hidden'>
      <div className='flex items-center justify-between mb-8'>
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className='text-4xl font-display font-bold bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent'
        >
          Mass Apply
        </motion.h1>
        <Button
          variant='ghost'
          onClick={() => navigate('/')}
          className='flex items-center gap-2'
        >
          <ArrowLeft className='w-4 h-4' />
          Back to Home
        </Button>
      </div>

      <Dialog
        open={showServiceEndedDialog}
        onOpenChange={setShowServiceEndedDialog}
      >
        <DialogContent className='max-w-2xl'>
          <Card className='p-8 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-primary/20'>
            <div className='space-y-6 text-center'>
              <div className='flex justify-center'>
                <AlertTriangle className='w-16 h-16 text-yellow-500 animate-bounce' />
              </div>

              <h2 className='text-2xl font-display font-bold text-primary'>
                Service Temporarily Unavailable 🚧
              </h2>

              <p className='text-lg text-gray-700'>
                Due to Supabase free tier services ending, this feature is
                currently unavailable.
              </p>

              <div className='space-y-4'>
                <div className='flex items-center justify-center space-x-2 text-primary'>
                  <Info className='w-5 h-5' />
                  <p>Try Job Seeker feature to test the application</p>
                </div>

                <div className='flex items-center justify-center space-x-2 text-primary'>
                  <ExternalLink className='w-5 h-5' />
                  <a
                    href='https://youtu.be/WZZAk1jGY00'
                    target='_blank'
                    rel='noopener noreferrer'
                    className='underline text-red-500 hover:text-red-600'
                  >
                    Watch demonstration video
                  </a>
                </div>
              </div>

              <Button
                onClick={() => {
                  setShowServiceEndedDialog(false);
                  window.open('https://youtu.be/WZZAk1jGY00', '_blank');
                }}
                className='bg-gradient-to-r from-primary to-indigo-600 text-white hover:from-primary/90 hover:to-indigo-600/90'
              >
                Got it
              </Button>
            </div>
          </Card>
        </DialogContent>
      </Dialog>

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
                            handleJobClick();
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
