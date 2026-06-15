import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  icon: React.ReactElement<LucideIcon>;
  value: number | string;
  label: string;
  color: string; // Gradient classes like "from-blue-500 to-cyan-500"
  trend?: string;
  children?: React.ReactNode;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  icon,
  value,
  label,
  color,
  trend,
  children
}) => {
  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <Card className={`relative overflow-hidden bg-gradient-to-br ${color} text-white border-0 shadow-xl`}>
        {children}
        <CardContent className="p-4 relative z-10">
          <div className="flex items-center justify-between mb-2">
            <div className="text-white/90">
              {icon}
            </div>
            {trend && (
              <Badge variant="secondary" className="text-xs bg-white/20 text-white border-0">
                {trend}
              </Badge>
            )}
          </div>
          <p className="text-3xl font-black mb-1 text-white drop-shadow-lg">{value}</p>
          <p className="text-xs opacity-90 text-white/80">{label}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
};
