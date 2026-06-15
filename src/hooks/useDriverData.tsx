import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface DriverStats {
  today_earnings: number;
  total_rides: number;
  hours_online: number;
  rating: number;
  total_earnings: number;
}

interface RecentRide {
  id: string;
  pickup_location: string;
  destination: string;
  actual_price: number;
  completion_time: string;
  user_name?: string;
  user_rating?: number;
}

export const useDriverData = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DriverStats>({
    today_earnings: 0,
    total_rides: 0,
    hours_online: 0,
    rating: 0,
    total_earnings: 0
  });
  const [recentRides, setRecentRides] = useState<RecentRide[]>([]);
  const [isOnline, setIsOnline] = useState(false);
  const { user } = useAuth();

  // Load driver stats
  const loadDriverStats = async () => {
    if (!user) return;

    try {
      // Get completed rides for today
      const today = new Date().toISOString().split('T')[0];
      const { data: todayRides, error: todayError } = await supabase
        .from('transport_bookings')
        .select('actual_price')
        .eq('driver_id', user.id)
        .eq('status', 'completed')
        .gte('completion_time', today);

      if (todayError) throw todayError;

      // Get total completed rides count and earnings
      const { data: allRides, count: totalRides, error: countError } = await supabase
        .from('transport_bookings')
        .select('actual_price', { count: 'exact' })
        .eq('driver_id', user.id)
        .eq('status', 'completed');

      if (countError) throw countError;

      // Get driver rating
      const { data: ratings, error: ratingError } = await supabase
        .from('user_ratings')
        .select('rating')
        .eq('rated_user_id', user.id);

      if (ratingError) throw ratingError;

      // Calculate earnings
      const todayEarnings = todayRides?.reduce((sum, ride) => sum + (ride.actual_price || 0), 0) || 0;
      const totalEarnings = allRides?.reduce((sum, ride) => sum + (ride.actual_price || 0), 0) || 0;

      // Calculate average rating
      const avgRating = ratings?.length 
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length 
        : 0;

      // Get online hours (simplified calculation)
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const hoursOnline = Math.min(
        Math.floor((Date.now() - startOfDay.getTime()) / (1000 * 60 * 60)),
        24
      );

      setStats({
        today_earnings: todayEarnings,
        total_rides: totalRides || 0,
        hours_online: hoursOnline,
        rating: Math.round(avgRating * 10) / 10,
        total_earnings: totalEarnings
      });

    } catch (error: any) {
      console.error('Error loading driver stats:', error);
      toast.error('Erreur lors du chargement des statistiques');
    }
  };

  // Load recent rides
  const loadRecentRides = async () => {
    if (!user) return;

    try {
      const { data: rides, error } = await supabase
        .from('transport_bookings')
        .select(`
          id,
          pickup_location,
          destination,
          actual_price,
          completion_time
        `)
        .eq('driver_id', user.id)
        .eq('status', 'completed')
        .order('completion_time', { ascending: false })
        .limit(10);

      if (error) throw error;

      const formattedRides = rides?.map(ride => ({
        id: ride.id,
        pickup_location: ride.pickup_location,
        destination: ride.destination,
        actual_price: ride.actual_price || 0,
        completion_time: ride.completion_time || '',
        user_name: 'Client',
        user_rating: 5.0 // Would need to get actual rating
      })) || [];

      setRecentRides(formattedRides);

    } catch (error: any) {
      console.error('Error loading recent rides:', error);
      toast.error('Erreur lors du chargement des courses récentes');
    }
  };

  // Update driver online status with real coordinates
  const updateOnlineStatus = async (online: boolean, coordinates?: { latitude: number; longitude: number }) => {
    if (!user) return;

    try {
      // Use provided coordinates or default to Kinshasa center
      const latitude = coordinates?.latitude || -4.3217;
      const longitude = coordinates?.longitude || 15.3069;

      // ⚠️ is_online/is_available retirés — gérés par useDriverStatus.goOnline/goOffline
      const { error } = await supabase
        .from('driver_locations')
        .upsert({
          driver_id: user.id,
          latitude,
          longitude,
          last_ping: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'driver_id'
        });

      if (error) throw error;

      setIsOnline(online);
    } catch (error: any) {
      console.error('Error updating online status:', error);
    }
  };

  useEffect(() => {
    if (user) {
      loadDriverStats();
      loadRecentRides();
      setLoading(false);
    }
  }, [user]);

  return {
    loading,
    stats,
    recentRides,
    isOnline,
    updateOnlineStatus,
    loadDriverStats,
    loadRecentRides
  };
};