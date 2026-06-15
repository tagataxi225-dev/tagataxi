import { useVendorStats } from '@/hooks/useVendorStats';
import { Card } from '@/components/ui/card';
import { Package, ShoppingBag, DollarSign, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export const VendorStatsCards = () => {
  const { stats, loading } = useVendorStats();

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="p-6">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-16" />
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      icon: Package,
      label: "Produits actifs",
      value: stats?.activeProducts || 0,
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    },
    {
      icon: ShoppingBag,
      label: "Commandes totales",
      value: stats?.totalOrders || 0,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      badge: stats?.pendingOrders ? `${stats.pendingOrders} en attente` : undefined
    },
    {
      icon: DollarSign,
      label: "Fonds séquestre",
      value: `${stats?.escrowBalance?.toLocaleString() || 0} CDF`,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      icon: TrendingUp,
      label: "Escrow en attente",
      value: `${stats?.pendingEscrow?.toLocaleString() || 0} CDF`,
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat, idx) => (
        <Card key={idx} className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
              <p className="text-2xl font-bold">{stat.value}</p>
              {stat.badge && (
                <p className="text-xs text-muted-foreground mt-1">{stat.badge}</p>
              )}
            </div>
            <div className={`p-3 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`h-6 w-6 ${stat.color}`} />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
