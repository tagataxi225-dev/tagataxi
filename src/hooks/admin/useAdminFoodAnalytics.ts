import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface FoodAnalytics {
  revenue30d: number;
  revenueGrowth: number;
  orders30d: number;
  avgOrderValue: number;
  activeRestaurants: number;
  newRestaurantsThisMonth: number;
  satisfactionRate: number;
  avgRating: number;
  topRestaurants: Array<{
    id: string;
    name: string;
    city: string;
    orders_count: number;
    total_revenue: number;
    rating: number;
  }>;
  topProducts: Array<{
    id: string;
    name: string;
    restaurant_name: string;
    image_url: string | null;
    total_orders: number;
    total_revenue: number;
  }>;
  ordersTimeline: Array<{
    date: string;
    orders: number;
  }>;
  ordersByCategory: Array<{
    name: string;
    value: number;
  }>;
}

export const useAdminFoodAnalytics = () => {
  const { toast } = useToast();
  const [analytics, setAnalytics] = useState<FoodAnalytics | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchAnalytics = async (dateRange?: { start: Date; end: Date }) => {
    try {
      setLoading(true);

      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const start = dateRange?.start || thirtyDaysAgo;
      const end = dateRange?.end || now;

      // Revenus et commandes
      const { data: revenueData } = await supabase
        .from('food_orders')
        .select('total_amount, created_at')
        .eq('payment_status', 'completed')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

      const revenue30d = revenueData?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
      const orders30d = revenueData?.length || 0;
      const avgOrderValue = orders30d > 0 ? revenue30d / orders30d : 0;

      // Restaurants actifs
      const { data: restaurantsData } = await supabase
        .from('restaurant_profiles')
        .select('id, created_at, rating_average')
        .eq('is_active', true)
        .eq('verification_status', 'approved');

      const activeRestaurants = restaurantsData?.length || 0;
      const newRestaurantsThisMonth = restaurantsData?.filter(r => {
        const createdAt = new Date(r.created_at);
        return createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear();
      }).length || 0;

      const avgRating = restaurantsData?.length
        ? restaurantsData.reduce((sum, r) => sum + (r.rating_average || 0), 0) / restaurantsData.length
        : 0;

      // Top restaurants
      const { data: topRestaurantsData } = await supabase.rpc('get_top_restaurants', {
        date_start: start.toISOString(),
        date_end: end.toISOString(),
        limit_count: 10,
      });

      // Top produits
      const { data: topProductsData } = await supabase.rpc('get_top_food_products', {
        date_start: start.toISOString(),
        date_end: end.toISOString(),
        limit_count: 10,
      });

      setAnalytics({
        revenue30d,
        revenueGrowth: 15, // TODO: Calculate from previous period
        orders30d,
        avgOrderValue,
        activeRestaurants,
        newRestaurantsThisMonth,
        satisfactionRate: 92, // TODO: Calculate from ratings
        avgRating,
        topRestaurants: topRestaurantsData || [],
        topProducts: topProductsData || [],
        ordersTimeline: [], // TODO: Implement
        ordersByCategory: [], // TODO: Implement
      });

      return analytics;
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    analytics,
    loading,
    fetchAnalytics,
  };
};
