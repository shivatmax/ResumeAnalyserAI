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
      whileHover={{ y: -5 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "glass-card p-6 rounded-xl cursor-pointer hover-card",
        className
      )}
      onClick={onClick}
    >
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="text-4xl text-gray-800">{icon}</div>
        <h3 className="text-xl font-display font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600 max-w-[250px]">{description}</p>
      </div>
    </motion.div>
  );
};

export default RoleCard;