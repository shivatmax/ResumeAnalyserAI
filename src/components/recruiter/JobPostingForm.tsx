import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  X,
  Loader2,
  Briefcase,
  MapPin,
  Building2,
  GraduationCap,
  Calendar,
  Info,
  Plus,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type EmploymentType = Database['public']['Enums']['employment_type'];
type ExperienceLevel = Database['public']['Enums']['experience_level'];

type FormData = {
  title: string;
  description: string;
  company_name: string;
  location: string;
  employment_type: EmploymentType;
  experience_level: ExperienceLevel;
  application_deadline: string;
  salary_min?: number;
  salary_max?: number;
  education_requirements?: string;
  skills: string[];
  additional_info?: string;
};

export const JobPostingForm = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentSkill, setCurrentSkill] = useState('');
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    company_name: '',
    location: '',
    employment_type: 'full-time',
    experience_level: 'entry',
    application_deadline: '',
    salary_min: undefined,
    salary_max: undefined,
    education_requirements: '',
    skills: [],
    additional_info: '',
  });

  const handleAddSkill = () => {
    if (currentSkill && !formData.skills.includes(currentSkill)) {
      setFormData((prev) => ({
        ...prev,
        skills: [...prev.skills, currentSkill],
      }));
      setCurrentSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((skill) => skill !== skillToRemove),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const { data: aiAnalysisResponse, error: analysisError } =
        await supabase.functions.invoke('analyze-job', {
          body: { jobData: formData },
        });

      if (analysisError) {
        console.error('AI Analysis error:', analysisError);
        toast.error('Error during AI analysis');
        return;
      }

      const { data: jobData, error: jobError } = await supabase
        .from('jobs')
        .insert({
          ...formData,
          recruiter_id: session.user.id,
          ai_analysis: aiAnalysisResponse.analysis,
        })
        .select()
        .single();

      if (jobError) throw jobError;

      toast.success('Job posted successfully!');
      navigate('/recruiter');
    } catch (error) {
      console.error(error);
      toast.error('Failed to post job');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formAnimation = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: 'easeOut',
      },
    },
  };

  const inputAnimation = {
    focus: { scale: 1.02, transition: { duration: 0.2 } },
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      className='max-w-5xl mx-auto space-y-8 p-8 rounded-2xl bg-white/90 backdrop-blur-lg shadow-2xl border border-gray-100'
      initial='hidden'
      animate='visible'
      variants={formAnimation}
    >
      <div className='text-center mb-10'>
        <motion.h2
          className='text-3xl font-bold bg-gradient-to-r from-primary via-purple-600 to-indigo-600 bg-clip-text text-transparent font-display'
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Create New Job Posting
        </motion.h2>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
        <motion.div
          whileFocus='focus'
          variants={inputAnimation}
          className='relative'
        >
          <Briefcase className='absolute left-3 top-3 h-5 w-5 text-gray-400' />
          <Input
            placeholder='Job Title'
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            required
            className='pl-10 h-12 bg-white/80 border-2 border-gray-100 hover:border-primary/30 focus:border-primary/50 rounded-xl shadow-sm transition-all duration-300'
          />
        </motion.div>

        <motion.div
          whileFocus='focus'
          variants={inputAnimation}
          className='relative'
        >
          <Building2 className='absolute left-3 top-3 h-5 w-5 text-gray-400' />
          <Input
            placeholder='Company Name'
            value={formData.company_name}
            onChange={(e) =>
              setFormData({ ...formData, company_name: e.target.value })
            }
            required
            className='pl-10 h-12 bg-white/80 border-2 border-gray-100 hover:border-primary/30 focus:border-primary/50 rounded-xl shadow-sm transition-all duration-300'
          />
        </motion.div>
      </div>

      <motion.div
        whileFocus='focus'
        variants={inputAnimation}
      >
        <Textarea
          placeholder='Job Description'
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          required
          className='min-h-[200px] bg-white/80 border-2 border-gray-100 hover:border-primary/30 focus:border-primary/50 rounded-xl shadow-sm transition-all duration-300 p-4 text-base'
        />
      </motion.div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
        <motion.div
          whileFocus='focus'
          variants={inputAnimation}
          className='relative'
        >
          <MapPin className='absolute left-3 top-3 h-5 w-5 text-gray-400' />
          <Input
            placeholder='Location'
            value={formData.location}
            onChange={(e) =>
              setFormData({ ...formData, location: e.target.value })
            }
            required
            className='pl-10 h-12 bg-white/80 border-2 border-gray-100 hover:border-primary/30 focus:border-primary/50 rounded-xl shadow-sm transition-all duration-300'
          />
        </motion.div>

        <Select
          value={formData.employment_type}
          onValueChange={(value: EmploymentType) =>
            setFormData({ ...formData, employment_type: value })
          }
        >
          <SelectTrigger className='h-12 bg-white/80 border-2 border-gray-100 hover:border-primary/30 focus:border-primary/50 rounded-xl shadow-sm transition-all duration-300'>
            <SelectValue placeholder='Employment Type' />
          </SelectTrigger>
          <SelectContent className='bg-white/95 backdrop-blur-lg border-gray-100'>
            <SelectItem value='full-time'>Full Time</SelectItem>
            <SelectItem value='part-time'>Part Time</SelectItem>
            <SelectItem value='contract'>Contract</SelectItem>
            <SelectItem value='internship'>Internship</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
        <motion.div
          whileFocus='focus'
          variants={inputAnimation}
        >
          <Input
            type='number'
            placeholder='Minimum Salary'
            value={formData.salary_min || ''}
            onChange={(e) =>
              setFormData({ ...formData, salary_min: parseInt(e.target.value) })
            }
            className='h-12 bg-white/80 border-2 border-gray-100 hover:border-primary/30 focus:border-primary/50 rounded-xl shadow-sm transition-all duration-300'
          />
        </motion.div>

        <motion.div
          whileFocus='focus'
          variants={inputAnimation}
        >
          <Input
            type='number'
            placeholder='Maximum Salary'
            value={formData.salary_max || ''}
            onChange={(e) =>
              setFormData({ ...formData, salary_max: parseInt(e.target.value) })
            }
            className='h-12 bg-white/80 border-2 border-gray-100 hover:border-primary/30 focus:border-primary/50 rounded-xl shadow-sm transition-all duration-300'
          />
        </motion.div>
      </div>

      <Select
        value={formData.experience_level}
        onValueChange={(value: ExperienceLevel) =>
          setFormData({ ...formData, experience_level: value })
        }
      >
        <SelectTrigger className='h-12 bg-white/80 border-2 border-gray-100 hover:border-primary/30 focus:border-primary/50 rounded-xl shadow-sm transition-all duration-300'>
          <SelectValue placeholder='Experience Level' />
        </SelectTrigger>
        <SelectContent className='bg-white/95 backdrop-blur-lg border-gray-100'>
          <SelectItem value='entry'>Entry Level</SelectItem>
          <SelectItem value='mid'>Mid Level</SelectItem>
          <SelectItem value='senior'>Senior Level</SelectItem>
          <SelectItem value='executive'>Executive Level</SelectItem>
        </SelectContent>
      </Select>

      <motion.div
        whileFocus='focus'
        variants={inputAnimation}
        className='relative'
      >
        <GraduationCap className='absolute left-3 top-3 h-5 w-5 text-gray-400' />
        <Input
          placeholder='Education Requirements'
          value={formData.education_requirements}
          onChange={(e) =>
            setFormData({ ...formData, education_requirements: e.target.value })
          }
          className='pl-10 h-12 bg-white/80 border-2 border-gray-100 hover:border-primary/30 focus:border-primary/50 rounded-xl shadow-sm transition-all duration-300'
        />
      </motion.div>

      <div className='space-y-4'>
        <div className='flex gap-3'>
          <motion.div
            whileFocus='focus'
            variants={inputAnimation}
            className='flex-1'
          >
            <Input
              placeholder='Add Required Skills'
              value={currentSkill}
              onChange={(e) => setCurrentSkill(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddSkill();
                }
              }}
              className='h-12 bg-white/80 border-2 border-gray-100 hover:border-primary/30 focus:border-primary/50 rounded-xl shadow-sm transition-all duration-300'
            />
          </motion.div>
          <Button
            type='button'
            onClick={handleAddSkill}
            className='h-12 px-6 bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2'
          >
            <Plus className='h-5 w-5' />
            Add
          </Button>
        </div>
        <AnimatePresence>
          <motion.div className='flex flex-wrap gap-2'>
            {formData.skills.map((skill, index) => (
              <motion.div
                key={skill}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
              >
                <Badge
                  variant='secondary'
                  className='px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary font-medium rounded-lg flex items-center gap-2 transition-colors duration-300'
                >
                  {skill}
                  <X
                    className='h-4 w-4 cursor-pointer hover:text-red-500 transition-colors'
                    onClick={() => handleRemoveSkill(skill)}
                  />
                </Badge>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      <motion.div
        whileFocus='focus'
        variants={inputAnimation}
        className='relative'
      >
        <Calendar className='absolute left-3 top-3 h-5 w-5 text-gray-400' />
        <Input
          type='datetime-local'
          value={formData.application_deadline}
          onChange={(e) =>
            setFormData({ ...formData, application_deadline: e.target.value })
          }
          required
          className='pl-10 h-12 bg-white/80 border-2 border-gray-100 hover:border-primary/30 focus:border-primary/50 rounded-xl shadow-sm transition-all duration-300'
        />
      </motion.div>

      <motion.div
        whileFocus='focus'
        variants={inputAnimation}
        className='relative'
      >
        <Info className='absolute left-3 top-3 h-5 w-5 text-gray-400' />
        <Textarea
          placeholder='Additional Information (Optional)'
          value={formData.additional_info || ''}
          onChange={(e) =>
            setFormData({ ...formData, additional_info: e.target.value })
          }
          className='pl-10 min-h-[100px] bg-white/80 border-2 border-gray-100 hover:border-primary/30 focus:border-primary/50 rounded-xl shadow-sm transition-all duration-300'
        />
      </motion.div>

      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Button
          type='submit'
          className='w-full h-14 bg-gradient-to-r from-primary via-purple-600 to-indigo-600 hover:from-primary/90 hover:via-purple-600/90 hover:to-indigo-600/90 text-white text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300'
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <motion.div
              className='flex items-center justify-center gap-3'
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              <Loader2 className='h-5 w-5 animate-spin' />
              Posting Job...
            </motion.div>
          ) : (
            'Post Job'
          )}
        </Button>
      </motion.div>
    </motion.form>
  );
};
