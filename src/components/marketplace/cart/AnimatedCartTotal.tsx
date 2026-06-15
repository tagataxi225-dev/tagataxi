import React from 'react';
import { motion } from 'framer-motion';
import { AnimatedBalance } from '@/components/wallet/AnimatedBalance';

interface AnimatedCartTotalProps {
  total: number;
}

export const AnimatedCartTotal: React.FC<AnimatedCartTotalProps> = ({ total }) => {
  return (
    <motion.div
      layout
      className="relative overflow-hidden rounded-lg sm:rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/10 p-3 sm:p-4 border border-primary/20"
    >
      {/* Shimmer effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
        animate={{
          x: ['-100%', '200%']
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'linear'
        }}
      />

      <div className="relative flex items-center justify-between">
        <span className="text-xs sm:text-sm font-medium text-muted-foreground">
          Total à payer
        </span>
        <AnimatedBalance value={total} currency="CDF" duration={0.8} />
      </div>

      {/* Decorative gradient line */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-primary"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.5 }}
      />
    </motion.div>
  );
};
