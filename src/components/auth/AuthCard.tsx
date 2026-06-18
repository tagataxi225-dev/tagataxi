import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface AuthCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

/**
 * Premium glassmorphism card for authentication
 * Features: Backdrop blur, animated border glow, deep shadows
 */
export const AuthCard = ({ children, className = '', delay = 0.2 }: AuthCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.5, 
        delay,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      className={`relative group ${className}`}
    >
      {/* Animated border glow */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400 rounded-3xl opacity-0 group-hover:opacity-20 blur transition-opacity duration-500" />
      
      {/* Main card with glassmorphism */}
      <div className="relative backdrop-blur-xl bg-white/80 dark:bg-card/80 border border-white/50 dark:border-border/50 rounded-3xl shadow-2xl shadow-emerald-500/5 dark:shadow-emerald-500/10 overflow-hidden">
        {/* Shimmer effect on hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
        </div>
        
        {/* Inner glow at top */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-300/50 dark:via-emerald-500/30 to-transparent" />
        
        {/* Content */}
        <div className="relative p-6 sm:p-8">
          {children}
        </div>
      </div>
    </motion.div>
  );
};
