/**
 * 🚗 Stats flottantes Glassmorphism pour chauffeurs taxi
 */

import { Car, Wallet, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TaxiFloatingStatsProps {
  ridesCount: number;
  earnings: number;
  hoursOnline: number;
  className?: string;
}

interface StatCardProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  color: 'blue' | 'green' | 'orange';
  delay?: number;
}

const StatCard = ({ icon, value, label, color, delay = 0 }: StatCardProps) => {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-500/10 dark:bg-blue-500/20',
      icon: 'text-blue-500',
      glow: 'group-hover:shadow-blue-500/20'
    },
    green: {
      bg: 'bg-green-500/10 dark:bg-green-500/20', 
      icon: 'text-green-500',
      glow: 'group-hover:shadow-green-500/20'
    },
    orange: {
      bg: 'bg-orange-500/10 dark:bg-orange-500/20',
      icon: 'text-orange-500', 
      glow: 'group-hover:shadow-orange-500/20'
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      whileHover={{ y: -4, scale: 1.02 }}
      className={cn(
        'group relative overflow-hidden rounded-2xl p-4 text-center',
        'bg-card/60 dark:bg-card/40 backdrop-blur-xl',
        'border border-border/50',
        'shadow-sm hover:shadow-lg transition-all duration-300',
        colorClasses[color].glow
      )}
    >
      {/* Glassmorphism overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
      
      {/* Icon */}
      <motion.div 
        className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2',
          colorClasses[color].bg
        )}
        whileHover={{ rotate: [0, -10, 10, 0] }}
        transition={{ duration: 0.5 }}
      >
        <div className={colorClasses[color].icon}>
          {icon}
        </div>
      </motion.div>
      
      {/* Value */}
      <motion.p 
        className="text-2xl font-bold text-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: delay + 0.2 }}
      >
        {value}
      </motion.p>
      
      {/* Label */}
      <p className="text-xs text-muted-foreground font-medium mt-0.5">
        {label}
      </p>
    </motion.div>
  );
};

export const TaxiFloatingStats = ({ 
  ridesCount, 
  earnings, 
  hoursOnline,
  className 
}: TaxiFloatingStatsProps) => {
  return (
    <div className={cn('grid grid-cols-3 gap-3', className)}>
      <StatCard
        icon={<Car className="w-5 h-5" />}
        value={ridesCount}
        label="Courses"
        color="blue"
        delay={0}
      />
      <StatCard
        icon={<Wallet className="w-5 h-5" />}
        value={earnings.toLocaleString()}
        label="CDF"
        color="green"
        delay={0.1}
      />
      <StatCard
        icon={<Clock className="w-5 h-5" />}
        value={`${hoursOnline}h`}
        label="En ligne"
        color="orange"
        delay={0.2}
      />
    </div>
  );
};
