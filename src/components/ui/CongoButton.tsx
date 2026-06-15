import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CongoButtonProps {
  children: React.ReactNode;
  variant?: 'congo' | 'electric' | 'vibrant' | 'glow' | 'support';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  asChild?: boolean;
}

const CongoButton: React.FC<CongoButtonProps> = ({
  children,
  variant = 'congo',
  size = 'md',
  className,
  onClick,
  disabled = false,
  asChild = false,
  ...props
}) => {
  const variants = {
    congo: 'btn-congo',
    electric: 'btn-congo-electric',
    vibrant: 'btn-congo-vibrant',
    glow: 'btn-congo-glow',
    support: 'btn-support-red'
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };

  if (asChild) {
    return (
      <Button
        asChild
        className={cn(
          variants[variant],
          sizes[size],
          className
        )}
        disabled={disabled}
        {...props}
      >
        {children}
      </Button>
    );
  }

  return (
    <Button
      className={cn(
        variants[variant],
        sizes[size],
        className
      )}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </Button>
  );
};

export default CongoButton;