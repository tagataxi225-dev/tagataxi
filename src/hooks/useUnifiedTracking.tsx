import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useModernTracking } from './useModernTracking';

interface UnifiedTrackingData {
  id: string;
  type: 'delivery' | 'taxi';
  status: string;
  driver?: {
    id: string;
    name: string;
    phone?: string;
    avatar?: string;
    rating?: number;
    vehicle?: string;
  };
  route: {
    pickup: {
      lat: number;
      lng: number;
      address: string;
    };
    destination: {
      lat: number;
      lng: number;
      address: string;
    };
  };
  pricing: {
    amount: number;
    currency: string;
  };
  timing: {
    createdAt: string;
    estimatedArrival?: string;
    completedAt?: string;
  };
  progress: number;
  driverLocation?: {
    lat: number;
    lng: number;
    heading?: number;
    speed?: number;
    lastUpdate: string;
  };
}

interface UseUnifiedTrackingOptions {
  trackingId: string;
  trackingType: 'delivery' | 'taxi';
  autoRefresh?: boolean;
  enableNotifications?: boolean;
}

export const useUnifiedTracking = ({
  trackingId,
  trackingType,
  autoRefresh = true,
  enableNotifications = true
}: UseUnifiedTrackingOptions) => {
  const [trackingData, setTrackingData] = useState<UnifiedTrackingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('disconnected');

  // Utilise le tracking moderne pour la géolocalisation
  const modernTracking = useModernTracking();

  // Charger les données de suivi
  const loadTrackingData = useCallback(async () => {
    if (!trackingId) return;

    setLoading(true);
    setError(null);

    try {
      if (trackingType === 'delivery') {
        await loadDeliveryData();
      } else if (trackingType === 'taxi') {
        await loadTaxiData();
      }
      setConnectionStatus('connected');
    } catch (err: any) {
      console.error('Erreur lors du chargement:', err);
      setError(err.message || 'Erreur de chargement');
      setConnectionStatus('disconnected');
    } finally {
      setLoading(false);
    }
  }, [trackingId, trackingType]);

  // Charger données de livraison
  const loadDeliveryData = async () => {
    const { data: order, error: orderError } = await supabase
      .from('delivery_orders')
      .select('*')
      .eq('id', trackingId)
      .single();

    if (orderError) throw orderError;

    // Charger localisation chauffeur et profil chauffeur
    let driverLocation = null;
    let driverProfile = null;
    
    if (order.driver_id) {
      // Charger localisation
      const { data: location } = await supabase
        .from('driver_locations')
        .select('*')
        .eq('driver_id', order.driver_id)
        .single();
      
      if (location) {
        driverLocation = {
          lat: location.latitude,
          lng: location.longitude,
          heading: location.heading || undefined,
          speed: location.speed || undefined,
          lastUpdate: location.updated_at
        };
      }

      // Charger profil chauffeur
      const { data: driver } = await supabase
        .from('chauffeurs')
        .select('id, display_name, phone_number, avatar_url, rating, vehicle_type')
        .eq('user_id', order.driver_id)
        .single();
      
      if (driver) {
        driverProfile = driver;
      }
    }

    // Formater les données
    const pickup = order.pickup_coordinates as any;
    const destination = order.delivery_coordinates as any;
    
    setTrackingData({
      id: order.id,
      type: 'delivery',
      status: order.status,
      driver: driverProfile ? {
        id: driverProfile.id,
        name: driverProfile.display_name,
        phone: driverProfile.phone_number,
        avatar: driverProfile.avatar_url,
        rating: driverProfile.rating,
        vehicle: driverProfile.vehicle_type
      } : undefined,
      route: {
        pickup: {
          lat: pickup.lat,
          lng: pickup.lng,
          address: order.pickup_location
        },
        destination: {
          lat: destination.lat,
          lng: destination.lng,
          address: order.delivery_location
        }
      },
      pricing: {
        amount: order.actual_price || order.estimated_price,
        currency: 'XOF'
      },
      timing: {
        createdAt: order.created_at,
        estimatedArrival: order.delivery_time,
        completedAt: order.delivered_at
      },
      progress: getProgressPercentage(order.status),
      driverLocation
    });
  };

  // Charger données de taxi
  const loadTaxiData = async () => {
    const { data: booking, error: bookingError } = await supabase
      .from('transport_bookings')
      .select('*')
      .eq('id', trackingId)
      .single();

    if (bookingError) throw bookingError;

    // Charger profil chauffeur si assigné
    let driverProfile = null;
    if (booking.driver_id) {
      const { data: driver } = await supabase
        .from('chauffeurs')
        .select('id, display_name, phone_number, avatar_url, rating, vehicle_type')
        .eq('user_id', booking.driver_id)
        .single();
      
      if (driver) {
        driverProfile = driver;
      }
    }

    // Format des données
    const pickup = booking.pickup_coordinates as any;
    const destination = booking.destination_coordinates as any;

    setTrackingData({
      id: booking.id,
      type: 'taxi',
      status: booking.status,
      driver: driverProfile ? {
        id: driverProfile.id,
        name: driverProfile.display_name,
        phone: driverProfile.phone_number,
        avatar: driverProfile.avatar_url,
        rating: driverProfile.rating,
        vehicle: driverProfile.vehicle_type
      } : undefined,
      route: {
        pickup: {
          lat: pickup.lat,
          lng: pickup.lng,
          address: booking.pickup_location
        },
        destination: {
          lat: destination.lat,
          lng: destination.lng,
          address: booking.destination
        }
      },
      pricing: {
        amount: booking.actual_price || booking.estimated_price,
        currency: 'XOF'
      },
      timing: {
        createdAt: booking.created_at,
        estimatedArrival: booking.completion_time,
        completedAt: booking.completion_time
      },
      progress: getProgressPercentage(booking.status),
      driverLocation: null
    });
  };

  // Calculer le pourcentage de progression
  const getProgressPercentage = (status: string): number => {
    const progressMap: Record<string, number> = {
      pending: 10,
      confirmed: 25,
      driver_assigned: 40,
      picked_up: 60,
      in_transit: 80,
      delivered: 100,
      completed: 100,
      cancelled: 0
    };
    return progressMap[status] || 0;
  };

  // Labels de statut localisés
  const statusLabel = useMemo(() => {
    if (!trackingData) return '';
    
    const statusLabels: Record<string, string> = {
      pending: 'En attente',
      confirmed: 'Confirmé',
      driver_assigned: 'Chauffeur assigné',
      picked_up: trackingType === 'delivery' ? 'Colis récupéré' : 'Client récupéré',
      in_transit: trackingType === 'delivery' ? 'En livraison' : 'En course',
      delivered: 'Livré',
      completed: 'Terminé',
      cancelled: 'Annulé'
    };
    
    return statusLabels[trackingData.status] || trackingData.status;
  }, [trackingData, trackingType]);

  // Temps de livraison estimé
  const estimatedArrival = useMemo(() => {
    if (!trackingData?.timing.estimatedArrival) return null;
    
    const eta = new Date(trackingData.timing.estimatedArrival);
    return eta.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }, [trackingData]);

  // Configuration des abonnements temps réel
  useEffect(() => {
    if (!trackingId || !autoRefresh) return;

    setConnectionStatus('reconnecting');

    const table = trackingType === 'delivery' ? 'delivery_orders' : 'transport_bookings';
    
    // Abonnement aux mises à jour de commande
    const orderChannel = supabase
      .channel(`${trackingType}-${trackingId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table,
        filter: `id=eq.${trackingId}`
      }, (payload) => {
        console.log('📦 Mise à jour de commande:', payload);
        loadTrackingData();
        
        if (enableNotifications && payload.old?.status !== payload.new?.status) {
          toast.success('Statut mis à jour', {
            description: `Votre ${trackingType === 'delivery' ? 'livraison' : 'course'} a été mise à jour`
          });
        }
      })
      .subscribe((status) => {
        console.log('🔗 Status abonnement:', status);
        setConnectionStatus(status === 'SUBSCRIBED' ? 'connected' : 'disconnected');
      });

    // Abonnement à la localisation du chauffeur
    let locationChannel: any = null;
    if (trackingData?.driver?.id) {
      locationChannel = supabase
        .channel(`driver-location-${trackingData.driver.id}`)
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'driver_locations',
          filter: `driver_id=eq.${trackingData.driver.id}`
        }, (payload) => {
          console.log('📍 Nouvelle position chauffeur:', payload);
          setTrackingData(prev => prev ? {
            ...prev,
            driverLocation: {
              lat: payload.new.latitude,
              lng: payload.new.longitude,
              heading: payload.new.heading || undefined,
              speed: payload.new.speed || undefined,
              lastUpdate: payload.new.updated_at
            }
          } : null);
        })
        .subscribe();
    }

    return () => {
      supabase.removeChannel(orderChannel);
      if (locationChannel) supabase.removeChannel(locationChannel);
    };
  }, [trackingId, trackingType, autoRefresh, enableNotifications, trackingData?.driver?.id]);

  // Charger les données au montage
  useEffect(() => {
    loadTrackingData();
  }, [loadTrackingData]);

  // Actions
  const refreshTracking = () => {
    loadTrackingData();
  };

  const contactDriver = () => {
    if (trackingData?.driver?.phone) {
      window.open(`tel:${trackingData.driver.phone}`, '_self');
    } else {
      toast.error('Numéro de téléphone non disponible');
    }
  };

  const contactSupport = () => {
    toast.info('Support TAGA', {
      description: '24h/7j au +243 XXX XXX XXX'
    });
  };

  return {
    // Données
    trackingData,
    loading,
    error,
    connectionStatus,
    
    // Valeurs calculées
    statusLabel,
    estimatedArrival,
    isCompleted: trackingData?.progress === 100,
    hasDriver: Boolean(trackingData?.driver),
    
    // Actions
    refreshTracking,
    contactDriver,
    contactSupport,
    
    // Tracking moderne (géolocalisation)
    modernTracking
  };
};