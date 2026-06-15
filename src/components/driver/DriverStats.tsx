import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, DollarSign, Target, Award } from 'lucide-react';

export const DriverStats: React.FC = () => {
  const { user } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ['driver-stats', user?.id],
    queryFn: async () => {
      // Récupérer les stats du chauffeur
      const { data: driverData } = await supabase
        .from('chauffeurs')
        .select('total_rides, rating_average, rating_count')
        .eq('user_id', user?.id)
        .single();

      // Récupérer le wallet
      const { data: walletData } = await supabase
        .from('user_wallets')
        .select('balance, bonus_balance, ecosystem_credits')
        .eq('user_id', user?.id)
        .single();

      // Courses complétées ce mois
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count: monthlyRides } = await supabase
        .from('transport_bookings')
        .select('*', { count: 'exact', head: true })
        .eq('driver_id', user?.id)
        .eq('status', 'completed')
        .gte('created_at', startOfMonth.toISOString());

      return {
        totalRides: driverData?.total_rides || 0,
        rating: driverData?.rating_average || 0,
        ratingCount: driverData?.rating_count || 0,
        balance: walletData?.balance || 0,
        monthlyRides: monthlyRides || 0,
      };
    },
    enabled: !!user?.id,
  });

  const statCards = [
    {
      icon: TrendingUp,
      label: 'Courses totales',
      value: stats?.totalRides?.toString() || '0',
      color: 'text-blue-600 bg-blue-50',
    },
    {
      icon: DollarSign,
      label: 'Solde wallet',
      value: `${stats?.balance?.toLocaleString() || '0'} CDF`,
      color: 'text-green-600 bg-green-50',
    },
    {
      icon: Target,
      label: 'Ce mois',
      value: `${stats?.monthlyRides} courses`,
      color: 'text-orange-600 bg-orange-50',
    },
    {
      icon: Award,
      label: 'Note moyenne',
      value: `${stats?.rating?.toFixed(1) || '0.0'}/5`,
      color: 'text-yellow-600 bg-yellow-50',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${stat.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-lg font-bold truncate">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default DriverStats;
