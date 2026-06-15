import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface DailyStats {
  todayCourses: number;
  todayEarnings: number;
  activeOrders: number;
  rating: number;
}

/**
 * Hook pour récupérer les statistiques du jour du chauffeur
 * Optimisé : pause en arrière-plan, intervalle 60s
 */
export const useDriverDailyStats = (serviceType: 'taxi' | 'delivery' = 'taxi') => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DailyStats>({
    todayCourses: 0,
    todayEarnings: 0,
    activeOrders: 0,
    rating: 0
  });
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchDailyStats = useCallback(async () => {
    if (!user || document.hidden) {
      setLoading(false);
      return;
    }

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const table = serviceType === 'delivery' ? 'delivery_orders' : 'transport_bookings';
      const completedStatus = serviceType === 'delivery' ? 'delivered' : 'completed';
      const activeStatuses = serviceType === 'delivery' 
        ? ['driver_assigned', 'picked_up', 'in_transit']
        : ['assigned', 'picked_up', 'in_transit'];
      const priceField = 'actual_price';
      const completionField = serviceType === 'delivery' ? 'delivered_at' : 'completion_time';

      const { count: coursesCount } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
        .eq('driver_id', user.id)
        .gte('created_at', today.toISOString())
        .eq('status', completedStatus);

      const { data: completedRides } = await supabase
        .from(table)
        .select(priceField)
        .eq('driver_id', user.id)
        .gte(completionField, today.toISOString())
        .eq('status', completedStatus);

      const totalEarnings = completedRides?.reduce((sum, ride) => sum + ((ride as any)[priceField] || 0), 0) || 0;

      const { count: activeCount } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
        .eq('driver_id', user.id)
        .in('status', activeStatuses);

      const { data: ratings } = await supabase
        .from('user_ratings')
        .select('rating')
        .eq('rated_user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      const averageRating = ratings?.length 
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length 
        : 0;

      setStats({
        todayCourses: coursesCount || 0,
        todayEarnings: Math.round(totalEarnings),
        activeOrders: activeCount || 0,
        rating: Math.round(averageRating * 10) / 10
      });

    } catch (error) {
      console.error('❌ Erreur chargement stats du jour:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id, serviceType]);

  useEffect(() => {
    fetchDailyStats();

    // 60s interval, paused when tab hidden
    intervalRef.current = setInterval(fetchDailyStats, 60000);

    const handleVisibility = () => {
      if (!document.hidden) {
        fetchDailyStats();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [fetchDailyStats]);

  return { stats, loading, refetch: fetchDailyStats };
};
