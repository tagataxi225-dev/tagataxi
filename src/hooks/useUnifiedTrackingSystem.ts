import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getTrackingUrl } from '@/config/appUrl';

interface TrackingData {
  id: string;
  status: string;
  progress: number;
  driver: any;
  route: {
    pickup: { address: string };
    destination: { address: string };
  };
  driverLocation?: { lat: number; lng: number };
  pricing: { amount: number; currency: string };
  timing: { createdAt: string };
  metadata?: any;
}

export const useUnifiedTrackingSystem = (options: {
  trackingId: string;
  trackingType: 'delivery' | 'taxi' | 'marketplace' | 'food';
  autoRefresh?: boolean;
  enableNotifications?: boolean;
  realTimeLocation?: boolean;
}) => {
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('connected');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Fonction pour charger les données depuis Supabase
  const fetchTrackingData = useCallback(async () => {
    try {
      setLoading(true);
      setConnectionStatus('reconnecting');

      let query: any;

      // Sélectionner la bonne table selon le type
      switch (options.trackingType) {
        case 'marketplace':
          query = supabase
            .from('marketplace_orders')
            .select(`
              *,
              driver:driver_id(id, display_name, phone_number, avatar_url),
              product:product_id(title, images)
            `)
            .eq('id', options.trackingId)
            .single();
          break;
        case 'delivery':
          query = supabase
            .from('delivery_orders')
            .select(`
              *,
              driver:driver_id(id, display_name, phone_number, avatar_url)
            `)
            .eq('id', options.trackingId)
            .single();
          break;
        case 'taxi':
          query = supabase
            .from('transport_bookings')
            .select(`
              *,
              driver:driver_id(id, display_name, phone_number, avatar_url, vehicle_plate)
            `)
            .eq('id', options.trackingId)
            .single();
          break;
        case 'food':
          query = supabase
            .from('food_orders')
            .select(`
              *,
              restaurant:restaurant_profiles(restaurant_name, logo_url, phone_number, address, coordinates),
              driver:chauffeurs(id, display_name, phone_number, avatar_url)
            `)
            .eq('id', options.trackingId)
            .single();
          break;
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      if (!data) throw new Error('Commande introuvable');

      // Transformer les données au format attendu par ModernTracker
      const transformedData: TrackingData = {
        id: data.id,
        status: data.status || 'pending',
        progress: calculateProgress(data.status),
        driver: data.driver ? {
          name: data.driver.display_name || 'Chauffeur',
          phone: data.driver.phone_number,
          avatar: data.driver.avatar_url,
          rating: data.driver.rating || 4.5,
          vehicle: options.trackingType === 'taxi' ? {
            type: 'Taxi',
            plate: data.driver.vehicle_plate
          } : undefined
        } : null,
        route: {
          pickup: { address: data.pickup_address || data.pickup_location || 'Adresse de départ' },
          destination: { address: data.delivery_address || data.destination || 'Adresse d\'arrivée' }
        },
        pricing: {
          amount: data.total_price || data.price || 0,
          currency: data.currency || 'CDF'
        },
        timing: {
          createdAt: data.created_at
        },
        metadata: {
          packageType: data.package_type,
          productTitle: data.product?.title
        }
      };

      // Récupérer la position du chauffeur si disponible
      if (data.driver_id && options.realTimeLocation) {
        const { data: locationData } = await supabase
          .from('driver_locations')
          .select('latitude, longitude')
          .eq('driver_id', data.driver_id)
          .order('timestamp', { ascending: false })
          .limit(1)
          .single();

        if (locationData) {
          transformedData.driverLocation = {
            lat: locationData.latitude,
            lng: locationData.longitude
          };
        }
      }

      setTrackingData(transformedData);
      setConnectionStatus('connected');
      setLastUpdate(new Date());
      setError(null);
    } catch (err: any) {
      console.error('[useUnifiedTrackingSystem] Error:', err);
      setError(err.message || 'Erreur de chargement');
      setConnectionStatus('disconnected');
      toast.error('Impossible de charger les données de suivi');
    } finally {
      setLoading(false);
    }
  }, [options.trackingId, options.trackingType, options.realTimeLocation]);

  // Fonction pour calculer le progrès basé sur le statut
  const calculateProgress = (status: string): number => {
    const progressMap: Record<string, number> = {
      'pending': 10,
      'confirmed': 20,
      'preparing': 40,
      'ready_for_pickup': 60,
      'in_transit': 80,
      'delivered': 100,
      'completed': 100,
      'driver_assigned': 30,
      'driver_on_way': 50,
      'arrived': 70,
      'trip_started': 80,
      'trip_completed': 100
    };
    return progressMap[status] || 0;
  };

  // Charger les données au montage
  useEffect(() => {
    fetchTrackingData();
  }, [fetchTrackingData]);

  // Auto-refresh si activé
  useEffect(() => {
    if (!options.autoRefresh) return;

    const interval = setInterval(() => {
      fetchTrackingData();
    }, 10000); // Rafraîchir toutes les 10 secondes

    return () => clearInterval(interval);
  }, [options.autoRefresh, fetchTrackingData]);

  // Real-time subscription
  useEffect(() => {
    if (!options.realTimeLocation || !trackingData?.driver) return;

    const channel = supabase
      .channel(`tracking-${options.trackingId}`)
      .on('broadcast', { event: 'location_update' }, (payload) => {
        setTrackingData(prev => prev ? {
          ...prev,
          driverLocation: payload.payload
        } : null);
        setLastUpdate(new Date());
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [options.trackingId, options.realTimeLocation, trackingData?.driver]);

  const statusLabel = trackingData ? getStatusLabel(trackingData.status) : '';
  const estimatedArrival = trackingData ? calculateETA(trackingData.status) : null;
  const isCompleted = trackingData?.status === 'delivered' || trackingData?.status === 'completed' || trackingData?.status === 'trip_completed';
  const hasDriver = !!trackingData?.driver;
  const isActive = !isCompleted && trackingData?.status !== 'cancelled';

  return {
    trackingData,
    loading,
    error,
    connectionStatus,
    statusLabel,
    estimatedArrival,
    isCompleted,
    hasDriver,
    isActive,
    refreshTracking: fetchTrackingData,
    contactDriver: () => {
      if (trackingData?.driver?.phone) {
        window.location.href = `tel:${trackingData.driver.phone}`;
      }
    },
    shareLocation: () => {
      const url = getTrackingUrl(options.trackingType, options.trackingId);
      navigator.share?.({ url }) || navigator.clipboard.writeText(url);
      toast.success('Lien de suivi copié !');
    },
    lastUpdate
  };
};

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    'pending': 'En attente de confirmation',
    'confirmed': 'Commande confirmée',
    'preparing': 'Préparation en cours',
    'ready_for_pickup': 'Prêt pour récupération',
    'in_transit': 'En cours de livraison',
    'delivered': 'Livré',
    'completed': 'Terminé',
    'driver_assigned': 'Chauffeur assigné',
    'driver_on_way': 'Chauffeur en route',
    'arrived': 'Chauffeur arrivé',
    'trip_started': 'Course en cours',
    'trip_completed': 'Course terminée',
    'cancelled': 'Annulé'
  };
  return labels[status] || status;
}

function calculateETA(status: string): string | null {
  const etaMap: Record<string, string> = {
    'driver_assigned': '5-10 min',
    'driver_on_way': '3-5 min',
    'in_transit': '15-30 min',
    'preparing': '10-20 min',
    'ready_for_pickup': '5-15 min'
  };
  return etaMap[status] || null;
}
