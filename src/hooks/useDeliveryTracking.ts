import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { validateOrderId } from '@/utils/validation';

// DEPRECATED: Utiliser RealDriverLocation depuis @/types/realLocation
export interface DriverLocation {
  lat: number;
  lng: number;
  speed?: number | null;
  heading?: number | null;
  updated_at?: string;
  // Nouveaux champs pour compatibilité
  googleAddress?: string;
  googlePlaceName?: string;
}

export interface DeliveryOrder {
  id: string;
  user_id: string;
  driver_id: string | null;
  status: string | null;
  delivery_type: string;
  pickup_location: string;
  delivery_location: string;
  pickup_coordinates: any;
  delivery_coordinates: any;
  estimated_price: number | null;
  actual_price: number | null;
  created_at: string;
  updated_at: string;
  delivery_time: string | null;
  confirmed_at: string | null;
  driver_assigned_at: string | null;
  picked_up_at: string | null;
  in_transit_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  delivery_proof: any;
  driver_notes: string | null;
  recipient_signature: string | null;
  delivery_photo_url: string | null;
}

export interface DeliveryStatusHistory {
  id: string;
  delivery_order_id: string;
  status: string;
  previous_status: string | null;
  changed_at: string;
  changed_by: string | null;
  notes: string | null;
  metadata: any;
  location_coordinates: any;
}

export interface UserProfileMinimal {
  display_name?: string | null;
  phone_number?: string | null;
  avatar_url?: string | null;
  rating?: number | null;
}

export const useDeliveryTracking = (orderId: string) => {
  const [order, setOrder] = useState<DeliveryOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [driverProfile, setDriverProfile] = useState<UserProfileMinimal | null>(null);
  const [recipientProfile, setRecipientProfile] = useState<UserProfileMinimal | null>(null);
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null);
  const [statusHistory, setStatusHistory] = useState<DeliveryStatusHistory[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Validate UUID early
  const validationResult = useMemo(() => validateOrderId(orderId), [orderId]);

  // Helpers
  const statusLabel = useMemo(() => {
    switch (order?.status) {
      case 'pending':
        return 'En attente de confirmation';
      case 'confirmed':
        return 'Commande confirmée';
      case 'driver_assigned':
        return 'Livreur assigné';
      case 'picked_up':
        return 'Colis récupéré';
      case 'in_transit':
        return 'En cours de livraison';
      case 'delivered':
        return 'Livré';
      case 'cancelled':
        return 'Annulé';
      default:
        return order?.status || 'En préparation';
    }
  }, [order?.status]);

  const price = useMemo(() => {
    const p = order?.actual_price ?? order?.estimated_price;
    return typeof p === 'number' ? Math.round(p) : null;
  }, [order?.actual_price, order?.estimated_price]);

  const packageType = useMemo(() => {
    // Si le type précis n'existe pas, déduire depuis delivery_type
    if (!order) return '';
    if (order.delivery_type === 'flash') return 'Petit colis';
    if (order.delivery_type === 'flex') return 'Colis moyen';
    return 'Gros colis';
  }, [order]);

  // Initial fetch
  useEffect(() => {
    // Early validation check
    if (!validationResult.isValid) {
      setError(validationResult.error || 'ID invalide');
      setLoading(false);
      return;
    }

    let isMounted = true;

    const fetchAll = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch order with expanded data
        const { data: o, error: oe } = await supabase
          .from('delivery_orders')
          .select('*')
          .eq('id', orderId)
          .maybeSingle();
        
        if (oe) throw oe;
        
        if (!o) {
          throw new Error('Commande de livraison non trouvée');
        }
        
        if (!isMounted) return;
        setOrder(o as DeliveryOrder);

        // TODO: Fetch status history once table is in types
        // const { data: history, error: historyError } = await supabase
        //   .from('delivery_status_history')
        //   .select('*')
        //   .eq('delivery_order_id', orderId)
        //   .order('changed_at', { ascending: true });
        // 
        // if (!historyError && isMounted) {
        //   setStatusHistory(history || []);
        // }

        // Recipient profile depuis clients
        const { data: rp } = await supabase
          .from('clients')
          .select('display_name, phone_number')
          .eq('user_id', (o as any).user_id)
          .maybeSingle();
        if (isMounted) setRecipientProfile({
          display_name: rp?.display_name,
          phone_number: rp?.phone_number,
          avatar_url: null
        } as UserProfileMinimal);

        // Driver profile + phone avec chauffeurs et clients
        if ((o as any).driver_id) {
          const driverId = (o as any).driver_id as string;
          
          // Chercher d'abord dans les chauffeurs, puis dans les clients
          let driverData = null;
          
          const { data: chauffeurData } = await supabase
            .from('chauffeurs')
            .select('display_name, phone_number, rating_average')
            .eq('user_id', driverId)
            .maybeSingle();
            
          if (chauffeurData) {
            driverData = {
              display_name: chauffeurData.display_name,
              phone_number: chauffeurData.phone_number,
              avatar_url: null,
              rating: chauffeurData.rating_average
            };
          } else {
            // Fallback sur clients
            const { data: clientData } = await supabase
              .from('clients')
              .select('display_name, phone_number')
              .eq('user_id', driverId)
              .maybeSingle();
              
            if (clientData) {
              driverData = {
                display_name: clientData.display_name,
                phone_number: clientData.phone_number,
                avatar_url: null,
                rating: null
              };
            }
          }
          
          if (isMounted && driverData) setDriverProfile(driverData as UserProfileMinimal);
        }
      } catch (e: any) {
        console.error('Delivery tracking init error:', e);
        if (isMounted) setError(e.message || 'Erreur de chargement');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAll();
    return () => {
      isMounted = false;
    };
  }, [orderId, validationResult]);

  // Realtime: order updates
  useEffect(() => {
    if (!orderId || !validationResult.isValid) return;
    const channel = supabase
      .channel(`delivery-order-${orderId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'delivery_orders', filter: `id=eq.${orderId}` }, (payload) => {
        setOrder(payload.new as DeliveryOrder);
      })
      // TODO: Add status history realtime once table is in types
      // .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'delivery_status_history', filter: `delivery_order_id=eq.${orderId}` }, (payload) => {
      //   setStatusHistory(prev => [...prev, payload.new as DeliveryStatusHistory]);
      // })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, validationResult]);

  // Realtime: driver live location avec adresse Google réelle
  useEffect(() => {
    if (!order?.driver_id) return;

    const channel = supabase
      .channel(`driver-location-${order.driver_id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'driver_locations', filter: `driver_id=eq.${order.driver_id}` },
        async (payload) => {
          const d = payload.new as any;
          
          // Position de base
          const baseLocation = {
            lat: Number(d.latitude),
            lng: Number(d.longitude),
            speed: d.speed,
            heading: d.heading,
            updated_at: d.updated_at,
          };

          // Ajouter l'adresse Google si disponible dans la colonne google_address
          if (d.google_address) {
            (baseLocation as any).googleAddress = d.google_address;
            (baseLocation as any).googlePlaceName = d.google_place_name;
          }

          setDriverLocation(baseLocation);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [order?.driver_id]);

  return {
    order,
    loading,
    error,
    driverProfile,
    recipientProfile,
    driverLocation,
    statusHistory,
    statusLabel,
    price,
    packageType,
  };
};
