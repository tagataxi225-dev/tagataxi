import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DriverStats } from '@/hooks/useDriverManagement';
import { Car, Users, UserCheck, Activity, Shield, TrendingUp } from 'lucide-react';

interface DriverStatsCardsProps {
  stats: DriverStats;
}

export const DriverStatsCards: React.FC<DriverStatsCardsProps> = ({ stats }) => {
  const statsCards = [
    {
      title: 'Total Chauffeurs',
      value: stats.totalDrivers.toLocaleString(),
      icon: Car,
      description: 'Tous chauffeurs inscrits',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900',
    },
    {
      title: 'En Ligne',
      value: stats.onlineDrivers.toLocaleString(),
      icon: Activity,
      description: 'Connectés maintenant',
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900',
    },
    {
      title: 'Disponibles',
      value: stats.availableDrivers.toLocaleString(),
      icon: UserCheck,
      description: 'Prêts pour courses',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100 dark:bg-emerald-900',
    },
    {
      title: 'Occupés',
      value: stats.busyDrivers.toLocaleString(),
      icon: Users,
      description: 'En course actuelle',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900',
    },
    {
      title: 'Vérifiés',
      value: stats.verifiedDrivers.toLocaleString(),
      icon: Shield,
      description: 'Documents validés',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900',
    },
    {
      title: 'Nouveaux Aujourd\'hui',
      value: stats.newDriversToday.toLocaleString(),
      icon: TrendingUp,
      description: 'Inscriptions du jour',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100 dark:bg-indigo-900',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {statsCards.map((stat) => (
        <Card key={stat.title} className="card-floating border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {stat.value}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};