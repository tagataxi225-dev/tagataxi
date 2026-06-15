import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { notificationSoundService } from '@/services/notificationSound';

export const useFoodNotifications = (restaurantId?: string) => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !restaurantId) return;

    // Canal pour nouvelles commandes restaurant
    const ordersChannel = supabase
      .channel(`restaurant-orders-${restaurantId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'food_orders',
          filter: `restaurant_id=eq.${restaurantId}`
        },
        async (payload) => {
          const order = payload.new;
          
          // 🔊 Son professionnel marketplace (ka-ching)
          await notificationSoundService.playNotificationSound('newOrder');
          
          toast.success('🍽️ Nouvelle commande !', {
            description: `Commande #${order.order_number} - ${order.total_amount} CDF`,
            duration: 10000,
          });

          // Notification browser native
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('🍽️ Nouvelle commande !', {
              body: `Commande #${order.order_number} - ${order.total_amount} CDF`,
              icon: '/logo.png',
              badge: '/logo.png',
              tag: `food-order-${order.id}`,
              requireInteraction: true
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'food_orders',
          filter: `restaurant_id=eq.${restaurantId}`
        },
        async (payload) => {
          const order = payload.new;
          
          if (order.status === 'delivered') {
            await notificationSoundService.playNotificationSound('deliveryCompleted');
            toast.success('✅ Commande livrée', {
              description: `#${order.order_number} confirmée`,
            });
          } else if (order.status === 'cancelled') {
            await notificationSoundService.playNotificationSound('error');
            toast.error('❌ Commande annulée', {
              description: `#${order.order_number} a été annulée`,
              duration: 8000,
            });
          } else if (order.status === 'preparing') {
            await notificationSoundService.playNotificationSound('orderConfirmed');
            toast.info('👨‍🍳 En préparation', {
              description: `#${order.order_number} est en cours`,
            });
          } else if (order.status === 'ready') {
            await notificationSoundService.playNotificationSound('success');
            toast.success('🔔 Commande prête !', {
              description: `#${order.order_number} prête pour livraison`,
              duration: 8000,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
    };
  }, [user, restaurantId]);
};
