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
};

const Recruiter = () => {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    company_name: "",
    location: "",
    employment_type: "full-time",
    experience_level: "entry",
    application_deadline: "",
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
            <Input
              placeholder="Job Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
            <Textarea
              placeholder="Job Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
            <Input
              placeholder="Company Name"
              value={formData.company_name}
              onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
              required
            />
            <Input
              placeholder="Location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              required
            />
            <select
              className="w-full p-2 border rounded"
              value={formData.employment_type}
              onChange={(e) => setFormData({ ...formData, employment_type: e.target.value as EmploymentType })}
              required
            >
              <option value="full-time">Full Time</option>
              <option value="part-time">Part Time</option>
              <option value="contract">Contract</option>
              <option value="internship">Internship</option>
            </select>
            <select
              className="w-full p-2 border rounded"
              value={formData.experience_level}
              onChange={(e) => setFormData({ ...formData, experience_level: e.target.value as ExperienceLevel })}
              required
            >
              <option value="entry">Entry Level</option>
              <option value="mid">Mid Level</option>
              <option value="senior">Senior Level</option>
              <option value="executive">Executive Level</option>
            </select>
            <Input
              type="datetime-local"
              value={formData.application_deadline}
              onChange={(e) => setFormData({ ...formData, application_deadline: e.target.value })}
              required
            />
            <Button type="submit">Post Job</Button>
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
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Recruiter;