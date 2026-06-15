import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Ticket, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RidesProgressBarProps {
  ridesRemaining: number;
  ridesIncluded: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showAlert?: boolean;
  className?: string;
}

export const RidesProgressBar: React.FC<RidesProgressBarProps> = ({
  ridesRemaining,
  ridesIncluded,
  size = 'md',
  showLabel = true,
  showAlert = true,
  className
}) => {
  const percentage = ridesIncluded > 0 ? (ridesRemaining / ridesIncluded) * 100 : 0;
  const isLow = percentage <= 20 && percentage > 0;
  const isEmpty = ridesRemaining === 0;

  const getProgressColor = () => {
    if (isEmpty) return 'bg-red-500';
    if (isLow) return 'bg-orange-500';
    if (percentage <= 50) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const heightClasses = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  return (
    <div className={cn('space-y-2', className)}>
      {showLabel && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Ticket className={cn(
              textSizeClasses[size] === 'text-xs' ? 'h-3 w-3' : 
              textSizeClasses[size] === 'text-sm' ? 'h-3.5 w-3.5' : 'h-4 w-4',
              getProgressColor().replace('bg-', 'text-')
            )} />
            <span className={cn('font-medium', textSizeClasses[size])}>
              {ridesRemaining} / {ridesIncluded} courses
            </span>
          </div>
          
          {showAlert && (isLow || isEmpty) && (
            <Badge 
              variant={isEmpty ? 'destructive' : 'outline'}
              className={cn(
                'gap-1',
                isEmpty ? 'border-red-500 text-red-600' : 'border-orange-500 text-orange-600'
              )}
            >
              <AlertTriangle className="h-3 w-3" />
              {isEmpty ? 'Épuisé' : 'Faible'}
            </Badge>
          )}
        </div>
      )}
      
      <div className="relative">
        <div className={cn('w-full bg-muted rounded-full overflow-hidden', heightClasses[size])}>
          <div 
            className={cn('h-full transition-all duration-300', getProgressColor())}
            style={{ width: `${percentage}%` }}
          />
        </div>
        
        {/* Percentage label inside progress bar for larger sizes */}
        {size === 'lg' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold text-white drop-shadow-md">
              {Math.round(percentage)}%
            </span>
          </div>
        )}
      </div>

      {/* Detailed info for medium and large sizes */}
      {(size === 'md' || size === 'lg') && (
        <p className={cn('text-muted-foreground', textSizeClasses[size])}>
          {ridesRemaining > 0 ? (
            <>Encore <strong className="text-foreground">{ridesRemaining}</strong> course{ridesRemaining > 1 ? 's' : ''} disponible{ridesRemaining > 1 ? 's' : ''}</>
          ) : (
            <span className="text-red-600 font-medium">Aucune course restante - Renouvellement requis</span>
          )}
        </p>
      )}
    </div>
  );
};