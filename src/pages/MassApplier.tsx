import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

const MassApplier = () => {
  const navigate = useNavigate();
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);

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
    queryKey: ["mass-apply-jobs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const handleMassApply = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const applications = selectedJobs.map((jobId) => ({
        job_id: jobId,
        applicant_id: session.user.id,
        resume_url: "placeholder", // You'll need to implement file upload
        status: "pending",
      }));

      const { error } = await supabase.from("applications").insert(applications);

      if (error) throw error;
      toast.success("Applications submitted successfully!");
      setSelectedJobs([]);
    } catch (error) {
      toast.error("Failed to submit applications");
      console.error(error);
    }
  };

  const toggleJobSelection = (jobId: string) => {
    setSelectedJobs((prev) =>
      prev.includes(jobId)
        ? prev.filter((id) => id !== jobId)
        : [...prev, jobId]
    );
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Mass Apply</h1>
        <Button
          onClick={handleMassApply}
          disabled={selectedJobs.length === 0}
        >
          Apply to Selected ({selectedJobs.length})
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {jobs?.map((job) => (
          <Card key={job.id} className="p-6">
            <div className="flex items-start gap-4">
              <Checkbox
                checked={selectedJobs.includes(job.id)}
                onCheckedChange={() => toggleJobSelection(job.id)}
              />
              <div>
                <h2 className="text-xl font-semibold mb-2">{job.title}</h2>
                <p className="text-gray-600 mb-2">{job.company_name}</p>
                <p className="text-sm mb-2">{job.location}</p>
                <p className="text-sm mb-4">{job.employment_type}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default MassApplier;