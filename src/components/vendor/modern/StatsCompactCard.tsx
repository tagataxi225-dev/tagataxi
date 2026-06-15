import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatsCompactCardProps {
  icon: LucideIcon;
  label: string;
  value: number | string;
  color?: 'green' | 'orange' | 'blue' | 'yellow';
  badge?: number;
  onClick?: () => void;
}

const colorClasses = {
  green: 'bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400',
  orange: 'bg-orange-500/10 border-orange-500/20 text-orange-600 dark:text-orange-400',
  blue: 'bg-primary/10 border-primary/20 text-primary',
  yellow: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-600 dark:text-yellow-400'
};

const iconClasses = {
  green: 'text-green-500',
  orange: 'text-orange-500',
  blue: 'text-primary',
  yellow: 'text-yellow-500'
};

export const StatsCompactCard: React.FC<StatsCompactCardProps> = ({
  icon: Icon,
  label,
  value,
  color = 'blue',
  badge,
  onClick
}) => {
  return (
    <Card
      className={cn(
        'p-3 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5',
        colorClasses[color],
        onClick && 'cursor-pointer active:scale-95'
      )}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium opacity-80">{label}</span>
        <Icon className={cn('h-4 w-4', iconClasses[color])} />
      </div>
      <p className="text-xl font-bold mb-1">{value}</p>
      {badge !== undefined && badge > 0 && (
        <Badge variant="destructive" className="text-[10px] h-4 px-1.5 animate-pulse">
          {badge} à traiter
        </Badge>
      )}
    </Card>
  );
};
