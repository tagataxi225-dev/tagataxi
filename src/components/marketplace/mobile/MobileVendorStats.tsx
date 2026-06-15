import React from 'react';
import { Store, Package, DollarSign, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface StatsData {
  activeProducts: number;
  totalProducts: number;
  pendingConfirmations: number;
  effectiveRevenue: number;
  pendingRevenue: number;
}

interface MobileVendorStatsProps {
  stats: StatsData;
  loading?: boolean;
}

export const MobileVendorStats: React.FC<MobileVendorStatsProps> = ({
  stats,
  loading = false
}) => {
  const statsItems = [
    {
      label: 'Produits',
      value: `${stats.activeProducts}/${stats.totalProducts}`,
      icon: Store,
      color: 'text-primary'
    },
    {
      label: 'Confirmations',
      value: stats.pendingConfirmations.toString(),
      icon: Package,
      color: 'text-primary',
      badge: stats.pendingConfirmations > 0
    },
    {
      label: 'Revenus effectifs',
      value: `${stats.effectiveRevenue.toLocaleString()} CDF`,
      icon: DollarSign,
      color: 'text-red-600'
    },
    {
      label: 'En attente',
      value: `${stats.pendingRevenue.toLocaleString()} CDF`,
      icon: Clock,
      color: 'text-orange-500'
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 p-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="p-3">
              <div className="animate-pulse">
                <div className="h-3 bg-muted rounded mb-2"></div>
                <div className="h-6 bg-muted rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 p-4">
      {statsItems.map((item, index) => {
        const Icon = item.icon;
        return (
          <Card key={index} className="relative">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground truncate">{item.label}</p>
                  <p className={`text-lg font-bold ${item.color} truncate`}>{item.value}</p>
                </div>
                <Icon className={`w-6 h-6 ${item.color} flex-shrink-0`} />
              </div>
              {item.badge && stats.pendingConfirmations > 0 && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full"></div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};