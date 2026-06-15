import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface PartnerStats {
  activeDrivers: number;
  ongoingRides: number;
  completedRides: number;
  todayRevenue: number;
  monthlyRevenue: number;
  monthlyEarnings: number;
  totalFleet: number;
  availableVehicles: number;
  pendingRides: number;
  driversTrend: number;
  revenueTrend: number;
  averageRating: number;
  totalReviews: number;
  operationalEfficiency: number;
  satisfactionRate: number;
}

export const usePartnerStats = () => {
  const { user } = useAuth();

  const { data: stats, isLoading: loading } = useQuery({
    queryKey: ['partner-stats', user?.id],
    queryFn: async (): Promise<PartnerStats | null> => {
      if (!user) return null;

      // Get partner ID
      const { data: partnerData } = await supabase
        .from('partenaires')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!partnerData) return null;

      // Get driver IDs
      const { data: drivers } = await supabase
        .from('partner_drivers')
        .select('driver_id')
        .eq('partner_id', partnerData.id);

      const driverIds = drivers?.map(d => d.driver_id) || [];

      const now = new Date();
      const todayStart = new Date(now.setHours(0, 0, 0, 0));
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

      let realStats: PartnerStats = {
        activeDrivers: 0,
        ongoingRides: 0,
        completedRides: 0,
        todayRevenue: 0,
        monthlyRevenue: 0,
        monthlyEarnings: 0,
        totalFleet: driverIds.length,
        availableVehicles: 0,
        pendingRides: 0,
        driversTrend: 0,
        revenueTrend: 0,
        averageRating: 0,
        totalReviews: 0,
        operationalEfficiency: 0,
        satisfactionRate: 0,
      };

      if (driverIds.length > 0) {
        // Active drivers today
        const { data: activeDriversData } = await supabase
          .from('driver_locations')
          .select('driver_id')
          .in('driver_id', driverIds)
          .eq('is_available', true)
          .gte('last_updated', new Date(Date.now() - 30 * 60 * 1000).toISOString());

        realStats.activeDrivers = new Set(activeDriversData?.map(d => d.driver_id) || []).size;

        // Ongoing rides
        const { count: ongoingCount } = await supabase
          .from('transport_bookings')
          .select('*', { count: 'exact', head: true })
          .in('driver_id', driverIds)
          .in('status', ['driver_assigned', 'driver_arrived', 'trip_started']);

        realStats.ongoingRides = ongoingCount || 0;

        // Pending rides
        const { count: pendingCount } = await supabase
          .from('transport_bookings')
          .select('*', { count: 'exact', head: true })
          .in('driver_id', driverIds)
          .eq('status', 'pending');

        realStats.pendingRides = pendingCount || 0;

        // Completed rides this month
        const { count: completedCount } = await supabase
          .from('transport_bookings')
          .select('*', { count: 'exact', head: true })
          .in('driver_id', driverIds)
          .eq('status', 'completed')
          .gte('created_at', monthStart.toISOString());

        realStats.completedRides = completedCount || 0;

        // Today's revenue
        const { data: todayBookings } = await supabase
          .from('transport_bookings')
          .select('actual_price, estimated_price')
          .in('driver_id', driverIds)
          .eq('status', 'completed')
          .gte('created_at', todayStart.toISOString());

        realStats.todayRevenue = todayBookings?.reduce((sum, b) => sum + (b.actual_price || b.estimated_price || 0), 0) || 0;

        // Monthly revenue
        const { data: monthlyBookings } = await supabase
          .from('transport_bookings')
          .select('actual_price, estimated_price')
          .in('driver_id', driverIds)
          .eq('status', 'completed')
          .gte('created_at', monthStart.toISOString());

        realStats.monthlyRevenue = monthlyBookings?.reduce((sum, b) => sum + (b.actual_price || b.estimated_price || 0), 0) || 0;
        realStats.monthlyEarnings = realStats.monthlyRevenue;

        // Last month revenue for trend
        const { data: lastMonthBookings } = await supabase
          .from('transport_bookings')
          .select('actual_price, estimated_price')
          .in('driver_id', driverIds)
          .eq('status', 'completed')
          .gte('created_at', lastMonthStart.toISOString())
          .lte('created_at', lastMonthEnd.toISOString());

        const lastMonthRevenue = lastMonthBookings?.reduce((sum, b) => sum + (b.actual_price || b.estimated_price || 0), 0) || 0;

        // Calculate revenue trend
        if (lastMonthRevenue > 0) {
          realStats.revenueTrend = Number((((realStats.monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100).toFixed(1));
        }

        // Last month drivers count for trend
        const lastMonthDriverCount = driverIds.length; // Simplified - could track historical data
        if (lastMonthDriverCount > 0) {
          realStats.driversTrend = Number((((driverIds.length - lastMonthDriverCount) / lastMonthDriverCount) * 100).toFixed(1));
        }

        // Available vehicles
        realStats.availableVehicles = driverIds.length - realStats.ongoingRides;

        // Rating metrics from chauffeurs table (pre-aggregated)
        const { data: driverProfiles } = await supabase
          .from('chauffeurs')
          .select('rating_average, rating_count')
          .in('user_id', driverIds);

        const driversWithRatings = driverProfiles?.filter(d => d.rating_average != null && d.rating_count != null) || [];
        const totalReviews = driversWithRatings.reduce((sum, d) => sum + (d.rating_count || 0), 0);
        const weightedSum = driversWithRatings.reduce((sum, d) => sum + (d.rating_average || 0) * (d.rating_count || 0), 0);
        realStats.totalReviews = totalReviews;
        realStats.averageRating = totalReviews > 0 ? Number((weightedSum / totalReviews).toFixed(1)) : 0;

        // Satisfaction rate from driver_ratings
        const { data: ratingsData } = await supabase
          .from('driver_ratings')
          .select('rating')
          .in('driver_id', driverIds);

        const allRatings = ratingsData || [];
        const highRatings = allRatings.filter(r => r.rating >= 4).length;
        realStats.satisfactionRate = allRatings.length > 0 ? Number(((highRatings / allRatings.length) * 100).toFixed(0)) : 0;

        // Operational efficiency
        const { count: totalBookings } = await supabase
          .from('transport_bookings')
          .select('*', { count: 'exact', head: true })
          .in('driver_id', driverIds);

        realStats.operationalEfficiency = (totalBookings || 0) > 0 ? Number(((realStats.completedRides / (totalBookings || 1)) * 100).toFixed(0)) : 0;
      }

      return realStats;
    },
    enabled: !!user,
    refetchInterval: 30000,
    staleTime: 20000,
  });

  return { stats: stats ?? null, loading };
};
