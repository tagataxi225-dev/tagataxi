import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface LoyaltyTierInfo {
  id: string;
  name: string;
  minPoints: number;
  commission: string;
}

const TIERS: LoyaltyTierInfo[] = [
  { id: 'bronze', name: 'Bronze', minPoints: 0, commission: '5%' },
  { id: 'silver', name: 'Argent', minPoints: 1000, commission: '4%' },
  { id: 'gold', name: 'Or', minPoints: 5000, commission: '3%' },
  { id: 'platinum', name: 'Platine', minPoints: 15000, commission: '2%' },
];

const POINTS_MAP: Record<string, number> = {
  transport: 10,
  delivery: 15,
  rental: 50,
};

function getTier(points: number): LoyaltyTierInfo {
  return [...TIERS].reverse().find(t => points >= t.minPoints) || TIERS[0];
}

function getNextTier(currentTier: LoyaltyTierInfo): LoyaltyTierInfo | null {
  const idx = TIERS.findIndex(t => t.id === currentTier.id);
  return idx < TIERS.length - 1 ? TIERS[idx + 1] : null;
}

export const usePartnerLoyalty = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['partner-loyalty', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');

      // Get partner ID
      const { data: partner } = await supabase
        .from('partenaires')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!partner) return { points: 0, tier: TIERS[0], nextTier: TIERS[1], progress: 0, pointsToNext: 1000, tiers: TIERS };

      // Fetch all commissions to calculate points
      const { data: commissions } = await supabase
        .from('partner_commission_tracking')
        .select('service_type')
        .eq('partner_id', partner.id);

      // Calculate points
      const points = (commissions || []).reduce((sum, c) => {
        const serviceType = (c.service_type || 'transport').toLowerCase();
        return sum + (POINTS_MAP[serviceType] || 10);
      }, 0);

      // Determine tier
      const tier = getTier(points);
      const nextTier = getNextTier(tier);
      const progress = nextTier
        ? Math.min(100, ((points - tier.minPoints) / (nextTier.minPoints - tier.minPoints)) * 100)
        : 100;
      const pointsToNext = nextTier ? nextTier.minPoints - points : 0;

      // Sync to partenaires table (fire and forget)
      supabase
        .from('partenaires')
        .update({ loyalty_points: points, loyalty_tier: tier.id } as any)
        .eq('id', partner.id)
        .then();

      return { points, tier, nextTier, progress, pointsToNext, tiers: TIERS };
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
  });
};
