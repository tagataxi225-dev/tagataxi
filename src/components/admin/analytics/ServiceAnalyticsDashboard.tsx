import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { ServiceConfiguration } from '@/hooks/useServiceConfigurations';
import { Activity, Users, TrendingUp, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface ServiceStats {
  service_type: string;
  total_orders: number;
  active_users: number;
  revenue: number;
  pending_orders: number;
}

interface ServiceAnalyticsDashboardProps {
  service: ServiceConfiguration;
}

export const ServiceAnalyticsDashboard = ({ service }: ServiceAnalyticsDashboardProps) => {
  const [stats, setStats] = useState<ServiceStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Données de démonstration pour l'instant
    setStats({
      service_type: service.service_type,
      total_orders: Math.floor(Math.random() * 1000),
      active_users: Math.floor(Math.random() * 500),
      revenue: Math.floor(Math.random() * 100000),
      pending_orders: Math.floor(Math.random() * 50)
    });
    setLoading(false);
  }, [service]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center text-muted-foreground py-8">
        Aucune donnée disponible pour ce service
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Commandes totales
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total_orders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Utilisateurs actifs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.active_users}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Revenu total
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {new Intl.NumberFormat('fr-CD', {
                style: 'currency',
                currency: 'CDF',
                minimumFractionDigits: 0
              }).format(stats.revenue)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Commandes en attente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {stats.pending_orders}
            </div>
          </CardContent>
        </Card>
      </div>

      {stats.pending_orders > 0 && !service.is_active && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Avertissement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Ce service a <strong>{stats.pending_orders} commandes en attente</strong>.
              <br />
              La désactivation pourrait impacter l'expérience de {stats.active_users} utilisateurs actifs.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
