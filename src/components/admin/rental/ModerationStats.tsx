import { Card } from '@/components/ui/card';
import { TrendingUp, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface ModerationStatsProps {
  stats: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    avgModerationTime?: number; // en heures
    approvalRate?: number; // en pourcentage
  };
}

export const ModerationStats = ({ stats }: ModerationStatsProps) => {
  const approvalRate = stats.total > 0 
    ? Math.round((stats.approved / (stats.approved + stats.rejected)) * 100) 
    : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <TrendingUp className="h-8 w-8 text-blue-600 opacity-50" />
        </div>
      </Card>

      <Card className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900 border-yellow-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">En attente</p>
            <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">{stats.pending}</p>
          </div>
          <AlertCircle className="h-8 w-8 text-yellow-600 opacity-50" />
        </div>
      </Card>

      <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Approuvés</p>
            <p className="text-2xl font-bold text-green-700 dark:text-green-400">{stats.approved}</p>
          </div>
          <CheckCircle className="h-8 w-8 text-green-600 opacity-50" />
        </div>
      </Card>

      <Card className="p-4 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 border-red-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Rejetés</p>
            <p className="text-2xl font-bold text-red-700 dark:text-red-400">{stats.rejected}</p>
          </div>
          <XCircle className="h-8 w-8 text-red-600 opacity-50" />
        </div>
      </Card>

      <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Taux d'approbation</p>
            <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">
              {isNaN(approvalRate) ? '0' : approvalRate}%
            </p>
          </div>
          <Clock className="h-8 w-8 text-purple-600 opacity-50" />
        </div>
      </Card>
    </div>
  );
};