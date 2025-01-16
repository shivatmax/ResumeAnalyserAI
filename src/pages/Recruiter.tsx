import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Database } from "@/integrations/supabase/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

type EmploymentType = Database["public"]["Enums"]["employment_type"];
type ExperienceLevel = Database["public"]["Enums"]["experience_level"];

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
};

const Recruiter = () => {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    company_name: "",
    location: "",
    employment_type: "full-time",
    experience_level: "entry",
    application_deadline: "",
    salary_min: undefined,
    salary_max: undefined,
    education_requirements: "",
    skills: [],
  });

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
      }
    };
    checkAuth();
  }, [navigate]);

  const { data: postedJobs, isLoading, refetch } = useQuery({
    queryKey: ["recruiter-jobs"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");

      const { data, error } = await supabase
        .from("jobs")
        .select("*, applications(*)")
        .eq("recruiter_id", session.user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const analyzeJobDescription = async () => {
    setIsAnalyzing(true);
    try {
      const response = await fetch('/functions/v1/analyze-job', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ jobData: formData }),
      });

      if (!response.ok) throw new Error('Failed to analyze job description');

      const analysis = await response.json();
      
      setFormData(prev => ({
        ...prev,
        skills: analysis.required_skills,
        experience_level: analysis.experience_requirements.level.toLowerCase() as ExperienceLevel,
        education_requirements: analysis.education_requirements,
      }));

      toast.success("Job description analyzed successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to analyze job description");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");

      const { error } = await supabase.from("jobs").insert({
        ...formData,
        recruiter_id: session.user.id,
      });

      if (error) throw error;
      toast.success("Job posted successfully!");
      setShowForm(false);
      refetch();
    } catch (error) {
      toast.error("Failed to post job");
      console.error(error);
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Recruiter Dashboard</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "Post New Job"}
        </Button>
      </div>

      {showForm && (
        <Card className="p-6 mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Input
                  placeholder="Job Title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <Input
                  placeholder="Company Name"
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  required
                />
              </div>
            </div>

            <Textarea
              placeholder="Job Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              className="min-h-[200px]"
            />

            <Button 
              type="button" 
              onClick={analyzeJobDescription}
              disabled={isAnalyzing || !formData.description}
              className="w-full"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                "Analyze with AI"
              )}
            </Button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                placeholder="Location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                required
              />

              <Select
                value={formData.employment_type}
                onValueChange={(value: EmploymentType) => 
                  setFormData({ ...formData, employment_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Employment Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full-time">Full Time</SelectItem>
                  <SelectItem value="part-time">Part Time</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="internship">Internship</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                type="number"
                placeholder="Minimum Salary"
                value={formData.salary_min || ""}
                onChange={(e) => setFormData({ ...formData, salary_min: parseInt(e.target.value) })}
              />
              <Input
                type="number"
                placeholder="Maximum Salary"
                value={formData.salary_max || ""}
                onChange={(e) => setFormData({ ...formData, salary_max: parseInt(e.target.value) })}
              />
            </div>

            <Select
              value={formData.experience_level}
              onValueChange={(value: ExperienceLevel) => 
                setFormData({ ...formData, experience_level: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Experience Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="entry">Entry Level</SelectItem>
                <SelectItem value="mid">Mid Level</SelectItem>
                <SelectItem value="senior">Senior Level</SelectItem>
                <SelectItem value="executive">Executive Level</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="datetime-local"
              value={formData.application_deadline}
              onChange={(e) => setFormData({ ...formData, application_deadline: e.target.value })}
              required
            />

            <Button type="submit" className="w-full">Post Job</Button>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {postedJobs?.map((job) => (
          <Card key={job.id} className="p-6">
            <h2 className="text-xl font-semibold mb-2">{job.title}</h2>
            <p className="text-gray-600 mb-2">{job.company_name}</p>
            <p className="text-sm mb-2">{job.location}</p>
            <p className="text-sm mb-4">{job.employment_type}</p>
            <p className="text-sm mb-2">
              Applications: {job.applications?.length || 0}
            </p>
            {job.skills && job.skills.length > 0 && (
              <div className="mt-2">
                <p className="text-sm font-semibold">Required Skills:</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {job.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 rounded-full text-xs"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Recruiter;