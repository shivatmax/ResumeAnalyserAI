import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Database } from "@/integrations/supabase/types";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

type ApplicationStatus = Database["public"]["Enums"]["application_status"];

const MassApplier = () => {
  const navigate = useNavigate();
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [isUploading, setIsUploading] = useState(false);

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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      // Check if all files are PDFs
      const allPdfs = Array.from(files).every(file => file.type === "application/pdf");
      if (!allPdfs) {
        toast.error("Please upload only PDF files");
        return;
      }
      if (files.length > 100) {
        toast.error("Maximum 100 resumes allowed");
        return;
      }
      setSelectedFiles(files);
    }
  };

  const handleMassApply = async () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      toast.error("Please select resumes to upload");
      return;
    }

    if (!selectedJob) {
      toast.error("Please select a job to apply to");
      return;
    }

    try {
      setIsUploading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const userId = session.user.id;
      const applications = [];

      for (const file of Array.from(selectedFiles)) {
        const fileExt = file.name.split('.').pop();
        const filePath = `${userId}/${crypto.randomUUID()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('resumes')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('resumes')
          .getPublicUrl(filePath);

        applications.push({
          job_id: selectedJob,
          applicant_id: userId,
          resume_url: publicUrl,
          status: "pending" as ApplicationStatus,
        });
      }

      const { error: applicationError } = await supabase
        .from("applications")
        .insert(applications);

      if (applicationError) throw applicationError;

      toast.success(`Successfully submitted ${applications.length} applications!`);
      setSelectedFiles(null);
      setSelectedJob(null);
    } catch (error) {
      toast.error("Failed to submit applications");
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Upload Multiple Resumes</h2>
          <Input
            type="file"
            accept=".pdf"
            multiple
            onChange={handleFileChange}
            className="cursor-pointer mb-4"
          />
          <p className="text-sm text-gray-500 mb-2">
            Selected: {selectedFiles ? selectedFiles.length : 0} resumes
          </p>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Select a Job</h1>
          <Button
            onClick={handleMassApply}
            disabled={!selectedJob || !selectedFiles || isUploading}
          >
            {isUploading 
              ? "Uploading..." 
              : `Apply with ${selectedFiles?.length || 0} Resumes`
            }
          </Button>
        </div>

        <RadioGroup
          value={selectedJob || ""}
          onValueChange={(value) => setSelectedJob(value)}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {jobs?.map((job) => (
            <div key={job.id} className="relative">
              <RadioGroupItem
                value={job.id}
                id={job.id}
                className="peer sr-only"
              />
              <Label
                htmlFor={job.id}
                className="flex flex-col p-6 bg-white rounded-lg shadow cursor-pointer border-2 peer-data-[state=checked]:border-primary"
              >
                <h2 className="text-xl font-semibold mb-2">{job.title}</h2>
                <p className="text-gray-600 mb-2">{job.company_name}</p>
                <p className="text-sm mb-2">{job.location}</p>
                <p className="text-sm mb-4">{job.employment_type}</p>
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>
    </div>
  );
};

export default MassApplier;