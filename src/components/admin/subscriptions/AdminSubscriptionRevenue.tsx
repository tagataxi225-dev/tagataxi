import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { TrendingUp, DollarSign, Calendar, Activity } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export const AdminSubscriptionRevenue = () => {
  // Fetch admin subscription earnings statistics
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-subscription-revenue'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_subscription_earnings')
        .select('admin_commission_amount, created_at, status')
        .eq('status', 'paid');

      if (error) {
        console.error('Error fetching admin revenue:', error);
        throw error;
      }

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const total = data?.reduce((sum, e) => sum + Number(e.admin_commission_amount), 0) || 0;
      
      const thisMonth = data?.filter(e => {
        const date = new Date(e.created_at);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      }).reduce((sum, e) => sum + Number(e.admin_commission_amount), 0) || 0;

      const lastMonth = data?.filter(e => {
        const date = new Date(e.created_at);
        const lastMonthDate = new Date(currentYear, currentMonth - 1);
        return date.getMonth() === lastMonthDate.getMonth() && 
               date.getFullYear() === lastMonthDate.getFullYear();
      }).reduce((sum, e) => sum + Number(e.admin_commission_amount), 0) || 0;

      const growthRate = lastMonth > 0 
        ? ((thisMonth - lastMonth) / lastMonth) * 100 
        : thisMonth > 0 ? 100 : 0;

      return {
        total,
        thisMonth,
        lastMonth,
        count: data?.length || 0,
        growthRate: Math.round(growthRate * 10) / 10
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000 // Refresh every 5 minutes
  });

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-primary/10">
            <DollarSign className="w-5 h-5 text-primary" />
          </div>
          <div>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-32" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-primary/5 via-background to-background border-primary/20">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <DollarSign className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-foreground">
              Revenus Abonnements Chauffeurs
            </h3>
            <p className="text-sm text-muted-foreground">
              Commission plateforme 10% sur tous les abonnements
            </p>
          </div>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total historique */}
        <div className="p-4 rounded-lg bg-card border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-primary" />
            <p className="text-sm text-muted-foreground">Total historique</p>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {stats?.total.toLocaleString('fr-FR')} CDF
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {stats?.count} abonnements
          </p>
        </div>

        {/* Ce mois */}
        <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-primary" />
            <p className="text-sm text-muted-foreground">Ce mois</p>
          </div>
          <p className="text-2xl font-bold text-primary">
            {stats?.thisMonth.toLocaleString('fr-FR')} CDF
          </p>
          {stats?.growthRate !== undefined && (
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp 
                className={`w-3 h-3 ${stats.growthRate >= 0 ? 'text-green-500' : 'text-red-500'}`} 
              />
              <p className={`text-xs font-medium ${stats.growthRate >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {stats.growthRate >= 0 ? '+' : ''}{stats.growthRate}% vs mois dernier
              </p>
            </div>
          )}
        </div>

        {/* Mois dernier */}
        <div className="p-4 rounded-lg bg-card border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Mois dernier</p>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {stats?.lastMonth.toLocaleString('fr-FR')} CDF
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Pour comparaison
          </p>
        </div>

        {/* Moyenne par abonnement */}
        <div className="p-4 rounded-lg bg-card border border-border">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Moyenne</p>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {stats?.count ? Math.round(stats.total / stats.count).toLocaleString('fr-FR') : 0} CDF
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Par abonnement
          </p>
        </div>
      </div>

      {/* Info Footer */}
      <div className="mt-6 p-3 rounded-lg bg-muted/50 border border-border">
        <p className="text-xs text-muted-foreground text-center">
          💡 La commission admin de 10% est automatiquement créditée à chaque souscription ou renouvellement d'abonnement chauffeur
        </p>
      </div>
    </Card>
  );
};
