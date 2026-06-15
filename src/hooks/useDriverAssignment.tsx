import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AssignmentRequest {
  pickup_location: string;
  pickup_coordinates: { lat: number; lng: number };
  destination: string;
  destination_coordinates: { lat: number; lng: number };
  service_type: 'flash' | 'flex' | 'maxicharge';
  vehicle_class: string;
  priority?: 'normal' | 'high' | 'urgent';
}

interface DriverProfile {
  user_id: string;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_plate: string;
  vehicle_color: string;
  rating_average: number;
  rating_count: number;
  display_name: string;
  phone_number: string;
}

interface AvailableDriver {
  driver_id: string;
  distance: number;
  estimated_arrival: number;
  vehicle_type: 'moto' | 'car' | 'truck';
  has_sufficient_balance?: boolean;
  driver_profile: DriverProfile;
}

export const useDriverAssignment = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const findAvailableDrivers = async (request: AssignmentRequest): Promise<AvailableDriver[]> => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔍 Recherche de livreurs disponibles:', request);

      // Appeler l'edge function marketplace-driver-assignment
      const { data, error } = await supabase.functions.invoke('marketplace-driver-assignment', {
        body: {
          action: 'find_marketplace_drivers',
          pickup_location: request.pickup_location,
          pickup_coordinates: request.pickup_coordinates,
          destination_location: request.destination,
          destination_coordinates: request.destination_coordinates,
          service_type: request.service_type,
          vehicle_class: request.vehicle_class,
          priority: request.priority || 'normal'
        }
      });

      if (error) {
        console.error('❌ Erreur edge function:', error);
        throw new Error(error.message || 'Erreur lors de la recherche de livreurs');
      }

      if (!data?.success || !data?.drivers) {
        console.warn('⚠️ Aucun livreur trouvé');
        return [];
      }

      console.log(`✅ ${data.drivers.length} livreur(s) trouvé(s):`, data.drivers);

      // Trier les livreurs par score (distance + rating)
      const sortedDrivers = data.drivers.sort((a: AvailableDriver, b: AvailableDriver) => {
        const scoreA = a.distance * 0.7 + (5 - a.driver_profile.rating_average) * 0.3;
        const scoreB = b.distance * 0.7 + (5 - b.driver_profile.rating_average) * 0.3;
        return scoreA - scoreB;
      });

      return sortedDrivers;
    } catch (error: any) {
      console.error('❌ Erreur recherche livreurs:', error);
      setError(error.message);
      
      toast({
        title: "Erreur de recherche",
        description: "Impossible de trouver des livreurs disponibles",
        variant: "destructive"
      });

      return [];
    } finally {
      setLoading(false);
    }
  };

  const assignDriverToDelivery = async (
    orderId: string, 
    driverId: string, 
    assignmentDetails: {
      pickup_location: string;
      delivery_location: string;
      assignment_fee?: number;
    }
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      console.log('🚚 Assignation du livreur:', { orderId, driverId, assignmentDetails });

      // Appeler l'edge function pour assigner le livreur
      const { data, error } = await supabase.functions.invoke('marketplace-driver-assignment', {
        body: {
          action: 'assign_marketplace_driver',
          order_id: orderId,
          driver_id: driverId,
          pickup_location: assignmentDetails.pickup_location,
          delivery_location: assignmentDetails.delivery_location,
          assignment_fee: assignmentDetails.assignment_fee || 500
        }
      });

      if (error) {
        console.error('❌ Erreur assignation:', error);
        throw new Error(error.message || 'Erreur lors de l\'assignation du livreur');
      }

      if (!data?.success) {
        throw new Error('Échec de l\'assignation du livreur');
      }

      console.log('✅ Livreur assigné avec succès:', data.assignment_id);

      toast({
        title: "Livreur assigné",
        description: "Un livreur a été assigné à votre commande",
      });

      return true;
    } catch (error: any) {
      console.error('❌ Erreur assignation livreur:', error);
      setError(error.message);
      
      toast({
        title: "Erreur d'assignation",
        description: "Impossible d'assigner un livreur",
        variant: "destructive"
      });

      return false;
    } finally {
      setLoading(false);
    }
  };

  const searchWithExpandedRadius = async (request: AssignmentRequest): Promise<AvailableDriver[]> => {
    console.log('🔄 Recherche avec rayon élargi...');
    
    // Recherche avec paramètres élargis et priorité haute
    const expandedRequest = {
      ...request,
      priority: 'high' as const
    };

    return findAvailableDrivers(expandedRequest);
  };

  const cancelDriverSearch = () => {
    setLoading(false);
    setError(null);
    console.log('🚫 Recherche de livreur annulée');
  };

  const getAssignmentStatus = async (orderId: string) => {
    try {
      const { data: order, error } = await supabase
        .from('delivery_orders')
        .select(`
          *,
          marketplace_delivery_assignments(*)
        `)
        .eq('id', orderId)
        .single();

      if (error) {
        throw error;
      }

      return {
        status: order.status,
        driverId: order.driver_id,
        assignmentDetails: order.marketplace_delivery_assignments?.[0] || null
      };
    } catch (error: any) {
      console.error('❌ Erreur statut assignation:', error);
      return null;
    }
  };

  return {
    loading,
    error,
    findAvailableDrivers,
    assignDriverToDelivery,
    assignDriver: assignDriverToDelivery, // Alias for compatibility
    assignedDriver: null, // Placeholder - implement if needed
    validationTimer: null, // Placeholder - implement if needed
    searchWithExpandedRadius,
    cancelDriverSearch,
    getAssignmentStatus
  };
};