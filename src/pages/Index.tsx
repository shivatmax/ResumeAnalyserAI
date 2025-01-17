import { motion } from 'framer-motion';
import RoleCard from '@/components/RoleCard';
import { Building2, Github, UserCircle2, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className='min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-gray-50 to-gray-100'>
      {/* Header */}
      <header className='w-full max-w-7xl mx-auto flex justify-between items-center mb-12'>
        <h1 className='text-2xl font-bold text-gray-900'>JobMatch</h1>
        <nav className='hidden md:flex space-x-6'>
          <a
            href='#'
            className='text-gray-600 hover:text-gray-900'
          >
            Home
          </a>
          <a
            href='#'
            className='text-gray-600 hover:text-gray-900'
          >
            About Us
          </a>
          <a
            href='#'
            className='text-gray-600 hover:text-gray-900'
          >
            Contact
          </a>
        </nav>
      </header>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className='text-center mb-12'
      >
        <h1 className='text-4xl md:text-5xl font-display font-bold text-gray-900 mb-4'>
          Connecting Talent with Opportunity
        </h1>
        <p className='text-lg text-gray-600 max-w-2xl mx-auto'>
          Choose your role and start your journey towards success
        </p>
      </motion.div>

      <motion.div
        variants={container}
        initial='hidden'
        animate='show'
        className='grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full'
      >
        <motion.div variants={item}>
          <RoleCard
            title='Recruiter'
            description='Post jobs and find the perfect candidates for your organization'
            icon={<Building2 className='w-12 h-12' />}
            onClick={() => navigate('/recruiter')}
            className='bg-blue-50'
          />
        </motion.div>

        <motion.div variants={item}>
          <RoleCard
            title='Job Seeker'
            description='Browse and apply to jobs that match your skills and experience'
            icon={<UserCircle2 className='w-12 h-12' />}
            onClick={() => navigate('/job-seeker')}
            className='bg-green-50'
          />
        </motion.div>

        <motion.div variants={item}>
          <RoleCard
            title='Mass Applier'
            description='Apply to multiple jobs efficiently with bulk resume uploads'
            icon={<Users className='w-12 h-12' />}
            onClick={() => navigate('/mass-applier')}
            className='bg-purple-50'
          />
        </motion.div>
      </motion.div>

      {/* Footer */}
      <footer className='w-full max-w-7xl mx-auto mt-16 py-8 border-t border-gray-200'>
        <div className='flex flex-col md:flex-row justify-between items-center'>
          <div className='flex space-x-4'>
            <a
              href='https://www.linkedin.com/in/shivawasthi/'
              className='text-gray-600 hover:text-gray-900'
            >
              <span className='sr-only'>LinkedIn</span>
              <svg
                className='h-6 w-6'
                fill='currentColor'
                viewBox='0 0 24 24'
              >
                <path d='M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z' />
              </svg>
            </a>
            <a
              href='https://github.com/shivatmax/applyeasy-network'
              className='text-gray-600 hover:text-gray-900'
            >
              <span className='sr-only'>GitHub</span>
              <Github className='h-6 w-6' />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
