import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// =================== CONGO BUTTON ===================
interface CongoButtonProps {
  children: React.ReactNode;
  variant?: 'default' | 'electric' | 'vibrant' | 'glow' | 'success' | 'warning' | 'info';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  asChild?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

const CongoButton: React.FC<CongoButtonProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className,
  onClick,
  disabled = false,
  asChild = false,
  type = 'button',
  ...props
}) => {
  const variants = {
    default: 'btn-congo',
    electric: 'btn-congo-electric',
    vibrant: 'btn-congo-vibrant',
    glow: 'btn-congo-glow',
    success: 'bg-success text-success-foreground hover:bg-success/90 shadow-lg',
    warning: 'bg-warning text-warning-foreground hover:bg-warning/90 shadow-lg',
    info: 'bg-info text-info-foreground hover:bg-info/90 shadow-lg'
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm rounded-md',
    md: 'px-6 py-3 text-base rounded-lg',
    lg: 'px-8 py-4 text-lg rounded-xl'
  };

  return (
    <Button
      asChild={asChild}
      className={cn(
        'font-semibold transition-all duration-200 active:scale-95',
        variants[variant],
        sizes[size],
        className
      )}
      onClick={onClick}
      disabled={disabled}
      type={type}
      {...props}
    >
      {children}
    </Button>
  );
};

// =================== CONGO CARD ===================
interface CongoCardProps {
  children: React.ReactNode;
  variant?: 'default' | 'electric' | 'vibrant' | 'glow' | 'glassmorphism' | 'success' | 'warning' | 'info';
  className?: string;
  onClick?: () => void;
}

const CongoCard: React.FC<CongoCardProps> = ({
  children,
  variant = 'default',
  className,
  onClick,
  ...props
}) => {
  const variants = {
    default: 'card-congo',
    electric: 'card-congo-electric',
    vibrant: 'congo-vibrant card-modern',
    glow: 'congo-glow card-modern',
    glassmorphism: 'glassmorphism rounded-xl p-6',
    success: 'bg-success/10 border-success/30 text-success-foreground',
    warning: 'bg-warning/10 border-warning/30 text-warning-foreground',
    info: 'bg-info/10 border-info/30 text-info-foreground'
  };

  return (
    <Card
      className={cn(
        'p-6 transition-all duration-300 cursor-pointer',
        variants[variant],
        onClick && 'hover:scale-[1.02] active:scale-[0.98]',
        className
      )}
      onClick={onClick}
      {...props}
    >
      {children}
    </Card>
  );
};

// =================== CONGO BADGE ===================
interface CongoBadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'electric' | 'vibrant' | 'glow' | 'success' | 'warning' | 'info';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const CongoBadge: React.FC<CongoBadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className,
  ...props
}) => {
  const variants = {
    default: 'bg-congo-red text-white border-congo-red/20',
    electric: 'congo-gradient-electric text-white border-0',
    vibrant: 'congo-gradient-vibrant text-white border-0',
    glow: 'bg-congo-blue text-white border-congo-blue/20 congo-glow',
    success: 'bg-success text-success-foreground border-success/20',
    warning: 'bg-warning text-warning-foreground border-warning/20',
    info: 'bg-info text-info-foreground border-info/20'
  };

  const sizes = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  return (
    <Badge
      className={cn(
        'font-semibold transition-all duration-200',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </Badge>
  );
};

// =================== CONGO GRADIENT ===================
interface CongoGradientProps {
  children: React.ReactNode;
  variant?: 'default' | 'electric' | 'vibrant' | 'glow' | 'subtle' | 'mesh';
  className?: string;
}

const CongoGradient: React.FC<CongoGradientProps> = ({
  children,
  variant = 'default',
  className,
  ...props
}) => {
  const variants = {
    default: 'congo-gradient',
    electric: 'congo-gradient-electric',
    vibrant: 'congo-gradient-vibrant',
    glow: 'congo-gradient-glow',
    subtle: 'congo-gradient-subtle',
    mesh: 'bg-gradient-to-br from-congo-red via-congo-yellow to-congo-blue'
  };

  return (
    <div
      className={cn(
        'p-6 rounded-xl transition-all duration-300',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export { CongoButton, CongoCard, CongoBadge, CongoGradient };