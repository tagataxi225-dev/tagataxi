import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Car, Truck, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ServiceTypeBadgeProps {
  serviceType: 'transport' | 'delivery' | 'both' | string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export const ServiceTypeBadge: React.FC<ServiceTypeBadgeProps> = ({
  serviceType,
  size = 'md',
  showIcon = true,
  className
}) => {
  const getConfig = () => {
    switch (serviceType) {
      case 'transport':
        return {
          label: 'Taxi',
          icon: Car,
          color: 'bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500/20',
          emoji: '🚗'
        };
      case 'delivery':
        return {
          label: 'Livraison',
          icon: Truck,
          color: 'bg-orange-500/10 text-orange-600 border-orange-500/20 hover:bg-orange-500/20',
          emoji: '🚚'
        };
      case 'both':
        return {
          label: 'Les deux',
          icon: Zap,
          color: 'bg-purple-500/10 text-purple-600 border-purple-500/20 hover:bg-purple-500/20',
          emoji: '🚗🚚'
        };
      default:
        return {
          label: serviceType,
          icon: Car,
          color: 'bg-muted text-muted-foreground',
          emoji: '❓'
        };
    }
  };

  const config = getConfig();
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-2.5 py-1 gap-1.5',
    lg: 'text-base px-3 py-1.5 gap-2'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-3.5 w-3.5',
    lg: 'h-4 w-4'
  };

  return (
    <Badge 
      variant="outline"
      className={cn(
        'font-medium transition-colors',
        config.color,
        sizeClasses[size],
        className
      )}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      <span>{config.emoji} {config.label}</span>
    </Badge>
  );
};