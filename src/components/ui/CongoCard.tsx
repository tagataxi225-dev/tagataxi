import React from 'react';
import { cn } from '@/lib/utils';

interface CongoCardProps {
  children: React.ReactNode;
  variant?: 'congo' | 'electric' | 'glow' | 'vibrant';
  className?: string;
  onClick?: () => void;
}

const CongoCard: React.FC<CongoCardProps> = ({
  children,
  variant = 'congo',
  className,
  onClick,
  ...props
}) => {
  const variants = {
    congo: 'card-congo',
    electric: 'card-congo-electric',
    glow: 'congo-glow card-modern',
    vibrant: 'congo-vibrant card-modern'
  };

  return (
    <div
      className={cn(
        'p-6 rounded-xl transition-all duration-300 cursor-pointer',
        variants[variant],
        className
      )}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
};

export default CongoCard;