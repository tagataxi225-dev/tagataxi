import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import tagaLogo from '@/assets/LOGO_TAGA.png';

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
    <img
      src={tagaLogo}
      alt="TAGAPay"
      className={cn(sizes[size], 'rounded-lg object-contain', className)}
      loading="eager"
      decoding="async"
    />
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
          TAGAPay
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
          TAGAPay
        </p>
        <p className="text-xs text-muted-foreground">Portefeuille Digital Congo</p>
      </div>
    </div>
  );
};
