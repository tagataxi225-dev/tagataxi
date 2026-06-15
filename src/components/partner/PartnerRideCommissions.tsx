import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePartnerRideCommissions } from '@/hooks/partner/usePartnerRideCommissions';
import { TrendingUp, DollarSign, Car, Users } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export const PartnerRideCommissions = () => {
  const { stats, isLoading } = usePartnerRideCommissions();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-CD', {
      style: 'currency',
      currency: stats.currency,
      minimumFractionDigits: 0
    }).format(amount).replace('CDF', 'CDF');
  };

  const statCards = [
    {
      title: 'Commissions ce mois',
      value: formatCurrency(stats.monthlyCommissions),
      icon: DollarSign,
      description: `${stats.monthlyRides} courses`,
      color: 'text-green-600'
    },
    {
      title: 'Total commissions',
      value: formatCurrency(stats.totalCommissions),
      icon: TrendingUp,
      description: `${stats.totalRides} courses au total`,
      color: 'text-blue-600'
    },
    {
      title: 'Commission moyenne',
      value: formatCurrency(stats.averageCommissionPerRide),
      icon: Car,
      description: 'Par course (2.5%)',
      color: 'text-purple-600'
    },
    {
      title: 'Chauffeurs actifs',
      value: stats.activeDrivers.toString(),
      icon: Users,
      description: 'Dans votre portefeuille',
      color: 'text-orange-600'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenus sur Courses</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">{stat.title}</span>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div className="text-2xl font-bold mb-1">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </div>
            );
          })}
        </div>

        {stats.activeDrivers === 0 && (
          <div className="mt-4 p-4 bg-muted/50 rounded-lg text-center">
            <p className="text-sm text-muted-foreground">
              Aucun chauffeur dans votre portefeuille. Ajoutez des chauffeurs pour commencer à gagner des commissions sur leurs courses.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
