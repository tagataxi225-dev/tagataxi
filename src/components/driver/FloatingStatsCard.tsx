/**
 * 💰 PHASE 3: Floating Stats Card
 * Affiche les stats jour en overlay sur la carte
 */

import React from 'react';
import { Card } from '@/components/ui/card';
import { DollarSign, Car, Clock, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface FloatingStatsCardProps {
  todayEarnings: number;
  todayTrips: number;
  onlineHours?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  className?: string;
}

interface StatItemProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}

const StatItem: React.FC<StatItemProps> = ({ icon, label, value, color }) => (
  <div className="flex flex-col items-center justify-center gap-1">
    <div className={cn("p-2 rounded-lg", color)}>
      {icon}
    </div>
    <div className="text-xs text-muted-foreground text-center">{label}</div>
    <div className="text-base font-bold text-foreground">{value}</div>
  </div>
);

export const FloatingStatsCard: React.FC<FloatingStatsCardProps> = ({
  todayEarnings,
  todayTrips,
  onlineHours = 0,
  position = 'top-right',
  className
}) => {
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4'
  };

  const formatEarnings = (amount: number) => {
    return `${amount.toLocaleString()} CDF`;
  };

  const formatHours = (hours: number) => {
    if (hours === 0) return '0h';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return m > 0 ? `${h}h${m}` : `${h}h`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "fixed z-40",
        positionClasses[position],
        className
      )}
    >
      <Card className="bg-background/95 backdrop-blur-sm shadow-2xl border-2 border-primary/20 p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Aujourd'hui</span>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <StatItem
            icon={<DollarSign className="h-4 w-4 text-green-500" />}
            label="Gains"
            value={formatEarnings(todayEarnings)}
            color="bg-green-50 dark:bg-green-950"
          />
          
          <StatItem
            icon={<Car className="h-4 w-4 text-blue-500" />}
            label="Courses"
            value={todayTrips}
            color="bg-blue-50 dark:bg-blue-950"
          />
          
          <StatItem
            icon={<Clock className="h-4 w-4 text-amber-500" />}
            label="En ligne"
            value={formatHours(onlineHours)}
            color="bg-amber-50 dark:bg-amber-950"
          />
        </div>
      </Card>
    </motion.div>
  );
};
