import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';

interface ModernStatCardProps {
  icon: LucideIcon;
  iconColor: 'red' | 'green' | 'orange' | 'blue';
  label: string;
  value: string | number;
  trend?: string;
  onClick?: () => void;
}

const iconColorClasses = {
  red: 'text-red-500 bg-red-50',
  green: 'text-green-500 bg-green-50',
  orange: 'text-orange-500 bg-orange-50',
  blue: 'text-blue-500 bg-blue-50',
};

export const ModernStatCard: React.FC<ModernStatCardProps> = ({
  icon: Icon,
  iconColor,
  label,
  value,
  trend,
  onClick
}) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card 
        className={`p-4 bg-card dark:bg-card/95 border-border/50 ${onClick ? 'cursor-pointer' : ''}`}
        onClick={onClick}
      >
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <p className="text-sm text-muted-foreground">{label}</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold">{value}</p>
              {trend && (
                <span className="text-xs text-green-600 font-medium">
                  {trend}
                </span>
              )}
            </div>
          </div>
          
          <div className={`h-12 w-12 rounded-xl ${iconColorClasses[iconColor]} flex items-center justify-center`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
