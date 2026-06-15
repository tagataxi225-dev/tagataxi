import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ShoppingBag, Wallet } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Stats {
  totalOrders: number;
  monthlyRevenue: number;
}

export function RestaurantStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalOrders: 0,
    monthlyRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user]);

  const loadStats = async () => {
    try {
      const { data: profile } = await supabase
        .from('restaurant_profiles')
        .select('id')
        .eq('user_id', user!.id)
        .single();

      if (!profile) return;

      // Stats du mois en cours
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: monthlyOrders } = await supabase
        .from('food_orders')
        .select('total_amount, status')
        .eq('restaurant_id', profile.id)
        .gte('created_at', startOfMonth.toISOString());

      const completedOrders = monthlyOrders?.filter(
        o => ['delivered', 'completed'].includes(o.status)
      ) || [];

      const monthlyRevenue = completedOrders.reduce(
        (sum, order) => sum + (order.total_amount || 0), 
        0
      );

      // Total commandes
      const { count: totalOrders } = await supabase
        .from('food_orders')
        .select('*', { count: 'exact', head: true })
        .eq('restaurant_id', profile.id);

      setStats({
        totalOrders: totalOrders || 0,
        monthlyRevenue,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="p-4 rounded-2xl bg-muted/50">
            <Skeleton className="h-5 w-5 mb-3" />
            <Skeleton className="h-7 w-16 mb-1" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    );
  }

  const formatRevenue = (amount: number) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `${(amount / 1000).toFixed(0)}K`;
    }
    return amount.toLocaleString();
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Commandes totales */}
      <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900">
        <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/50 w-fit">
          <ShoppingBag className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </div>
        <p className="text-2xl font-bold mt-3 text-blue-900 dark:text-blue-100">
          {stats.totalOrders}
        </p>
        <p className="text-sm text-blue-600 dark:text-blue-400">
          Commandes totales
        </p>
      </div>

      {/* Revenus du mois */}
      <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900">
        <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 w-fit">
          <Wallet className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <p className="text-2xl font-bold mt-3 text-emerald-900 dark:text-emerald-100">
          {formatRevenue(stats.monthlyRevenue)} <span className="text-sm font-normal">CDF</span>
        </p>
        <p className="text-sm text-emerald-600 dark:text-emerald-400">
          Revenus du mois
        </p>
      </div>
    </div>
  );
}
