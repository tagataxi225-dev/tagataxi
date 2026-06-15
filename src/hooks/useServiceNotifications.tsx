import { useMemo } from 'react';
import { useLottery } from './useLottery';
import { useOrderNotifications } from './useOrderNotifications';

interface ServiceNotificationCounts {
  transport: number;
  delivery: number;
  marketplace: number;
  food: number;
  rental: number;
}

export const useServiceNotifications = (): ServiceNotificationCounts => {
  const { myWins } = useLottery();
  const { unreadCount: orderUnreadCount, notifications: orderNotifications } = useOrderNotifications();

  const serviceCounts = useMemo(() => {
    // Food: notifications de commandes food non lues
    const foodCount = orderNotifications?.filter(
      notification => 
        !notification.is_read && 
        ['food_order', 'food_status', 'food_delivery'].includes(notification.notification_type)
    ).length || 0;

    // Delivery: notifications de livraison non lues
    const deliveryCount = orderNotifications?.filter(
      notification => 
        !notification.is_read && 
        ['delivery_status_update', 'delivery_pickup', 'delivery_completed'].includes(notification.notification_type)
    ).length || 0;

    // Marketplace: notifications de commandes marketplace non lues
    const marketplaceCount = orderNotifications?.filter(
      notification => 
        !notification.is_read && 
        ['marketplace_order', 'marketplace_message', 'marketplace_status'].includes(notification.notification_type)
    ).length || 0;

    // Transport: notifications de transport non lues (pour le futur)
    const transportCount = orderNotifications?.filter(
      notification => 
        !notification.is_read && 
        ['transport_booking', 'transport_status', 'trip_update'].includes(notification.notification_type)
    ).length || 0;

    // Rental: notifications de location non lues (pour le futur)
    const rentalCount = orderNotifications?.filter(
      notification => 
        !notification.is_read && 
        ['rental_booking', 'rental_reminder', 'rental_status'].includes(notification.notification_type)
    ).length || 0;

    return {
      transport: transportCount,
      delivery: deliveryCount,
      marketplace: marketplaceCount,
      food: foodCount,
      rental: rentalCount
    };
  }, [orderNotifications]);

  return serviceCounts;
};