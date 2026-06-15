/**
 * 🎯 HOOK UNIVERSEL DE TRACKING
 * 
 * Consolide tous les types de tracking en un seul hook intelligent qui :
 * - Détecte automatiquement le type de commande (delivery, marketplace, taxi)
 * - Gère le tracking temps réel
 * - Fournit une interface unifiée pour tous les composants
 * - Optimise les performances avec React Query
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getCurrencyByCity } from '@/utils/formatCurrency';

// ==================== INTERFACES ====================

interface TrackingLocation {
  lat: number;
  lng: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  last_ping?: string;
  is_online?: boolean;
}

interface TrackingDriver {
  id: string;
  display_name: string;
  phone_number: string;
  vehicle_model?: string;
  vehicle_plate?: string;
  rating_average?: number;
  profile_photo_url?: string;
}

interface TrackingData {
  // Informations de base
  orderId: string;
  orderType: 'delivery' | 'marketplace' | 'taxi';
  status: string;
  
  // Localisation
  pickupLocation: string;
  deliveryLocation: string;
  pickupCoords?: { lat: number; lng: number };
  deliveryCoords?: { lat: number; lng: number };
  
  // Chauffeur
  driver?: TrackingDriver;
  driverLocation?: TrackingLocation;
  
  // Vendeur (pour marketplace)
  seller?: {
    id: string;
    display_name: string;
    phone_number: string;
  };
  
  // Produit (pour marketplace)
  product?: {
    title: string;
    images: string[];
    category: string;
  };
  
  // Estimation
  eta?: number; // minutes
  distance?: number; // km
  
  // Prix
  totalAmount: number;
  currency: string;
  
  // Métadonnées
  createdAt: string;
  updatedAt: string;
  deliveryType?: string; // flash, flex, maxicharge pour delivery
}

interface UseUniversalTrackingOptions {
  orderId: string;
  orderType?: 'delivery' | 'marketplace' | 'taxi';
  enableTracking?: boolean;
  pollingInterval?: number;
}

// ==================== HOOK PRINCIPAL ====================

export function useUniversalTracking({
  orderId,
  orderType,
  enableTracking = true,
  pollingInterval = 5000
}: UseUniversalTrackingOptions) {
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');
  const [detectedOrderType, setDetectedOrderType] = useState<'delivery' | 'marketplace' | 'taxi' | null>(orderType || null);
  
  const channelRef = useRef<any>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // ==================== DÉTECTION AUTOMATIQUE DU TYPE ====================
  
  const detectOrderType = useCallback(async (): Promise<'delivery' | 'marketplace' | 'taxi' | null> => {
    if (orderType) return orderType;
    
    console.log('🔍 Détection auto du type de commande pour:', orderId);
    
    try {
      // Essayer delivery_orders
      const { data: deliveryData } = await supabase
        .from('delivery_orders')
        .select('id')
        .eq('id', orderId)
        .maybeSingle();
      
      if (deliveryData) {
        console.log('✅ Type détecté: delivery');
        return 'delivery';
      }
      
      // Essayer marketplace_orders
      const { data: marketplaceData } = await supabase
        .from('marketplace_orders')
        .select('id')
        .eq('id', orderId)
        .maybeSingle();
      
      if (marketplaceData) {
        console.log('✅ Type détecté: marketplace');
        return 'marketplace';
      }
      
      // Essayer transport_bookings
      const { data: taxiData } = await supabase
        .from('transport_bookings')
        .select('id')
        .eq('id', orderId)
        .maybeSingle();
      
      if (taxiData) {
        console.log('✅ Type détecté: taxi');
        return 'taxi';
      }
      
      console.error('❌ Aucun type détecté pour:', orderId);
      return null;
      
    } catch (err) {
      console.error('❌ Erreur détection type:', err);
      return null;
    }
  }, [orderId, orderType]);

  // ==================== CHARGEMENT DES DONNÉES ====================
  
  const loadTrackingData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Détecter le type si nécessaire
      const type = detectedOrderType || await detectOrderType();
      
      if (!type) {
        throw new Error('Type de commande non détecté');
      }
      
      setDetectedOrderType(type);
      
      console.log(`📦 Chargement tracking ${type}:`, orderId);
      
      // Charger selon le type
      let data: TrackingData | null = null;
      
      if (type === 'delivery') {
        data = await loadDeliveryTracking(orderId);
      } else if (type === 'marketplace') {
        data = await loadMarketplaceTracking(orderId);
      } else if (type === 'taxi') {
        data = await loadTaxiTracking(orderId);
      }
      
      if (!data) {
        throw new Error('Commande non trouvée');
      }
      
      setTrackingData(data);
      setConnectionStatus('connected');
      
    } catch (err) {
      console.error('❌ Erreur chargement tracking:', err);
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
      setConnectionStatus('disconnected');
    } finally {
      setLoading(false);
    }
  }, [orderId, detectedOrderType, detectOrderType]);

  // ==================== CHARGEMENT DELIVERY ====================
  
  const loadDeliveryTracking = async (id: string): Promise<TrackingData | null> => {
    const { data, error } = await supabase
      .from('delivery_orders')
      .select(`
        *,
        driver:chauffeurs(
          id, display_name, phone_number, vehicle_model, vehicle_plate, rating_average, profile_photo_url
        )
      `)
      .eq('id', id)
      .single();
    
    if (error || !data) return null;
    
    // Charger position chauffeur si assigné
    let driverLocation: TrackingLocation | undefined;
    if (data.driver_id && enableTracking) {
      const { data: locationData } = await supabase
        .from('driver_locations')
        .select('*')
        .eq('driver_id', data.driver_id)
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
      }
    }
    
    return {
      orderId: data.id,
      orderType: 'delivery',
      status: data.status,
      pickupLocation: data.pickup_location,
      deliveryLocation: data.delivery_location,
      pickupCoords: parseCoords(data.pickup_coordinates),
      deliveryCoords: parseCoords(data.delivery_coordinates),
      driver: (data as any).driver?.[0] || undefined,
      driverLocation,
      eta: driverLocation ? calculateETA(driverLocation, parseCoords(data.delivery_coordinates)) : undefined,
      distance: driverLocation ? calculateDistance(driverLocation, parseCoords(data.delivery_coordinates)) : undefined,
      totalAmount: (data as any).total_price || (data as any).total_amount || 0,
      currency: getCurrencyByCity(data.city || ''),
      deliveryType: data.delivery_type,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  };

  // ==================== CHARGEMENT MARKETPLACE ====================
  
  const loadMarketplaceTracking = async (id: string): Promise<TrackingData | null> => {
    const { data, error } = await supabase
      .from('marketplace_orders')
      .select(`
        *,
        seller:profiles!fk_marketplace_orders_seller(id, display_name, phone_number),
        product:marketplace_products(title, images, category)
      `)
      .eq('id', id)
      .single();
    
    if (error || !data) return null;
    
    // Si livraison Tembea, chercher le chauffeur
    let driver: TrackingDriver | undefined;
    let driverLocation: TrackingLocation | undefined;
    
    if (data.vendor_delivery_method === 'kwenda' && enableTracking) {
      const { data: assignmentData } = await supabase
        .from('marketplace_delivery_assignments')
        .select('driver_id')
        .eq('order_id', id)
        .maybeSingle();
      
      if (assignmentData?.driver_id) {
        const { data: driverData } = await supabase
          .from('chauffeurs')
          .select('id, display_name, phone_number, vehicle_model, vehicle_plate, rating_average, profile_photo_url')
          .eq('user_id', assignmentData.driver_id)
          .single();
        
        if (driverData) {
          driver = driverData;
          
          // Position chauffeur
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
          }
        }
      }
    }
    
    return {
      orderId: data.id,
      orderType: 'marketplace',
      status: data.status,
      pickupLocation: 'Vendeur', // Pas d'adresse pickup pour marketplace
      deliveryLocation: data.delivery_address || 'Non spécifié',
      deliveryCoords: parseCoords(data.delivery_coordinates),
      driver,
      driverLocation,
      seller: (data as any).seller?.[0] || undefined,
      product: (data as any).product?.[0] || undefined,
      eta: driverLocation ? calculateETA(driverLocation, parseCoords(data.delivery_coordinates)) : undefined,
      distance: driverLocation ? calculateDistance(driverLocation, parseCoords(data.delivery_coordinates)) : undefined,
      totalAmount: data.total_amount,
      currency: getCurrencyByCity(data.delivery_address || ''),
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  };

  // ==================== CHARGEMENT TAXI ====================
  
  const loadTaxiTracking = async (id: string): Promise<TrackingData | null> => {
    const { data, error } = await supabase
      .from('transport_bookings')
      .select(`
        *,
        driver:chauffeurs(
          id, display_name, phone_number, vehicle_model, vehicle_plate, rating_average, profile_photo_url
        )
      `)
      .eq('id', id)
      .single();
    
    if (error || !data) return null;
    
    // Position chauffeur
    let driverLocation: TrackingLocation | undefined;
    if (data.driver_id && enableTracking) {
      const { data: locationData } = await supabase
        .from('driver_locations')
        .select('*')
        .eq('driver_id', data.driver_id)
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
      }
    }
    
    return {
      orderId: data.id,
      orderType: 'taxi',
      status: data.status,
      pickupLocation: data.pickup_location,
      deliveryLocation: data.destination,
      pickupCoords: parseCoords(data.pickup_coordinates),
      deliveryCoords: parseCoords(data.destination_coordinates),
      driver: (data as any).driver?.[0] || undefined,
      driverLocation,
      eta: driverLocation ? calculateETA(driverLocation, parseCoords(data.destination_coordinates)) : undefined,
      distance: driverLocation ? calculateDistance(driverLocation, parseCoords(data.destination_coordinates)) : undefined,
      totalAmount: data.actual_price || data.estimated_price || 0,
      currency: getCurrencyByCity(data.city || ''),
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  };

  // ==================== SUBSCRIPTIONS TEMPS RÉEL ====================
  
  const setupRealtimeSubscriptions = useCallback(() => {
    if (!trackingData || !detectedOrderType) return;
    
    // Nettoyer anciennes subscriptions
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }
    
    const channel = supabase.channel(`universal-tracking-${orderId}`);
    
    // Table à écouter selon le type
    const tableName = 
      detectedOrderType === 'delivery' ? 'delivery_orders' :
      detectedOrderType === 'marketplace' ? 'marketplace_orders' :
      'transport_bookings';
    
    // Écouter les mises à jour de commande
    channel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: tableName,
        filter: `id=eq.${orderId}`
      },
      (payload) => {
        console.log('📦 Mise à jour commande:', payload.new);
        loadTrackingData(); // Recharger toutes les données
        
        // Notification
        if (payload.old?.status !== payload.new?.status) {
          toast.success(`Statut mis à jour: ${getStatusLabel(payload.new.status)}`);
        }
      }
    );
    
    // Écouter position chauffeur si assigné
    if (trackingData.driver?.id && enableTracking) {
      channel.on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'driver_locations',
          filter: `driver_id=eq.${trackingData.driver.id}`
        },
        (payload) => {
          console.log('📍 Position chauffeur mise à jour');
          const newLocation: TrackingLocation = {
            lat: payload.new.latitude,
            lng: payload.new.longitude,
            accuracy: payload.new.accuracy,
            speed: payload.new.speed,
            heading: payload.new.heading,
            last_ping: payload.new.last_ping,
            is_online: payload.new.is_online
          };
          
          setTrackingData(prev => prev ? {
            ...prev,
            driverLocation: newLocation,
            eta: calculateETA(newLocation, prev.deliveryCoords),
            distance: calculateDistance(newLocation, prev.deliveryCoords)
          } : null);
        }
      );
    }
    
    channel.subscribe((status) => {
      console.log('📡 Statut subscription:', status);
      setConnectionStatus(status === 'SUBSCRIBED' ? 'connected' : 'connecting');
    });
    
    channelRef.current = channel;
  }, [orderId, trackingData, detectedOrderType, enableTracking, loadTrackingData]);

  // ==================== FONCTIONS UTILITAIRES ====================
  
  const parseCoords = (coords: any): { lat: number; lng: number } | undefined => {
    if (!coords) return undefined;
    try {
      if (typeof coords === 'string') {
        const parsed = JSON.parse(coords);
        return { lat: parsed.lat, lng: parsed.lng };
      }
      if (coords.lat && coords.lng) {
        return { lat: coords.lat, lng: coords.lng };
      }
    } catch {
      return undefined;
    }
    return undefined;
  };
  
  const calculateDistance = (point1: any, point2: any): number | undefined => {
    if (!point1 || !point2) return undefined;
    
    const R = 6371; // Rayon de la Terre en km
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLng = (point2.lng - point1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };
  
  const calculateETA = (driverLoc: any, destination: any): number | undefined => {
    if (!driverLoc || !destination) return undefined;
    const distance = calculateDistance(driverLoc, destination);
    if (!distance) return undefined;
    const avgSpeed = 30; // km/h
    return Math.round((distance / avgSpeed) * 60); // minutes
  };
  
  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      'pending': 'En attente',
      'confirmed': 'Confirmée',
      'driver_assigned': 'Chauffeur assigné',
      'picked_up': 'Récupéré',
      'in_transit': 'En livraison',
      'delivered': 'Livrée',
      'completed': 'Terminée',
      'cancelled': 'Annulée'
    };
    return labels[status] || status;
  };

  // ==================== ACTIONS ====================
  
  const callDriver = useCallback(() => {
    if (!trackingData?.driver?.phone_number) {
      toast.error('Numéro du chauffeur non disponible');
      return;
    }
    window.open(`tel:${trackingData.driver.phone_number}`, '_self');
  }, [trackingData]);
  
  const callSeller = useCallback(() => {
    if (!trackingData?.seller?.phone_number) {
      toast.error('Numéro du vendeur non disponible');
      return;
    }
    window.open(`tel:${trackingData.seller.phone_number}`, '_self');
  }, [trackingData]);
  
  const refreshTracking = useCallback(() => {
    loadTrackingData();
  }, [loadTrackingData]);

  // ==================== EFFETS ====================
  
  useEffect(() => {
    loadTrackingData();
  }, [loadTrackingData]);
  
  useEffect(() => {
    if (trackingData && !loading) {
      setupRealtimeSubscriptions();
    }
    
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [setupRealtimeSubscriptions, trackingData, loading]);
  
  // Polling de sécurité
  useEffect(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }
    
    if (connectionStatus === 'connected' && trackingData?.driverLocation) {
      pollingRef.current = setInterval(() => {
        const lastUpdate = trackingData.driverLocation?.last_ping;
        if (lastUpdate) {
          const timeDiff = Date.now() - new Date(lastUpdate).getTime();
          if (timeDiff > 30000) {
            console.log('🔄 Données obsolètes, refresh...');
            refreshTracking();
          }
        }
      }, pollingInterval);
    }
    
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [connectionStatus, trackingData?.driverLocation, pollingInterval, refreshTracking]);

  // ==================== RETOUR ====================
  
  return {
    trackingData,
    loading,
    error,
    connectionStatus,
    orderType: detectedOrderType,
    callDriver,
    callSeller,
    refreshTracking,
    getStatusLabel
  };
}
