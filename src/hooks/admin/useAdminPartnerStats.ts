import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PartnerStats {
  activeDrivers: number;
  subscribedDrivers: number;
  totalCommissions: number;
  monthlyCommissions: number;
}

const fetchPartnerStats = async (partnerId: string): Promise<PartnerStats> => {
  // ✅ OPTIMISATION: Utiliser materialized view partner_stats_mv
  const { data: statsArray, error } = await supabase
    .rpc('get_partner_stats_optimized', { partner_user_id: partnerId }) as any;
  
  const stats = statsArray?.[0];

  if (error || !stats) {
    console.warn('Partner stats MV error:', error);
    return {
      activeDrivers: 0,
      subscribedDrivers: 0,
      totalCommissions: 0,
      monthlyCommissions: 0
    };
  }

  return {
    activeDrivers: stats.active_drivers || 0,
    subscribedDrivers: stats.subscribed_drivers || 0,
    totalCommissions: stats.total_commissions || 0,
    monthlyCommissions: stats.monthly_commissions || 0
  };
};

export const useAdminPartnerStats = (partnerId: string) => {
  return useQuery({
    queryKey: ['admin-partner-stats', partnerId],
    queryFn: () => fetchPartnerStats(partnerId),
    staleTime: 5 * 60 * 1000, // ✅ 5 minutes (sync avec cron MV)
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false, // MV se refresh automatiquement
    enabled: !!partnerId,
    retry: 2
  });
};
