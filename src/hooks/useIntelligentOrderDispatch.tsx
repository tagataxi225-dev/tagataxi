import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface OrderRequest {
  id: string;
  type: 'taxi' | 'delivery' | 'marketplace';
  pickup_location: string;
  delivery_location?: string;
  pickup_coordinates?: { lat: number; lng: number };
  delivery_coordinates?: { lat: number; lng: number };
  estimated_price: number;
  priority: 'normal' | 'high' | 'urgent';
  created_at: string;
  customer_id: string;
  special_requirements?: string;
  distance_km?: number;
}

interface DriverScore {
  distance_km: number;
  score: number;
  estimated_arrival: number;
  compatibility: number;
}

export const useIntelligentOrderDispatch = () => {
  const { user } = useAuth();
  const [pendingOrders, setPendingOrders] = useState<OrderRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Calculer le score intelligent pour un chauffeur
  const calculateDriverScore = useCallback((
    order: OrderRequest,
    driverLocation: { lat: number; lng: number },
    driverRating: number = 4.0,
    totalRides: number = 0
  ): DriverScore => {
    const pickupLat = order.pickup_coordinates?.lat || 0;
    const pickupLng = order.pickup_coordinates?.lng || 0;
    
    // Calcul de la distance (formule Haversine simplifiée)
    const distance_km = Math.sqrt(
      Math.pow((pickupLat - driverLocation.lat) * 111, 2) + 
      Math.pow((pickupLng - driverLocation.lng) * 111, 2)
    );

    // Score basé sur multiple critères
    const proximityScore = Math.max(0, 100 - (distance_km * 10)); // Plus proche = meilleur
    const ratingScore = (driverRating / 5) * 100; // Note sur 5
    const experienceScore = Math.min(100, totalRides * 2); // Expérience
    const priorityBonus = order.priority === 'urgent' ? 20 : order.priority === 'high' ? 10 : 0;

    const totalScore = (
      proximityScore * 0.4 +  // 40% proximité
      ratingScore * 0.3 +     // 30% rating
      experienceScore * 0.2 + // 20% expérience  
      priorityBonus * 0.1     // 10% priorité
    );

    const estimatedArrival = Math.ceil(distance_km * 2); // 2 min par km
    const compatibility = order.type === 'marketplace' ? 95 : 90; // Marketplace privilégiée

    return {
      distance_km,
      score: totalScore,
      estimated_arrival: estimatedArrival,
      compatibility
    };
  }, []);

  // Écouter les notifications d'assignation automatique
  useEffect(() => {
    if (!user || !isListening) return;

    console.log('🎯 Démarrage écoute notifications dispatch...');

    // Canal pour les notifications d'assignation
    const notificationChannel = supabase
      .channel('driver_notifications')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'push_notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const notification = payload.new as any;
          
          // Vérifier si c'est une notification d'assignation pour ce chauffeur
          if (notification.user_id === user.id && 
              notification.notification_type === 'assignment') {
            console.log('📱 Assignation automatique reçue:', notification);
            
            const order: OrderRequest = {
              id: notification.metadata?.booking_id || notification.metadata?.order_id || notification.id,
              type: notification.metadata?.booking_id ? 'taxi' : 'delivery',
              pickup_location: 'Lieu de prise en charge',
              delivery_location: notification.metadata?.booking_id ? 'Destination' : 'Lieu de livraison',
              pickup_coordinates: null,
              delivery_coordinates: null,
              estimated_price: 0,
              priority: notification.metadata?.priority || 'normal',
              created_at: notification.created_at,
              customer_id: 'system'
            };
            
            setPendingOrders(prev => [...prev, order]);
            
            // Notification push
            toast.success(notification.title, {
              description: notification.message,
              duration: 15000
            });
            
            // Notification navigateur
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(notification.title, {
                body: notification.message,
                icon: '/favicon.ico'
              });
            }
          }
        }
      )
      .subscribe();

    // Déclencher le dispatch automatique pour les nouvelles commandes
    const transportChannel = supabase
      .channel('auto_dispatch_transport')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'transport_bookings' },
        async (payload) => {
          const booking = payload.new as any;
          if (booking.status === 'pending' && !booking.driver_id && booking.pickup_coordinates) {
            console.log('🚗 Auto-dispatch transport:', booking.id);
            
            // Lancer le dispatch automatique via Edge Function
            try {
              const { error } = await supabase.functions.invoke('auto-dispatch-system', {
                body: {
                  booking_id: booking.id,
                  type: 'transport',
                  pickup_lat: booking.pickup_coordinates.lat,
                  pickup_lng: booking.pickup_coordinates.lng,
                  city: booking.city || 'Kinshasa',
                  priority: booking.is_urgent ? 'urgent' : 'normal',
                  service_type: booking.service_type
                }
              });
              
              if (error) console.error('❌ Erreur auto-dispatch transport:', error);
            } catch (err) {
              console.error('❌ Exception auto-dispatch transport:', err);
            }
          }
        }
      )
      .subscribe();

    const deliveryChannel = supabase
      .channel('auto_dispatch_delivery')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'delivery_orders' },
        async (payload) => {
          const delivery = payload.new as any;
          if (delivery.status === 'pending' && !delivery.driver_id && delivery.pickup_coordinates) {
            console.log('📦 Auto-dispatch livraison:', delivery.id);
            
            try {
              const { error } = await supabase.functions.invoke('auto-dispatch-system', {
                body: {
                  order_id: delivery.id,
                  type: 'delivery',
                  pickup_lat: delivery.pickup_coordinates.lat,
                  pickup_lng: delivery.pickup_coordinates.lng,
                  priority: delivery.delivery_type === 'flash' ? 'urgent' : 'normal',
                  delivery_type: delivery.delivery_type
                }
              });
              
              if (error) console.error('❌ Erreur auto-dispatch livraison:', error);
            } catch (err) {
              console.error('❌ Exception auto-dispatch livraison:', err);
            }
          }
        }
      )
      .subscribe();

    return () => {
      console.log('🔌 Arrêt écoute dispatch...');
      supabase.removeChannel(notificationChannel);
      supabase.removeChannel(transportChannel);
      supabase.removeChannel(deliveryChannel);
    };
  }, [user, isListening]);

  // Accepter une commande
  const acceptOrder = useCallback(async (order: OrderRequest): Promise<boolean> => {
    if (!user) return false;

    setLoading(true);
    try {
      let updateResult;
      
      switch (order.type) {
        case 'taxi':
          updateResult = await supabase
            .from('transport_bookings')
            .update({
              driver_id: user.id,
              status: 'driver_assigned',
              driver_assigned_at: new Date().toISOString()
            })
            .eq('id', order.id);
          break;
          
        case 'delivery':
          updateResult = await supabase
            .from('delivery_orders')
            .update({
              driver_id: user.id,
              status: 'driver_assigned',
              driver_assigned_at: new Date().toISOString()
            })
            .eq('id', order.id);
          break;
          
        case 'marketplace':
          updateResult = await supabase
            .from('marketplace_delivery_assignments')
            .update({
              driver_id: user.id,
              status: 'assigned'
            })
            .eq('id', order.id);
          break;
      }

      if (updateResult?.error) {
        toast.error('Erreur lors de l\'acceptation de la commande');
        return false;
      }

      // Retirer la commande des ordres en attente
      setPendingOrders(prev => prev.filter(o => o.id !== order.id));
      
      // Mettre le chauffeur comme non disponible
      await supabase
        .from('driver_locations')
        .update({ is_available: false })
        .eq('driver_id', user.id);

      toast.success('Commande acceptée avec succès!');
      return true;
      
    } catch (error) {
      console.error('Error accepting order:', error);
      toast.error('Erreur lors de l\'acceptation');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Refuser une commande
  const rejectOrder = useCallback((orderId: string) => {
    setPendingOrders(prev => prev.filter(o => o.id !== orderId));
    toast.info('Commande refusée');
  }, []);

  // Démarrer/arrêter l'écoute des commandes
  const toggleListening = useCallback((listening: boolean) => {
    setIsListening(listening);
    if (listening) {
      toast.success('Écoute des commandes activée');
    } else {
      toast.info('Écoute des commandes désactivée');
      setPendingOrders([]);
    }
  }, []);

  return {
    pendingOrders,
    loading,
    isListening,
    acceptOrder,
    rejectOrder,
    toggleListening,
    calculateDriverScore
  };
};