import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { useUserRoles } from './useUserRoles';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useModernNotifications } from './useModernNotifications';
import { PushNotificationToastData } from '@/components/notifications/PushNotificationToast';

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  metadata?: any;
}

interface UseRealtimeNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  toasts: PushNotificationToastData[];
  showModernToast: (notification: Omit<PushNotificationToastData, 'id' | 'timestamp'>) => void;
}

export const useRealtimeNotifications = (): UseRealtimeNotificationsReturn => {
  const { user } = useAuth();
  const { hasRole, hasPermission } = useUserRoles();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { toasts, showToast, removeToast } = useModernNotifications();

  useEffect(() => {
    if (!user?.id) return;

    // Channel pour les notifications générales
    const generalChannel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transport_bookings',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          handleTransportBookingUpdate(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'delivery_orders',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          handleDeliveryUpdate(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'marketplace_orders',
          filter: `buyer_id=eq.${user.id}`
        },
        (payload) => {
          handleMarketplaceUpdate(payload);
        }
      )
      .subscribe();

    // Channel pour les chauffeurs
    let driverChannel;
    if (hasRole('driver')) {
      driverChannel = supabase
        .channel('driver-notifications')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'transport_bookings',
            filter: `driver_id=eq.${user.id}`
          },
          (payload) => {
            handleDriverBookingUpdate(payload);
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'driver_requests',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            handleDriverRequestUpdate(payload);
          }
        )
        .subscribe();
    }

    // Channel pour les admins
    let adminChannel;
    if (hasPermission('system_admin') || hasPermission('analytics_read')) {
      adminChannel = supabase
        .channel('admin-notifications')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'enhanced_support_tickets'
          },
          (payload) => {
            handleSupportTicketUpdate(payload);
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'driver_requests'
          },
          (payload) => {
            handleNewDriverRequest(payload);
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'credit_transactions'
          },
          (payload) => {
            handleCreditTransactionUpdate(payload);
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'wallet_transactions',
            filter: 'description.ilike.*commission*'
          },
          (payload) => {
            handleCommissionUpdate(payload);
          }
        )
        .subscribe();
    }

    return () => {
      generalChannel.unsubscribe();
      driverChannel?.unsubscribe();
      adminChannel?.unsubscribe();
    };
  }, [user?.id, hasRole, hasPermission]);

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      read: false
    };

    setNotifications(prev => [newNotification, ...prev.slice(0, 49)]); // Garder max 50 notifications

    // Afficher un toast moderne pour toutes les notifications
    const toastTypeMap = {
      'info': 'system' as const,
      'success': 'system' as const,
      'warning': 'system' as const,
      'error': 'system' as const
    };

    const priorityMap = {
      'error': 'urgent' as const,
      'warning': 'high' as const,
      'success': 'normal' as const,
      'info': 'low' as const
    };

    showToast({
      id: newNotification.id,
      type: toastTypeMap[notification.type],
      priority: priorityMap[notification.type],
      title: notification.title,
      message: notification.message,
      metadata: notification.metadata
    });

    return newNotification;
  };

  const handleTransportBookingUpdate = (payload: any) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    switch (eventType) {
      case 'INSERT':
        addNotification({
          type: 'info',
          title: 'Nouvelle réservation',
          message: `Votre réservation de ${newRecord.pickup_location} vers ${newRecord.destination_location} a été créée.`,
          metadata: { bookingId: newRecord.id }
        });
        break;
      
      case 'UPDATE':
        if (oldRecord.status !== newRecord.status) {
          const statusMessages = {
            confirmed: 'Votre réservation a été confirmée',
            in_progress: 'Votre course a commencé',
            completed: 'Votre course est terminée',
            cancelled: 'Votre réservation a été annulée'
          };
          
          addNotification({
            type: newRecord.status === 'cancelled' ? 'warning' : 'success',
            title: 'Statut de réservation mis à jour',
            message: statusMessages[newRecord.status as keyof typeof statusMessages] || 'Statut mis à jour',
            metadata: { bookingId: newRecord.id }
          });
        }
        break;
    }
  };

  const handleDeliveryUpdate = (payload: any) => {
    const { eventType, new: newRecord } = payload;
    
    if (eventType === 'INSERT') {
      addNotification({
        type: 'info',
        title: 'Nouvelle commande de livraison',
        message: `Livraison ${newRecord.delivery_type} de ${newRecord.pickup_location} vers ${newRecord.delivery_location}`,
        metadata: { deliveryId: newRecord.id }
      });
    }
  };

  const handleMarketplaceUpdate = (payload: any) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    if (eventType === 'UPDATE' && oldRecord.status !== newRecord.status) {
      const statusMessages = {
        confirmed: 'Votre commande a été confirmée par le vendeur',
        shipped: 'Votre commande a été expédiée',
        delivered: 'Votre commande a été livrée',
        cancelled: 'Votre commande a été annulée'
      };
      
      addNotification({
        type: newRecord.status === 'cancelled' ? 'warning' : 'success',
        title: 'Commande marketplace mise à jour',
        message: statusMessages[newRecord.status as keyof typeof statusMessages] || 'Statut mis à jour',
        metadata: { orderId: newRecord.id }
      });
    }
  };

  const handleDriverBookingUpdate = (payload: any) => {
    const { eventType, new: newRecord } = payload;

    if (eventType === 'INSERT') {
      const newNotification = addNotification({
        type: 'info',
        title: 'Nouvelle course assignée',
        message: `Course de ${newRecord.pickup_location} vers ${newRecord.destination_location}`,
        metadata: { bookingId: newRecord.id }
      });
      setTimeout(() => removeToast(newNotification.id), 6000);
    }
  };

  const handleDriverRequestUpdate = (payload: any) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    if (eventType === 'UPDATE' && oldRecord.status !== newRecord.status) {
      const statusMessages = {
        approved: 'Votre demande de chauffeur a été approuvée! 🎉',
        rejected: 'Votre demande de chauffeur a été rejetée',
        pending_admin: 'Votre demande est en cours de validation admin'
      };
      
      addNotification({
        type: newRecord.status === 'approved' ? 'success' : newRecord.status === 'rejected' ? 'error' : 'info',
        title: 'Demande chauffeur mise à jour',
        message: statusMessages[newRecord.status as keyof typeof statusMessages] || 'Statut mis à jour',
        metadata: { requestId: newRecord.id }
      });
    }
  };

  const handleSupportTicketUpdate = (payload: any) => {
    const { eventType, new: newRecord } = payload;
    
    if (eventType === 'INSERT') {
      addNotification({
        type: 'warning',
        title: 'Nouveau ticket de support',
        message: `Ticket #${newRecord.ticket_number}: ${newRecord.subject}`,
        metadata: { ticketId: newRecord.id }
      });
    }
  };

  const handleNewDriverRequest = (payload: any) => {
    const { new: newRecord } = payload;
    
    addNotification({
      type: 'info',
      title: 'Nouvelle demande chauffeur',
      message: `Demande de validation pour ${newRecord.license_number}`,
      metadata: { requestId: newRecord.id }
    });
  };

  const handleCreditTransactionUpdate = (payload: any) => {
    const { eventType, new: newRecord } = payload;
    
    if (eventType === 'INSERT' && hasPermission('finance_read')) {
      const isTopup = newRecord.transaction_type === 'credit' && newRecord.description?.includes('Recharge');
      const isDeduction = newRecord.transaction_type === 'debit';
      
      addNotification({
        type: isTopup ? 'success' : 'info',
        title: 'Transaction de crédit',
        message: `${isTopup ? 'Recharge' : 'Déduction'} de ${newRecord.amount} CDF par chauffeur`,
        metadata: { transactionId: newRecord.id, driverId: newRecord.driver_id }
      });
    }
  };

  const handleCommissionUpdate = (payload: any) => {
    const { eventType, new: newRecord } = payload;
    
    if (eventType === 'INSERT' && hasPermission('finance_read')) {
      addNotification({
        type: 'success',
        title: 'Commission générée',
        message: `Commission de ${newRecord.amount} CDF enregistrée`,
        metadata: { 
          transactionId: newRecord.id, 
          amount: newRecord.amount,
          service: newRecord.reference_type 
        }
      });
    }
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    toasts,
    showModernToast: showToast
  };
};