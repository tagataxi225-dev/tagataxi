import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface VendorPageTransitionProps {
  children: ReactNode;
  className?: string;
}

export const VendorPageTransition = ({ children, className }: VendorPageTransitionProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ 
        duration: 0.3, 
        ease: [0.25, 0.46, 0.45, 0.94] // easeOutQuad
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};
