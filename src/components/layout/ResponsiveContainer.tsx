import React from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  withBottomNav?: boolean;
  withHeader?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md', 
  lg: 'max-w-4xl',
  xl: 'max-w-6xl',
  full: 'max-w-none'
};

const paddingClasses = {
  none: '',
  sm: 'px-2 sm:px-4',
  md: 'px-4 sm:px-6',
  lg: 'px-6 sm:px-8'
};

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  className,
  size = 'lg',
  withBottomNav = false,
  withHeader = false,
  padding = 'md'
}) => {
  return (
    <div className={cn(
      'mx-auto w-full',
      sizeClasses[size],
      paddingClasses[padding],
      withHeader && 'pt-16 sm:pt-20',
      className
    )}>
      <div className={cn(
        'w-full',
        withBottomNav && 'pb-[var(--bottom-nav-height-safe)]'
      )}>
        {children}
      </div>
    </div>
  );
};

export default ResponsiveContainer;