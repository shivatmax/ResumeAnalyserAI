import { motion } from 'framer-motion';
import {
  Briefcase,
  Brain,
  Cpu,
  Users,
  LineChart,
  Shield,
  Github,
  Mail,
} from 'lucide-react';
import { Card } from '@/components/ui/card';

const About = () => {
  const features = [
    {
      icon: <Brain className='w-8 h-8 text-primary' />,
      title: 'AI-Powered Analysis',
      description:
        'Advanced machine learning algorithms analyze resumes and job descriptions to find the perfect match.',
    },
    {
      icon: <Cpu className='w-8 h-8 text-secondary' />,
      title: 'Intelligent Processing',
      description:
        'Process multiple resumes simultaneously with our state-of-the-art batch processing system.',
    },
    {
      icon: <Users className='w-8 h-8 text-accent' />,
      title: 'Mass Application',
      description:
        'Apply to multiple positions efficiently with our bulk upload and processing feature.',
    },
    {
      icon: <LineChart className='w-8 h-8 text-primary' />,
      title: 'Analytics',
      description:
        'Get detailed insights into application performance and matching scores.',
    },
    {
      icon: <Shield className='w-8 h-8 text-secondary' />,
      title: 'Data Security',
      description:
        'Your data is protected with enterprise-grade security and encryption.',
    },
    {
      icon: <Briefcase className='w-8 h-8 text-accent' />,
      title: 'Job Management',
      description:
        'Comprehensive tools for recruiters to manage job postings and applications.',
    },
  ];

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-blue-50'>
      <div className='container mx-auto px-6 py-12'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className='text-center mb-16'
        >
          <h1 className='text-5xl font-display font-bold text-gray-900 mb-6'>
            About{' '}
            <span className='bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent'>
              Resume Analyser AI
            </span>
          </h1>
          <p className='text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed'>
            We're revolutionizing the job application process with advanced AI
            technology, making it easier for both job seekers and recruiters to
            find their perfect match.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16'
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <Card className='p-6 backdrop-blur-sm border border-gray-200/50 hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white/50 to-transparent'>
                <div className='flex flex-col items-center text-center space-y-4'>
                  {feature.icon}
                  <h3 className='text-xl font-semibold text-gray-900'>
                    {feature.title}
                  </h3>
                  <p className='text-gray-600'>{feature.description}</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className='text-center max-w-3xl mx-auto'
        >
          <h2 className='text-3xl font-display font-bold text-gray-900 mb-6'>
            Get in Touch
          </h2>
          <p className='text-gray-600 mb-8'>
            Have questions or suggestions? We'd love to hear from you!
          </p>
          <div className='flex justify-center space-x-6'>
            <a
              href='https://github.com/shivatmax/ResumeAnalyserAI'
              target='_blank'
              rel='noopener noreferrer'
              className='flex items-center space-x-2 text-gray-600 hover:text-primary transition-colors'
            >
              <Github className='w-6 h-6' />
              <span>GitHub</span>
            </a>
            <a
              href='mailto:contact@resumeanalyserai.com'
              className='flex items-center space-x-2 text-gray-600 hover:text-primary transition-colors'
            >
              <Mail className='w-6 h-6' />
              <span>Email Us</span>
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default About;
