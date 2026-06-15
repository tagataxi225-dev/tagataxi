import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface VehicleTypeConfig {
  service_type: string;
  display_name: string;
  description: string;
  is_active: boolean;
  base_price: number;
  price_per_km: number;
  minimum_fare: number;
  currency: string;
  city: string;
  vehicle_class: string;
  pricing_id: string;
  config_id: string;
}

export const useVehicleTypeConfig = (city: string = 'Kinshasa') => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Récupérer les types de véhicules avec tarifs
  const { data: vehicleTypes, isLoading, error, refetch } = useQuery({
    queryKey: ['vehicle-types-config', city],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_vehicle_types_with_pricing', {
        p_city: city
      });

      if (error) throw error;
      
      // Parse le JSON retourné par la RPC
      if (!data) return [];
      const parsed = typeof data === 'string' ? JSON.parse(data) : data;
      return Array.isArray(parsed) ? parsed : [];
    },
    staleTime: 30 * 1000, // 30 secondes
  });

  // Mutation pour mettre à jour la configuration
  const updateConfig = useMutation({
    mutationFn: async ({
      serviceType,
      displayName,
      description,
      isActive
    }: {
      serviceType: string;
      displayName: string;
      description: string;
      isActive: boolean;
    }) => {
      const { error } = await supabase.rpc('update_vehicle_type_config', {
        p_service_type: serviceType,
        p_display_name: displayName,
        p_description: description,
        p_is_active: isActive
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicle-types-config'] });
      queryClient.invalidateQueries({ queryKey: ['vehicle-types'] });
      toast({
        title: 'Configuration mise à jour',
        description: 'Les modifications ont été enregistrées avec succès',
      });
    },
    onError: (error) => {
      console.error('Error updating vehicle type config:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de mettre à jour la configuration',
      });
    },
  });

  // Mutation pour mettre à jour les tarifs
  const updatePricing = useMutation({
    mutationFn: async ({
      pricingId,
      basePrice,
      pricePerKm,
      minimumFare
    }: {
      pricingId: string;
      basePrice: number;
      pricePerKm: number;
      minimumFare: number;
    }) => {
      const { error } = await supabase.rpc('update_vehicle_pricing', {
        p_pricing_id: pricingId,
        p_base_price: basePrice,
        p_price_per_km: pricePerKm,
        p_minimum_fare: minimumFare
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicle-types-config'] });
      queryClient.invalidateQueries({ queryKey: ['vehicle-types'] });
      toast({
        title: 'Tarifs mis à jour',
        description: 'Les nouveaux tarifs ont été enregistrés',
      });
    },
    onError: (error) => {
      console.error('Error updating vehicle pricing:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de mettre à jour les tarifs',
      });
    },
  });

  return {
    vehicleTypes,
    isLoading,
    error,
    refetch,
    updateConfig,
    updatePricing
  };
};
