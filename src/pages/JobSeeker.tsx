import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Loader2,
  Briefcase,
  MapPin,
  Clock,
  Upload,
  Send,
  DollarSign,
  GraduationCap,
  ListChecks,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const JobSeeker = () => {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
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

  const { data: jobs, isLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        toast.error('Failed to fetch jobs');
        throw error;
      }
      return data;
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error('Please upload a PDF file');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleApply = (jobId: string) => {
    setSelectedJobId(jobId);
    setDialogOpen(true);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleJobClick = (job: any) => {
    setSelectedJobDetails(job);
    setJobDetailsOpen(true);
  };

  const handleSubmitApplication = async () => {
    if (!selectedFile || !selectedJobId) {
      toast.error('Please select a resume to upload');
      return;
    }

    try {
      setIsUploading(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }

      const userId = session.user.id;
      const fileExt = selectedFile.name.split('.').pop();
      const filePath = `${userId}/${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from('resumes').getPublicUrl(filePath);

      // Parse resume using Edge Function
      const { data: parsedData, error: parseError } =
        await supabase.functions.invoke('parse-resume', {
          body: { resumeUrl: publicUrl },
        });

      if (parseError) throw parseError;

      // Get job analysis data
      const { data: jobData, error: jobError } = await supabase
        .from('jobs')
        .select('ai_analysis')
        .eq('id', selectedJobId)
        .single();

      if (jobError) throw jobError;

      // Score the application
      const { data: scoringResult, error: scoringError } =
        await supabase.functions.invoke('score-application', {
          body: {
            jobAnalysis: jobData.ai_analysis,
            resumeData: parsedData.data,
          },
        });

      if (scoringError) {
        console.error('Scoring error:', scoringError);
      }

      // Save application to database
      const { error: applicationError } = await supabase
        .from('applications')
        .insert({
          job_id: selectedJobId,
          applicant_id: userId,
          resume_url: publicUrl,
          status: 'pending',
          parsed_data: parsedData.data,
          score: scoringResult?.overall_score || null,
          scoring_breakdown: scoringResult?.scoring_breakdown || null,
          strengths: scoringResult?.analysis?.strengths || null,
          gaps: scoringResult?.analysis?.gaps || null,
          recommendation: scoringResult?.recommendation || null,
        });

      if (applicationError) throw applicationError;

      toast.success('Application submitted successfully!');
      setSelectedFile(null);
      setSelectedJobId(null);
      setDialogOpen(false);
    } catch (error) {
      console.error('Application error:', error);
      toast.error('Failed to submit application');
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading)
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <Loader2 className='w-8 h-8 animate-spin text-primary' />
      </div>
    );

  return (
    <div className='container mx-auto p-6 overflow-hidden'>
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className='text-4xl font-display font-bold mb-8 bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent'
      >
        Available Jobs
      </motion.h1>
      <motion.div
        className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ staggerChildren: 0.1 }}
      >
        <AnimatePresence>
          {jobs?.map((job) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              whileHover={{ y: -5, scale: 1.02 }}
              className='overflow-hidden cursor-pointer'
              onClick={() => handleJobClick(job)}
            >
              <Card className='p-8 backdrop-blur-sm border border-gray-200/50 hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white/50 to-transparent'>
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

                  <Dialog
                    open={dialogOpen}
                    onOpenChange={setDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApply(job.id);
                        }}
                        className='w-full bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 text-white shadow-lg hover:shadow-xl transition-all duration-300'
                      >
                        Apply Now
                      </Button>
                    </DialogTrigger>
                    <DialogContent className='overflow-hidden backdrop-blur-lg bg-white/90 p-8 border border-gray-200/50'>
                      <DialogHeader>
                        <DialogTitle className='text-2xl font-display font-bold bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent'>
                          Upload Your Resume
                        </DialogTitle>
                      </DialogHeader>
                      <motion.div
                        className='space-y-6'
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <div className='relative'>
                          <Input
                            type='file'
                            accept='.pdf'
                            onChange={handleFileChange}
                            className='cursor-pointer bg-white/50 border-gray-200/50 hover:border-primary/50 transition-colors duration-300'
                          />
                          <Upload className='absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400' />
                        </div>
                        <Button
                          onClick={handleSubmitApplication}
                          disabled={!selectedFile || isUploading}
                          className='w-full bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 text-white'
                        >
                          {isUploading ? (
                            <motion.div
                              className='flex items-center'
                              animate={{ opacity: [1, 0.5, 1] }}
                              transition={{ repeat: Infinity, duration: 1.5 }}
                            >
                              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                              Processing...
                            </motion.div>
                          ) : (
                            <div className='flex items-center justify-center'>
                              <Send className='mr-2 h-4 w-4' />
                              Submit Application
                            </div>
                          )}
                        </Button>
                      </motion.div>
                    </DialogContent>
                  </Dialog>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Job Details Dialog */}
      <Dialog
        open={jobDetailsOpen}
        onOpenChange={setJobDetailsOpen}
      >
        <DialogContent className='max-w-3xl overflow-y-auto max-h-[80vh] backdrop-blur-lg bg-white/90 p-8 border border-gray-200/50'>
          <DialogHeader>
            <DialogTitle className='text-2xl font-display font-bold bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent'>
              {selectedJobDetails?.title}
            </DialogTitle>
          </DialogHeader>
          <div className='space-y-6 mt-4'>
            <div className='grid grid-cols-2 gap-4'>
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

            <Button
              onClick={() => {
                setJobDetailsOpen(false);
                handleApply(selectedJobDetails.id);
              }}
              className='w-full bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 text-white'
            >
              Apply for this Position
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default JobSeeker;
