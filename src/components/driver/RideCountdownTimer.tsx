/**
 * ⏱️ Timer visuel avec progress circulaire
 */

import React from 'react';
import { Clock } from 'lucide-react';
import { motion } from 'framer-motion';

interface RideCountdownTimerProps {
  seconds: number;
  maxSeconds?: number;
}

export const RideCountdownTimer: React.FC<RideCountdownTimerProps> = ({ 
  seconds, 
  maxSeconds = 30 
}) => {
  const percentage = (seconds / maxSeconds) * 100;
  const isUrgent = seconds <= 10;

  return (
    <div className="relative flex items-center gap-2">
      {/* Circle progress */}
      <div className="relative w-10 h-10">
        <svg className="transform -rotate-90" width="40" height="40">
          <circle
            cx="20"
            cy="20"
            r="16"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="3"
            fill="none"
          />
          <motion.circle
            cx="20"
            cy="20"
            r="16"
            stroke="white"
            strokeWidth="3"
            fill="none"
            strokeDasharray={`${2 * Math.PI * 16}`}
            strokeDashoffset={`${2 * Math.PI * 16 * (1 - percentage / 100)}`}
            animate={{ 
              strokeDashoffset: `${2 * Math.PI * 16 * (1 - percentage / 100)}`,
              stroke: isUrgent ? '#ef4444' : 'white'
            }}
            transition={{ duration: 0.3 }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-white">{seconds}s</span>
        </div>
      </div>
    </div>
  );
};
