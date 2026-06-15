/**
 * ⏱️ PHASE 5: Circular Timer Component
 * Timer circulaire animé pour countdown nouvelle course
 */

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CircularTimerProps {
  seconds: number;
  totalSeconds: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export const CircularTimer: React.FC<CircularTimerProps> = ({
  seconds,
  totalSeconds,
  size = 120,
  strokeWidth = 8,
  className
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = seconds / totalSeconds;
  const strokeDashoffset = circumference * (1 - progress);

  // Couleur selon le temps restant
  const getColor = () => {
    if (progress > 0.5) return '#10B981'; // Vert
    if (progress > 0.2) return '#F59E0B'; // Orange
    return '#EF4444'; // Rouge
  };

  return (
    <div className={cn("relative", className)}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-gray-200 dark:text-gray-700"
        />
        
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getColor()}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: 0 }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.5, ease: 'linear' }}
        />
      </svg>

      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.div
          key={seconds}
          initial={{ scale: 1.2, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={cn(
            "text-4xl font-black",
            progress > 0.5 ? "text-green-600" : progress > 0.2 ? "text-orange-600" : "text-red-600"
          )}
        >
          {seconds}
        </motion.div>
        <div className="text-xs text-muted-foreground font-medium mt-1">
          secondes
        </div>
      </div>
    </div>
  );
};
