import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

export const JobListings = () => {
  const queryClient = useQueryClient();
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

      // Invalidate and refetch jobs query
      await queryClient.invalidateQueries({ queryKey: ['recruiter-jobs'] });

      toast.success(
        `Job ${!currentState ? 'activated' : 'deactivated'} successfully`
      );
    } catch (error) {
      console.error('Error toggling job status:', error);
      toast.error('Failed to update job status');
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
      {postedJobs?.map((job) => (
        <Card
          key={job.id}
          className='p-6'
        >
          <div className='flex justify-between items-start mb-4'>
            <h2 className='text-xl font-semibold'>{job.title}</h2>
            <div className='flex items-center gap-2'>
              <span className='text-sm text-gray-500'>
                {job.is_active ? 'Active' : 'Inactive'}
              </span>
              <Switch
                checked={job.is_active}
                onCheckedChange={() =>
                  handleToggleActive(job.id, job.is_active)
                }
              />
            </div>
          </div>
          <p className='text-gray-600 mb-2'>{job.company_name}</p>
          <p className='text-sm mb-2'>{job.location}</p>
          <p className='text-sm mb-4'>{job.employment_type}</p>
          <p className='text-sm mb-2'>
            Applications: {job.applications?.length || 0}
          </p>
          {job.skills && job.skills.length > 0 && (
            <div className='mt-2'>
              <p className='text-sm font-semibold'>Required Skills:</p>
              <div className='flex flex-wrap gap-2 mt-1'>
                {job.skills.map((skill, index) => (
                  <Badge
                    key={index}
                    variant='secondary'
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
};
