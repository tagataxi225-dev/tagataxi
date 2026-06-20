import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FoodOrderItem {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  options?: any;
}

interface CreateOrderData {
  restaurant_id: string;
  items: FoodOrderItem[];
  delivery_address: string;
  delivery_coordinates: { lat: number; lng: number };
  delivery_phone: string;
  delivery_instructions?: string;
  payment_method: 'kwenda_pay' | 'cash_on_delivery';
}

export const useFoodOrders = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);

  // Créer une commande
  const createOrder = async (orderData: CreateOrderData) => {
    try {
      setLoading(true);

      console.log('🍽️ Creating food order:', orderData);

      // Vérifier l'authentification
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: 'Erreur',
          description: 'Vous devez être connecté pour commander',
          variant: 'destructive',
        });
        return { success: false, needsAuth: true };
      }

      // Appeler l'Edge Function pour traiter la commande
      const { data, error } = await supabase.functions.invoke('food-order-processor', {
        body: orderData,
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: '🎉 Commande créée !',
          description: `Commande #${data.order.order_number} créée avec succès`,
        });

        return {
          success: true,
          order: data.order,
        };
      } else if (data.needsTopUp) {
        toast({
          title: 'Solde insuffisant',
          description: `Rechargez votre compte TAGAPay (${data.required} CDF requis)`,
          variant: 'destructive',
        });

        return {
          success: false,
          needsTopUp: true,
          required: data.required,
          current: data.current,
        };
      } else {
        throw new Error(data.error || 'Échec de la commande');
      }
    } catch (error: any) {
      console.error('Order creation error:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de créer la commande',
        variant: 'destructive',
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Récupérer les commandes du client
  const fetchCustomerOrders = async () => {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('food_orders')
        .select(`
          *,
          restaurant:restaurant_profiles(
            restaurant_name,
            logo_url,
            phone_number
          )
        `)
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setOrders(data || []);
      return data || [];
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger vos commandes',
        variant: 'destructive',
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Récupérer les commandes du restaurant (2 étapes pour éviter les problèmes de FK)
  const fetchRestaurantOrders = async (restaurantId: string) => {
    try {
      setLoading(true);

      // Étape 1: Récupérer les commandes
      const { data: ordersData, error: ordersError } = await supabase
        .from('food_orders')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      if (!ordersData || ordersData.length === 0) {
        setOrders([]);
        return [];
      }

      // Étape 2: Récupérer les profils des clients
      const customerIds = [...new Set(ordersData.map(o => o.customer_id).filter(Boolean))];
      
      let profilesMap: Record<string, { display_name: string | null; phone_number: string | null }> = {};
      
      if (customerIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, display_name, phone_number')
          .in('user_id', customerIds);
        
        if (profilesData) {
          profilesMap = profilesData.reduce((acc, profile) => {
            acc[profile.user_id] = {
              display_name: profile.display_name,
              phone_number: profile.phone_number
            };
            return acc;
          }, {} as Record<string, { display_name: string | null; phone_number: string | null }>);
        }
      }

      // Étape 3: Mapper les profils aux commandes
      const ordersWithCustomers = ordersData.map(order => ({
        ...order,
        customer: profilesMap[order.customer_id] || null
      }));

      setOrders(ordersWithCustomers);
      return ordersWithCustomers;
    } catch (error: any) {
      console.error('Error fetching restaurant orders:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les commandes',
        variant: 'destructive',
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Mettre à jour le statut d'une commande
  const updateOrderStatus = async (
    orderId: string,
    newStatus: string,
    estimatedTime?: number
  ) => {
    try {
      setLoading(true);

      const updateData: any = { status: newStatus };

      // Ajouter les timestamps selon le statut
      switch (newStatus) {
        case 'confirmed':
          updateData.confirmed_at = new Date().toISOString();
          if (estimatedTime) updateData.estimated_preparation_time = estimatedTime;
          break;
        case 'preparing':
          updateData.preparing_at = new Date().toISOString();
          break;
        case 'ready':
          updateData.ready_at = new Date().toISOString();
          break;
        case 'picked_up':
          updateData.picked_up_at = new Date().toISOString();
          break;
        case 'in_transit':
          break;
        case 'delivered':
          updateData.delivered_at = new Date().toISOString();
          break;
        case 'cancelled':
          updateData.cancelled_at = new Date().toISOString();
          break;
      }

      const { error } = await supabase
        .from('food_orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Statut mis à jour',
      });

      return true;
    } catch (error: any) {
      console.error('Error updating order status:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour le statut',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Annuler une commande
  const cancelOrder = async (orderId: string, reason: string) => {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { error } = await supabase
        .from('food_orders')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancelled_by: user.id,
          cancellation_reason: reason,
        })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: 'Commande annulée',
        description: 'Votre commande a été annulée avec succès',
      });

      return true;
    } catch (error: any) {
      console.error('Error canceling order:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'annuler la commande',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // S'abonner aux changements en temps réel
  const subscribeToOrders = (
    restaurantId: string,
    onNewOrder: (order: any) => void,
    onStatusChange: (order: any) => void
  ) => {
    const channel = supabase
      .channel('food-orders-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'food_orders',
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        (payload) => {
          console.log('🆕 New order:', payload.new);
          onNewOrder(payload.new);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'food_orders',
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        (payload) => {
          console.log('📝 Order updated:', payload.new);
          onStatusChange(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  return {
    loading,
    orders,
    createOrder,
    fetchCustomerOrders,
    fetchRestaurantOrders,
    updateOrderStatus,
    cancelOrder,
    subscribeToOrders,
  };
};
