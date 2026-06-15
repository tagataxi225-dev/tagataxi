import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface RideCommission {
  id: string;
  ride_id: string;
  ride_type: 'transport' | 'delivery';
  driver_id: string;
  partner_id: string | null;
  ride_amount: number;
  kwenda_commission: number;
  kwenda_rate: number;
  partner_commission: number;
  partner_rate: number;
  driver_net_amount: number;
  payment_status: 'pending' | 'paid' | 'failed';
  paid_at: string | null;
  created_at: string;
}

interface CommissionStats {
  totalRides: number;
  totalEarnings: number;
  totalTembeaFees: number;
  totalPartnerFees: number;
  netEarnings: number;
  averagePerRide: number;
}

/**
 * Hook pour récupérer l'historique détaillé des commissions pour un chauffeur
 */
export const useRideCommissionHistory = (limit: number = 50) => {
  const { user } = useAuth();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['ride-commission-history', user?.id, limit],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const { data: commissions, error } = await supabase
        .from('ride_commissions')
        .select('*')
        .eq('driver_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Calculer les stats
      const stats: CommissionStats = {
        totalRides: commissions?.length || 0,
        totalEarnings: 0,
        totalTembeaFees: 0,
        totalPartnerFees: 0,
        netEarnings: 0,
        averagePerRide: 0
      };

      commissions?.forEach((c) => {
        stats.totalEarnings += Number(c.ride_amount);
        stats.totalTembeaFees += Number(c.kwenda_commission);
        stats.totalPartnerFees += Number(c.partner_commission);
        stats.netEarnings += Number(c.driver_net_amount);
      });

      if (stats.totalRides > 0) {
        stats.averagePerRide = Math.round(stats.netEarnings / stats.totalRides);
      }

      return {
        commissions: commissions as RideCommission[],
        stats
      };
    },
    enabled: !!user,
    staleTime: 60 * 1000 // 1 minute
  });

  return {
    commissions: data?.commissions || [],
    stats: data?.stats || {
      totalRides: 0,
      totalEarnings: 0,
      totalTembeaFees: 0,
      totalPartnerFees: 0,
      netEarnings: 0,
      averagePerRide: 0
    },
    isLoading,
    refetch
  };
};

/**
 * Hook pour récupérer les détails d'une commission spécifique
 */
export const useRideCommissionDetails = (rideId: string | null) => {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['ride-commission-details', rideId],
    queryFn: async () => {
      if (!user || !rideId) return null;

      const { data, error } = await supabase
        .from('ride_commissions')
        .select('*')
        .eq('ride_id', rideId)
        .eq('driver_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as RideCommission | null;
    },
    enabled: !!user && !!rideId
  });

  return { commission: data, isLoading };
};
