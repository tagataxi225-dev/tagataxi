import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface FoodStats {
  totalRestaurants: number;
  activeRestaurants: number;
  pendingRestaurants: number;
  suspendedRestaurants: number;
  totalProducts: number;
  pendingProducts: number;
  approvedProducts: number;
  rejectedProducts: number;
  totalOrders: number;
  revenue30Days: number;
  approvalRate: number;
  avgPreparationTime: number;
  topCategories: Array<{ category: string; count: number }>;
}

export const useAdminFoodStats = () => {
  const [stats, setStats] = useState<FoodStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);

      // Fetch restaurants stats
      const { data: restaurants, error: restaurantsError } = await supabase
        .from('restaurant_profiles')
        .select('verification_status, is_active');

      if (restaurantsError) throw restaurantsError;

      // Fetch products stats
      const { data: products, error: productsError } = await supabase
        .from('food_products')
        .select('moderation_status, category');

      if (productsError) throw productsError;

      // Fetch orders stats (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: orders, error: ordersError } = await supabase
        .from('food_orders')
        .select('total_amount, created_at')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .eq('payment_status', 'completed');

      if (ordersError) throw ordersError;

      // Fetch average preparation time
      const { data: avgPrepTime, error: avgPrepError } = await supabase
        .from('restaurant_profiles')
        .select('average_preparation_time')
        .not('average_preparation_time', 'is', null);

      if (avgPrepError) throw avgPrepError;

      // Calculate stats
      const totalRestaurants = restaurants?.length || 0;
      const activeRestaurants = restaurants?.filter(r => r.is_active && r.verification_status === 'verified').length || 0;
      const pendingRestaurants = restaurants?.filter(r => r.verification_status === 'pending').length || 0;
      const suspendedRestaurants = restaurants?.filter(r => !r.is_active || r.verification_status === 'suspended').length || 0;

      const totalProducts = products?.length || 0;
      const pendingProducts = products?.filter(p => p.moderation_status === 'pending').length || 0;
      const approvedProducts = products?.filter(p => p.moderation_status === 'approved').length || 0;
      const rejectedProducts = products?.filter(p => p.moderation_status === 'rejected').length || 0;

      const totalOrders = orders?.length || 0;
      const revenue30Days = orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

      const approvalRate = totalProducts > 0 ? (approvedProducts / totalProducts) * 100 : 0;

      const avgPreparationTime = avgPrepTime && avgPrepTime.length > 0
        ? avgPrepTime.reduce((sum, r) => sum + (r.average_preparation_time || 0), 0) / avgPrepTime.length
        : 0;

      // Calculate top categories
      const categoryCounts = products?.reduce((acc, product) => {
        const category = product.category || 'Autre';
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const topCategories = Object.entries(categoryCounts)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setStats({
        totalRestaurants,
        activeRestaurants,
        pendingRestaurants,
        suspendedRestaurants,
        totalProducts,
        pendingProducts,
        approvedProducts,
        rejectedProducts,
        totalOrders,
        revenue30Days,
        approvalRate: Math.round(approvalRate),
        avgPreparationTime: Math.round(avgPreparationTime),
        topCategories,
      });
    } catch (error: any) {
      console.error('Error fetching food stats:', error);
      toast.error('Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return { stats, loading, refetch: fetchStats };
};
