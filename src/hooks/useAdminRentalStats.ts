import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Types explicites pour les stats
interface VehicleStats {
  total_vehicles: number;
  pending_moderation: number;
  approved_vehicles: number;
  active_vehicles: number;
}

interface BookingStats {
  total_bookings: number;
  completed_bookings: number;
  pending_bookings: number;
  total_revenue: number;
}

interface SubscriptionStats {
  active_subscriptions: number;
}

export interface AdminRentalStats {
  totalVehicles: number;
  pendingModeration: number;
  approvedVehicles: number;
  activeVehicles: number;
  activeSubscriptions: number;
  totalCategories: number;
  totalBookings: number;
  totalRevenue: number;
  completedBookings: number;
  pendingBookings: number;
}

export const useAdminRentalStats = () => {
  return useQuery({
    queryKey: ['admin-rental-stats'],
    queryFn: async (): Promise<AdminRentalStats> => {
      console.log('🔍 [RENTAL STATS] Fetching from secure stats tables...');
      
      // Utiliser les tables de stats sécurisées
      const [
        vehicleStatsResult,
        bookingStatsResult,
        subscriptionStatsResult,
        categoriesResult
      ] = await Promise.all([
        // Stats véhicules depuis table sécurisée
        supabase
          .from('rental_vehicle_stats_secure')
          .select('*')
          .single(),
        
        // Stats réservations depuis table sécurisée
        supabase
          .from('rental_booking_stats_secure')
          .select('*')
          .single(),
        
        // Stats abonnements depuis table sécurisée
        supabase
          .from('rental_subscription_stats_secure')
          .select('*')
          .single(),
        
        // Seulement les catégories actives (requête simple)
        supabase
          .from('rental_vehicle_categories')
          .select('id', { count: 'exact', head: true })
          .eq('is_active', true)
      ]);

      // Log des résultats
      console.log('📊 [RENTAL STATS] Secure stats results:', {
        vehicleStats: {
          success: !vehicleStatsResult.error,
          data: vehicleStatsResult.data,
          error: vehicleStatsResult.error?.message
        },
        bookingStats: {
          success: !bookingStatsResult.error,
          data: bookingStatsResult.data,
          error: bookingStatsResult.error?.message
        },
        subscriptionStats: {
          success: !subscriptionStatsResult.error,
          data: subscriptionStatsResult.data,
          error: subscriptionStatsResult.error?.message
        },
        categories: {
          success: !categoriesResult.error,
          count: categoriesResult.count,
          error: categoriesResult.error?.message
        }
      });

      // Extraire les données des tables sécurisées avec types explicites
      const vehicleStats = vehicleStatsResult.data || {
        total_vehicles: 0,
        pending_moderation: 0,
        approved_vehicles: 0,
        active_vehicles: 0
      };

      const bookingStats = bookingStatsResult.data || {
        total_bookings: 0,
        completed_bookings: 0,
        pending_bookings: 0,
        total_revenue: 0
      };

      const subscriptionStats = subscriptionStatsResult.data || {
        active_subscriptions: 0
      };

      return {
        totalVehicles: vehicleStats.total_vehicles,
        pendingModeration: vehicleStats.pending_moderation,
        approvedVehicles: vehicleStats.approved_vehicles,
        activeVehicles: vehicleStats.active_vehicles,
        activeSubscriptions: subscriptionStats.active_subscriptions,
        totalCategories: categoriesResult.count || 0,
        totalBookings: bookingStats.total_bookings,
        totalRevenue: Number(bookingStats.total_revenue) || 0,
        completedBookings: bookingStats.completed_bookings,
        pendingBookings: bookingStats.pending_bookings,
      };
    },
    staleTime: 5 * 60 * 1000, // Cache pendant 5 minutes
    gcTime: 10 * 60 * 1000, // Garder en cache 10 minutes
    refetchInterval: 60000, // Actualiser toutes les minutes (au lieu de 30s)
    retry: 3, // Réessayer 3 fois en cas d'erreur
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Backoff exponentiel
  });
};