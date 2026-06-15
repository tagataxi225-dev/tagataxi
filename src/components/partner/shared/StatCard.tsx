import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  suffix?: string;
  badge?: {
    text: string;
    icon?: LucideIcon;
    variant: 'success' | 'warning' | 'error' | 'info';
  };
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  onClick?: () => void;
}

export const StatCard = ({
  icon: Icon,
  label,
  value,
  suffix = '',
  badge,
  trend,
  className,
  onClick
}: StatCardProps) => {
  const badgeColors = {
    success: 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    warning: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    error: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    info: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={onClick ? { scale: 1.02 } : {}}
      className={cn("h-full", onClick && "cursor-pointer")}
      onClick={onClick}
    >
      <Card className="h-full backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/30">
              <Icon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            
            {badge && (
              <div className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                badgeColors[badge.variant]
              )}>
                {badge.icon && <badge.icon className="w-3 h-3" />}
                {badge.text}
              </div>
            )}
          </div>

          <div className="space-y-1">
            <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
              {label}
            </p>
            
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
                {value}
              </h3>
              {suffix && (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {suffix}
                </span>
              )}
            </div>

            {trend && (
              <div className={cn(
                "flex items-center gap-1 text-xs font-medium",
                trend.isPositive 
                  ? "text-green-600 dark:text-green-400" 
                  : "text-red-600 dark:text-red-400"
              )}>
                <span>{trend.isPositive ? '↑' : '↓'}</span>
                <span>{Math.abs(trend.value)}%</span>
                <span className="text-gray-500 dark:text-gray-400">vs mois dernier</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
