import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { JobPostingForm } from "@/components/recruiter/JobPostingForm";
import { JobListings } from "@/components/recruiter/JobListings";
import { motion } from "framer-motion";
import { Briefcase, PlusCircle, ListFilter } from "lucide-react";

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
    <div className="min-h-screen overflow-hidden bg-gradient-to-br from-purple-50 via-white to-orange-50">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto p-6 space-y-8"
      >
        <div className="flex justify-between items-center mb-6 bg-white/80 backdrop-blur-lg rounded-lg p-4 shadow-lg">
          <div className="flex items-center gap-3">
            <Briefcase className="w-8 h-8 text-primary animate-bounce" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Recruiter Dashboard
            </h1>
          </div>
          <Button 
            onClick={() => setShowForm(!showForm)}
            className="group relative overflow-hidden hover:shadow-xl transition-all duration-300"
            variant={showForm ? "secondary" : "default"}
          >
            <span className="relative z-10 flex items-center gap-2">
              {showForm ? (
                <>
                  <ListFilter className="w-5 h-5" />
                  View Posted Jobs
                </>
              ) : (
                <>
                  <PlusCircle className="w-5 h-5" />
                  Post New Job
                </>
              )}
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-primary-light via-primary to-primary-dark opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </Button>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden rounded-xl shadow-2xl bg-white/90 backdrop-blur-sm"
        >
          {showForm ? (
            <div className="max-w-4xl mx-auto p-6">
              <JobPostingForm />
            </div>
          ) : (
            <JobListings />
          )}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Recruiter;