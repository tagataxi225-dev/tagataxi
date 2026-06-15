/**
 * 💰 Hook de Chargement des Statistiques Chauffeur
 * Récupère les vraies données depuis Supabase :
 * - Revenus nets aujourd'hui (après commissions)
 * - Courses aujourd'hui
 * - Note moyenne
 * - Objectif hebdomadaire
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface DriverEarningsStats {
  todayEarnings: number;
  todayTrips: number;
  averageRating: number;
  weeklyGoal: number;
  weeklyProgress: number;
}

const computeNet = (
  orders: { actual_price: number | null; estimated_price: number | null }[],
  commissionRate: number
) => {
  return orders.reduce((sum, o) => {
    const gross = o.actual_price || o.estimated_price || 0;
    return sum + gross * (1 - commissionRate / 100);
  }, 0);
};

export const useDriverEarnings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DriverEarningsStats>({
    todayEarnings: 0,
    todayTrips: 0,
    averageRating: 0,
    weeklyGoal: 0,
    weeklyProgress: 0
  });

  const loadEarningsData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString();

      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      const weekStartStr = startOfWeek.toISOString();

      // Déterminer le taux de commission effectif
      const [
        { data: activeSub },
        { data: commSettings },
        { data: partnerDriver },
      ] = await Promise.all([
        supabase
          .from('driver_subscriptions')
          .select('plan_id, subscription_plans(commission_rate)')
          .eq('driver_id', user.id)
          .eq('status', 'active')
          .maybeSingle(),
        supabase
          .from('commission_settings')
          .select('platform_rate')
          .eq('is_active', true)
          .eq('service_type', 'transport')
          .maybeSingle(),
        supabase
          .from('partner_drivers')
          .select('commission_rate')
          .eq('driver_id', user.id)
          .maybeSingle(),
      ]);

      const platformRate = (activeSub?.subscription_plans as any)?.commission_rate ?? commSettings?.platform_rate ?? 12;
      const partnerRate = partnerDriver?.commission_rate ?? 0;
      const totalCommissionRate = platformRate + partnerRate;

      // Charger les courses, livraisons et note moyenne en parallèle
      const [
        { data: taxiToday },
        { data: deliveriesToday },
        { data: taxiWeek },
        { data: deliveriesWeek },
        { data: ratings },
      ] = await Promise.all([
        supabase
          .from('transport_bookings')
          .select('actual_price, estimated_price')
          .eq('driver_id', user.id)
          .eq('status', 'completed')
          .gte('created_at', todayStr),
        supabase
          .from('delivery_orders')
          .select('actual_price, estimated_price')
          .eq('driver_id', user.id)
          .eq('status', 'delivered')
          .gte('created_at', todayStr),
        supabase
          .from('transport_bookings')
          .select('actual_price, estimated_price')
          .eq('driver_id', user.id)
          .eq('status', 'completed')
          .gte('created_at', weekStartStr),
        supabase
          .from('delivery_orders')
          .select('actual_price, estimated_price')
          .eq('driver_id', user.id)
          .eq('status', 'delivered')
          .gte('created_at', weekStartStr),
        supabase
          .from('user_ratings')
          .select('rating')
          .eq('rated_user_id', user.id),
      ]);

      // Gains nets (après commissions)
      const todayEarnings = Math.round(
        computeNet(taxiToday || [], totalCommissionRate) +
        computeNet(deliveriesToday || [], totalCommissionRate)
      );

      const todayTrips = (taxiToday?.length || 0) + (deliveriesToday?.length || 0);
      const averageRating = ratings?.length
        ? Math.round((ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length) * 10) / 10
        : 0;
      const weeklyGoal = 250000;

      const weeklyEarnings = Math.round(
        computeNet(taxiWeek || [], totalCommissionRate) +
        computeNet(deliveriesWeek || [], totalCommissionRate)
      );
      const weeklyProgress = weeklyGoal > 0 ? Math.round((weeklyEarnings / weeklyGoal) * 100) : 0;

      setStats({
        todayEarnings,
        todayTrips,
        averageRating,
        weeklyGoal,
        weeklyProgress
      });
    } catch (error: any) {
      console.error('Error loading earnings data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadEarningsData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const refresh = () => {
    loadEarningsData();
  };

  return { stats, loading, refresh };
};
