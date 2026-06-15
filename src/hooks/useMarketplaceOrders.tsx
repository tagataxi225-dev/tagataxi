import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useWallet } from './useWallet';

interface MarketplaceOrder {
  id: string;
  buyer_id: string;
  seller_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  delivery_address?: string;
  delivery_coordinates?: any;
  pickup_coordinates?: any;
  status: string;
  payment_status: string;
  delivery_method: string;
  delivery_fee?: number;
  vendor_approved_at?: string;
  delivery_fee_approved_by_buyer?: boolean;
  vendor_delivery_method?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  confirmed_at?: string;
  preparing_at?: string;
  ready_for_pickup_at?: string;
  in_transit_at?: string;
  delivery_attempted_at?: string;
  delivered_at?: string;
  completed_at?: string;
  estimated_delivery_time?: string;
  driver_notes?: string;
  customer_rating?: number;
  customer_feedback?: string;
  product?: {
    title: string;
    price: number;
    images: string[];
    seller: {
      display_name: string;
    };
  };
  buyer?: {
    display_name: string;
    phone_number?: string;
  };
  seller?: {
    display_name: string;
    phone_number?: string;
  };
  escrow_payment?: {
    id: string;
    status: string;
    amount: number;
  };
}

export const useMarketplaceOrders = () => {
  const { user } = useAuth();
  const { wallet, transferFunds } = useWallet();
  const [orders, setOrders] = useState<MarketplaceOrder[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch orders avec JOIN optimisé et PAGINATION (PHASE 1.3)
  const fetchOrders = async (page: number = 1, pageSize: number = 20) => {
    if (!user) return;

    try {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      // ✅ CORRECTION : Utiliser foreign keys pour LEFT JOIN automatique + pagination
      const { data, error, count } = await supabase
        .from('marketplace_orders')
        .select(`
          *,
          marketplace_products!inner(title, price, images, seller_id),
          buyer:profiles!fk_marketplace_orders_buyer(display_name, phone_number),
          seller:profiles!fk_marketplace_orders_seller(display_name, phone_number),
          escrow_payments(id, status, amount)
        `, { count: 'exact' })
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      const formattedOrders = data?.map(order => ({
        ...order,
        product: {
          title: order.marketplace_products.title,
          price: order.marketplace_products.price,
          images: Array.isArray(order.marketplace_products.images) 
            ? order.marketplace_products.images as string[] 
            : [],
          seller: {
            display_name: order.seller?.display_name || 'Vendeur inconnu'
          }
        },
        buyer: {
          display_name: order.buyer?.display_name || 'Acheteur',
          phone_number: order.buyer?.phone_number
        },
        seller: {
          display_name: order.seller?.display_name || 'Vendeur',
          phone_number: order.seller?.phone_number
        },
        escrow_payment: order.escrow_payments?.[0]
      })) || [];

      setOrders(formattedOrders);

      return {
        data: formattedOrders,
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize)
      };
    } catch (error) {
      console.error('Error fetching orders:', error);
      return { data: [], totalCount: 0, totalPages: 0 };
    }
  };

  // Create an order with flexible payment
  const createOrderFlexible = async (orderData: {
    productId: string;
    sellerId: string;
    quantity: number;
    unitPrice: number;
    deliveryAddress?: string;
    deliveryCoordinates?: any;
    deliveryMethod: string;
    notes?: string;
    paymentMethod: 'wallet' | 'mobile_money';
    paymentData?: any;
  }) => {
    if (!user) return null;

    // Pas de frais de livraison au début - sera fixé par le vendeur
    const subtotal = orderData.quantity * orderData.unitPrice;
    const totalAmount = subtotal; // Montant initial = prix produit seulement

    // Only check wallet balance if using wallet payment
    if (orderData.paymentMethod === 'wallet') {
      if (!wallet || wallet.balance < totalAmount) {
        throw new Error('Solde insuffisant. Veuillez utiliser Mobile Money ou recharger votre portefeuille.');
      }
    }

    try {
      // Create the order
      const { data: order, error: orderError } = await supabase
        .from('marketplace_orders')
        .insert({
          buyer_id: user.id,
          seller_id: orderData.sellerId,
          product_id: orderData.productId,
          quantity: orderData.quantity,
          unit_price: orderData.unitPrice,
          total_amount: totalAmount,
          delivery_address: orderData.deliveryAddress,
          delivery_coordinates: orderData.deliveryCoordinates,
          pickup_coordinates: orderData.deliveryCoordinates,
          delivery_method: orderData.deliveryMethod,
          delivery_fee: null, // Sera défini par le vendeur
          notes: orderData.notes,
          status: 'pending', // En attente validation vendeur
          payment_status: 'pending'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      if (orderData.paymentMethod === 'wallet') {
        // Create escrow payment (hold funds from wallet)
        const { error: escrowError } = await supabase
          .from('escrow_payments')
          .insert({
            order_id: order.id,
            buyer_id: user.id,
            seller_id: orderData.sellerId,
            amount: totalAmount,
            payment_method: 'wallet',
            status: 'held'
          });

        if (escrowError) throw escrowError;

        // Deduct from buyer's wallet (funds held in escrow)
        await transferFunds(
          'system',
          totalAmount,
          `Paiement en séquestre pour commande ${order.id}`
        );

        // Update order payment status and move to pending confirmation
        await supabase
          .from('marketplace_orders')
          .update({ 
            payment_status: 'held',
            status: 'pending' 
          })
          .eq('id', order.id);
      } else {
        // Mobile Money payment - create payment record
        const { error: escrowError } = await supabase
          .from('escrow_payments')
          .insert({
            order_id: order.id,
            buyer_id: user.id,
            seller_id: orderData.sellerId,
            amount: totalAmount,
            payment_method: 'mobile_money',
            transaction_reference: orderData.paymentData?.transactionId,
            status: 'held'
          });

        if (escrowError) throw escrowError;
      }

      // Call Edge Function to process the order (notifications, etc.)
      try {
        await supabase.functions.invoke('process-marketplace-order', {
          body: { orderId: order.id }
        });
      } catch (processError) {
        console.error('Failed to process order:', processError);
        // Ne pas faire échouer la commande pour une erreur de traitement
      }

      fetchOrders();
      return order.id;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  };

  // Legacy create order method for backward compatibility
  const createOrder = async (
    productId: string,
    sellerId: string,
    quantity: number,
    unitPrice: number,
    deliveryAddress?: string,
    deliveryCoordinates?: any,
    deliveryMethod: string = 'pickup',
    notes?: string
  ) => {
    return createOrderFlexible({
      productId,
      sellerId,
      quantity,
      unitPrice,
      deliveryAddress,
      deliveryCoordinates,
      deliveryMethod,
      notes,
      paymentMethod: 'wallet'
    });
  };

  // Update order status via Edge Function
  const updateOrderStatus = async (orderId: string, newStatus: string, metadata: any = {}) => {
    try {
      const { data, error } = await supabase.functions.invoke('handle-order-status-change', {
        body: { 
          orderId, 
          newStatus,
          metadata 
        }
      });

      if (error) throw error;

      fetchOrders();
      return data;
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  };

  // Confirm order (seller accepts)
  const confirmOrder = async (orderId: string) => {
    return updateOrderStatus(orderId, 'confirmed');
  };

  // Mark order as preparing
  const markAsPreparing = async (orderId: string) => {
    return updateOrderStatus(orderId, 'preparing');
  };

  // Mark order as ready for pickup/delivery
  const markAsReady = async (orderId: string) => {
    return updateOrderStatus(orderId, 'ready_for_pickup');
  };

  // Mark order as in transit (for delivery)
  const markAsInTransit = async (orderId: string, driverId?: string) => {
    return updateOrderStatus(orderId, 'in_transit', { driver_id: driverId });
  };

  // Mark as delivered
  const markAsDelivered = async (orderId: string, driverNotes?: string) => {
    return updateOrderStatus(orderId, 'delivered', { driver_notes: driverNotes });
  };

  // Complete order (buyer confirms receipt)
  const completeOrder = async (orderId: string, rating?: number, feedback?: string) => {
    try {
      // Appeler la nouvelle Edge Function qui gère tout le processus
      const { data, error } = await supabase.functions.invoke('complete-marketplace-order', {
        body: { 
          orderId, 
          rating,
          feedback 
        }
      });

      if (error) throw error;

      fetchOrders();
      return data;
    } catch (error) {
      console.error('Error completing order:', error);
      throw error;
    }
  };

  // Cancel order
  const cancelOrder = async (orderId: string, reason?: string, cancellationType?: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Get order details first
      const { data: order, error: orderFetchError } = await supabase
        .from('marketplace_orders')
        .select('*, escrow_payments(*)')
        .eq('id', orderId)
        .single();

      if (orderFetchError) throw orderFetchError;
      if (!order) throw new Error('Order not found');

      const statusAtCancellation = order.status;

      // Update order status
      const { error: orderError } = await supabase
        .from('marketplace_orders')
        .update({
          status: 'cancelled',
          payment_status: 'refunded',
          notes: reason
        })
        .eq('id', orderId);

      if (orderError) throw orderError;

      // Refund escrow payment
      const { error: escrowError } = await supabase
        .from('escrow_payments')
        .update({
          status: 'refunded',
          refunded_at: new Date().toISOString()
        })
        .eq('order_id', orderId);

      if (escrowError) throw escrowError;

      // Log cancellation to history
      const { error: historyError } = await supabase
        .from('cancellation_history')
        .insert({
          reference_id: orderId,
          reference_type: 'marketplace_order',
          cancelled_by: user.id,
          cancellation_type: cancellationType || 'customer_request',
          status_at_cancellation: statusAtCancellation,
          reason: reason || 'No reason provided',
          financial_impact: {
            refund_amount: order.total_amount,
            currency: 'CDF',
            escrow_payment_id: order.escrow_payments?.[0]?.id
          },
          metadata: {
            payment_method: order.escrow_payments?.[0]?.payment_method,
            product_id: order.product_id,
            quantity: order.quantity
          }
        });

      if (historyError) {
        console.error('Error logging cancellation:', historyError);
      }

      fetchOrders();
    } catch (error) {
      console.error('Error cancelling order:', error);
      throw error;
    }
  };

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('marketplace-orders-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'marketplace_orders',
        filter: `buyer_id=eq.${user.id}`
      }, () => {
        fetchOrders();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'marketplace_orders',
        filter: `seller_id=eq.${user.id}`
      }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Initial fetch
  useEffect(() => {
    if (user) {
      fetchOrders().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user]);

  // Accept delivery fee (buyer)
  const acceptDeliveryFee = async (orderId: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { error } = await supabase.functions.invoke('accept-delivery-fee', {
        body: { orderId, buyerId: user.id }
      });

      if (error) throw error;
      
      fetchOrders();
    } catch (error) {
      console.error('Error accepting delivery fee:', error);
      throw error;
    }
  };

  // Create bulk orders grouped by vendor (Sprint 1 optimization)
  const createBulkOrder = async (
    cartItems: Array<{
      id: string;
      seller_id: string;
      price: number;
      quantity: number;
      coordinates?: { lat: number; lng: number };
    }>,
    userCoordinates?: { lat: number; lng: number }
  ) => {
    if (!user) throw new Error('User not authenticated');

    // Group items by seller
    const vendorGroups = cartItems.reduce((groups, item) => {
      if (!groups[item.seller_id]) {
        groups[item.seller_id] = [];
      }
      groups[item.seller_id].push(item);
      return groups;
    }, {} as Record<string, typeof cartItems>);

    const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // ✅ PHASE 1: Créer le wallet automatiquement s'il n'existe pas
    if (!wallet) {
      try {
        const { data: newWallet, error: walletError } = await supabase
          .from('user_wallets')
          .insert({ 
            user_id: user.id, 
            balance: 0, 
            bonus_balance: 0 
          })
          .select()
          .single();
        
        if (walletError) {
          throw new Error('Impossible de créer votre portefeuille. Contactez le support.');
        }
        
        throw new Error(`Solde insuffisant (0 CDF). Rechargez votre compte pour continuer.`);
      } catch (error: any) {
        throw new Error(error.message || 'Erreur de création du portefeuille');
      }
    }

    // Check wallet balance
    if (wallet.balance < totalAmount) {
      throw new Error(`Solde insuffisant. Vous avez ${wallet.balance.toLocaleString()} CDF mais il vous faut ${totalAmount.toLocaleString()} CDF.`);
    }

    try {
      const orderIds: string[] = [];

      // Create one order per vendor
      for (const [sellerId, items] of Object.entries(vendorGroups)) {
        for (const item of items) {
          const itemTotal = item.price * item.quantity;

          // Create order
          const { data: order, error: orderError } = await supabase
            .from('marketplace_orders')
            .insert({
              buyer_id: user.id,
              seller_id: sellerId,
              product_id: item.id,
              quantity: item.quantity,
              unit_price: item.price,
              total_amount: itemTotal,
              delivery_address: userCoordinates ? `${userCoordinates.lat}, ${userCoordinates.lng}` : undefined,
              delivery_coordinates: userCoordinates,
              pickup_coordinates: item.coordinates,
              delivery_method: 'pickup',
              status: 'pending',
              payment_status: 'pending',
              notes: `Commande groupée marketplace`
            })
            .select()
            .single();

          if (orderError) throw orderError;

          // Create escrow payment
          const { error: escrowError } = await supabase
            .from('escrow_payments')
            .insert({
              order_id: order.id,
              buyer_id: user.id,
              seller_id: sellerId,
              amount: itemTotal,
              payment_method: 'wallet',
              status: 'held'
            });

          if (escrowError) throw escrowError;

          orderIds.push(order.id);
        }
      }

      // Deduct total from wallet
      await transferFunds(
        'system',
        totalAmount,
        `Paiement groupé pour ${orderIds.length} commande(s)`
      );

      // Update all orders to held status
      await supabase
        .from('marketplace_orders')
        .update({ 
          payment_status: 'held',
          status: 'pending'
        })
        .in('id', orderIds);

      fetchOrders();
      return orderIds;

    } catch (error) {
      console.error('Error creating bulk order:', error);
      throw error;
    }
  };

  return {
    orders,
    loading,
    createOrder,
    createOrderFlexible,
    createBulkOrder,
    updateOrderStatus,
    confirmOrder,
    markAsPreparing,
    markAsReady,
    markAsInTransit,
    markAsDelivered,
    completeOrder,
    cancelOrder,
    acceptDeliveryFee,
    refetch: fetchOrders
  };
};