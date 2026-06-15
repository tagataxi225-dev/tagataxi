import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';
import { VEHICLE_CLASS_TO_SERVICE_TYPE } from '@/utils/pricingMapper';

export interface AvailableTaxiService {
  id: string;
  service_type: 'transport';
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
  display_name: string;
  description?: string;
}

const getCityMultiplier = (city: string): number => {
  const c = city.toLowerCase();
  if (c.includes('lubumbashi')) return 1.2;
  if (c.includes('kolwezi')) return 1.1;
  return 1.0;
};

export const useAvailableTaxiServices = (city: string = 'Kinshasa') => {
  const queryClient = useQueryClient();

  const query = useQuery<AvailableTaxiService[]>({
    queryKey: ['available-taxi-services', city],
    queryFn: async () => {
      let { data: pricingRules, error: pricingError } = await supabase
        .from('pricing_rules')
        .select('*')
        .ilike('city', city)
        .eq('service_type', 'transport')
        .eq('is_active', true);

      if (pricingError) throw pricingError;

      if (!pricingRules || pricingRules.length === 0) {
        const { data: fallbackRules, error: fallbackError } = await supabase
          .from('pricing_rules')
          .select('*')
          .eq('city', 'Kinshasa')
          .eq('service_type', 'transport')
          .eq('is_active', true);
          
        if (fallbackError) throw fallbackError;
        
        const cityMultiplier = getCityMultiplier(city);
        pricingRules = fallbackRules?.map(rule => ({
          ...rule,
          city: city,
          base_price: rule.base_price * cityMultiplier,
          price_per_km: rule.price_per_km * cityMultiplier,
          price_per_minute: rule.price_per_minute * cityMultiplier,
          minimum_fare: rule.minimum_fare * cityMultiplier,
          waiting_fee_per_minute: rule.waiting_fee_per_minute * cityMultiplier
        }));
      }

      const { data: serviceConfigs, error: configError } = await supabase
        .from('service_configurations')
        .select('*')
        .eq('service_category', 'taxi')
        .eq('is_active', true);

      if (configError) throw configError;

      return (pricingRules || [])
        .map((rule: any) => {
          const serviceType = VEHICLE_CLASS_TO_SERVICE_TYPE[rule.vehicle_class];
          const config = serviceConfigs?.find(c => c.service_type === serviceType);
          if (!config || !config.is_active) return null;
          return {
            ...rule,
            display_name: config.display_name,
            description: config.description,
          } as AvailableTaxiService;
        })
        .filter(Boolean) as AvailableTaxiService[];
    },
    staleTime: 30000,
  });

  useEffect(() => {
    const channel = supabase
      .channel('taxi-services-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pricing_rules' },
        (payload: any) => {
          const affectedCity = payload.new?.city || payload.old?.city;
          if (affectedCity?.toLowerCase() === city.toLowerCase()) {
            queryClient.invalidateQueries({ queryKey: ['available-taxi-services', city] });
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'service_configurations' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['available-taxi-services', city] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, city]);

  return {
    availableServices: query.data || [],
    loading: query.isLoading,
    error: query.error as Error | null,
    refresh: () => queryClient.invalidateQueries({ queryKey: ['available-taxi-services', city] }),
  };
};
