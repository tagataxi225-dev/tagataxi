import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useModernTracking } from './useModernTracking';

export interface TrackingDriver {
  id: string;
  name: string;
  phone?: string;
  avatar?: string;
  rating?: number;
  vehicle?: {
    type: string;
    plate?: string;
    model?: string;
  };
}

export interface TrackingLocation {
  lat: number;
  lng: number;
  address: string;
  name?: string;
}

export interface TrackingData {
  id: string;
  type: 'delivery' | 'taxi' | 'marketplace';
  status: string;
  driver?: TrackingDriver;
  route: {
    pickup: TrackingLocation;
    destination: TrackingLocation;
  };
  pricing: {
    amount: number;
    currency: string;
    estimated?: number;
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
  metadata?: {
    packageType?: string;
    instructions?: string;
    deliveryProof?: any;
  };
}

interface UseUnifiedTrackingOptions {
  trackingId: string;
  trackingType: 'delivery' | 'taxi' | 'marketplace';
  autoRefresh?: boolean;
  enableNotifications?: boolean;
  realTimeLocation?: boolean;
}

export const useUnifiedTrackingSystem = ({
  trackingId,
  trackingType,
  autoRefresh = true,
  enableNotifications = true,
  realTimeLocation = true
}: UseUnifiedTrackingOptions) => {
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('disconnected');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Utilise le tracking moderne pour la géolocalisation
  const { isTracking, currentPosition, startTracking, stopTracking } = useModernTracking();

  // Charger les données selon le type
  const loadTrackingData = useCallback(async () => {
    if (!trackingId) return;

    setLoading(true);
    setError(null);

    try {
      let data: TrackingData | null = null;

      switch (trackingType) {
        case 'delivery':
          data = await loadDeliveryData();
          break;
        case 'taxi':
          data = await loadTaxiData();
          break;
        case 'marketplace':
          data = await loadMarketplaceData();
          break;
      }

      if (data) {
        setTrackingData(data);
        setLastUpdate(new Date());
        setConnectionStatus('connected');
      }
    } catch (err: any) {
      console.error('Erreur chargement tracking:', err);
      setError(err.message || 'Erreur de chargement');
      setConnectionStatus('disconnected');
    } finally {
      setLoading(false);
    }
  }, [trackingId, trackingType]);

  // Charger données de livraison
  const loadDeliveryData = async (): Promise<TrackingData | null> => {
    const { data: order, error: orderError } = await supabase
      .from('delivery_orders')
      .select('*')
      .eq('id', trackingId)
      .single();

    if (orderError) throw orderError;

    // Charger le chauffeur
    let driver: TrackingDriver | undefined;
    let driverLocation: TrackingData['driverLocation'];

    if (order.driver_id) {
      // Profil chauffeur
      const { data: driverProfile } = await supabase
        .from('chauffeurs')
        .select('user_id, display_name, phone_number, profile_photo_url, rating_average, vehicle_type, vehicle_model, vehicle_plate')
        .eq('user_id', order.driver_id)
        .single();

      if (driverProfile) {
        driver = {
          id: driverProfile.user_id,
          name: driverProfile.display_name || 'Chauffeur',
          phone: driverProfile.phone_number,
          avatar: driverProfile.profile_photo_url,
          rating: driverProfile.rating_average,
          vehicle: {
            type: driverProfile.vehicle_type || 'Véhicule',
            plate: driverProfile.vehicle_plate,
            model: driverProfile.vehicle_model
          }
        };

        // Position chauffeur
        if (realTimeLocation) {
          const { data: location } = await supabase
            .from('driver_locations')
            .select('*')
            .eq('driver_id', order.driver_id)
            .single();

          if (location) {
            driverLocation = {
              lat: Number(location.latitude),
              lng: Number(location.longitude),
              heading: location.heading || undefined,
              speed: location.speed || undefined,
              lastUpdate: location.updated_at
            };
          }
        }
      }
    }

    // Coordonnées
    const pickup = order.pickup_coordinates as any;
    const destination = order.delivery_coordinates as any;

    return {
      id: order.id,
      type: 'delivery',
      status: order.status,
      driver,
      route: {
        pickup: {
          lat: pickup?.lat || 0,
          lng: pickup?.lng || 0,
          address: order.pickup_location || ''
        },
        destination: {
          lat: destination?.lat || 0,
          lng: destination?.lng || 0,
          address: order.delivery_location || ''
        }
      },
      pricing: {
        amount: order.actual_price || order.estimated_price || 0,
        currency: 'XOF',
        estimated: order.estimated_price
      },
      timing: {
        createdAt: order.created_at,
        estimatedArrival: order.delivery_time,
        completedAt: order.delivered_at
      },
      progress: calculateProgress(order.status, 'delivery'),
      driverLocation,
      metadata: {
        packageType: getPackageType(order.delivery_type),
        instructions: order.driver_notes,
        deliveryProof: order.delivery_proof
      }
    };
  };

  // Charger données de taxi
  const loadTaxiData = async (): Promise<TrackingData | null> => {
    const { data: booking, error: bookingError } = await supabase
      .from('transport_bookings')
      .select('*')
      .eq('id', trackingId)
      .single();

    if (bookingError) throw bookingError;

    // Chauffeur si assigné
    let driver: TrackingDriver | undefined;
    if (booking.driver_id) {
      const { data: driverProfile } = await supabase
        .from('chauffeurs')
        .select('user_id, display_name, phone_number, profile_photo_url, rating_average, vehicle_type, vehicle_model, vehicle_plate')
        .eq('user_id', booking.driver_id)
        .single();

      if (driverProfile) {
        driver = {
          id: driverProfile.user_id,
          name: driverProfile.display_name || 'Chauffeur',
          phone: driverProfile.phone_number,
          avatar: driverProfile.profile_photo_url,
          rating: driverProfile.rating_average,
          vehicle: {
            type: driverProfile.vehicle_type || 'Taxi',
            plate: driverProfile.vehicle_plate,
            model: driverProfile.vehicle_model
          }
        };
      }
    }

    const pickup = booking.pickup_coordinates as any;
    const destination = booking.destination_coordinates as any;

    return {
      id: booking.id,
      type: 'taxi',
      status: booking.status,
      driver,
      route: {
        pickup: {
          lat: pickup?.lat || 0,
          lng: pickup?.lng || 0,
          address: booking.pickup_location || ''
        },
        destination: {
          lat: destination?.lat || 0,
          lng: destination?.lng || 0,
          address: booking.destination || ''
        }
      },
      pricing: {
        amount: booking.actual_price || booking.estimated_price || 0,
        currency: 'XOF',
        estimated: booking.estimated_price
      },
      timing: {
        createdAt: booking.created_at,
        estimatedArrival: booking.completion_time,
        completedAt: booking.completion_time
      },
      progress: calculateProgress(booking.status, 'taxi'),
      metadata: {
        instructions: booking.notes
      }
    };
  };

  // Charger données marketplace
  const loadMarketplaceData = async (): Promise<TrackingData | null> => {
    const { data: order, error: orderError } = await supabase
      .from('marketplace_orders')
      .select('*')
      .eq('id', trackingId)
      .single();

    if (orderError) throw orderError;

    // Si c'est une livraison, charger les données de livraison séparément
    if (order.delivery_method === 'delivery') {
      // Logique marketplace avec livraison - pour l'instant retourner les données basiques
    }

    // Sinon, données marketplace basiques
    return {
      id: order.id,
      type: 'marketplace',
      status: order.status,
      route: {
        pickup: {
          lat: 0,
          lng: 0,
          address: 'Vendeur'
        },
        destination: {
          lat: 0,
          lng: 0,
          address: order.delivery_address || 'Adresse de livraison'
        }
      },
      pricing: {
        amount: order.total_amount || 0,
        currency: 'XOF'
      },
      timing: {
        createdAt: order.created_at,
        completedAt: order.completed_at
      },
      progress: calculateProgress(order.status, 'marketplace')
    };
  };

  // Calculer progression
  const calculateProgress = (status: string, type: string): number => {
    const progressMaps = {
      delivery: {
        pending: 10,
        confirmed: 25,
        driver_assigned: 40,
        picked_up: 60,
        in_transit: 80,
        delivered: 100,
        cancelled: 0
      },
      taxi: {
        pending: 10,
        confirmed: 25,
        driver_assigned: 40,
        pickup: 60,
        in_progress: 80,
        completed: 100,
        cancelled: 0
      },
      marketplace: {
        pending: 15,
        confirmed: 30,
        preparing: 50,
        ready: 70,
        shipped: 85,
        delivered: 100,
        cancelled: 0
      }
    };

    return progressMaps[type as keyof typeof progressMaps]?.[status] || 0;
  };

  // Type de colis
  const getPackageType = (deliveryType: string): string => {
    const types: Record<string, string> = {
      flash: 'Express',
      flex: 'Camionnette',
      maxicharge: 'Gros colis'
    };
    return types[deliveryType] || 'Colis';
  };

  // Labels de statut
  const statusLabel = useMemo(() => {
    if (!trackingData) return '';
    
    const labels: Record<string, Record<string, string>> = {
      delivery: {
        pending: 'En attente',
        confirmed: 'Confirmé',
        driver_assigned: 'Chauffeur assigné',
        picked_up: 'Colis récupéré',
        in_transit: 'En livraison',
        delivered: 'Livré',
        cancelled: 'Annulé'
      },
      taxi: {
        pending: 'En attente',
        confirmed: 'Confirmé',
        driver_assigned: 'Chauffeur assigné',
        pickup: 'En route vers vous',
        in_progress: 'En course',
        completed: 'Terminé',
        cancelled: 'Annulé'
      },
      marketplace: {
        pending: 'En attente',
        confirmed: 'Confirmé',
        preparing: 'En préparation',
        ready: 'Prêt',
        shipped: 'Expédié',
        delivered: 'Livré',
        cancelled: 'Annulé'
      }
    };
    
    return labels[trackingData.type]?.[trackingData.status] || trackingData.status;
  }, [trackingData]);

  // ETA formaté
  const estimatedArrival = useMemo(() => {
    if (!trackingData?.timing.estimatedArrival) return null;
    
    const eta = new Date(trackingData.timing.estimatedArrival);
    const now = new Date();
    const diffMs = eta.getTime() - now.getTime();
    const diffMin = Math.floor(diffMs / (1000 * 60));
    
    if (diffMin <= 0) return 'Imminent';
    if (diffMin < 60) return `${diffMin} min`;
    
    const hours = Math.floor(diffMin / 60);
    const minutes = diffMin % 60;
    return `${hours}h${minutes.toString().padStart(2, '0')}`;
  }, [trackingData]);

  // Configuration temps réel
  useEffect(() => {
    if (!trackingId || !autoRefresh) return;

    setConnectionStatus('reconnecting');

    const tableName = 
      trackingType === 'delivery' ? 'delivery_orders' :
      trackingType === 'taxi' ? 'transport_bookings' : 'marketplace_orders';
    
    const orderChannel = supabase
      .channel(`unified-tracking-${trackingId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: tableName,
        filter: `id=eq.${trackingId}`
      }, (payload) => {
        console.log('📦 Mise à jour:', payload);
        loadTrackingData();
        
        if (enableNotifications && payload.old?.status !== payload.new?.status) {
          toast.success('Statut mis à jour');
        }
      })
      .subscribe();

    // Position chauffeur en temps réel
    let locationChannel: any = null;
    if (trackingData?.driver?.id && realTimeLocation) {
      locationChannel = supabase
        .channel(`driver-location-${trackingData.driver.id}`)
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'driver_locations',
          filter: `driver_id=eq.${trackingData.driver.id}`
        }, (payload) => {
          setTrackingData(prev => prev ? {
            ...prev,
            driverLocation: {
              lat: Number(payload.new.latitude),
              lng: Number(payload.new.longitude),
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
  }, [trackingId, trackingType, autoRefresh, enableNotifications, trackingData?.driver?.id, realTimeLocation]);

  // Charger au montage
  useEffect(() => {
    loadTrackingData();
  }, [loadTrackingData]);

  // Actions
  const refreshTracking = useCallback(() => {
    loadTrackingData();
  }, [loadTrackingData]);

  const contactDriver = useCallback(() => {
    if (trackingData?.driver?.phone) {
      window.open(`tel:${trackingData.driver.phone}`, '_self');
    } else {
      toast.error('Numéro non disponible');
    }
  }, [trackingData?.driver?.phone]);

  const shareLocation = useCallback(() => {
    if (currentPosition) {
      const shareData = {
        title: 'Ma position - TAGA',
        text: `Je suis ici: ${currentPosition.latitude}, ${currentPosition.longitude}`,
        url: `https://maps.google.com/?q=${currentPosition.latitude},${currentPosition.longitude}`
      };

      if (navigator.share) {
        navigator.share(shareData);
      } else {
        navigator.clipboard.writeText(shareData.url);
        toast.success('Lien copié');
      }
    }
  }, [currentPosition]);

  return {
    // Données
    trackingData,
    loading,
    error,
    connectionStatus,
    lastUpdate,

    // Valeurs calculées
    statusLabel,
    estimatedArrival,
    isCompleted: trackingData?.progress === 100,
    hasDriver: Boolean(trackingData?.driver),
    isActive: trackingData && !['delivered', 'completed', 'cancelled'].includes(trackingData.status),

    // Actions
    refreshTracking,
    contactDriver,
    shareLocation,

    // Géolocalisation
    isTracking,
    currentPosition,
    startTracking,
    stopTracking
  };
};