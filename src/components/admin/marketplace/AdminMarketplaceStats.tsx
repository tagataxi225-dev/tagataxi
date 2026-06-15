import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Package, CheckCircle, XCircle, Clock, TrendingUp, AlertCircle } from 'lucide-react';

export const AdminMarketplaceStats = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-marketplace-stats'],
    queryFn: async () => {
      // Statistiques produits par statut
      const { data: products, error: productsError } = await supabase
        .from('marketplace_products')
        .select('moderation_status, created_at');

      if (productsError) throw productsError;

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const totalProducts = products?.length || 0;
      const pendingProducts = products?.filter(p => p.moderation_status === 'pending').length || 0;
      const approvedProducts = products?.filter(p => p.moderation_status === 'approved').length || 0;
      const rejectedProducts = products?.filter(p => p.moderation_status === 'rejected').length || 0;
      
      // Produits modérés aujourd'hui
      const todayModerated = products?.filter(p => {
        const createdDate = new Date(p.created_at);
        return createdDate >= today && p.moderation_status !== 'pending';
      }).length || 0;

      // Taux d'approbation
      const totalModerated = approvedProducts + rejectedProducts;
      const approvalRate = totalModerated > 0 
        ? Math.round((approvedProducts / totalModerated) * 100) 
        : 0;

      // Statistiques vendeurs
      const { count: totalVendors, error: vendorsError } = await supabase
        .from('vendor_profiles')
        .select('*', { count: 'exact', head: true });

      if (vendorsError) throw vendorsError;

      return {
        totalProducts,
        pendingProducts,
        approvedProducts,
        rejectedProducts,
        todayModerated,
        approvalRate,
        totalVendors: totalVendors || 0
      };
    },
    refetchInterval: 30000 // Refresh toutes les 30 secondes
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-6">
            <Skeleton className="h-20 w-full" />
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: 'Produits en attente',
      value: stats?.pendingProducts || 0,
      icon: Clock,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      trend: stats?.pendingProducts > 0 ? 'Nécessite action' : 'Aucun en attente'
    },
    {
      title: 'Produits approuvés',
      value: stats?.approvedProducts || 0,
      icon: CheckCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      trend: `${stats?.approvalRate || 0}% taux d'approbation`
    },
    {
      title: 'Modérés aujourd\'hui',
      value: stats?.todayModerated || 0,
      icon: TrendingUp,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      trend: `${stats?.totalProducts || 0} produits au total`
    },
    {
      title: 'Vendeurs inscrits',
      value: stats?.totalVendors || 0,
      icon: Package,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      trend: `${stats?.totalProducts || 0} produits au total`
    }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium mb-1">
                    {stat.title}
                  </p>
                  <h3 className="text-3xl font-bold mb-2">{stat.value}</h3>
                  <p className="text-xs text-muted-foreground">{stat.trend}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {stats?.pendingProducts > 0 && (
        <Card className="p-4 border-orange-500/50 bg-orange-500/5">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            <div>
              <p className="font-semibold text-sm">Action requise</p>
              <p className="text-xs text-muted-foreground">
                {stats.pendingProducts} produit{stats.pendingProducts > 1 ? 's' : ''} en attente de modération
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
