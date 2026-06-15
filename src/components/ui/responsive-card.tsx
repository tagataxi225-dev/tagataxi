import React from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { TouchOptimizedCard } from '@/components/ui/touch-optimized';

interface ResponsiveCardProps {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
  onTap?: () => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'glass' | 'modern' | 'floating';
}

const sizeClasses = {
  sm: 'p-3 sm:p-4',
  md: 'p-4 sm:p-6',
  lg: 'p-6 sm:p-8'
};

const variantClasses = {
  default: 'bg-card border border-border',
  glass: 'glassmorphism',
  modern: 'card-modern',
  floating: 'card-floating'
};

export const ResponsiveCard: React.FC<ResponsiveCardProps> = ({
  children,
  className,
  interactive = false,
  onTap,
  size = 'md',
  variant = 'default'
}) => {
  const cardClasses = cn(
    'rounded-xl transition-all duration-200',
    sizeClasses[size],
    variantClasses[variant],
    interactive && 'hover:scale-[1.02] cursor-pointer',
    className
  );

  if (interactive || onTap) {
    return (
      <TouchOptimizedCard className={cardClasses} onTap={onTap}>
        {children}
      </TouchOptimizedCard>
    );
  }

  return (
    <Card className={cardClasses}>
      {children}
    </Card>
  );
};

export default ResponsiveCard;