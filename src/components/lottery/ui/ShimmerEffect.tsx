import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ShimmerEffectProps {
  className?: string;
  duration?: number;
  delay?: number;
}

export const ShimmerEffect: React.FC<ShimmerEffectProps> = ({
  className,
  duration = 2.5,
  delay = 0
}) => {
  return (
    <motion.div
      initial={{ x: '-100%', opacity: 0 }}
      animate={{ 
        x: ['−100%', '200%'],
        opacity: [0, 0.6, 0]
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        repeatDelay: 1,
        ease: 'easeInOut'
      }}
      className={cn(
        "absolute inset-0 pointer-events-none",
        "bg-gradient-to-r from-transparent via-white/40 to-transparent",
        "skew-x-12",
        className
      )}
    />
  );
};

export const GoldShimmer: React.FC<ShimmerEffectProps> = ({
  className,
  duration = 3,
  delay = 0
}) => {
  return (
    <motion.div
      initial={{ x: '-100%' }}
      animate={{ x: '200%' }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        repeatDelay: 2,
        ease: 'easeInOut'
      }}
      className={cn(
        "absolute inset-0 pointer-events-none",
        "bg-gradient-to-r from-transparent via-amber-300/30 to-transparent",
        "skew-x-12",
        className
      )}
    />
  );
};
