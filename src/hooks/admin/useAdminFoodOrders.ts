import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AdminFoodOrder {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  payment_status: string;
  created_at: string;
  confirmed_at: string | null;
  preparing_at: string | null;
  ready_at: string | null;
  picked_up_at: string | null;
  delivered_at: string | null;
  restaurant_id: string;
  customer_id: string;
  delivery_phone: string;
  restaurant: {
    restaurant_name: string;
    logo_url: string | null;
  };
  customer: {
    display_name: string;
  };
  items: any;
  [key: string]: any;
}

export const useAdminFoodOrders = () => {
  const { toast } = useToast();
  const [orders, setOrders] = useState<AdminFoodOrder[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchOrders = async (statusFilter?: string) => {
    try {
      setLoading(true);
      let query = supabase
        .from('food_orders')
        .select(`
          *,
          restaurant:restaurant_profiles!inner(restaurant_name, logo_url),
          customer:clients!inner(display_name),
          items:food_order_items(*)
        `);

      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      const formattedData = data?.map(o => ({
        ...o,
        restaurant: Array.isArray(o.restaurant) ? o.restaurant[0] : o.restaurant,
        customer: Array.isArray(o.customer) ? o.customer[0] : o.customer,
      })) || [];

      setOrders(formattedData);
      return formattedData;
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = async (orderId: string, reason: string) => {
    try {
      const { error } = await supabase
        .from('food_orders')
        .update({
          status: 'cancelled',
          cancellation_reason: reason,
          cancelled_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: 'Commande annulée',
        description: 'La commande a été annulée',
      });

      await fetchOrders();
      return true;
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  };

  // Subscribe to real-time updates
  useEffect(() => {
    const channel = supabase
      .channel('admin-food-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'food_orders',
        },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    orders,
    loading,
    fetchOrders,
    cancelOrder,
  };
};
