import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

const JobSeeker = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
      }
    };
    checkAuth();
  }, [navigate]);

  const { data: jobs, isLoading } = useQuery({
    queryKey: ["jobs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) {
        toast.error("Failed to fetch jobs");
        throw error;
      }
      return data;
    },
  });

  const handleApply = async (jobId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const { error } = await supabase.from("applications").insert({
        job_id: jobId,
        applicant_id: session.user.id,
        resume_url: "placeholder", // You'll need to implement file upload
        status: "pending",
      });

      if (error) throw error;
      toast.success("Application submitted successfully!");
    } catch (error) {
      toast.error("Failed to submit application");
      console.error(error);
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Available Jobs</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {jobs?.map((job) => (
          <Card key={job.id} className="p-6">
            <h2 className="text-xl font-semibold mb-2">{job.title}</h2>
            <p className="text-gray-600 mb-2">{job.company_name}</p>
            <p className="text-sm mb-2">{job.location}</p>
            <p className="text-sm mb-4">{job.employment_type}</p>
            <Button onClick={() => handleApply(job.id)}>Apply Now</Button>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default JobSeeker;