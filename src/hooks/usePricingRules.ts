import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

export type ServiceCategory = 'transport' | 'delivery';

export interface PricingRule {
  id: string;
  service_type: ServiceCategory;
  vehicle_class: string;
  base_price: number;
  price_per_km: number;
  price_per_minute: number;
  minimum_fare: number;
  surge_multiplier: number;
  waiting_fee_per_minute: number;
  free_waiting_time_minutes: number;
  max_waiting_time_minutes: number;
  currency: string;
  city: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const usePricingRules = (city: string = 'Kinshasa') => {
  const queryClient = useQueryClient();

  const query = useQuery<PricingRule[]>({
    queryKey: ['pricing_rules', city],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pricing_rules')
        .select('*')
        .eq('city', city)
        .eq('is_active', true);
      if (error) throw error;
      return (data || []) as PricingRule[];
    }
  });

  // Realtime updates: keep tariffs in sync with admin changes
  useEffect(() => {
    const channel = supabase
      .channel('pricing-rules-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pricing_rules' },
        (payload: any) => {
          // Invalider uniquement si le changement affecte cette ville
          const affectedCity = payload.new?.city || payload.old?.city;
          if (affectedCity === city) {
            queryClient.invalidateQueries({ queryKey: ['pricing_rules', city] });
          }
        }
      )
      .subscribe();

    return () => {
      try { supabase.removeChannel(channel); } catch {}
    };
  }, [queryClient, city]);

  const upsertRule = useMutation({
    mutationFn: async (rule: Partial<PricingRule> & { service_type: ServiceCategory; vehicle_class: string }) => {
      // Update existing active rule for the pair
      const { data: existing } = await supabase
        .from('pricing_rules')
        .select('*')
        .eq('service_type', rule.service_type)
        .eq('vehicle_class', rule.vehicle_class)
        .eq('is_active', true)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('pricing_rules')
          .update({
            base_price: rule.base_price,
            price_per_km: rule.price_per_km,
            price_per_minute: rule.price_per_minute || existing.price_per_minute,
            minimum_fare: rule.minimum_fare || existing.minimum_fare,
            surge_multiplier: rule.surge_multiplier || existing.surge_multiplier,
            waiting_fee_per_minute: rule.waiting_fee_per_minute || existing.waiting_fee_per_minute,
            free_waiting_time_minutes: rule.free_waiting_time_minutes || existing.free_waiting_time_minutes,
            max_waiting_time_minutes: rule.max_waiting_time_minutes || existing.max_waiting_time_minutes,
            currency: rule.currency || existing.currency,
            city: rule.city || existing.city
          })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('pricing_rules')
          .insert({
            service_type: rule.service_type,
            vehicle_class: rule.vehicle_class,
            base_price: rule.base_price,
            price_per_km: rule.price_per_km,
            price_per_minute: rule.price_per_minute || 0,
            minimum_fare: rule.minimum_fare || 0,
            surge_multiplier: rule.surge_multiplier || 1,
            waiting_fee_per_minute: rule.waiting_fee_per_minute || 50,
            free_waiting_time_minutes: rule.free_waiting_time_minutes || 5,
            max_waiting_time_minutes: rule.max_waiting_time_minutes || 15,
            currency: rule.currency || 'CDF',
            city: rule.city || 'Kinshasa',
            is_active: true
          });
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pricing_rules'] })
  });

  const deactivateRule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('pricing_rules')
        .update({ is_active: false })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pricing_rules'] })
  });

  return {
    rules: query.data || [],
    isLoading: query.isLoading,
    error: query.error as Error | null,
    refresh: () => queryClient.invalidateQueries({ queryKey: ['pricing_rules', city] }),
    upsertRule,
    deactivateRule,
  };
};

export const usePriceEstimator = (service_type: ServiceCategory, vehicle_class: string) => {
  const { rules } = usePricingRules();

  const rule = rules.find(r => r.service_type === service_type && r.vehicle_class === vehicle_class);

  const estimate = (distanceKm: number): number => {
    const d = Math.max(distanceKm || 0, 0);
    if (rule) {
      return Math.round((rule.base_price || 0) + d * (rule.price_per_km || 0));
    }
    // Fallbacks if rule missing - TARIFS 2025
    const defaults: Record<string, { base: number; perKm: number }> = {
      moto: { base: 1500, perKm: 500 },
      eco: { base: 2500, perKm: 1500 },
      standard: { base: 3200, perKm: 1800 },
      premium: { base: 4300, perKm: 2300 },
      first_class: { base: 4300, perKm: 2300 },
      flash: { base: 5000, perKm: 1000 }, // ✅ Corrigé : 5000 au lieu de 7000
      flex: { base: 55000, perKm: 2500 },
      maxicharge: { base: 100000, perKm: 5000 }
    };
    const key = vehicle_class as keyof typeof defaults;
    const def = defaults[key] || { base: 2500, perKm: 1500 };
    return Math.round(def.base + d * def.perKm);
  };

  const calculateWaitingFees = (arrivalTime: Date, boardingTime: Date): { waitingMinutes: number; billableMinutes: number; waitingFee: number } => {
    if (!rule || !arrivalTime || !boardingTime) {
      return { waitingMinutes: 0, billableMinutes: 0, waitingFee: 0 };
    }
    
    const waitingMinutes = Math.floor((boardingTime.getTime() - arrivalTime.getTime()) / (1000 * 60));
    const billableMinutes = Math.max(0, waitingMinutes - (rule.free_waiting_time_minutes || 5));
    const waitingFee = billableMinutes * (rule.waiting_fee_per_minute || 50);
    
    return { waitingMinutes, billableMinutes, waitingFee: Math.round(waitingFee) };
  };

  const calculateFinalPrice = (basePrice: number, waitingFee: number = 0): number => {
    return Math.round(basePrice + waitingFee);
  };

  return { estimate, rule, calculateWaitingFees, calculateFinalPrice };
};
