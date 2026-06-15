import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type ServiceCategory = 'taxi' | 'delivery' | 'rental' | 'marketplace' | 'lottery' | 'food';

export type ServiceStatus = 'active' | 'inactive' | 'coming_soon';

export interface ServiceConfiguration {
  id: string;
  service_type: string;
  service_category: ServiceCategory;
  display_name: string;
  description?: string;
  requirements: string[];
  features: string[];
  vehicle_requirements: Record<string, any>;
  is_active: boolean;
  service_status: ServiceStatus;
}

export interface ServicePricing {
  id: string;
  service_type: string;
  service_category: ServiceCategory;
  city: string;
  base_price: number;
  price_per_km: number;
  price_per_minute?: number;
  minimum_fare: number;
  maximum_fare?: number;
  surge_multiplier: number;
  commission_rate: number;
  currency: string;
  is_active: boolean;
}

export const useServiceConfigurations = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ✅ Cache React Query stable (5min staleTime, 10min gcTime)
  const { data: configurations, isLoading: configurationsLoading } = useQuery({
    queryKey: ['service-configurations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_configurations')
        .select('*')
        .order('service_category', { ascending: true })
        .order('service_type', { ascending: true });

      if (error) throw error;
      return data as ServiceConfiguration[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,   // 10 minutes (anciennement cacheTime)
  });

  const { data: pricing, isLoading: pricingLoading } = useQuery({
    queryKey: ['service-pricing'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_pricing')
        .select('*')
        .eq('is_active', true)
        .order('service_category', { ascending: true })
        .order('service_type', { ascending: true });

      if (error) throw error;
      return data as ServicePricing[];
    },
  });

  const updatePricingMutation = useMutation({
    mutationFn: async (pricing: Partial<ServicePricing> & { id: string }) => {
      const { data, error } = await supabase
        .from('service_pricing')
        .update(pricing)
        .eq('id', pricing.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-pricing'] });
      toast({
        title: "Tarification mise à jour",
        description: "Les tarifs du service ont été mis à jour avec succès.",
      });
    },
    onError: (error) => {
      console.error('Error updating pricing:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la tarification.",
        variant: "destructive",
      });
    },
  });

  const createServiceMutation = useMutation({
    mutationFn: async (service: Omit<ServiceConfiguration, 'id'>) => {
      const { data, error } = await supabase
        .from('service_configurations')
        .insert(service)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-configurations'] });
      toast({
        title: "Service créé",
        description: "Le nouveau service a été créé avec succès.",
      });
    },
    onError: (error) => {
      console.error('Error creating service:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer le service.",
        variant: "destructive",
      });
    },
  });

  const updateServiceMutation = useMutation({
    mutationFn: async (service: Partial<ServiceConfiguration> & { id: string }) => {
      const { data, error } = await supabase
        .from('service_configurations')
        .update(service)
        .eq('id', service.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-configurations'] });
      toast({
        title: "Service mis à jour",
        description: "Le service a été mis à jour avec succès.",
      });
    },
    onError: (error) => {
      console.error('Error updating service:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le service.",
        variant: "destructive",
      });
    },
  });

  const createPricingMutation = useMutation({
    mutationFn: async (pricing: Omit<ServicePricing, 'id'>) => {
      const { data, error } = await supabase
        .from('service_pricing')
        .insert(pricing)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-pricing'] });
      toast({
        title: "Tarification créée",
        description: "La tarification a été créée avec succès.",
      });
    },
    onError: (error) => {
      console.error('Error creating pricing:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer la tarification.",
        variant: "destructive",
      });
    },
  });

  const getTaxiServices = () => {
    return configurations?.filter(config => config.service_category === 'taxi') || [];
  };

  const getDeliveryServices = () => {
    return configurations?.filter(config => config.service_category === 'delivery') || [];
  };

  const getRentalServices = () => {
    return configurations?.filter(config => config.service_category === 'rental') || [];
  };

  const getMarketplaceServices = () => {
    return configurations?.filter(config => config.service_category === 'marketplace') || [];
  };

  const getLotteryServices = () => {
    return configurations?.filter(config => config.service_category === 'lottery') || [];
  };

  const getFoodServices = () => {
    return configurations?.filter(config => config.service_category === 'food') || [];
  };

  const getServicePricing = (serviceType: string, serviceCategory: ServiceCategory, city = 'Kinshasa') => {
    return pricing?.find(p => 
      p.service_type === serviceType && 
      p.service_category === serviceCategory && 
      p.city === city
    );
  };

  const formatPrice = (amount: number, currency = 'CDF') => {
    return new Intl.NumberFormat('fr-CD', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return {
    configurations: configurations || [],
    pricing: pricing || [],
    loading: configurationsLoading || pricingLoading,
    configurationsLoading,
    pricingLoading,
    getTaxiServices,
    getDeliveryServices,
    getRentalServices,
    getMarketplaceServices,
    getLotteryServices,
    getFoodServices,
    getServicePricing,
    formatPrice,
    updatePricing: updatePricingMutation.mutate,
    createService: createServiceMutation.mutate,
    updateService: updateServiceMutation.mutate,
    createPricing: createPricingMutation.mutate,
  };
};