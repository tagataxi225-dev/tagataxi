import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface PartnerStats {
  activeDrivers: number;
  ongoingRides: number;
  todayRevenue: number;
  monthlyRevenue: number;
  monthlyEarnings: number; // ✅ AJOUTÉ: Gains du mois en cours (commissions)
  totalFleet: number;
  availableVehicles: number;
  completedRides: number;
  pendingRides: number;
}

export const usePartnerStats = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<PartnerStats>({
    activeDrivers: 0,
    ongoingRides: 0,
    todayRevenue: 0,
    monthlyRevenue: 0,
    monthlyEarnings: 0,
    totalFleet: 0,
    availableVehicles: 0,
    completedRides: 0,
    pendingRides: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStats = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get partner drivers
      const { data: partnerDrivers, error: driversError } = await supabase
        .from('partner_drivers')
        .select('driver_id')
        .eq('partner_id', user.id)
        .eq('status', 'active');

      if (driversError) {
        console.error('Error fetching partner drivers:', driversError);
        return;
      }

      const driverIds = partnerDrivers?.map(pd => pd.driver_id) || [];
      const totalFleet = driverIds.length;

      if (driverIds.length === 0) {
        setStats(prev => ({ ...prev, totalFleet: 0, activeDrivers: 0 }));
        return;
      }

      // Get today's date range
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Get this month's date range
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      // Fetch transport bookings
      const { data: transportBookings, error: transportError } = await supabase
        .from('transport_bookings')
        .select('status, actual_price, estimated_price, created_at, driver_id')
        .in('driver_id', driverIds);

      // Fetch delivery orders
      const { data: deliveryOrders, error: deliveryError } = await supabase
        .from('delivery_orders')
        .select('status, actual_price, estimated_price, created_at, driver_id')
        .in('driver_id', driverIds);

      if (transportError) console.error('Error fetching transport bookings:', transportError);
      if (deliveryError) console.error('Error fetching delivery orders:', deliveryError);

      const allRides = [
        ...(transportBookings || []),
        ...(deliveryOrders || [])
      ];

      // Calculate stats
      const ongoingRides = allRides.filter(ride => 
        ride.status === 'accepted' || ride.status === 'in_progress'
      ).length;

      const completedRides = allRides.filter(ride => 
        ride.status === 'completed'
      ).length;

      const pendingRides = allRides.filter(ride => 
        ride.status === 'pending'
      ).length;

      // Calculate today's revenue (15% commission from completed rides)
      const todayCompletedRides = allRides.filter(ride => {
        const rideDate = new Date(ride.created_at);
        return ride.status === 'completed' && 
               rideDate >= today && 
               rideDate < tomorrow;
      });

      const todayRevenue = todayCompletedRides.reduce((total, ride) => {
        const price = ride.actual_price || ride.estimated_price || 0;
        return total + (price * 0.15); // 15% commission
      }, 0);

      // Calculate monthly revenue
      const monthlyCompletedRides = allRides.filter(ride => {
        const rideDate = new Date(ride.created_at);
        return ride.status === 'completed' && 
               rideDate >= monthStart && 
               rideDate <= monthEnd;
      });

      const monthlyRevenue = monthlyCompletedRides.reduce((total, ride) => {
        const price = ride.actual_price || ride.estimated_price || 0;
        return total + (price * 0.15); // 15% commission
      }, 0);

      // Active drivers = drivers with rides in the last 24 hours
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const recentRides = allRides.filter(ride => {
        const rideDate = new Date(ride.created_at);
        return rideDate >= yesterday;
      });

      // Get unique driver IDs from recent rides
      const recentDriverIds = new Set<string>();
      recentRides.forEach(ride => {
        // Check if the ride has a driver_id property directly
        if ('driver_id' in ride && ride.driver_id) {
          recentDriverIds.add(ride.driver_id);
        }
      });
      
      const activeDrivers = recentDriverIds.size;

      const availableVehicles = totalFleet - ongoingRides;

      setStats({
        activeDrivers,
        ongoingRides,
        todayRevenue,
        monthlyRevenue,
        monthlyEarnings: monthlyRevenue, // ✅ AJOUTÉ: Même valeur que monthlyRevenue pour cohérence
        totalFleet,
        availableVehicles: Math.max(0, availableVehicles),
        completedRides,
        pendingRides,
      });

    } catch (error) {
      console.error('Error fetching partner stats:', error);
      setError(error as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchStats();
      
      // Set up real-time updates every 30 seconds
      const interval = setInterval(fetchStats, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  return {
    stats,
    loading,
    error,
    refreshStats: fetchStats
  };
};