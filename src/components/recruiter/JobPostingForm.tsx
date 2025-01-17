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
import { X, Loader2 } from 'lucide-react';

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

      // First, analyze the job with AI
      const { data: aiAnalysisResponse, error: analysisError } =
        await supabase.functions.invoke('analyze-job', {
          body: { jobData: formData },
        });

      if (analysisError) {
        console.error('AI Analysis error:', analysisError);
        toast.error('Error during AI analysis');
        return;
      }

      // Then, create the job posting with AI analysis
      const { data: jobData, error: jobError } = await supabase
        .from('jobs')
        .insert({
          ...formData,
          recruiter_id: session.user.id,
          ai_analysis: aiAnalysisResponse.analysis, // Access the analysis from the response object
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

  return (
    <form
      onSubmit={handleSubmit}
      className='space-y-6'
    >
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <Input
          placeholder='Job Title'
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
        <Input
          placeholder='Company Name'
          value={formData.company_name}
          onChange={(e) =>
            setFormData({ ...formData, company_name: e.target.value })
          }
          required
        />
      </div>

      <Textarea
        placeholder='Job Description'
        value={formData.description}
        onChange={(e) =>
          setFormData({ ...formData, description: e.target.value })
        }
        required
        className='min-h-[200px]'
      />

      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <Input
          placeholder='Location'
          value={formData.location}
          onChange={(e) =>
            setFormData({ ...formData, location: e.target.value })
          }
          required
        />

        <Select
          value={formData.employment_type}
          onValueChange={(value: EmploymentType) =>
            setFormData({ ...formData, employment_type: value })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder='Employment Type' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='full-time'>Full Time</SelectItem>
            <SelectItem value='part-time'>Part Time</SelectItem>
            <SelectItem value='contract'>Contract</SelectItem>
            <SelectItem value='internship'>Internship</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <Input
          type='number'
          placeholder='Minimum Salary'
          value={formData.salary_min || ''}
          onChange={(e) =>
            setFormData({ ...formData, salary_min: parseInt(e.target.value) })
          }
        />
        <Input
          type='number'
          placeholder='Maximum Salary'
          value={formData.salary_max || ''}
          onChange={(e) =>
            setFormData({ ...formData, salary_max: parseInt(e.target.value) })
          }
        />
      </div>

      <Select
        value={formData.experience_level}
        onValueChange={(value: ExperienceLevel) =>
          setFormData({ ...formData, experience_level: value })
        }
      >
        <SelectTrigger>
          <SelectValue placeholder='Experience Level' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='entry'>Entry Level</SelectItem>
          <SelectItem value='mid'>Mid Level</SelectItem>
          <SelectItem value='senior'>Senior Level</SelectItem>
          <SelectItem value='executive'>Executive Level</SelectItem>
        </SelectContent>
      </Select>

      <Input
        placeholder='Education Requirements'
        value={formData.education_requirements}
        onChange={(e) =>
          setFormData({ ...formData, education_requirements: e.target.value })
        }
      />

      <div className='space-y-2'>
        <div className='flex gap-2'>
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
          />
          <Button
            type='button'
            onClick={handleAddSkill}
          >
            Add
          </Button>
        </div>
        <div className='flex flex-wrap gap-2'>
          {formData.skills.map((skill, index) => (
            <Badge
              key={index}
              variant='secondary'
              className='flex items-center gap-1'
            >
              {skill}
              <X
                className='h-3 w-3 cursor-pointer'
                onClick={() => handleRemoveSkill(skill)}
              />
            </Badge>
          ))}
        </div>
      </div>

      <Input
        type='datetime-local'
        value={formData.application_deadline}
        onChange={(e) =>
          setFormData({ ...formData, application_deadline: e.target.value })
        }
        required
      />

      <Textarea
        placeholder='Additional Information (Optional)'
        value={formData.additional_info || ''}
        onChange={(e) =>
          setFormData({ ...formData, additional_info: e.target.value })
        }
        className='min-h-[100px]'
      />

      <Button
        type='submit'
        className='w-full'
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
            Posting Job...
          </>
        ) : (
          'Post Job'
        )}
      </Button>
    </form>
  );
};
