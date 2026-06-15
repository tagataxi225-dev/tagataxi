import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, DollarSign, Star, Award, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: number;
  color?: string;
  delay?: number;
}

const StatCard: React.FC<StatsCardProps> = ({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  color = 'text-primary',
  delay = 0
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
    >
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-1">{title}</p>
              <p className="text-2xl font-bold">{value}</p>
              {trend !== undefined && (
                <div className={cn(
                  "flex items-center gap-1 text-xs mt-1",
                  trend > 0 ? 'text-green-600' : 'text-red-600'
                )}>
                  <TrendingUp className="h-3 w-3" />
                  {trend > 0 ? '+' : ''}{trend}% vs hier
                </div>
              )}
            </div>
            <div className={cn(
              'p-3 rounded-full bg-opacity-10',
              color.replace('text-', 'bg-')
            )}>
              <Icon className={cn('h-5 w-5', color)} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

interface DriverStatsPanelProps {
  serviceType: 'taxi' | 'delivery';
  stats: {
    todayEarnings: number;
    todayTrips: number;
    averageRating: number;
    weeklyGoal?: number;
    weeklyProgress?: number;
  };
  className?: string;
}

export const DriverStatsPanel: React.FC<DriverStatsPanelProps> = ({
  serviceType,
  stats,
  className
}) => {
  const currency = 'CDF';

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" />
          Statistiques du jour
        </h2>
        <p className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString('fr-FR', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          title="Revenus aujourd'hui"
          value={`${stats.todayEarnings.toLocaleString()} ${currency}`}
          icon={DollarSign}
          trend={12}
          color="text-green-600"
          delay={0.1}
        />

        <StatCard
          title={serviceType === 'taxi' ? 'Courses du jour' : 'Livraisons du jour'}
          value={stats.todayTrips}
          icon={Calendar}
          trend={8}
          color="text-blue-600"
          delay={0.2}
        />

        <StatCard
          title="Note moyenne"
          value={stats.averageRating.toFixed(1)}
          icon={Star}
          color="text-yellow-600"
          delay={0.3}
        />

        <StatCard
          title="Objectif hebdo"
          value={stats.weeklyProgress ? `${stats.weeklyProgress}%` : 'N/A'}
          icon={TrendingUp}
          color="text-purple-600"
          delay={0.4}
        />
      </div>

      {/* Weekly Goal Progress */}
      {stats.weeklyGoal && stats.weeklyProgress !== undefined && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>Objectif de la semaine</span>
                <span className="text-primary">{stats.weeklyProgress}%</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.weeklyProgress}%` }}
                  transition={{ delay: 0.6, duration: 0.8, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {stats.weeklyGoal.toLocaleString()} {currency} / semaine
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};
