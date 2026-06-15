import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DriverLocation {
  id: string;
  driver_id: string;
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  accuracy?: number;
  is_online: boolean;
  is_available: boolean;
  last_ping: string;
  updated_at: string;
}

interface DeliveryOrder {
  id: string;
  user_id: string;
  driver_id?: string;
  pickup_location: string;
  delivery_location: string;
  pickup_coordinates?: any;
  delivery_coordinates?: any;
  delivery_type: string;
  status: string;
  estimated_price?: number;
  actual_price?: number;
  package_type?: string;
  package_weight?: number;
  vehicle_size?: string;
  loading_assistance?: boolean;
  driver_notes?: string;
  delivery_proof?: any;
  recipient_signature?: string;
  delivery_photo_url?: string;
  order_time: string;
  pickup_time?: string;
  delivery_time?: string;
  confirmed_at?: string;
  driver_assigned_at?: string;
  picked_up_at?: string;
  in_transit_at?: string;
  delivered_at?: string;
  cancelled_at?: string;
  created_at: string;
  updated_at: string;
}

interface DeliveryStatusHistory {
  id: string;
  delivery_order_id: string;
  status: string;
  previous_status?: string;
  notes?: string;
  location_coordinates?: any;
  changed_by?: string;
  changed_at: string;
  metadata?: any;
}

interface UserProfileMinimal {
  id: string;
  display_name: string;
  phone_number?: string;
  email?: string;
}

export const useDeliveryTracking = (orderId: string) => {
  const [order, setOrder] = useState<DeliveryOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [driverProfile, setDriverProfile] = useState<UserProfileMinimal | null>(null);
  const [recipientProfile, setRecipientProfile] = useState<UserProfileMinimal | null>(null);
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null);
  const [statusHistory, setStatusHistory] = useState<DeliveryStatusHistory[]>([]);

  // Helper function to validate order ID
  const validateOrderId = (id: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  };

  // Computed values
  const statusLabel = useMemo(() => {
    if (!order) return 'Inconnu';
    
    const statusLabels: Record<string, string> = {
      'pending': 'En attente',
      'confirmed': 'Confirmée',
      'driver_assigned': 'Chauffeur assigné',
      'picked_up': 'Récupérée',
      'in_transit': 'En transit',
      'delivered': 'Livrée',
      'cancelled': 'Annulée'
    };
    
    return statusLabels[order.status] || order.status;
  }, [order?.status]);

  const price = useMemo(() => {
    if (!order) return 0;
    return Math.round(order.actual_price || order.estimated_price || 0);
  }, [order?.actual_price, order?.estimated_price]);

  const packageType = useMemo(() => {
    if (!order) return 'Standard';
    
    const typeMap: Record<string, string> = {
      'flash': 'Express',
      'flex': 'Standard', 
      'maxicharge': 'Gros colis'
    };
    
    return typeMap[order.delivery_type] || 'Standard';
  }, [order?.delivery_type]);

  // Load initial data
  useEffect(() => {
    const loadOrderData = async () => {
      if (!orderId) {
        setError('ID de commande manquant');
        setLoading(false);
        return;
      }

      if (!validateOrderId(orderId)) {
        setError('Format d\'ID de commande invalide');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Load order details
        const { data: orderData, error: orderError } = await supabase
          .from('delivery_orders')
          .select('*')
          .eq('id', orderId)
          .single();

        if (orderError) {
          if (orderError.code === 'PGRST116') {
            setError('Commande non trouvée');
          } else {
            throw orderError;
          }
          return;
        }

        setOrder(orderData);

        // Load recipient profile (order creator)
        const { data: clientData } = await supabase
          .from('clients')
          .select('id, display_name, phone_number, email')
          .eq('user_id', orderData.user_id)
          .single();

        if (clientData) {
          setRecipientProfile(clientData);
        }

        // Load driver profile if assigned
        if (orderData.driver_id) {
          // Try chauffeurs table first
          let { data: driverData } = await supabase
            .from('chauffeurs')
            .select('id, display_name, phone_number, email')
            .eq('user_id', orderData.driver_id)
            .single();

          // Fallback to clients table
          if (!driverData) {
            const { data: clientDriver } = await supabase
              .from('clients')
              .select('id, display_name, phone_number, email')
              .eq('user_id', orderData.driver_id)
              .single();
            
            driverData = clientDriver;
          }

          if (driverData) {
            setDriverProfile(driverData);
          }
        }

        // Load status history
        const { data: historyData } = await supabase
          .from('delivery_status_history')
          .select('*')
          .eq('delivery_order_id', orderId)
          .order('changed_at', { ascending: false });

        if (historyData) {
          setStatusHistory(historyData);
        }

      } catch (error: any) {
        console.error('Error loading order data:', error);
        setError(error.message || 'Erreur lors du chargement des données');
        toast.error('Erreur lors du chargement de la commande');
      } finally {
        setLoading(false);
      }
    };

    loadOrderData();
  }, [orderId]);

  // Real-time order updates
  useEffect(() => {
    if (!orderId || !validateOrderId(orderId)) return;

    const orderSubscription = supabase
      .channel(`delivery_order_${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'delivery_orders',
          filter: `id=eq.${orderId}`
        },
        (payload) => {
          console.log('📦 Order update received:', payload.new);
          setOrder(payload.new as DeliveryOrder);
          
          // If driver was just assigned, load their profile
          if (payload.new.driver_id && !driverProfile) {
            const loadDriverProfile = async () => {
              let { data: driverData } = await supabase
                .from('chauffeurs')
                .select('id, display_name, phone_number, email')
                .eq('user_id', payload.new.driver_id)
                .single();

              if (!driverData) {
                const { data: clientDriver } = await supabase
                  .from('clients')
                  .select('id, display_name, phone_number, email')
                  .eq('user_id', payload.new.driver_id)
                  .single();
                
                driverData = clientDriver;
              }

              if (driverData) {
                setDriverProfile(driverData);
              }
            };

            loadDriverProfile();
          }
        }
      )
      .subscribe();

    return () => {
      orderSubscription.unsubscribe();
    };
  }, [orderId, driverProfile]);

  // Real-time driver location updates
  useEffect(() => {
    if (!order?.driver_id) return;

    const locationSubscription = supabase
      .channel(`driver_location_${order.driver_id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'driver_locations',
          filter: `driver_id=eq.${order.driver_id}`
        },
        (payload) => {
          console.log('📍 Driver location update:', payload.new);
          setDriverLocation(payload.new as DriverLocation);
        }
      )
      .subscribe();

    return () => {
      locationSubscription.unsubscribe();
    };
  }, [order?.driver_id]);

  // Real-time status history updates
  useEffect(() => {
    if (!orderId || !validateOrderId(orderId)) return;

    const historySubscription = supabase
      .channel(`delivery_history_${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'delivery_status_history',
          filter: `delivery_order_id=eq.${orderId}`
        },
        (payload) => {
          console.log('📋 Status history update:', payload.new);
          setStatusHistory(prev => [payload.new as DeliveryStatusHistory, ...prev]);
        }
      )
      .subscribe();

    return () => {
      historySubscription.unsubscribe();
    };
  }, [orderId]);

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
    packageType
  };
};