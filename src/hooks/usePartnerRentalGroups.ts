import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PartnerGroup {
  partnerId: string;
  partnerName: string;
  partnerLogo: string | null;
  partnerBanner: string | null;
  vehicleCount: number;
  avgRating: number;
  ratingCount: number;
  followersCount: number;
  tier: string;
  vehicles: any[];
  topVehicles: any[];
}

export const usePartnerRentalGroups = (city?: string) => {
  // Fetch ALL partners directly
  const { data: allPartners = [], isLoading: partnersLoading } = useQuery({
    queryKey: ['all-rental-partners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partenaires')
        .select('id, company_name, logo_url, banner_image')
        .eq('partner_type', 'auto');
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch approved vehicles separately
  const { data: vehicles = [], isLoading: vehiclesLoading } = useQuery({
    queryKey: ['rental-vehicles-approved', city],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rental_vehicles')
        .select(`*, category:rental_vehicle_categories(id, name, icon)`)
        .eq('is_available', true)
        .eq('is_active', true)
        .eq('moderation_status', 'approved')
        .order('created_at', { ascending: false });

      if (error) throw error;

      let result = data || [];
      if (city) {
        result = result.filter((v: any) => {
          const cities = Array.isArray(v.available_cities) ? v.available_cities : [];
          return cities.includes(city);
        });
      }
      return result;
    }
  });

  // Fetch partner stats
  const { data: stats = [] } = useQuery({
    queryKey: ['partner-rental-stats-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partner_rental_stats')
        .select('*');
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch followers count
  const { data: followersData = [] } = useQuery({
    queryKey: ['partner-followers-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partner_rental_followers')
        .select('partner_id')
        .returns<{ partner_id: string }[]>();
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch subscriptions for tiers
  const { data: subscriptions = [] } = useQuery({
    queryKey: ['partner-subscriptions-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partner_rental_subscriptions')
        .select(`partner_id, plan:rental_subscription_plans(tier)`)
        .eq('status', 'active')
        .gte('end_date', new Date().toISOString());
      if (error) throw error;
      return data || [];
    }
  });

  // Build groups: partners-first approach
  const partnerGroups = useMemo<PartnerGroup[]>(() => {
    return allPartners
      .map(partner => {
        const partnerVehicles = vehicles.filter(v => v.partner_id === partner.id);
        const partnerStats = stats.find(s => s.partner_id === partner.id);
        const followersCount = followersData.filter(f => f.partner_id === partner.id).length;
        const subscription = subscriptions.find(s => s.partner_id === partner.id);

        return {
          partnerId: partner.id,
          partnerName: partner.company_name,
          partnerLogo: partner.logo_url || null,
          partnerBanner: partner.banner_image || null,
          vehicleCount: partnerVehicles.length,
          avgRating: partnerStats?.rating_average || 0,
          ratingCount: partnerStats?.rating_count || 0,
          followersCount,
          tier: subscription?.plan?.tier || 'basic',
          vehicles: partnerVehicles,
          topVehicles: [...partnerVehicles]
            .sort((a, b) => a.daily_rate - b.daily_rate)
            .slice(0, 3)
        };
      })
      .filter(p => p.vehicleCount > 0)
      .sort((a, b) => {
        // Partners with vehicles first
        if (a.vehicleCount > 0 && b.vehicleCount === 0) return -1;
        if (a.vehicleCount === 0 && b.vehicleCount > 0) return 1;

        // Then by tier
        const tierOrder = { platinum: 0, gold: 1, silver: 2, basic: 3 };
        const aTier = tierOrder[a.tier as keyof typeof tierOrder] ?? 99;
        const bTier = tierOrder[b.tier as keyof typeof tierOrder] ?? 99;
        if (aTier !== bTier) return aTier - bTier;

        // Then by rating
        if (Math.abs(a.avgRating - b.avgRating) > 0.1) return b.avgRating - a.avgRating;

        // Then by vehicle count
        return b.vehicleCount - a.vehicleCount;
      });
  }, [allPartners, vehicles, stats, followersData, subscriptions]);

  const premiumPartners = useMemo(() => {
    return partnerGroups.filter(p => p.tier === 'gold' || p.tier === 'platinum');
  }, [partnerGroups]);

  return {
    partnerGroups,
    premiumPartners,
    isLoading: partnersLoading || vehiclesLoading,
    totalPartners: partnerGroups.length,
    totalVehicles: vehicles.length
  };
};
