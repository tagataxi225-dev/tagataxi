import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SubscriptionStatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  trend?: {
    value: number;
    label: string;
  };
  badge?: {
    text: string;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  };
  className?: string;
  borderColor?: string;
}

export const SubscriptionStatCard: React.FC<SubscriptionStatCardProps> = ({
  title,
  value,
  icon: Icon,
  description,
  trend,
  badge,
  className,
  borderColor
}) => {
  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend.value > 0) return <TrendingUp className="h-3 w-3" />;
    if (trend.value < 0) return <TrendingDown className="h-3 w-3" />;
    return <Minus className="h-3 w-3" />;
  };

  const getTrendColor = () => {
    if (!trend) return 'text-muted-foreground';
    if (trend.value > 0) return 'text-green-500';
    if (trend.value < 0) return 'text-red-500';
    return 'text-muted-foreground';
  };

  return (
    <Card 
      className={cn(
        'relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.02]',
        borderColor && `border-l-4`,
        className
      )}
      style={{ borderLeftColor: borderColor }}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4 sm:px-6 sm:pt-6">
        <CardTitle className="text-xs sm:text-sm font-medium">{title}</CardTitle>
        <div className="flex items-center gap-2">
          {badge && (
            <Badge variant={badge.variant || 'secondary'} className="text-xs">
              {badge.text}
            </Badge>
          )}
          <Icon className={cn('h-4 w-4', borderColor ? `text-[${borderColor}]` : 'text-muted-foreground')} />
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="text-xl sm:text-2xl font-bold">{value}</div>
        
        {(description || trend) && (
          <div className="mt-1 flex items-center gap-2">
            {trend && (
              <div className={cn('flex items-center gap-1 text-xs font-medium', getTrendColor())}>
                {getTrendIcon()}
                <span>{trend.value > 0 ? '+' : ''}{trend.value}%</span>
              </div>
            )}
            {description && (
              <p className="text-xs text-muted-foreground">
                {description}
              </p>
            )}
          </div>
        )}
      </CardContent>

      {/* Decoration gradient */}
      {borderColor && (
        <div 
          className="absolute top-0 right-0 w-32 h-32 opacity-5 -mr-16 -mt-16 rounded-full blur-2xl"
          style={{ backgroundColor: borderColor }}
        />
      )}
    </Card>
  );
};