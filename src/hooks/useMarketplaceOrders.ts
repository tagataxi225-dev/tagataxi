import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import type { CartItem } from '@/types/marketplace';

interface Coordinates {
  lat: number;
  lng: number;
}

export const useMarketplaceOrders = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = async () => {
    if (!user) {
      setOrders([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Charger les commandes avec les produits
      const { data: ordersData, error } = await supabase
        .from('marketplace_orders')
        .select(`
          *,
          marketplace_products!inner (
            id,
            title,
            images,
            price,
            seller_id
          )
        `)
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!ordersData || ordersData.length === 0) {
        setOrders([]);
        setLoading(false);
        return;
      }

      // Collecter les IDs uniques pour batch fetching
      const sellerIds = [...new Set(ordersData.map(o => o.seller_id))];
      const buyerIds = [...new Set(ordersData.map(o => o.buyer_id))];

      // Batch fetch des profils vendeurs
      const { data: sellerProfiles } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', sellerIds);

      // Batch fetch des infos boutiques
      const { data: vendorProfiles } = await supabase
        .from('vendor_profiles')
        .select('user_id, shop_name, shop_logo_url, shop_banner_url')
        .in('user_id', sellerIds);

      // Batch fetch des profils acheteurs
      const { data: buyerProfiles } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', buyerIds);

      // Créer des maps pour accès rapide
      const sellersMap = new Map((sellerProfiles || []).map(p => [p.id, p]));
      const vendorsMap = new Map((vendorProfiles || []).map(v => [v.user_id, v]));
      const buyersMap = new Map((buyerProfiles || []).map(p => [p.id, p]));

      // Enrichir les commandes avec les données
      const enrichedOrders = ordersData.map(order => ({
        ...order,
        product: order.marketplace_products,
        seller: sellersMap.get(order.seller_id) || null,
        vendor_info: vendorsMap.get(order.seller_id) || null,
        buyer: buyersMap.get(order.buyer_id) || null,
      }));

      setOrders(enrichedOrders);
    } catch (error: any) {
      console.error('Error loading marketplace orders:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les commandes',
        variant: 'destructive'
      });
      setOrders([]); // Prevent infinite loop
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();

    // Realtime subscription
    if (user) {
      const channel = supabase
        .channel('marketplace-orders-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'marketplace_orders',
            filter: `buyer_id=eq.${user.id}`,
          },
          () => {
            loadOrders();
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'marketplace_orders',
            filter: `seller_id=eq.${user.id}`,
          },
          () => {
            loadOrders();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const createBulkOrder = async (items: CartItem[], userCoordinates?: Coordinates) => {
    if (!user) throw new Error('User not authenticated');
    if (items.length === 0) throw new Error('Cart is empty');

    try {
      // Grouper par vendeur
      const ordersByVendor = items.reduce((acc, item) => {
        if (!acc[item.seller_id]) {
          acc[item.seller_id] = [];
        }
        acc[item.seller_id].push(item);
        return acc;
      }, {} as Record<string, CartItem[]>);

      const orderIds: string[] = [];
      let totalAmount = 0;

      // Créer une commande par vendeur
      for (const [sellerId, vendorItems] of Object.entries(ordersByVendor)) {
        for (const item of vendorItems) {
          const orderTotal = item.price * item.quantity;
          totalAmount += orderTotal;

          const { data: order, error } = await supabase
            .from('marketplace_orders')
            .insert([{
              product_id: item.product_id || item.id, // Fallback à item.id si product_id n'existe pas
              buyer_id: user.id,
              seller_id: sellerId,
              quantity: item.quantity,
              unit_price: item.price,
              total_amount: orderTotal,
              status: 'pending',
              payment_status: 'pending',
              delivery_method: 'standard',
              delivery_coordinates: userCoordinates,
              pickup_coordinates: null,
            }] as any) // Utiliser 'as any' pour contourner les types générés
            .select()
            .single();

          if (error) throw error;
          if (order) orderIds.push(order.id);

          // Notifier le vendeur via system_notifications
          try {
            await supabase.from('system_notifications').insert({
              user_id: sellerId,
              title: 'Nouvelle commande',
              message: `Vous avez reçu une nouvelle commande pour ${item.name || 'un produit'}`,
              notification_type: 'marketplace_order',
              data: { order_id: order.id }
            });
          } catch (notifError) {
            console.error('Error creating notification:', notifError);
            // Ne pas bloquer la commande si la notification échoue
          }
        }
      }

      return { orderIds, totalAmount };
    } catch (error: any) {
      console.error('Error creating bulk order:', error);
      throw error;
    }
  };

  const markAsPreparing = async (orderId: string) => {
    const { error } = await supabase
      .from('marketplace_orders')
      .update({ status: 'preparing', updated_at: new Date().toISOString() })
      .eq('id', orderId);

    if (error) throw error;
    await loadOrders();
  };

  const markAsReady = async (orderId: string) => {
    const { error } = await supabase
      .from('marketplace_orders')
      .update({ status: 'ready_for_pickup', updated_at: new Date().toISOString() })
      .eq('id', orderId);

    if (error) throw error;
    await loadOrders();
  };

  const markAsInTransit = async (orderId: string) => {
    const { error } = await supabase
      .from('marketplace_orders')
      .update({ status: 'in_transit', updated_at: new Date().toISOString() })
      .eq('id', orderId);

    if (error) throw error;
    await loadOrders();
  };

  const markAsDelivered = async (orderId: string) => {
    const { error } = await supabase
      .from('marketplace_orders')
      .update({ status: 'delivered', updated_at: new Date().toISOString() })
      .eq('id', orderId);

    if (error) throw error;
    await loadOrders();
  };

  const completeOrder = async (orderId: string, rating?: number, feedback?: string) => {
    try {
      // Appeler edge function pour libérer le paiement
      const { error: functionError } = await supabase.functions.invoke('release-escrow-payment', {
        body: { orderId }
      });

      if (functionError) throw functionError;

      // Mettre à jour le statut avec rating et feedback optionnels
      const updateData: any = { 
        status: 'completed', 
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString() 
      };

      if (rating !== undefined) updateData.customer_rating = rating;
      if (feedback) updateData.customer_feedback = feedback;

      const { error: updateError } = await supabase
        .from('marketplace_orders')
        .update(updateData)
        .eq('id', orderId);

      if (updateError) throw updateError;

      await loadOrders();
      
      toast({
        title: '✅ Commande complétée',
        description: 'Le paiement a été libéré au vendeur',
      });
    } catch (error: any) {
      console.error('Error completing order:', error);
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive'
      });
      throw error;
    }
  };

  const createOrder = async (
    productId: string, 
    sellerId: string,
    quantity: number, 
    unitPrice: number,
    deliveryAddress?: string,
    coordinates?: Coordinates,
    deliveryMethod?: string,
    notes?: string
  ) => {
    if (!user) throw new Error('User not authenticated');

    const orderTotal = unitPrice * quantity;

    const { data, error } = await supabase
      .from('marketplace_orders')
      .insert([{
        product_id: productId,
        buyer_id: user.id,
        seller_id: sellerId,
        quantity,
        unit_price: unitPrice,
        total_amount: orderTotal,
        status: 'pending',
        payment_status: 'pending',
        delivery_address: deliveryAddress,
        delivery_coordinates: coordinates,
        delivery_method: deliveryMethod || 'standard',
        notes: notes,
      }] as any) // Utiliser 'as any' pour contourner les types générés
      .select()
      .single();

    if (error) throw error;
    await loadOrders();
    return data;
  };

  const updateOrderStatus = async (orderId: string, status: string, additionalData?: Record<string, any>) => {
    const updateData = { 
      status, 
      updated_at: new Date().toISOString(),
      ...additionalData 
    };

    const { error } = await supabase
      .from('marketplace_orders')
      .update(updateData)
      .eq('id', orderId);

    if (error) throw error;
    await loadOrders();
  };

  const confirmOrder = async (orderId: string) => {
    await updateOrderStatus(orderId, 'confirmed');
  };

  const cancelOrder = async (orderId: string, reason?: string, cancellationType?: string) => {
    const additionalData: Record<string, any> = {};
    if (reason) additionalData.vendor_rejection_reason = reason;
    if (cancellationType) additionalData.notes = cancellationType;
    
    await updateOrderStatus(orderId, 'cancelled', additionalData);
  };

  const refetch = loadOrders;

  return {
    orders,
    loading,
    createBulkOrder,
    createOrder,
    updateOrderStatus,
    confirmOrder,
    cancelOrder,
    markAsPreparing,
    markAsReady,
    markAsInTransit,
    markAsDelivered,
    completeOrder,
    refetch,
  };
};
