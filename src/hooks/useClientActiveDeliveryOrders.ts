/**
 * Hook pour récupérer et surveiller les commandes de livraison actives du client
 * Permet la persistance des commandes même après retour à l'accueil
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ActiveDeliveryOrder {
  id: string;
  status: string;
  delivery_type: string;
  pickup_location: string;
  delivery_location: string;
  estimated_price: number | null;
  actual_price: number | null;
  created_at: string;
  driver_id: string | null;
  recipient_name: string;
}

const ACTIVE_STATUSES = ['pending', 'confirmed', 'driver_assigned', 'picked_up', 'in_transit'];

export const useClientActiveDeliveryOrders = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeOrders, setActiveOrders] = useState<ActiveDeliveryOrder[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch active orders
  const fetchActiveOrders = useCallback(async () => {
    if (!user?.id) {
      setActiveOrders([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('delivery_orders')
        .select('id, status, delivery_type, pickup_location, delivery_location, estimated_price, actual_price, created_at, driver_id, recipient_name')
        .eq('user_id', user.id)
        .in('status', ACTIVE_STATUSES)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [ActiveDeliveryOrders] Erreur fetch:', error);
        return;
      }

      setActiveOrders(data || []);
    } catch (error) {
      console.error('❌ [ActiveDeliveryOrders] Exception:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Cancel order
  const cancelOrder = useCallback(async (orderId: string) => {
    if (!user?.id) return false;

    try {
      const { error } = await supabase
        .from('delivery_orders')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancelled_by: user.id,
          cancellation_reason: 'Annulé par le client'
        })
        .eq('id', orderId)
        .eq('user_id', user.id)
        .in('status', ['pending', 'confirmed']); // Only allow cancellation for pending/confirmed orders

      if (error) {
        console.error('❌ [ActiveDeliveryOrders] Erreur annulation:', error);
        toast({
          title: "Erreur",
          description: "Impossible d'annuler cette commande",
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Commande annulée",
        description: "Votre livraison a été annulée avec succès"
      });

      // Refresh orders
      await fetchActiveOrders();
      return true;
    } catch (error) {
      console.error('❌ [ActiveDeliveryOrders] Exception annulation:', error);
      return false;
    }
  }, [user?.id, toast, fetchActiveOrders]);

  // Initial fetch
  useEffect(() => {
    fetchActiveOrders();
  }, [fetchActiveOrders]);

  // Realtime subscription
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`delivery_orders_client_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'delivery_orders',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('📦 [ActiveDeliveryOrders] Realtime update:', payload);
          fetchActiveOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchActiveOrders]);

  // Computed values
  const pendingCount = activeOrders.filter(o => o.status === 'pending').length;
  const hasActiveOrders = activeOrders.length > 0;
  const mostRecentOrder = activeOrders[0] || null;

  return {
    activeOrders,
    pendingCount,
    hasActiveOrders,
    mostRecentOrder,
    loading,
    refetch: fetchActiveOrders,
    cancelOrder
  };
};
