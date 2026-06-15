import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

interface DailyEarnings {
  date: string;
  rides: number;
  earnings: number;
  hours: number;
}

interface WeeklyStats {
  totalEarnings: number;
  totalRides: number;
  totalHours: number;
  averageRating: number;
  previousWeekEarnings: number;
  changePercent: number;
  dailyBreakdown: DailyEarnings[];
}

export const useDriverEarnings = () => {
  const [loading, setLoading] = useState(true);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats>({
    totalEarnings: 0,
    totalRides: 0,
    totalHours: 0,
    averageRating: 0,
    previousWeekEarnings: 0,
    changePercent: 0,
    dailyBreakdown: []
  });
  const { user } = useAuth();
  const { toast } = useToast();

  const loadEarningsData = async () => {
    if (!user) return;

    try {
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      const previousWeekStart = new Date(startOfWeek);
      previousWeekStart.setDate(startOfWeek.getDate() - 7);
      
      const previousWeekEnd = new Date(endOfWeek);
      previousWeekEnd.setDate(endOfWeek.getDate() - 7);

      // Get current week rides
      const { data: currentWeekRides, error: currentError } = await supabase
        .from('transport_bookings')
        .select('*')
        .eq('driver_id', user.id)
        .eq('status', 'completed')
        .gte('completion_time', startOfWeek.toISOString())
        .lte('completion_time', endOfWeek.toISOString())
        .order('completion_time', { ascending: true });

      if (currentError) throw currentError;

      // Get previous week rides for comparison
      const { data: previousWeekRides, error: previousError } = await supabase
        .from('transport_bookings')
        .select('actual_price')
        .eq('driver_id', user.id)
        .eq('status', 'completed')
        .gte('completion_time', previousWeekStart.toISOString())
        .lte('completion_time', previousWeekEnd.toISOString());

      if (previousError) throw previousError;

      // Get driver rating
      const { data: ratings, error: ratingError } = await supabase
        .from('user_ratings')
        .select('rating')
        .eq('rated_user_id', user.id);

      if (ratingError) throw ratingError;

      // Calculate current week stats
      const totalEarnings = currentWeekRides?.reduce((sum, ride) => sum + (ride.actual_price || 0), 0) || 0;
      const totalRides = currentWeekRides?.length || 0;
      const previousWeekEarnings = previousWeekRides?.reduce((sum, ride) => sum + (ride.actual_price || 0), 0) || 0;
      
      const changePercent = previousWeekEarnings > 0 
        ? ((totalEarnings - previousWeekEarnings) / previousWeekEarnings) * 100 
        : 0;

      const averageRating = ratings?.length 
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length 
        : 0;

      // Create daily breakdown
      const dailyBreakdown: DailyEarnings[] = [];
      for (let i = 0; i < 7; i++) {
        const day = new Date(startOfWeek);
        day.setDate(startOfWeek.getDate() + i);
        
        const dayStart = new Date(day);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(day);
        dayEnd.setHours(23, 59, 59, 999);

        const dayRides = currentWeekRides?.filter(ride => {
          const rideDate = new Date(ride.completion_time || '');
          return rideDate >= dayStart && rideDate <= dayEnd;
        }) || [];

        dailyBreakdown.push({
          date: day.toISOString().split('T')[0],
          rides: dayRides.length,
          earnings: dayRides.reduce((sum, ride) => sum + (ride.actual_price || 0), 0),
          hours: Math.round(dayRides.length * 0.5 * 10) / 10 // Estimated hours
        });
      }

      setWeeklyStats({
        totalEarnings,
        totalRides,
        totalHours: Math.round(totalRides * 0.5 * 10) / 10,
        averageRating: Math.round(averageRating * 10) / 10,
        previousWeekEarnings,
        changePercent: Math.round(changePercent * 10) / 10,
        dailyBreakdown
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

      // Set up real-time listeners for earnings updates
      const bookingsChannel = supabase
        .channel('driver-earnings-bookings')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'transport_bookings',
            filter: `driver_id=eq.${user.id}`
          },
          (payload) => {
            console.log('Booking updated:', payload);
            // Refresh earnings when a booking is completed
            if (payload.new?.status === 'completed') {
              const earnings = payload.new?.actual_price || 0;
              toast({
                title: "💰 Nouveau gain enregistré",
                description: `Course terminée : +${earnings.toLocaleString()} CDF`,
              });
              loadEarningsData();
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'user_ratings',
            filter: `rated_user_id=eq.${user.id}`
          },
          (payload) => {
            console.log('New rating received:', payload);
            const rating = payload.new?.rating || 0;
            toast({
              title: "⭐ Nouvelle évaluation",
              description: `Vous avez reçu ${rating} étoile${rating > 1 ? 's' : ''}`,
            });
            // Refresh earnings to update average rating
            loadEarningsData();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(bookingsChannel);
      };
    }
  }, [user]);

  return {
    loading,
    weeklyStats,
    refreshEarnings: loadEarningsData
  };
};