import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { JobPostingForm } from '@/components/recruiter/JobPostingForm';
import { JobListings } from '@/components/recruiter/JobListings';
import { motion } from 'framer-motion';
import { Briefcase, PlusCircle, ListFilter } from 'lucide-react';

const Recruiter = () => {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);

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

  return (
    <div className='min-h-screen bg-gradient-to-br from-white to-gray-50'>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className='container mx-auto p-6 space-y-8'
      >
        <div className='flex justify-between items-center mb-6'>
          <div className='flex items-center gap-3'>
            <Briefcase className='w-8 h-8 text-indigo-600' />
            <h1 className='text-3xl font-bold font-display tracking-tight text-gray-900'>
              Recruiter Dashboard
            </h1>
          </div>
          <div className='flex gap-3'>
            <Button
              onClick={() => navigate('/')}
              variant='outline'
              size='sm'
              className='hover:bg-gray-100'
            >
              <span className='flex items-center gap-2'>← Back to Home</span>
            </Button>
            <Button
              onClick={() => setShowForm(!showForm)}
              variant={showForm ? 'outline' : 'default'}
              size='sm'
              className='hover:bg-gray-100'
            >
              <span className='flex items-center gap-2'>
                {showForm ? (
                  <>
                    <ListFilter className='w-4 h-4 text-gray-600' />
                    View Posted Jobs
                  </>
                ) : (
                  <>
                    <PlusCircle className='w-4 h-4 text-gray-600' />
                    Post New Job
                  </>
                )}
              </span>
            </Button>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className='bg-white rounded-lg shadow-lg'
        >
          {showForm ? (
            <div className='max-w-4xl mx-auto p-8'>
              <JobPostingForm />
            </div>
          ) : (
            <JobListings />
          )}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Recruiter;
