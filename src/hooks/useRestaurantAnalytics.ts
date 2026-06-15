import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface RestaurantAnalytics {
  totalOrders: number;
  monthlyRevenue: number;
  satisfactionRate: number;
  topDishes: Array<{
    name: string;
    orders: number;
    revenue: number;
  }>;
}

export function useRestaurantAnalytics(restaurantId: string) {
  const [analytics, setAnalytics] = useState<RestaurantAnalytics>({
    totalOrders: 0,
    monthlyRevenue: 0,
    satisfactionRate: 0,
    topDishes: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (restaurantId) {
      fetchAnalytics();
    }
  }, [restaurantId]);

  const fetchAnalytics = async () => {
    try {
      // Get orders from last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: orders, error } = await supabase
        .from('food_orders')
        .select('total_amount, status')
        .eq('restaurant_id', restaurantId)
        .gte('created_at', thirtyDaysAgo.toISOString());

      if (error) throw error;

      const completedOrders = orders?.filter(
        o => ['delivered', 'completed'].includes(o.status)
      ) || [];

      const totalRevenue = completedOrders.reduce(
        (sum, order) => sum + (order.total_amount || 0),
        0
      );

      setAnalytics({
        totalOrders: completedOrders.length,
        monthlyRevenue: totalRevenue,
        satisfactionRate: 95, // À calculer avec de vrais avis
        topDishes: [], // À implémenter
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  return { analytics, loading };
}
