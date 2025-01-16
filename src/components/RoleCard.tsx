import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

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
        "glass-card p-8 rounded-xl cursor-pointer transition-all duration-300",
        "hover:shadow-lg border border-gray-200",
        className
      )}
      onClick={onClick}
    >
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="text-4xl text-gray-800 bg-white p-4 rounded-full shadow-sm">
          {icon}
        </div>
        <h3 className="text-2xl font-display font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600 max-w-[250px] leading-relaxed">
          {description}
        </p>
      </div>
    </motion.div>
  );
};

export default RoleCard;