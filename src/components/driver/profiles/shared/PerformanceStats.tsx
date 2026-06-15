/**
 * 📊 Stats de performance réutilisables - Avec loading state
 */

import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';

interface Stat {
  label: string;
  value: string | number;
  icon: string;
}

interface PerformanceStatsProps {
  stats: Stat[];
  serviceType: 'taxi' | 'delivery';
  loading?: boolean;
}

export const PerformanceStats = ({ stats, serviceType, loading = false }: PerformanceStatsProps) => {
  if (loading) {
    return (
      <Card className="p-6 animate-pulse">
        <div className="h-6 bg-muted rounded w-40 mb-4" />
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="p-4 rounded-xl bg-muted h-24" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card className="p-6">
        <h3 className="font-semibold text-foreground mb-4">Stats de performance</h3>
        <div className="grid grid-cols-2 gap-4">
          {stats.map((stat, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 * index }}
              className={`p-4 rounded-xl ${
                serviceType === 'taxi' 
                  ? 'bg-primary/10 border border-primary/20' 
                  : 'bg-green-500/10 border border-green-500/20'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{stat.icon}</span>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
              <p className={`text-2xl font-bold ${
                serviceType === 'taxi' ? 'text-primary' : 'text-green-500'
              }`}>
                {stat.value}
              </p>
            </motion.div>
          ))}
        </div>
      </Card>
    </motion.div>
  );
};
