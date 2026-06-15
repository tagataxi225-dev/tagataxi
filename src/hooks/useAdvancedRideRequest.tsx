import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface RideRequestData {
  pickupLocation: string;
  pickupCoordinates: [number, number];
  destination: string;
  destinationCoordinates: [number, number];
  vehicleClass?: string;
  intermediateStops?: Array<{
    location: string;
    coordinates: [number, number];
  }>;
}

interface DriverMatch {
  driver_id: string;
  distance: number;
  latitude: number;
  longitude: number;
  driver_profiles: {
    user_id: string;
    vehicle_make: string;
    vehicle_model: string;
    vehicle_class: string;
    rating_average: number;
  };
}

export const useAdvancedRideRequest = () => {
  const [loading, setLoading] = useState(false);
  const [searchingDrivers, setSearchingDrivers] = useState(false);
  const [currentRequest, setCurrentRequest] = useState<any>(null);
  const [availableDrivers, setAvailableDrivers] = useState<DriverMatch[]>([]);
  const [estimatedPrice, setEstimatedPrice] = useState<number>(0);
  const { user } = useAuth();

  // Écouter les mises à jour en temps réel
  useEffect(() => {
    if (!user || !currentRequest) return;

    const channel = supabase
      .channel('ride_updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'ride_requests',
          filter: `id=eq.${currentRequest.id}`
        },
        (payload) => {
          console.log('Mise à jour course:', payload.new);
          setCurrentRequest(payload.new);
          
          if (payload.new.status === 'accepted') {
            setSearchingDrivers(false);
            toast.success('Chauffeur accepté ! Il arrive vers vous.');
          } else if (payload.new.status === 'driver_arrived') {
            toast.success('Votre chauffeur est arrivé !');
          } else if (payload.new.status === 'no_drivers_available') {
            setSearchingDrivers(false);
            toast.error('Aucun chauffeur disponible pour le moment');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, currentRequest]);

  const createRideRequest = async (data: RideRequestData) => {
    if (!user) {
      toast.error('Vous devez être connecté');
      return null;
    }

    setLoading(true);
    try {
      console.log('Création demande de course:', data);

      const { data: response, error } = await supabase.functions.invoke('ride-dispatcher', {
        body: {
          action: 'create_request',
          userId: user.id,
          pickupLocation: data.pickupLocation,
          pickupCoordinates: { lat: data.pickupCoordinates[0], lng: data.pickupCoordinates[1] },
          destination: data.destination,
          destinationCoordinates: { lat: data.destinationCoordinates[0], lng: data.destinationCoordinates[1] },
          vehicleClass: data.vehicleClass || 'standard'
        }
      });

      if (error) throw error;

      if (response.success) {
        setCurrentRequest(response.rideRequest);
        setEstimatedPrice(response.estimatedPrice);
        setSearchingDrivers(true);
        
        toast.success('Demande de course créée, recherche de chauffeurs...');
        
        // Démarrer la recherche de chauffeurs
        findDrivers(response.rideRequest.id, data.pickupCoordinates);
        
        return response.rideRequest;
      }

      throw new Error(response.message || 'Erreur lors de la création');
    } catch (error: any) {
      console.error('Erreur création course:', error);
      toast.error(error.message || 'Erreur lors de la création de la demande');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const findDrivers = async (rideRequestId: string, coordinates: [number, number]) => {
    try {
      const { data: response, error } = await supabase.functions.invoke('ride-dispatcher', {
        body: {
          action: 'find_drivers',
          rideRequestId,
          coordinates: { lat: coordinates[0], lng: coordinates[1] }
        }
      });

      if (error) throw error;

      if (response.success) {
        setAvailableDrivers(response.drivers || []);
        if (response.drivers?.length > 0) {
          toast.success(`${response.drivers.length} chauffeurs notifiés`);
        }
      } else {
        setSearchingDrivers(false);
        toast.error(response.message || 'Aucun chauffeur trouvé');
      }
    } catch (error: any) {
      console.error('Erreur recherche chauffeurs:', error);
      setSearchingDrivers(false);
      toast.error('Erreur lors de la recherche de chauffeurs');
    }
  };

  const cancelRideRequest = async (reason?: string) => {
    if (!currentRequest) return false;

    try {
      const { data: response, error } = await supabase.functions.invoke('ride-dispatcher', {
        body: {
          action: 'update_status',
          rideRequestId: currentRequest.id,
          status: 'cancelled',
          notes: reason
        }
      });

      if (error) throw error;

      if (response.success) {
        setCurrentRequest(null);
        setSearchingDrivers(false);
        setAvailableDrivers([]);
        toast.success('Course annulée');
        return true;
      }

      return false;
    } catch (error: any) {
      console.error('Erreur annulation course:', error);
      toast.error('Erreur lors de l\'annulation');
      return false;
    }
  };

  const acceptDriver = async (driverId: string) => {
    if (!currentRequest) return false;

    try {
      const { data: response, error } = await supabase.functions.invoke('ride-dispatcher', {
        body: {
          action: 'assign_driver',
          rideRequestId: currentRequest.id,
          driverId
        }
      });

      if (error) throw error;

      if (response.success) {
        setSearchingDrivers(false);
        toast.success('Chauffeur accepté !');
        return true;
      } else {
        toast.error(response.message || 'Impossible d\'accepter ce chauffeur');
        return false;
      }
    } catch (error: any) {
      console.error('Erreur acceptation chauffeur:', error);
      toast.error('Erreur lors de l\'acceptation du chauffeur');
      return false;
    }
  };

  const updateRideStatus = async (status: string, data?: any) => {
    if (!currentRequest) return false;

    try {
      const { data: response, error } = await supabase.functions.invoke('ride-dispatcher', {
        body: {
          action: 'update_status',
          rideRequestId: currentRequest.id,
          status,
          ...data
        }
      });

      if (error) throw error;

      return response.success;
    } catch (error: any) {
      console.error('Erreur mise à jour statut:', error);
      return false;
    }
  };

  const getRideHistory = async () => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('ride_requests')
        .select(`
          *,
          driver_profiles:assigned_driver_id(
            vehicle_make,
            vehicle_model,
            rating_average
          )
        `)
        .eq('user_id', user.id)
        .in('status', ['completed', 'cancelled'])
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Erreur historique courses:', error);
      return [];
    }
  };

  const calculateEstimatedPrice = async (
    pickup: [number, number],
    destination: [number, number],
    vehicleClass: string = 'standard'
  ) => {
    try {
      // Calculer distance
      const distance = calculateDistance(pickup[1], pickup[0], destination[1], destination[0]);
      
      // Récupérer règles de prix
      const { data: pricingRules } = await supabase
        .from('pricing_rules')
        .select('*')
        .eq('vehicle_class', vehicleClass)
        .eq('service_type', 'transport')
        .eq('is_active', true);

      const pricingRule = pricingRules?.[0];

      let price = pricingRule?.base_price || 500;
      if (distance > 0) {
        price += distance * (pricingRule?.price_per_km || 150);
      }

      // Récupérer surge pricing
      const { data: zones } = await supabase
        .from('service_zones')
        .select('id')
        .eq('is_active', true)
        .limit(1);

      if (zones?.[0]) {
        const { data: surgeMultiplier } = await supabase
          .rpc('calculate_surge_pricing', {
            zone_id_param: zones[0].id,
            vehicle_class_param: vehicleClass
          });

        price *= (surgeMultiplier || 1);
      }

      return price;
    } catch (error) {
      console.error('Erreur calcul prix:', error);
      return 500; // Prix par défaut
    }
  };

  return {
    loading,
    searchingDrivers,
    currentRequest,
    availableDrivers,
    estimatedPrice,
    createRideRequest,
    cancelRideRequest,
    acceptDriver,
    updateRideStatus,
    getRideHistory,
    calculateEstimatedPrice
  };
};

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Rayon de la Terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}