import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

interface RoleCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  className?: string;
}

const RoleCard = ({ title, description, icon, onClick, className }: RoleCardProps) => {
  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "overflow-hidden relative group p-8 rounded-2xl cursor-pointer transition-all duration-300",
        "hover:shadow-xl border border-gray-200/50 backdrop-blur-sm",
        className
      )}
      onClick={onClick}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative flex flex-col items-center text-center space-y-4">
        <motion.div 
          className="text-4xl bg-white/80 p-4 rounded-xl shadow-sm"
          whileHover={{ rotate: 5 }}
        >
          {icon}
        </motion.div>
        
        <h3 className="text-2xl font-display font-semibold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
          {title}
        </h3>
        
        <p className="text-sm text-gray-600 max-w-[250px] leading-relaxed">
          {description}
        </p>
        
        <motion.div
          className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          whileHover={{ x: 5 }}
        >
          <ArrowRight className="w-5 h-5 text-primary" />
        </motion.div>
      </div>
    </motion.div>
  );
};

export default RoleCard;