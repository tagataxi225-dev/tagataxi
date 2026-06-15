import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserStats } from '@/hooks/useAdvancedUserManagement';
import { Users, UserCheck, Car, Building2, Activity, TrendingUp } from 'lucide-react';

interface UserStatsCardsProps {
  stats: UserStats;
}

export const UserStatsCards: React.FC<UserStatsCardsProps> = ({ stats }) => {
  const statsCards = [
    {
      title: 'Total Utilisateurs',
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      description: 'Tous types confondus',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900',
    },
    {
      title: 'Clients',
      value: stats.totalClients.toLocaleString(),
      icon: UserCheck,
      description: 'Utilisateurs clients',
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900',
    },
    {
      title: 'Chauffeurs',
      value: stats.totalDrivers.toLocaleString(),
      icon: Car,
      description: 'Chauffeurs/Livreurs',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900',
    },
    {
      title: 'Partenaires',
      value: stats.totalPartners.toLocaleString(),
      icon: Building2,
      description: 'Entreprises partenaires',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900',
    },
    {
      title: 'Utilisateurs Actifs',
      value: stats.activeUsers.toLocaleString(),
      icon: Activity,
      description: 'Actifs ce mois',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100 dark:bg-emerald-900',
    },
    {
      title: 'Nouveaux Aujourd\'hui',
      value: stats.newUsersToday.toLocaleString(),
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