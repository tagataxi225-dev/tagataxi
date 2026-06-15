import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useUnifiedPartnerFinances } from './useUnifiedPartnerFinances';

interface WeeklyPerformance {
  day: string;
  rides: number;
  revenue: number;
  efficiency: number;
}

interface TopDriver {
  name: string;
  rides: number;
  rating: number;
  revenue: number;
}

interface GoalData {
  current: number;
  target: number;
  percentage: number;
}

interface PerformanceMetrics {
  avgResponseTime: number; // in minutes
  cancellationRate: number; // percentage
  operationalEfficiency: number; // percentage
}

export const usePartnerAnalytics = (timeRange: '7d' | '30d' | 'all' = '30d') => {
  const { user } = useAuth();
  const finances = useUnifiedPartnerFinances(timeRange);

  return useQuery({
    queryKey: ['partner-analytics', user?.id, timeRange],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data: partnerData } = await supabase
        .from('partenaires')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!partnerData) return null;

      const startDate = timeRange === '7d'
        ? new Date(Date.now() - 7 * 86400000).toISOString()
        : timeRange === '30d'
          ? new Date(Date.now() - 30 * 86400000).toISOString()
          : null;

      const firstDayOfMonth = new Date();
      firstDayOfMonth.setDate(1);
      firstDayOfMonth.setHours(0, 0, 0, 0);

      // Get partner drivers
      const { data: drivers } = await supabase
        .from('partner_drivers')
        .select('driver_id')
        .eq('partner_id', partnerData.id);

      const driverIds = drivers?.map(d => d.driver_id) || [];

      let totalRides = 0;
      let monthlyGoal: GoalData = { current: 0, target: 100, percentage: 0 };
      let revenueGoal: GoalData = { current: 0, target: 1000000, percentage: 0 };
      let satisfactionGoal: GoalData = { current: 0, target: 5.0, percentage: 0 };
      let performanceMetrics: PerformanceMetrics = { avgResponseTime: 0, cancellationRate: 0, operationalEfficiency: 0 };

      if (driverIds.length > 0) {
        // === CURRENT PERIOD RIDES ===
        let vtcQ = supabase
          .from('transport_bookings')
          .select('*', { count: 'exact', head: true })
          .in('driver_id', driverIds)
          .eq('status', 'completed');
        if (startDate) vtcQ = vtcQ.gte('created_at', startDate);
        const { count: vtcCount } = await vtcQ;

        let delivQ = supabase
          .from('delivery_orders')
          .select('*', { count: 'exact', head: true })
          .in('driver_id', driverIds)
          .eq('status', 'delivered');
        if (startDate) delivQ = delivQ.gte('created_at', startDate);
        const { count: deliveryCount } = await delivQ;

        totalRides = (vtcCount || 0) + (deliveryCount || 0);

        // === HISTORICAL RIDES (3 previous months for goal calc) ===
        const historicalCounts: number[] = [];
        for (let i = 1; i <= 3; i++) {
          const monthStart = new Date();
          monthStart.setMonth(monthStart.getMonth() - i, 1);
          monthStart.setHours(0, 0, 0, 0);
          const monthEnd = new Date(monthStart);
          monthEnd.setMonth(monthEnd.getMonth() + 1);

          const { count: hVtc } = await supabase
            .from('transport_bookings')
            .select('*', { count: 'exact', head: true })
            .in('driver_id', driverIds)
            .eq('status', 'completed')
            .gte('created_at', monthStart.toISOString())
            .lt('created_at', monthEnd.toISOString());

          const { count: hDel } = await supabase
            .from('delivery_orders')
            .select('*', { count: 'exact', head: true })
            .in('driver_id', driverIds)
            .eq('status', 'delivered')
            .gte('created_at', monthStart.toISOString())
            .lt('created_at', monthEnd.toISOString());

          historicalCounts.push((hVtc || 0) + (hDel || 0));
        }

        const maxHistorical = Math.max(...historicalCounts, totalRides, 10);
        const ridesTarget = Math.ceil(maxHistorical / 100) * 100;
        monthlyGoal = {
          current: totalRides,
          target: ridesTarget,
          percentage: ridesTarget > 0 ? Math.min(100, (totalRides / ridesTarget) * 100) : 0
        };

        // === PERFORMANCE METRICS ===
        // Avg response time
        let responseQ = supabase
          .from('transport_bookings')
          .select('created_at, driver_assigned_at')
          .in('driver_id', driverIds)
          .not('driver_assigned_at', 'is', null);
        if (startDate) responseQ = responseQ.gte('created_at', startDate);
        const { data: responseData } = await responseQ.limit(200);

        let avgResponseTime = 0;
        if (responseData && responseData.length > 0) {
          const totalMs = responseData.reduce((sum, b) => {
            const diff = new Date(b.driver_assigned_at!).getTime() - new Date(b.created_at).getTime();
            return sum + Math.max(0, diff);
          }, 0);
          avgResponseTime = Number(((totalMs / responseData.length) / 60000).toFixed(1));
        }

        // Cancellation rate & efficiency
        let totalBQ = supabase
          .from('transport_bookings')
          .select('*', { count: 'exact', head: true })
          .in('driver_id', driverIds);
        if (startDate) totalBQ = totalBQ.gte('created_at', startDate);
        const { count: totalBookings } = await totalBQ;

        let cancelQ = supabase
          .from('transport_bookings')
          .select('*', { count: 'exact', head: true })
          .in('driver_id', driverIds)
          .eq('status', 'cancelled');
        if (startDate) cancelQ = cancelQ.gte('created_at', startDate);
        const { count: cancelledBookings } = await cancelQ;

        let completedQ = supabase
          .from('transport_bookings')
          .select('*', { count: 'exact', head: true })
          .in('driver_id', driverIds)
          .eq('status', 'completed');
        if (startDate) completedQ = completedQ.gte('created_at', startDate);
        const { count: completedBookings } = await completedQ;

        const total = totalBookings || 0;
        const cancelled = cancelledBookings || 0;
        const completed = completedBookings || 0;

        const cancellationRate = total > 0 ? Number(((cancelled / total) * 100).toFixed(1)) : 0;
        const operationalEfficiency = (completed + cancelled) > 0
          ? Number(((completed / (completed + cancelled)) * 100).toFixed(1))
          : 100;

        performanceMetrics = { avgResponseTime, cancellationRate, operationalEfficiency };

        // === SATISFACTION ===
        const { data: driverRatings } = await supabase
          .from('driver_profiles')
          .select('rating_average')
          .in('user_id', driverIds);

        const validRatings = driverRatings?.filter(d => d.rating_average && d.rating_average > 0) || [];
        const satisfactionScore = validRatings.length > 0
          ? validRatings.reduce((sum, d) => sum + (d.rating_average || 0), 0) / validRatings.length
          : 0;

        satisfactionGoal = {
          current: Number(satisfactionScore.toFixed(1)),
          target: 5.0,
          percentage: (satisfactionScore / 5.0) * 100
        };

        // === REVENUE ===
        let revenueQ = supabase
          .from('activity_logs')
          .select('amount')
          .eq('user_id', user.id)
          .in('activity_type', ['commission_received', 'subscription_payment_received']);
        if (startDate) revenueQ = revenueQ.gte('created_at', startDate);
        const { data: monthlyRevenue } = await revenueQ;

        const totalRevenue = monthlyRevenue?.reduce((sum, log) => sum + Number(log.amount || 0), 0) || 0;
        const revenueTarget = totalRevenue > 0 ? Math.ceil(totalRevenue / 1000000) * 1000000 : 1000000;
        revenueGoal = {
          current: totalRevenue,
          target: revenueTarget,
          percentage: revenueTarget > 0 ? Math.min(100, (totalRevenue / revenueTarget) * 100) : 0
        };

        // === WEEKLY PERFORMANCE ===
        const today = new Date();
        const weeklyPerformance: WeeklyPerformance[] = [];
        const daysOfWeek = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

        for (let i = 6; i >= 0; i--) {
          const dayDate = new Date(today);
          dayDate.setDate(today.getDate() - i);
          dayDate.setHours(0, 0, 0, 0);
          const nextDay = new Date(dayDate);
          nextDay.setDate(dayDate.getDate() + 1);

          const { count: dayRides } = await supabase
            .from('transport_bookings')
            .select('*', { count: 'exact', head: true })
            .in('driver_id', driverIds)
            .eq('status', 'completed')
            .gte('created_at', dayDate.toISOString())
            .lt('created_at', nextDay.toISOString());

          const { data: dayRevenue } = await supabase
            .from('transport_bookings')
            .select('actual_price, estimated_price')
            .in('driver_id', driverIds)
            .eq('status', 'completed')
            .gte('created_at', dayDate.toISOString())
            .lt('created_at', nextDay.toISOString());

          const revenue = dayRevenue?.reduce((sum, b) => sum + (b.actual_price || b.estimated_price || 0), 0) || 0;
          const rides = dayRides || 0;
          const efficiency = rides > 0 ? Math.min(100, Math.round((rides / 20) * 100)) : 0;

          weeklyPerformance.push({ day: daysOfWeek[dayDate.getDay()], rides, revenue, efficiency });
        }

        // === TOP DRIVERS ===
        const topDrivers: TopDriver[] = [];
        for (const driverId of driverIds.slice(0, 5)) {
          const { data: driverProfile } = await supabase
            .from('driver_profiles')
            .select('rating_average')
            .eq('user_id', driverId)
            .maybeSingle();

          let driverRidesQ = supabase
            .from('transport_bookings')
            .select('*', { count: 'exact', head: true })
            .eq('driver_id', driverId)
            .eq('status', 'completed');
          if (startDate) driverRidesQ = driverRidesQ.gte('created_at', startDate);
          const { count: driverRidesCount } = await driverRidesQ;

          let driverRevenueQ = supabase
            .from('transport_bookings')
            .select('actual_price, estimated_price')
            .eq('driver_id', driverId)
            .eq('status', 'completed');
          if (startDate) driverRevenueQ = driverRevenueQ.gte('created_at', startDate);
          const { data: driverRevenue } = await driverRevenueQ;

          const rev = driverRevenue?.reduce((sum, b) => sum + (b.actual_price || b.estimated_price || 0), 0) || 0;

          if (driverProfile && (driverRidesCount || 0) > 0) {
            topDrivers.push({
              name: `Chauffeur ${driverId.substring(0, 8)}`,
              rides: driverRidesCount || 0,
              rating: driverProfile.rating_average || 0,
              revenue: rev
            });
          }
        }
        topDrivers.sort((a, b) => b.revenue - a.revenue);

        return {
          totalRides,
          totalRevenue,
          satisfactionScore: satisfactionGoal.current,
          period: '30 derniers jours',
          weeklyPerformance,
          topDrivers,
          finances,
          monthlyGoal,
          revenueGoal,
          satisfactionGoal,
          performanceMetrics
        };
      }

      // No drivers case
      return {
        totalRides: 0,
        totalRevenue: 0,
        satisfactionScore: 0,
        period: '30 derniers jours',
        weeklyPerformance: [],
        topDrivers: [],
        finances,
        monthlyGoal: { current: 0, target: 100, percentage: 0 },
        revenueGoal: { current: 0, target: 1000000, percentage: 0 },
        satisfactionGoal: { current: 0, target: 5.0, percentage: 0 },
        performanceMetrics: { avgResponseTime: 0, cancellationRate: 0, operationalEfficiency: 100 }
      };
    },
    enabled: !!user?.id,
    staleTime: 3 * 60 * 1000,
    gcTime: 10 * 60 * 1000
  });
};
