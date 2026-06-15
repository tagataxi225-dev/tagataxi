import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type FoodOrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivering' | 'in_transit' | 'delivered' | 'cancelled' | 'pending_delivery_approval' | 'driver_assigned' | 'picked_up';

export interface FoodOrder {
  id: string;
  order_number: string;
  client_id: string;
  restaurant_id: string;
  restaurant_name?: string;
  restaurant_logo?: string;
  restaurant_phone?: string;
  driver_id?: string;
  driver_name?: string;
  driver_phone?: string;
  driver_photo?: string;
  status: FoodOrderStatus;
  total_amount: number;
  delivery_fee: number;
  delivery_payment_status?: string;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
    image_url?: string;
  }>;
  delivery_address: string;
  delivery_phone: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  estimated_delivery_time?: string;
}

export const useFoodClientOrders = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id || null);
    });
  }, []);

  // Fetch all orders for current user
  const { data: orders = [], isLoading, error: queryError, refetch } = useQuery({
    queryKey: ['food-client-orders', userId],
    queryFn: async () => {
      if (!userId) return [];

      // Étape 1: Récupérer les commandes SANS join problématique
      const { data, error } = await supabase
        .from('food_orders')
        .select('*')
        .eq('customer_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching food orders:', error);
        throw error;
      }

      // Étape 2: Récupérer les restaurants séparément
      const restaurantIds = [...new Set((data || []).filter(o => o.restaurant_id).map(o => o.restaurant_id))];
      let restaurantsMap: Record<string, any> = {};

      if (restaurantIds.length > 0) {
        const { data: restaurants } = await supabase
          .from('restaurant_profiles')
          .select('id, restaurant_name, logo_url, phone_number')
          .in('id', restaurantIds);
        
        if (restaurants) {
          restaurantsMap = restaurants.reduce((acc, r) => ({
            ...acc,
            [r.id]: r
          }), {});
        }
      }

      // Étape 3: Récupérer les chauffeurs séparément
      const driverIds = [...new Set((data || []).filter(o => o.driver_id).map(o => o.driver_id))];
      let driversMap: Record<string, any> = {};

      if (driverIds.length > 0) {
        const { data: drivers } = await supabase
          .from('chauffeurs')
          .select('user_id, display_name, phone_number, profile_photo_url')
          .in('user_id', driverIds);
        
        if (drivers) {
          driversMap = drivers.reduce((acc, driver) => ({
            ...acc,
            [driver.user_id]: driver
          }), {});
        }
      }

      // Mapper avec les données chauffeur et restaurant
      return (data || []).map((order: any) => {
        const driver = driversMap[order.driver_id];
        const restaurant = restaurantsMap[order.restaurant_id];
        return {
          id: order.id,
          order_number: order.order_number,
          client_id: order.customer_id,
          restaurant_id: order.restaurant_id,
          restaurant_name: restaurant?.restaurant_name || 'Restaurant',
          restaurant_logo: restaurant?.logo_url,
          restaurant_phone: restaurant?.phone_number,
          driver_id: order.driver_id,
          driver_name: driver?.display_name,
          driver_phone: driver?.phone_number,
          driver_photo: driver?.profile_photo_url,
          status: order.status,
          total_amount: order.total_amount,
          delivery_fee: order.delivery_fee || 0,
          delivery_payment_status: order.delivery_payment_status,
          items: order.items || [],
          delivery_address: order.delivery_address,
          delivery_phone: order.delivery_phone,
          notes: order.delivery_instructions,
          created_at: order.created_at,
          updated_at: order.updated_at,
          estimated_delivery_time: order.estimated_delivery_time,
        };
      }) as FoodOrder[];
    },
    enabled: !!userId,
  });

  // Real-time updates for orders
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('food-orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'food_orders',
          filter: `customer_id=eq.${userId}`,
        },
        (payload) => {
          console.log('Food order change:', payload);
          
          // Show notification for status changes
          if (payload.eventType === 'UPDATE' && payload.new) {
            const newStatus = (payload.new as any).status;
            const orderNumber = (payload.new as any).order_number;
            
            const statusMessages: Record<FoodOrderStatus, string> = {
              pending: 'Commande en attente',
              confirmed: `✅ Commande ${orderNumber} confirmée !`,
              preparing: `👨‍🍳 Votre commande ${orderNumber} est en préparation`,
              ready: `✨ Commande ${orderNumber} prête !`,
              in_transit: `🚚 Votre commande ${orderNumber} est en route !`,
              delivering: `🚚 Livraison en cours de ${orderNumber}`,
              delivered: `🎉 Commande ${orderNumber} livrée !`,
              cancelled: `❌ Commande ${orderNumber} annulée`,
              pending_delivery_approval: `📋 Approbation des frais de livraison requise`,
              driver_assigned: `🚴 Un livreur a été assigné à votre commande ${orderNumber}`,
              picked_up: `📦 Votre commande ${orderNumber} a été récupérée`,
            };

            if (statusMessages[newStatus as FoodOrderStatus]) {
              toast.success(statusMessages[newStatus as FoodOrderStatus]);
            }
          }

          // Refetch orders to get updated data
          queryClient.invalidateQueries({ queryKey: ['food-client-orders', userId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  // Cancel order mutation
  const cancelOrderMutation = useMutation({
    mutationFn: async ({ orderId, reason }: { orderId: string; reason: string }) => {
      const { error } = await supabase
        .from('food_orders')
        .update({ 
          status: 'cancelled',
          delivery_instructions: reason 
        })
        .eq('id', orderId)
        .eq('customer_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Commande annulée');
      queryClient.invalidateQueries({ queryKey: ['food-client-orders', userId] });
    },
    onError: (error) => {
      console.error('Error cancelling order:', error);
      toast.error('Impossible d\'annuler la commande');
    },
  });

  // Get orders by status
  const getOrdersByStatus = (status: FoodOrderStatus | FoodOrderStatus[]) => {
    const statuses = Array.isArray(status) ? status : [status];
    return orders.filter(order => statuses.includes(order.status));
  };

  // Get active orders (not delivered or cancelled)
  const activeOrders = orders.filter(
    order => !['delivered', 'cancelled'].includes(order.status)
  );

  // Get completed orders
  const completedOrders = orders.filter(
    order => order.status === 'delivered'
  );

  // Get cancelled orders
  const cancelledOrders = orders.filter(
    order => order.status === 'cancelled'
  );

  return {
    orders,
    activeOrders,
    completedOrders,
    cancelledOrders,
    isLoading,
    error: queryError,
    refetch,
    cancelOrder: cancelOrderMutation.mutate,
    isCancelling: cancelOrderMutation.isPending,
    getOrdersByStatus,
  };
};
