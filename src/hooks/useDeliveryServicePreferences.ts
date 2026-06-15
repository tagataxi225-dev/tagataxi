/**
 * 📦 Hook gestion préférences services livraison
 * - Flash (moto express, petit colis)
 * - Flex (camionnette, colis moyen volume)
 * - Maxicharge (camion, gros volume)
 * - Validation compatibilité vehicle_class
 */

import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export type DeliveryServiceType = 'flash' | 'flex' | 'maxicharge';

export interface ServicePreference {
  active: boolean;
  vehicle_class_required: string[];
  description: string;
  icon: string;
  color: string;
}

export const SERVICE_DEFINITIONS: Record<DeliveryServiceType, ServicePreference> = {
  flash: {
    active: false,
    vehicle_class_required: ['moto', 'scooter'],
    description: 'Livraison express moto (5-15min)',
    icon: '⚡',
    color: 'red'
  },
  flex: {
    active: false,
    vehicle_class_required: ['van', 'camionnette'],
    description: 'Livraison camionnette (30-60min)',
    icon: '📦',
    color: 'green'
  },
  maxicharge: {
    active: false,
    vehicle_class_required: ['truck', 'van'],
    description: 'Gros colis et déménagement',
    icon: '🚚',
    color: 'purple'
  }
};

export const useDeliveryServicePreferences = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Charger les préférences actuelles
  const { data, isLoading } = useQuery({
    queryKey: ['delivery-service-preferences', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data: chauffeur, error } = await supabase
        .from('chauffeurs')
        .select('service_specialization, vehicle_class, service_type')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      // Parser le service_specialization avec casting correct
      const rawPrefs = chauffeur?.service_specialization;
      const preferences: Record<string, any> = typeof rawPrefs === 'object' && rawPrefs !== null && !Array.isArray(rawPrefs)
        ? (rawPrefs as Record<string, any>)
        : {};
      
      return {
        vehicle_class: chauffeur?.vehicle_class || 'standard',
        service_type: chauffeur?.service_type,
        preferences: {
          flash: { 
            active: preferences.flash?.active || false,
            ...SERVICE_DEFINITIONS.flash 
          },
          flex: { 
            active: preferences.flex?.active || false,
            ...SERVICE_DEFINITIONS.flex 
          },
          maxicharge: { 
            active: preferences.maxicharge?.active || false,
            ...SERVICE_DEFINITIONS.maxicharge 
          }
        }
      };
    },
    enabled: !!user
  });

  // Vérifier si un service est compatible avec le véhicule
  const isServiceCompatible = (serviceType: DeliveryServiceType): boolean => {
    if (!data?.vehicle_class) return false;
    const service = SERVICE_DEFINITIONS[serviceType];
    return service.vehicle_class_required.includes(data.vehicle_class);
  };

  // Toggle un service
  const toggleService = useMutation({
    mutationFn: async (serviceType: DeliveryServiceType) => {
      if (!user) throw new Error('Non authentifié');

      // Vérifier compatibilité
      if (!isServiceCompatible(serviceType)) {
        const required = SERVICE_DEFINITIONS[serviceType].vehicle_class_required.join(', ');
        throw new Error(
          `Votre véhicule (${data?.vehicle_class}) n'est pas compatible. Types requis: ${required}`
        );
      }

      const currentPrefs = data?.preferences || {};
      const currentActive = currentPrefs[serviceType]?.active || false;

      const updatedPrefs: Record<string, any> = {
        ...(typeof currentPrefs === 'object' ? currentPrefs : {}),
        [serviceType]: {
          active: !currentActive,
          vehicle_class: data?.vehicle_class
        }
      };

      const { error } = await supabase
        .from('chauffeurs')
        .update({ service_specialization: updatedPrefs as any })
        .eq('user_id', user.id);

      if (error) throw error;

      return { serviceType, active: !currentActive };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['delivery-service-preferences'] });
      toast.success(
        result.active 
          ? `Service ${result.serviceType} activé !` 
          : `Service ${result.serviceType} désactivé`
      );
    },
    onError: (error: Error) => {
      console.error('Error toggling service:', error);
      toast.error(error.message || 'Erreur lors de la mise à jour');
    }
  });

  // Stats par service
  const { data: serviceStats } = useQuery({
    queryKey: ['delivery-service-stats', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data: orders, error } = await supabase
        .from('delivery_orders')
        .select('delivery_type, status, total_amount')
        .eq('driver_id', user.id)
        .eq('status', 'delivered');

      if (error) throw error;

      // Agréger par type de service
      const stats = orders?.reduce((acc: any, order: any) => {
        const type = order.delivery_type || 'flex';
        if (!acc[type]) {
          acc[type] = { count: 0, earnings: 0 };
        }
        acc[type].count += 1;
        acc[type].earnings += order.total_amount || 0;
        return acc;
      }, {});

      return stats;
    },
    enabled: !!user
  });

  const activeServices = data?.preferences 
    ? Object.entries(data.preferences)
        .filter(([_, pref]) => pref.active)
        .map(([type, _]) => type as DeliveryServiceType)
    : [];

  return {
    preferences: data?.preferences,
    vehicleClass: data?.vehicle_class,
    serviceType: data?.service_type,
    loading: isLoading,
    activeServices,
    serviceStats,
    isServiceCompatible,
    toggleService
  };
};
