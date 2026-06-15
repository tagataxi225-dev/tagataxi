import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getVehicleClass } from '@/utils/pricingMapper';

export interface VehicleTypeData {
  id: string;
  service_type: string;
  display_name: string;
  description: string;
  is_active: boolean;
  sort_order: number;
  base_price?: number;
  price_per_km?: number;
  minimum_fare?: number;
  icon?: string;
  gradient?: string;
}

export const useVehicleTypeManagement = () => {
  const queryClient = useQueryClient();

  // Fetch tous les types de véhicules taxi
  const { data: vehicleTypes, isLoading } = useQuery({
    queryKey: ['admin', 'vehicle-types'],
    queryFn: async () => {
      const { data: configs, error: configError } = await supabase
        .from('service_configurations')
        .select('*')
        .eq('service_category', 'taxi')
        .order('sort_order', { ascending: true });

      if (configError) throw configError;

      // Récupérer les prix pour chaque véhicule depuis pricing_rules
      const typesWithPricing = await Promise.all(
        (configs || []).map(async (config) => {
          const vehicleClass = getVehicleClass(config.service_type);
          
          const { data: pricing } = await supabase
            .from('pricing_rules')
            .select('base_price, price_per_km, minimum_fare')
            .eq('service_type', 'transport')
            .eq('vehicle_class', vehicleClass)
            .eq('city', 'Kinshasa')
            .single();

          return {
            id: config.id,
            service_type: config.service_type,
            display_name: config.display_name,
            description: config.description || '',
            is_active: config.is_active,
            sort_order: config.sort_order || 0,
            base_price: pricing?.base_price || 0,
            price_per_km: pricing?.price_per_km || 0,
            minimum_fare: pricing?.minimum_fare || 0,
          };
        })
      );

      return typesWithPricing as VehicleTypeData[];
    },
  });

  // Mutation pour mettre à jour un type de véhicule
  const updateVehicleType = useMutation({
    mutationFn: async (updates: Partial<VehicleTypeData> & { id: string }) => {
      const { id, base_price, price_per_km, minimum_fare, ...configUpdates } = updates;

      // Mettre à jour la configuration
      const { error: configError } = await supabase
        .from('service_configurations')
        .update(configUpdates)
        .eq('id', id);

      if (configError) throw configError;

      // Mettre à jour les prix si fournis dans pricing_rules
      if (base_price !== undefined || price_per_km !== undefined || minimum_fare !== undefined) {
        const vehicleType = vehicleTypes?.find((v) => v.id === id);
        if (vehicleType) {
          const vehicleClass = getVehicleClass(vehicleType.service_type);
          
          const { error: pricingError } = await supabase
            .from('pricing_rules')
            .update({
              ...(base_price !== undefined && { base_price }),
              ...(price_per_km !== undefined && { price_per_km }),
              ...(minimum_fare !== undefined && { minimum_fare }),
              updated_at: new Date().toISOString(),
            })
            .eq('service_type', 'transport')
            .eq('vehicle_class', vehicleClass)
            .eq('city', 'Kinshasa');

          if (pricingError) throw pricingError;

          // Log de l'audit
          await supabase.from('activity_logs').insert({
            user_id: (await supabase.auth.getUser()).data.user?.id,
            activity_type: 'vehicle_pricing_update',
            description: `Modification des tarifs ${vehicleType.display_name}`,
            metadata: {
              vehicle_type: vehicleType.service_type,
              vehicle_class: vehicleClass,
              old_base: vehicleType.base_price,
              new_base: base_price,
              old_per_km: vehicleType.price_per_km,
              new_per_km: price_per_km,
              old_minimum: vehicleType.minimum_fare,
              new_minimum: minimum_fare,
            }
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'vehicle-types'] });
      queryClient.invalidateQueries({ queryKey: ['vehicle-types'] }); // Invalider le cache client
      toast.success('Type de véhicule mis à jour avec succès');
    },
    onError: (error) => {
      console.error('Erreur mise à jour véhicule:', error);
      toast.error('Erreur lors de la mise à jour du véhicule');
    },
  });

  // Mutation pour activer/désactiver un type
  const toggleVehicleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('service_configurations')
        .update({ is_active })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'vehicle-types'] });
      toast.success('Statut mis à jour');
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour du statut');
    },
  });

  // Mutation pour réorganiser les véhicules
  const reorderVehicleTypes = useMutation({
    mutationFn: async (reorderedTypes: { id: string; sort_order: number }[]) => {
      const updates = reorderedTypes.map(({ id, sort_order }) =>
        supabase
          .from('service_configurations')
          .update({ sort_order })
          .eq('id', id)
      );

      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'vehicle-types'] });
      toast.success('Ordre mis à jour');
    },
    onError: () => {
      toast.error('Erreur lors de la réorganisation');
    },
  });

  return {
    vehicleTypes,
    isLoading,
    updateVehicleType,
    toggleVehicleActive,
    reorderVehicleTypes,
  };
};
