import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Download, Loader2, Briefcase, MapPin, Clock } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export const JobListings = () => {
  const queryClient = useQueryClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: postedJobs, isLoading } = useQuery({
    queryKey: ['recruiter-jobs'],
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const { data, error } = await supabase
        .from('jobs')
        .select('*, applications(*)')
        .eq('recruiter_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const handleToggleActive = async (jobId: string, currentState: boolean) => {
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ is_active: !currentState })
        .eq('id', jobId);

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ['recruiter-jobs'] });

      toast.success(
        `Job ${!currentState ? 'activated' : 'deactivated'} successfully`
      );
    } catch (error) {
      console.error('Error toggling job status:', error);
      toast.error('Failed to update job status');
    }
  };

  const handleExportToExcel = async (jobId: string, jobTitle: string) => {
    try {
      const { data: applications, error } = await supabase
        .from('applications')
        .select('*, jobs(*)')
        .eq('job_id', jobId)
        .order('score', { ascending: false });

      if (error) throw error;

      if (!applications || applications.length === 0) {
        toast.error('No applications to export');
        return;
      }

      const excelData = applications.map((app, index) => ({
        'S.No.': index + 1,
        'Applicant Score': app.score || 0,
        Resume: {
          v: app.resume_url,
          l: {
            Target: app.resume_url,
            Tooltip: 'Click to open resume',
          },
          s: {
            font: { color: { rgb: '0000FF' }, underline: true },
            alignment: { horizontal: 'left' },
          },
        },
        'Application Status': app.status,
        'Submission Date': new Date(app.created_at || '').toLocaleDateString(),
        Strengths: app.strengths?.join(', ') || '',
        Gaps: app.gaps?.join(', ') || '',
        Recommendation: app.recommendation || '',
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData, {
        header: Object.keys(excelData[0]),
      });

      const colWidths = [
        { wch: 5 },
        { wch: 12 },
        { wch: 50 },
        { wch: 15 },
        { wch: 15 },
        { wch: 40 },
        { wch: 40 },
        { wch: 40 },
      ];
      ws['!cols'] = colWidths;

      const headerStyle = {
        font: { bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '4F46E5' } },
        alignment: { horizontal: 'center' },
      };

      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const address = XLSX.utils.encode_col(C) + '1';
        if (!ws[address]) continue;
        ws[address].s = headerStyle;
      }

      for (let R = 2; R <= range.e.r + 1; ++R) {
        const rowStyle = {
          fill: { fgColor: { rgb: R % 2 ? 'F3F4F6' : 'FFFFFF' } },
          alignment: { vertical: 'center' },
        };
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const address = XLSX.utils.encode_col(C) + R;
          if (!ws[address]) continue;
          ws[address].s = { ...ws[address].s, ...rowStyle };
        }
      }

      XLSX.utils.book_append_sheet(wb, ws, 'Applications');
      XLSX.writeFile(wb, `${jobTitle}-Applications.xlsx`);

      toast.success('Applications exported successfully');
    } catch (error) {
      console.error('Error exporting applications:', error);
      toast.error('Failed to export applications');
    }
  };

  if (isLoading)
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <Loader2 className='w-8 h-8 animate-spin text-primary' />
      </div>
    );

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6'>
      <AnimatePresence>
        {postedJobs?.map((job) => (
          <motion.div
            key={job.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            whileHover={{ y: -5, scale: 1.02 }}
            className='overflow-hidden'
          >
            <Card
              className='p-8 backdrop-blur-sm border border-gray-200/50 hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white/50 to-transparent'
              onClick={() => {
                setSelectedJob(job);
                setDialogOpen(true);
              }}
            >
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

                <div className='flex justify-between items-center'>
                  <p className='text-base font-medium text-gray-800'>
                    Applications:{' '}
                    <span className='text-primary'>
                      {job.applications?.length || 0}
                    </span>
                  </p>

                  <div className='flex items-center gap-3'>
                    <Button
                      variant='outline'
                      size='sm'
                      className='hover:bg-gray-100'
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExportToExcel(job.id, job.title);
                      }}
                    >
                      <Download className='w-4 h-4 mr-2 text-gray-600' />
                      Export
                    </Button>
                    <Switch
                      checked={job.is_active}
                      onCheckedChange={(e) => {
                        handleToggleActive(job.id, job.is_active);
                      }}
                    />
                  </div>
                </div>

                {job.skills && job.skills.length > 0 && (
                  <div className='mt-4'>
                    <p className='text-base font-semibold text-gray-800 mb-3'>
                      Required Skills:
                    </p>
                    <div className='flex flex-wrap gap-2'>
                      {job.skills.map((skill, index) => (
                        <Badge
                          key={index}
                          variant='secondary'
                          className='px-3 py-1 bg-indigo-100 text-indigo-700 font-medium rounded-full'
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>

      <Dialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      >
        <DialogContent className='overflow-hidden backdrop-blur-lg bg-white/90 p-8 border border-gray-200/50 max-w-4xl max-h-[85vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle className='text-3xl font-display font-bold bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent'>
              {selectedJob?.title}
            </DialogTitle>
          </DialogHeader>
          <motion.div
            className='space-y-6'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div>
              <h3 className='text-xl font-semibold text-gray-800 mb-3'>
                Company
              </h3>
              <p className='text-lg text-gray-700'>
                {selectedJob?.company_name}
              </p>
            </div>
            <div>
              <h3 className='text-xl font-semibold text-gray-800 mb-3'>
                Description
              </h3>
              <p className='text-base leading-relaxed text-gray-600 whitespace-pre-wrap'>
                {selectedJob?.description}
              </p>
            </div>
            <div className='grid grid-cols-2 gap-8'>
              <div>
                <h3 className='text-lg font-semibold text-gray-800 mb-2'>
                  Location
                </h3>
                <p className='text-base text-gray-700'>
                  {selectedJob?.location}
                </p>
              </div>
              <div>
                <h3 className='text-lg font-semibold text-gray-800 mb-2'>
                  Employment Type
                </h3>
                <p className='text-base text-gray-700'>
                  {selectedJob?.employment_type}
                </p>
              </div>
              <div>
                <h3 className='text-lg font-semibold text-gray-800 mb-2'>
                  Experience Level
                </h3>
                <p className='text-base text-gray-700'>
                  {selectedJob?.experience_level}
                </p>
              </div>
              <div>
                <h3 className='text-lg font-semibold text-gray-800 mb-2'>
                  Applications
                </h3>
                <p className='text-base text-primary font-medium'>
                  {selectedJob?.applications?.length || 0}
                </p>
              </div>
            </div>
            {selectedJob?.skills && selectedJob.skills.length > 0 && (
              <div>
                <h3 className='text-xl font-semibold text-gray-800 mb-3'>
                  Required Skills
                </h3>
                <div className='flex flex-wrap gap-2'>
                  {selectedJob.skills.map((skill: string, index: number) => (
                    <Badge
                      key={index}
                      variant='secondary'
                      className='px-3 py-1 bg-indigo-100 text-indigo-700 font-medium rounded-full'
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {selectedJob?.additional_info && (
              <div>
                <h3 className='text-xl font-semibold text-gray-800 mb-3'>
                  Additional Information
                </h3>
                <p className='text-base leading-relaxed text-gray-600 whitespace-pre-wrap'>
                  {selectedJob.additional_info}
                </p>
              </div>
            )}
          </motion.div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
