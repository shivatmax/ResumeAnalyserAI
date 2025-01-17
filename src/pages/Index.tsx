import { motion } from 'framer-motion';
import RoleCard from '@/components/RoleCard';
import { Building2, Github, UserCircle2, Users, Sparkles, ArrowRight } from 'lucide-react';
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
    <div className='min-h-screen overflow-hidden bg-gradient-to-br from-gray-50 via-purple-50 to-blue-50'>
      {/* Header */}
      <header className='w-full max-w-7xl mx-auto flex justify-between items-center p-6 relative z-10'>
        <motion.h1 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className='text-3xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent'
        >
          JobMatch
        </motion.h1>
        <nav className='hidden md:flex space-x-6'>
          <motion.a
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            href='#'
            className='text-gray-600 hover:text-primary transition-colors duration-300'
          >
            Home
          </motion.a>
          <motion.a
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            href='#'
            className='text-gray-600 hover:text-primary transition-colors duration-300'
          >
            About Us
          </motion.a>
          <motion.a
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            href='#'
            className='text-gray-600 hover:text-primary transition-colors duration-300'
          >
            Contact
          </motion.a>
        </nav>
      </header>

      {/* Main Content */}
      <main className='relative overflow-hidden'>
        {/* Background Decorations */}
        <div className='absolute top-0 left-0 w-64 h-64 bg-primary/10 rounded-full filter blur-3xl -translate-x-1/2 -translate-y-1/2' />
        <div className='absolute bottom-0 right-0 w-96 h-96 bg-secondary/10 rounded-full filter blur-3xl translate-x-1/2 translate-y-1/2' />
        
        <div className='max-w-7xl mx-auto px-6 py-12'>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className='text-center mb-16 relative'
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3 }}
              className='absolute -top-6 left-1/2 transform -translate-x-1/2'
            >
              <Sparkles className='w-12 h-12 text-primary animate-pulse' />
            </motion.div>
            <h1 className='text-5xl md:text-6xl font-display font-bold text-gray-900 mb-6'>
              Connecting Talent with
              <span className='bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent'> Opportunity</span>
            </h1>
            <p className='text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed'>
              Choose your role and start your journey towards success
            </p>
          </motion.div>

          <motion.div
            variants={container}
            initial='hidden'
            animate='show'
            className='grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto'
          >
            <motion.div variants={item}>
              <RoleCard
                title='Recruiter'
                description='Post jobs and find the perfect candidates for your organization'
                icon={<Building2 className='w-12 h-12 text-primary' />}
                onClick={() => navigate('/recruiter')}
                className='bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-purple-200/50'
              />
            </motion.div>

            <motion.div variants={item}>
              <RoleCard
                title='Job Seeker'
                description='Browse and apply to jobs that match your skills and experience'
                icon={<UserCircle2 className='w-12 h-12 text-secondary' />}
                onClick={() => navigate('/job-seeker')}
                className='bg-gradient-to-br from-orange-50 to-orange-100 hover:shadow-orange-200/50'
              />
            </motion.div>

            <motion.div variants={item}>
              <RoleCard
                title='Mass Applier'
                description='Apply to multiple jobs efficiently with bulk resume uploads'
                icon={<Users className='w-12 h-12 text-accent' />}
                onClick={() => navigate('/mass-applier')}
                className='bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-blue-200/50'
              />
            </motion.div>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className='w-full max-w-7xl mx-auto mt-16 py-8 px-6 border-t border-gray-200'>
        <div className='flex flex-col md:flex-row justify-between items-center'>
          <div className='flex space-x-4'>
            <motion.a
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.9 }}
              href='https://www.linkedin.com/in/shivawasthi/'
              className='text-gray-600 hover:text-primary transition-colors duration-300'
            >
              <span className='sr-only'>LinkedIn</span>
              <svg
                className='h-6 w-6'
                fill='currentColor'
                viewBox='0 0 24 24'
              >
                <path d='M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z' />
              </svg>
            </motion.a>
            <motion.a
              whileHover={{ scale: 1.1, rotate: -5 }}
              whileTap={{ scale: 0.9 }}
              href='https://github.com/shivatmax/applyeasy-network'
              className='text-gray-600 hover:text-primary transition-colors duration-300'
            >
              <span className='sr-only'>GitHub</span>
              <Github className='h-6 w-6' />
            </motion.a>
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className='mt-4 md:mt-0 text-sm text-gray-500'
          >
            © 2024 JobMatch. All rights reserved.
          </motion.div>
        </div>
      </footer>
    </div>
  );
};

export default Index;