/**
 * 🛒 HOOK POUR SUIVI TEMPS RÉEL DES COMMANDES MARKETPLACE
 * 
 * Adapté spécifiquement pour marketplace_orders :
 * - Support livraison Tembea (via delivery_assignments)
 * - Support livraison vendeur (self-delivery)
 * - Chat acheteur-vendeur
 * - Tracking chauffeur si livraison Tembea
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface MarketplaceTrackingData {
  order: {
    id: string;
    status: string;
    buyer_id: string;
    seller_id: string;
    product_id: string;
    quantity: number;
    total_amount: number;
    delivery_address: string | null;
    delivery_coordinates: any;
    vendor_delivery_method: string | null;
    created_at: string;
    updated_at: string;
  } | null;
  product: {
    title: string;
    images: string[];
    category: string;
  } | null;
  buyer: {
    id: string;
    display_name: string;
    phone_number: string;
  } | null;
  seller: {
    id: string;
    display_name: string;
    phone_number: string;
  } | null;
  driverLocation: {
    lat: number;
    lng: number;
    accuracy?: number;
    speed?: number;
    heading?: number;
    last_ping: string;
    is_online: boolean;
  } | null;
  driverProfile: {
    id: string;
    display_name: string;
    phone_number: string;
    vehicle_model?: string;
    vehicle_plate?: string;
    rating_average?: number;
  } | null;
  eta: number | null;
  distance: number | null;
}

interface UseMarketplaceOrderTrackingOptions {
  orderId: string;
  enableTracking?: boolean;
  pollingInterval?: number;
}

export function useMarketplaceOrderTracking({
  orderId,
  enableTracking = true,
  pollingInterval = 5000
}: UseMarketplaceOrderTrackingOptions) {
  const { user } = useAuth();
  
  const [trackingData, setTrackingData] = useState<MarketplaceTrackingData>({
    order: null,
    product: null,
    buyer: null,
    seller: null,
    driverLocation: null,
    driverProfile: null,
    eta: null,
    distance: null
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');
  
  const channelRef = useRef<any>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // ==================== CHARGEMENT INITIAL ====================
  
  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🛒 Chargement commande marketplace:', orderId);

      // ÉTAPE 1 : Charger la commande marketplace
      const { data: orderData, error: orderError } = await supabase
        .from('marketplace_orders')
        .select(`
          *,
          buyer:profiles!fk_marketplace_orders_buyer(
            id, display_name, phone_number
          ),
          seller:profiles!fk_marketplace_orders_seller(
            id, display_name, phone_number
          ),
          product:marketplace_products(
            title, images, category
          )
        `)
        .eq('id', orderId)
        .single();

      if (orderError) {
        throw new Error(`Erreur chargement commande: ${orderError.message}`);
      }

      if (!orderData) {
        throw new Error('Commande marketplace non trouvée');
      }

      console.log('✅ Commande marketplace chargée:', orderData);

      // ÉTAPE 2 : Si livraison Tembea, chercher l'assignation de chauffeur
      let driverLocation = null;
      let driverProfile = null;

      if (orderData.vendor_delivery_method === 'kwenda' && enableTracking) {
        console.log('🚚 Livraison Tembea détectée, recherche du chauffeur...');
        
        const { data: assignmentData, error: assignmentError } = await supabase
          .from('marketplace_delivery_assignments')
          .select('driver_id')
          .eq('order_id', orderId)
          .maybeSingle();

        if (assignmentData?.driver_id) {
          console.log('✅ Driver ID trouvé:', assignmentData.driver_id);

          // Charger le profil du chauffeur
          const { data: driverData } = await supabase
            .from('chauffeurs')
            .select('id, display_name, phone_number, vehicle_model, vehicle_plate, rating_average, rating_count')
            .eq('user_id', assignmentData.driver_id)
            .single();

          if (driverData) {
            driverProfile = driverData;
            console.log('✅ Profil chauffeur chargé:', driverProfile);

            // Charger la position du chauffeur
            const { data: locationData } = await supabase
              .from('driver_locations')
              .select('*')
              .eq('driver_id', assignmentData.driver_id)
              .single();

            if (locationData) {
              driverLocation = {
                lat: locationData.latitude,
                lng: locationData.longitude,
                accuracy: locationData.accuracy,
                speed: locationData.speed,
                heading: locationData.heading,
                last_ping: locationData.last_ping,
                is_online: locationData.is_online
              };

              console.log('✅ Position chauffeur chargée:', driverLocation);
            }
          }
        } else if (assignmentError) {
          console.warn('⚠️ Aucune assignation trouvée:', assignmentError.message);
        }
      }

      setTrackingData({
        order: orderData,
        product: (orderData as any).product?.[0] || null,
        buyer: (orderData as any).buyer?.[0] || null,
        seller: (orderData as any).seller?.[0] || null,
        driverLocation,
        driverProfile,
        eta: calculateETA(driverLocation, orderData.delivery_coordinates),
        distance: calculateDistance(driverLocation, orderData.delivery_coordinates)
      });

      setConnectionStatus('connected');

    } catch (err) {
      console.error('❌ Erreur chargement tracking marketplace:', err);
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
      setConnectionStatus('disconnected');
    } finally {
      setLoading(false);
    }
  }, [orderId, enableTracking]);

  // ==================== SUBSCRIPTIONS TEMPS RÉEL ====================
  
  const setupRealtimeSubscriptions = useCallback(() => {
    if (!trackingData.order) return;

    // Nettoyer les anciennes subscriptions
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase.channel(`marketplace-tracking-${orderId}`);

    // 1. Écouter les mises à jour de commande
    channel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'marketplace_orders',
        filter: `id=eq.${orderId}`
      },
      (payload) => {
        console.log('📦 Mise à jour commande marketplace:', payload.new);
        setTrackingData(prev => ({
          ...prev,
          order: { ...prev.order!, ...payload.new }
        }));
        
        if (payload.old?.status !== payload.new?.status) {
          toast.success(`Statut mis à jour: ${getStatusLabel(payload.new.status)}`);
        }
      }
    );

    // 2. Écouter la position du chauffeur (si livraison Tembea)
    if (trackingData.driverProfile?.id && enableTracking) {
      channel.on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'driver_locations',
          filter: `driver_id=eq.${trackingData.driverProfile.id}`
        },
        (payload) => {
          console.log('📍 Position chauffeur mise à jour:', payload.new);
          const newLocation = {
            lat: payload.new.latitude,
            lng: payload.new.longitude,
            accuracy: payload.new.accuracy,
            speed: payload.new.speed,
            heading: payload.new.heading,
            last_ping: payload.new.last_ping,
            is_online: payload.new.is_online
          };

          setTrackingData(prev => ({
            ...prev,
            driverLocation: newLocation,
            eta: calculateETA(newLocation, prev.order?.delivery_coordinates),
            distance: calculateDistance(newLocation, prev.order?.delivery_coordinates)
          }));
        }
      );
    }


    channel.subscribe((status) => {
      console.log('📡 Statut subscription marketplace:', status);
      setConnectionStatus(status === 'SUBSCRIBED' ? 'connected' : 'connecting');
    });

    channelRef.current = channel;
  }, [orderId, trackingData.order, trackingData.driverProfile, trackingData.seller, enableTracking, user?.id]);

  // ==================== FONCTIONS UTILITAIRES ====================
  
  const calculateETA = useCallback((driverLoc: any, destination: any): number | null => {
    if (!driverLoc || !destination) return null;
    
    try {
      const distance = calculateDistance(driverLoc, destination);
      if (!distance) return null;
      
      const avgSpeed = 30; // km/h
      const etaHours = distance / avgSpeed;
      return Math.round(etaHours * 60);
    } catch {
      return null;
    }
  }, []);

  const calculateDistance = useCallback((point1: any, point2: any): number | null => {
    if (!point1 || !point2) return null;
    
    try {
      const lat1 = point1.lat || point1.latitude;
      const lng1 = point1.lng || point1.longitude;
      const lat2 = point2.lat || point2.latitude || parseFloat(point2.lat);
      const lng2 = point2.lng || point2.longitude || parseFloat(point2.lng);
      
      if (!lat1 || !lng1 || !lat2 || !lng2) return null;
      
      const R = 6371;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLng = (lng2 - lng1) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLng/2) * Math.sin(dLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    } catch {
      return null;
    }
  }, []);

  const getStatusLabel = useCallback((status: string): string => {
    const labels: Record<string, string> = {
      'pending': 'En attente',
      'confirmed': 'Confirmée',
      'processing': 'En préparation',
      'shipped': 'Expédiée',
      'in_transit': 'En livraison',
      'delivered': 'Livrée',
      'cancelled': 'Annulée'
    };
    return labels[status] || status;
  }, []);

  // ==================== ACTIONS ====================

  const callSeller = useCallback(() => {
    if (!trackingData.seller?.phone_number) {
      toast.error('Numéro de téléphone non disponible');
      return;
    }

    const cleanNumber = trackingData.seller.phone_number.replace(/\D/g, '');
    window.open(`tel:${cleanNumber}`, '_self');
    toast.success(`Appel en cours vers ${trackingData.seller.display_name}...`);
  }, [trackingData.seller]);

  const callDriver = useCallback(() => {
    if (!trackingData.driverProfile?.phone_number) {
      toast.error('Numéro du chauffeur non disponible');
      return;
    }

    const cleanNumber = trackingData.driverProfile.phone_number.replace(/\D/g, '');
    window.open(`tel:${cleanNumber}`, '_self');
    toast.success(`Appel en cours vers ${trackingData.driverProfile.display_name}...`);
  }, [trackingData.driverProfile]);

  const refreshTracking = useCallback(() => {
    loadInitialData();
  }, [loadInitialData]);

  // ==================== EFFETS ====================
  
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    if (trackingData.order && !loading) {
      setupRealtimeSubscriptions();
    }

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [setupRealtimeSubscriptions, trackingData.order, loading]);

  // Polling de sécurité
  useEffect(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    pollingRef.current = setInterval(() => {
      if (connectionStatus === 'connected' && trackingData.driverLocation) {
        const lastUpdate = trackingData.driverLocation.last_ping;
        if (lastUpdate) {
          const timeDiff = Date.now() - new Date(lastUpdate).getTime();
          if (timeDiff > 30000) {
            console.log('🔄 Données obsolètes, refresh...');
            refreshTracking();
          }
        }
      }
    }, pollingInterval);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [connectionStatus, trackingData.driverLocation, pollingInterval, refreshTracking]);

  return {
    trackingData,
    loading,
    error,
    connectionStatus,
    callSeller,
    callDriver,
    refreshTracking
  };
}
