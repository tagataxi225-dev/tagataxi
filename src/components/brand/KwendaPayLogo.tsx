import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface KwendaPayLogoProps {
  variant?: 'minimal' | 'full' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  className?: string;
}

export const KwendaPayLogo: React.FC<KwendaPayLogoProps> = ({
  variant = 'icon',
  size = 'md',
  animated = false,
  className
}) => {
  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const LogoIcon = () => (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(sizes[size], className)}
    >
      {/* K letter with Congo flag colors */}
      <path
        d="M8 8 L8 32 L12 32 L12 22 L20 32 L26 32 L16 20 L26 8 L20 8 L12 18 L12 8 Z"
        fill="url(#congo-gradient)"
      />
      
      {/* Coin circle outline */}
      <circle
        cx="20"
        cy="20"
        r="18"
        stroke="url(#congo-gradient)"
        strokeWidth="2"
        fill="none"
      />
      
      {/* Gradient definition using Congo colors */}
      <defs>
        <linearGradient id="congo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(357, 85%, 50%)" />
          <stop offset="50%" stopColor="hsl(42, 100%, 60%)" />
          <stop offset="100%" stopColor="hsl(142, 85%, 45%)" />
        </linearGradient>
      </defs>
    </svg>
  );

  if (variant === 'icon') {
    return animated ? (
      <motion.div
        animate={{
          scale: [1, 1.05, 1],
          rotate: [0, 5, -5, 0]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <LogoIcon />
      </motion.div>
    ) : (
      <LogoIcon />
    );
  }

  if (variant === 'minimal') {
    return (
      <div className="flex items-center gap-2">
        {animated ? (
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          >
            <LogoIcon />
          </motion.div>
        ) : (
          <LogoIcon />
        )}
        <span className="font-bold text-lg bg-gradient-to-r from-congo-red via-congo-yellow to-congo-green bg-clip-text text-transparent">
          TembeaPay
        </span>
      </div>
    );
  }

  // Full variant
  return (
    <div className="flex flex-col items-center gap-1">
      {animated ? (
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <LogoIcon />
        </motion.div>
      ) : (
        <LogoIcon />
      )}
      <div className="text-center">
        <p className="font-bold text-xl bg-gradient-to-r from-congo-red via-congo-yellow to-congo-green bg-clip-text text-transparent">
          TembeaPay
        </p>
        <p className="text-xs text-muted-foreground">Portefeuille Digital Congo</p>
      </div>
    </div>
  );
};
