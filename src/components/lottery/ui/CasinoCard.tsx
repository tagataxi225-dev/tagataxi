import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { GoldShimmer } from './ShimmerEffect';

interface CasinoCardProps {
  children: React.ReactNode;
  variant?: 'gold' | 'silver' | 'blue' | 'red';
  className?: string;
  shimmer?: boolean;
  glow?: boolean;
}

const variantStyles = {
  gold: {
    bg: 'bg-gradient-to-br from-amber-900 via-yellow-800 to-amber-900',
    border: 'border-amber-500/50',
    glow: 'shadow-amber-500/30'
  },
  silver: {
    bg: 'bg-gradient-to-br from-slate-700 via-slate-600 to-slate-700',
    border: 'border-slate-400/50',
    glow: 'shadow-slate-400/30'
  },
  blue: {
    bg: 'bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900',
    border: 'border-blue-400/50',
    glow: 'shadow-blue-400/30'
  },
  red: {
    bg: 'bg-gradient-to-br from-rose-900 via-red-800 to-rose-900',
    border: 'border-rose-400/50',
    glow: 'shadow-rose-400/30'
  }
};

export const CasinoCard: React.FC<CasinoCardProps> = ({
  children,
  variant = 'gold',
  className,
  shimmer = true,
  glow = true
}) => {
  const styles = variantStyles[variant];

  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={cn(
        "relative overflow-hidden rounded-2xl",
        styles.bg,
        "border-2",
        styles.border,
        glow && `shadow-xl ${styles.glow}`,
        className
      )}
    >
      {/* Diamond pattern overlay */}
      <div 
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10 0l10 10-10 10L0 10z' fill='%23fff' fill-opacity='0.3'/%3E%3C/svg%3E")`,
          backgroundSize: '20px 20px'
        }}
      />

      {/* Shimmer effect */}
      {shimmer && <GoldShimmer />}

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>

      {/* Corner decorations */}
      <div className="absolute top-2 left-2 text-amber-400/30 text-xs">♦</div>
      <div className="absolute top-2 right-2 text-amber-400/30 text-xs">♠</div>
      <div className="absolute bottom-2 left-2 text-amber-400/30 text-xs">♥</div>
      <div className="absolute bottom-2 right-2 text-amber-400/30 text-xs">♣</div>
    </motion.div>
  );
};

export const GoldBadge: React.FC<{ 
  children: React.ReactNode; 
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}> = ({ children, className, size = 'md' }) => {
  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base'
  };

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-semibold",
        "bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500",
        "text-amber-900 shadow-lg shadow-amber-500/30",
        sizeStyles[size],
        className
      )}
    >
      {children}
    </motion.div>
  );
};
