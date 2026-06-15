import React from 'react';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

interface NotificationBadgeProps {
  count: number;
  max?: number;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  showZero?: boolean;
  pulse?: boolean;
  className?: string;
}

const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  count,
  max = 99,
  variant = 'destructive',
  size = 'sm',
  showZero = false,
  pulse = true,
  className = ''
}) => {
  if (count === 0 && !showZero) {
    return null;
  }

  const displayCount = count > max ? `${max}+` : count.toString();

  const sizeClasses = {
    sm: 'h-4 w-4 text-xs min-w-[16px]',
    md: 'h-5 w-5 text-xs min-w-[20px]',
    lg: 'h-6 w-6 text-sm min-w-[24px]'
  };

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className={className}
    >
      <Badge 
        variant={variant}
        className={`
          ${sizeClasses[size]}
          rounded-full flex items-center justify-center
          font-bold leading-none p-0
          ${pulse && count > 0 ? 'animate-pulse-glow' : ''}
        `}
      >
        {displayCount}
      </Badge>
    </motion.div>
  );
};

export default NotificationBadge;