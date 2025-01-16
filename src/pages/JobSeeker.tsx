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
import { Loader2 } from 'lucide-react';

const JobSeeker = () => {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

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

      // Upload file to Supabase Storage
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('resumes')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      // Get the public URL for the uploaded file
      const {
        data: { publicUrl },
      } = supabase.storage.from('resumes').getPublicUrl(filePath);

      console.log('Resume URL:', publicUrl);

      // Parse resume using Edge Function
      const { data: parsedData, error: parseError } =
        await supabase.functions.invoke('parse-resume', {
          body: { resumeUrl: publicUrl },
        });

      if (parseError) {
        console.error('Parse error:', parseError);
        throw parseError;
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
        Loading...
      </div>
    );

  return (
    <div className='container mx-auto p-6'>
      <h1 className='text-3xl font-bold mb-6'>Available Jobs</h1>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {jobs?.map((job) => (
          <Card
            key={job.id}
            className='p-6'
          >
            <h2 className='text-xl font-semibold mb-2'>{job.title}</h2>
            <p className='text-gray-600 mb-2'>{job.company_name}</p>
            <p className='text-sm mb-2'>{job.location}</p>
            <p className='text-sm mb-4'>{job.employment_type}</p>
            <Dialog
              open={dialogOpen}
              onOpenChange={setDialogOpen}
            >
              <DialogTrigger asChild>
                <Button onClick={() => handleApply(job.id)}>Apply Now</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload Your Resume</DialogTitle>
                </DialogHeader>
                <div className='space-y-4'>
                  <Input
                    type='file'
                    accept='.pdf'
                    onChange={handleFileChange}
                    className='cursor-pointer'
                  />
                  <Button
                    onClick={handleSubmitApplication}
                    disabled={!selectedFile || isUploading}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                        Processing...
                      </>
                    ) : (
                      'Submit Application'
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default JobSeeker;
