/**
 * 📊 PHASE 1: Barre de stats compacte (seulement 2 KPIs)
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { DollarSign, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CompactStatsBarProps {
  todayEarnings: number;
  totalRides: number;
  onClick?: () => void;
}

export const CompactStatsBar: React.FC<CompactStatsBarProps> = ({
  todayEarnings,
  totalRides,
  onClick
}) => {
  return (
    <Card 
      className={cn(
        "bg-gradient-to-br from-primary/5 to-secondary/5 border-border/50 cursor-pointer hover:shadow-md transition-all",
        onClick && "cursor-pointer"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Revenus du jour */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-950">
              <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Aujourd'hui</p>
              <p className="text-lg font-bold text-green-600 dark:text-green-400">
                {todayEarnings.toLocaleString()} CDF
              </p>
            </div>
          </div>

          {/* Nombre de courses */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950">
              <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Courses</p>
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {totalRides}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
