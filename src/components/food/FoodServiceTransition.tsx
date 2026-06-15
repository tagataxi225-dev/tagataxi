import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface FoodServiceTransitionProps {
  children: ReactNode;
}

export const FoodServiceTransition = ({ children }: FoodServiceTransitionProps) => {
  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  if (prefersReducedMotion) {
    return <>{children}</>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      className="flex-1 overflow-y-auto"
    >
      {children}
    </motion.div>
  );
};
