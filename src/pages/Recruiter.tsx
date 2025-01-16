import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { JobPostingForm } from "@/components/recruiter/JobPostingForm";
import { JobListings } from "@/components/recruiter/JobListings";

const Recruiter = () => {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
      }
    };
    checkAuth();
  }, [navigate]);

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Recruiter Dashboard</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? "View Posted Jobs" : "Post New Job"}
        </Button>
      </div>

      {showForm ? (
        <div className="max-w-4xl mx-auto">
          <JobPostingForm />
        </div>
      ) : (
        <JobListings />
      )}
    </div>
  );
};

export default Recruiter;