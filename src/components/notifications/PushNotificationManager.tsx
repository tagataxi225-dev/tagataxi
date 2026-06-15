import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { unifiedNotificationService } from '@/services/unifiedNotificationService';

export const PushNotificationManager = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Initialiser le service
    unifiedNotificationService.initialize();

    // Subscribe to transport booking updates
    const transportChannel = supabase
      .channel('transport-notifications')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'transport_bookings',
          filter: `user_id=eq.${user.id}`
        },
        async (payload) => {
          const { status, driver_id } = payload.new;
          
          if (status === 'accepted' && driver_id) {
            await unifiedNotificationService.notifyTransport('driver_assigned');
          } else if (status === 'driver_arrived') {
            await unifiedNotificationService.notifyTransport('driver_arrived');
          } else if (status === 'in_progress') {
            await unifiedNotificationService.notifyTransport('in_progress');
          } else if (status === 'completed') {
            await unifiedNotificationService.notifyTransport('completed');
          }
        }
      )
      .subscribe();

    // Subscribe to delivery order updates
    const deliveryChannel = supabase
      .channel('delivery-notifications')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'delivery_orders',
          filter: `user_id=eq.${user.id}`
        },
        async (payload) => {
          const { status } = payload.new;
          
          if (status === 'confirmed') {
            await unifiedNotificationService.notifyDelivery('confirmed');
          } else if (status === 'driver_assigned' || status === 'picked_up') {
            await unifiedNotificationService.notifyDelivery('picked_up');
          } else if (status === 'in_transit') {
            await unifiedNotificationService.notifyDelivery('in_transit');
          } else if (status === 'delivered') {
            await unifiedNotificationService.notifyDelivery('delivered');
          }
        }
      )
      .subscribe();

    // Subscribe to marketplace order updates
    const marketplaceChannel = supabase
      .channel('marketplace-notifications')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'marketplace_orders',
          filter: `buyer_id=eq.${user.id}`
        },
        async (payload) => {
          const { status } = payload.new;
          
          if (status === 'confirmed') {
            await unifiedNotificationService.notify({
              title: '🛍️ Commande acceptée',
              message: 'Le vendeur a accepté votre commande',
              category: 'marketplace',
              priority: 'high'
            });
          } else if (status === 'shipped') {
            await unifiedNotificationService.notify({
              title: '📮 Commande expédiée',
              message: 'Votre article est en route',
              category: 'marketplace',
              priority: 'normal',
              action: { label: 'Suivre', url: '/marketplace/tracking' }
            });
          } else if (status === 'delivered') {
            await unifiedNotificationService.notify({
              title: '✅ Commande livrée',
              message: 'Profitez de votre achat !',
              category: 'marketplace',
              priority: 'high',
              action: { label: 'Noter', url: '/marketplace/rating' }
            });
          }
        }
      )
      .subscribe();

    // Subscribe to restaurant food orders
    const foodChannel = supabase
      .channel('food-notifications')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'food_orders',
          filter: `user_id=eq.${user.id}`
        },
        async (payload) => {
          const { status } = payload.new;
          
          if (status === 'confirmed') {
            await unifiedNotificationService.notify({
              title: '🍽️ Commande confirmée',
              message: 'Le restaurant prépare votre commande',
              category: 'food',
              priority: 'normal'
            });
          } else if (status === 'preparing') {
            await unifiedNotificationService.notify({
              title: '👨‍🍳 En cours de préparation',
              message: 'Votre repas est en cours de préparation',
              category: 'food',
              priority: 'low'
            });
          } else if (status === 'ready') {
            await unifiedNotificationService.notify({
              title: '✅ Commande prête',
              message: 'Votre commande est prête',
              category: 'food',
              priority: 'high'
            });
          } else if (status === 'out_for_delivery') {
            await unifiedNotificationService.notify({
              title: '🚗 En cours de livraison',
              message: 'Votre commande arrive !',
              category: 'food',
              priority: 'high',
              action: { label: 'Suivre', url: '/food/tracking' }
            });
          } else if (status === 'delivered') {
            await unifiedNotificationService.notify({
              title: '🎉 Bon appétit !',
              message: 'Votre commande a été livrée',
              category: 'food',
              priority: 'high',
              action: { label: 'Noter', url: '/food/rating' }
            });
          }
        }
      )
      .subscribe();

    // Subscribe to rental booking updates (NOUVEAU)
    const rentalChannel = supabase
      .channel('rental-notifications')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rental_bookings',
          filter: `user_id=eq.${user.id}`
        },
        async (payload) => {
          const { status, payment_status } = payload.new;
          const oldStatus = payload.old?.status;
          
          // Ne notifier que si le statut a changé
          if (status === oldStatus) return;
          
          if (status === 'approved_by_partner') {
            await unifiedNotificationService.notifyRental('approved_by_partner', 'Payez maintenant pour confirmer !');
          } else if (status === 'confirmed') {
            await unifiedNotificationService.notifyRental('confirmed');
          } else if (status === 'in_progress') {
            await unifiedNotificationService.notifyRental('in_progress');
          } else if (status === 'completed') {
            await unifiedNotificationService.notifyRental('completed');
          } else if (status === 'cancelled' || status === 'rejected') {
            await unifiedNotificationService.notifyRental('cancelled');
          }
        }
      )
      .subscribe();

    // Subscribe to lottery wins
    const lotteryChannel = supabase
      .channel('lottery-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'lottery_wins',
          filter: `user_id=eq.${user.id}`
        },
        async (payload) => {
          const prizeAmount = (payload.new as any).prize_amount;
          await unifiedNotificationService.notifyLottery(true, `${prizeAmount} CDF`);
        }
      )
      .subscribe();

    // Subscribe to wallet transactions
    const walletChannel = supabase
      .channel('wallet-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'wallet_transactions',
          filter: `user_id=eq.${user.id}`
        },
        async (payload) => {
          const { transaction_type, amount, status } = payload.new as any;
          
          if (transaction_type === 'topup' && status === 'completed') {
            await unifiedNotificationService.notifyPayment('success', `${amount} CDF`);
          }
        }
      )
      .subscribe();

    // Cleanup
    return () => {
      supabase.removeChannel(transportChannel);
      supabase.removeChannel(deliveryChannel);
      supabase.removeChannel(marketplaceChannel);
      supabase.removeChannel(foodChannel);
      supabase.removeChannel(rentalChannel);
      supabase.removeChannel(lotteryChannel);
      supabase.removeChannel(walletChannel);
    };
  }, [user]);

  return null; // This is a headless component
};
