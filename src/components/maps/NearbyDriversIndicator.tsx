import React from 'react';
import { Car } from 'lucide-react';
import { motion } from 'framer-motion';

interface NearbyDriversIndicatorProps {
  driverCount: number;
  onClick?: () => void;
  className?: string;
}

export const NearbyDriversIndicator = ({ 
  driverCount, 
  onClick,
  className 
}: NearbyDriversIndicatorProps) => {
  if (driverCount === 0) return null;

  const displayCount = driverCount > 99 ? '99+' : driverCount.toString();

  return (
    <motion.button
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`absolute top-4 right-4 z-10 bg-white dark:bg-gray-900 p-4 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 ${className}`}
    >
      <div className="relative">
        {/* Icône de voiture (32px) — pulse GPU supprimé */}
        <div className="relative">
          <Car className="w-8 h-8 text-primary drop-shadow-md" strokeWidth={2.5} />
        </div>
        
        {/* Badge compact à l'angle top-right (22px) */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ 
            type: "spring", 
            stiffness: 500, 
            damping: 25
          }}
          className="absolute -top-2 -right-2 bg-gradient-to-br from-red-500 to-red-600 text-white text-xs font-bold rounded-full min-w-[22px] h-[22px] px-1.5 flex items-center justify-center shadow-lg border-2 border-white dark:border-gray-900"
        >
          <span>{displayCount}</span>
        </motion.div>
      </div>
    </motion.button>
  );
};
