import { motion } from "framer-motion";
import RoleCard from "@/components/RoleCard";
import { UserCircle2, Building2, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-gray-50 to-gray-100">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl md:text-5xl font-display font-bold text-gray-900 mb-4">
          Find Your Perfect Match
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl">
          Connect with opportunities that align with your career goals
        </p>
      </motion.div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full"
      >
        <motion.div variants={item}>
          <RoleCard
            title="Job Seeker"
            description="Browse and apply to jobs that match your skills and experience"
            icon={<UserCircle2 className="w-12 h-12" />}
            onClick={() => navigate("/jobs")}
          />
        </motion.div>

        <motion.div variants={item}>
          <RoleCard
            title="Recruiter"
            description="Post jobs and find the perfect candidates for your organization"
            icon={<Building2 className="w-12 h-12" />}
            onClick={() => navigate("/recruiter")}
          />
        </motion.div>

        <motion.div variants={item}>
          <RoleCard
            title="Mass Applier"
            description="Apply to multiple jobs efficiently with bulk resume uploads"
            icon={<Users className="w-12 h-12" />}
            onClick={() => navigate("/mass-apply")}
          />
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Index;