import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface RideCommissionStats {
  totalCommissions: number;
  monthlyCommissions: number;
  totalRides: number;
  monthlyRides: number;
  activeDrivers: number;
  averageCommissionPerRide: number;
  currency: string;
}

/**
 * Hook pour récupérer les statistiques de commissions sur courses
 * pour un partenaire (2.5% par course des chauffeurs de son portefeuille)
 */
export const usePartnerRideCommissions = () => {
  const { user } = useAuth();

  const { data: stats, isLoading, refetch } = useQuery({
    queryKey: ['partner-ride-commissions', user?.id],
    queryFn: async (): Promise<RideCommissionStats> => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data: partenaireData } = await supabase
        .from('partenaires')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      const partenaireId = partenaireData?.id;
      if (!partenaireId) return { totalCommissions: 0, monthlyCommissions: 0, totalRides: 0, monthlyRides: 0, activeDrivers: 0, averageCommissionPerRide: 0, currency: 'XOF' };

      // 1. Récupérer tous les chauffeurs du partenaire
      const { data: partnerDrivers, error: driversError } = await supabase
        .from('partner_drivers')
        .select('driver_id')
        .eq('partner_id', partenaireId)
        .eq('status', 'active');

      if (driversError) throw driversError;

      const driverIds = partnerDrivers?.map(pd => pd.driver_id) || [];

      if (driverIds.length === 0) {
        return {
          totalCommissions: 0,
          monthlyCommissions: 0,
          totalRides: 0,
          monthlyRides: 0,
          activeDrivers: 0,
          averageCommissionPerRide: 0,
          currency: 'XOF'
        };
      }

      // 2. Lire les commissions depuis la DB (source de vérité)
      const { data: trackingRows } = await supabase
        .from('partner_commission_tracking')
        .select('commission_amount, created_at, booking_id')
        .eq('partner_id', partenaireId)
        .order('created_at', { ascending: false });

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      let totalCommissions = 0;
      let monthlyCommissions = 0;
      let totalRides = 0;
      let monthlyRides = 0;

      if (trackingRows && trackingRows.length > 0) {
        // Source DB : somme des commission_amount enregistrés
        trackingRows.forEach(row => {
          const amount = Number(row.commission_amount || 0);
          totalCommissions += amount;
          totalRides++;

          const rowDate = new Date(row.created_at);
          if (rowDate.getMonth() === currentMonth && rowDate.getFullYear() === currentYear) {
            monthlyCommissions += amount;
            monthlyRides++;
          }
        });
      } else {
        // Fallback frontend : calcul 2.5% si partner_commission_tracking est vide

        const { data: transportBookings, error: bookingsError } = await supabase
          .from('transport_bookings')
          .select('actual_price, created_at')
          .in('driver_id', driverIds)
          .eq('status', 'completed');

        if (bookingsError) throw bookingsError;

        const { data: deliveryOrders, error: deliveryError } = await supabase
          .from('delivery_orders')
          .select('actual_price, created_at')
          .in('driver_id', driverIds)
          .eq('status', 'delivered');

        if (deliveryError) throw deliveryError;

        transportBookings?.forEach(booking => {
          const partnerCommission = (Number(booking.actual_price || 0) * 2.5) / 100;
          totalCommissions += partnerCommission;
          totalRides++;

          const bookingDate = new Date(booking.created_at);
          if (bookingDate.getMonth() === currentMonth && bookingDate.getFullYear() === currentYear) {
            monthlyCommissions += partnerCommission;
            monthlyRides++;
          }
        });

        deliveryOrders?.forEach(order => {
          const partnerCommission = (Number(order.actual_price || 0) * 2.5) / 100;
          totalCommissions += partnerCommission;
          totalRides++;

          const orderDate = new Date(order.created_at);
          if (orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear) {
            monthlyCommissions += partnerCommission;
            monthlyRides++;
          }
        });
      }

      return {
        totalCommissions: Math.round(totalCommissions),
        monthlyCommissions: Math.round(monthlyCommissions),
        totalRides,
        monthlyRides,
        activeDrivers: driverIds.length,
        averageCommissionPerRide: totalRides > 0 ? Math.round(totalCommissions / totalRides) : 0,
        currency: 'XOF'
      };
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 2
  });

  return {
    stats: stats || {
      totalCommissions: 0,
      monthlyCommissions: 0,
      totalRides: 0,
      monthlyRides: 0,
      activeDrivers: 0,
      averageCommissionPerRide: 0,
      currency: 'XOF'
    },
    isLoading,
    refetch
  };
};
