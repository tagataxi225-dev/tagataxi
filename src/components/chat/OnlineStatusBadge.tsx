import React from 'react';
import { cn } from '@/lib/utils';

interface OnlineStatusBadgeProps {
  isOnline: boolean;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const OnlineStatusBadge: React.FC<OnlineStatusBadgeProps> = ({
  isOnline,
  showText = false,
  size = 'md',
  className
}) => {
  const sizeClasses = {
    sm: 'h-2 w-2',
    md: 'h-2.5 w-2.5',
    lg: 'h-3 w-3'
  };

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <span
        className={cn(
          "rounded-full flex-shrink-0 transition-colors duration-300",
          sizeClasses[size],
          isOnline 
            ? "bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.5)]" 
            : "bg-muted-foreground/40"
        )}
      />
      {showText && (
        <span className={cn(
          "text-xs",
          isOnline ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
        )}>
          {isOnline ? 'En ligne' : 'Hors ligne'}
        </span>
      )}
    </div>
  );
};
