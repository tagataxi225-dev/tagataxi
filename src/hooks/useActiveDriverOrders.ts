/**
 * 🎯 HOOK COMMANDES ACTIVES CHAUFFEUR
 * 
 * Utilise la vue matérialisée `active_driver_orders`
 * pour obtenir TOUTES les commandes actives du chauffeur
 * (taxi + delivery) de manière optimisée
 * 
 * PHASE 3 - Optimisation
 */

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ActiveDriverOrder {
  driver_id: string;
  order_type: 'taxi' | 'delivery';
  order_id: string;
  status: string;
  pickup_location: string;
  delivery_location: string;
  pickup_coordinates: any;
  delivery_coordinates: any;
  estimated_price: number;
  created_at: string;
  updated_at: string;
  pickup_time: string | null;
  user_id: string;
  city: string;
  package_type?: string | null;
  delivery_type?: string | null;
}

export const useActiveDriverOrders = () => {
  const [orders, setOrders] = useState<ActiveDriverOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ============================================
  // CHARGEMENT INITIAL
  // ============================================

  const loadActiveOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setOrders([]);
        setLoading(false);
        return;
      }

      // Requête optimisée sur la vue matérialisée
      const { data, error: fetchError } = await supabase
        .from('active_driver_orders')
        .select('*')
        .eq('driver_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('❌ Error fetching active orders:', fetchError);
        setError(fetchError.message);
        toast.error('Erreur de chargement des commandes actives');
        setOrders([]);
      } else {
        // Cast explicite des types
        const typedData = (data || []).map(order => ({
          ...order,
          order_type: order.order_type as 'taxi' | 'delivery'
        }));
        setOrders(typedData);
        console.log(`✅ ${typedData.length} commandes actives chargées`);
      }
    } catch (err: any) {
      console.error('❌ Load active orders failed:', err);
      setError(err.message);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // ABONNEMENT TEMPS RÉEL
  // ============================================

  useEffect(() => {
    loadActiveOrders();

    // Real-time sur transport_bookings
    const transportChannel = supabase
      .channel('active-transport-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transport_bookings',
        },
        () => {
          console.log('🔄 Transport booking changed, reloading...');
          loadActiveOrders();
        }
      )
      .subscribe();

    // Real-time sur delivery_orders
    const deliveryChannel = supabase
      .channel('active-delivery-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'delivery_orders',
        },
        () => {
          console.log('🔄 Delivery order changed, reloading...');
          loadActiveOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(transportChannel);
      supabase.removeChannel(deliveryChannel);
    };
  }, []);

  // ============================================
  // HELPERS
  // ============================================

  const hasActiveOrders = orders.length > 0;

  const activeOrdersByType = {
    taxi: orders.filter(o => o.order_type === 'taxi'),
    delivery: orders.filter(o => o.order_type === 'delivery'),
  };

  const isBusy = hasActiveOrders;

  // ============================================
  // RETURN API
  // ============================================

  return {
    orders,
    loading,
    error,
    refresh: loadActiveOrders,
    hasActiveOrders,
    activeOrdersByType,
    isBusy,
    totalActive: orders.length,
  };
};
