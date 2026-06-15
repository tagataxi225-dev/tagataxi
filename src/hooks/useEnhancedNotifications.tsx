import { useEffect, useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useUserRoles } from './useUserRoles';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useNotificationPermissions } from './useNotificationPermissions';
import { useNotificationPreferences } from './useNotificationPreferences';

interface EnhancedNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'ride' | 'delivery' | 'payment' | 'chat' | 'system' | 'marketing' | 'urgent' | 'reward';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority?: 'low' | 'normal' | 'high';
  metadata?: any;
  avatar?: string;
  category?: string;
  source?: string;
  actionUrl?: string;
}

interface UseEnhancedNotificationsReturn {
  notifications: EnhancedNotification[];
  unreadCount: number;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  addNotification: (notification: Omit<EnhancedNotification, 'id' | 'timestamp' | 'read'>) => void;
  removeNotification: (notificationId: string) => void;
  getNotificationsByCategory: (category: string) => EnhancedNotification[];
  searchNotifications: (query: string) => EnhancedNotification[];
}

export const useEnhancedNotifications = (): UseEnhancedNotificationsReturn => {
  const { user } = useAuth();
  const { hasRole, hasPermission } = useUserRoles();
  const { showNotification } = useNotificationPermissions();
  const { shouldShowNotification } = useNotificationPreferences();
  const [notifications, setNotifications] = useState<EnhancedNotification[]>([]);

  useEffect(() => {
    if (!user?.id) return;

    // Load notifications from localStorage
    const storageKey = `notifications_${user.id}`;
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        setNotifications(JSON.parse(stored));
      } catch (error) {
        console.error('Error loading notifications from localStorage:', error);
      }
    }

    // Channel pour les notifications générales
    const generalChannel = supabase
      .channel('enhanced-notifications')
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
          filter: `buyer_id=eq.${user.id}` // Corrected: buyer_id
        },
        (payload) => {
          handleMarketplaceUpdate(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          handleChatUpdate(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lottery_wins',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          handleLotteryUpdate(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'driver_challenges'
        },
        (payload) => {
          if (hasRole('driver')) {
            handleChallengeUpdate(payload);
          }
        }
      )
      .subscribe();

    // Channel pour les chauffeurs
    let driverChannel;
    if (hasRole('driver')) {
      driverChannel = supabase
        .channel('driver-enhanced-notifications')
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
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'wallet_transactions', // Corrected: wallet_transactions instead of credit_transactions
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            handleCreditUpdate(payload);
          }
        )
        .subscribe();
    }

    // Channel pour les admins
    let adminChannel;
    if (hasPermission('system_admin') || hasPermission('analytics_read')) {
      adminChannel = supabase
        .channel('admin-enhanced-notifications')
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
        .subscribe();
    }

    return () => {
      generalChannel.unsubscribe();
      driverChannel?.unsubscribe();
      adminChannel?.unsubscribe();
    };
  }, [user?.id, hasRole, hasPermission]);

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    if (user?.id && notifications.length > 0) {
      const storageKey = `notifications_${user.id}`;
      localStorage.setItem(storageKey, JSON.stringify(notifications.slice(0, 100))); // Keep only last 100
    }
  }, [notifications, user?.id]);

  const addNotification = useCallback((notification: Omit<EnhancedNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: EnhancedNotification = {
      ...notification,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      read: false
    };

    setNotifications(prev => [newNotification, ...prev.slice(0, 99)]); // Keep max 100 notifications

    // Show browser notification if enabled and allowed
    if (shouldShowNotification(notification.type, notification.priority)) {
      showNotification(notification.title, {
        body: notification.message,
        tag: `kwenda-${notification.type}`,
        data: notification.metadata
      });
    }

    // Show toast for important notifications
    if (notification.priority === 'high' || notification.type === 'error' || notification.type === 'urgent') {
      toast({
        title: notification.title,
        description: notification.message,
        variant: notification.type === 'error' ? 'destructive' : 'default'
      });
    }
  }, [shouldShowNotification, showNotification]);

  const handleTransportBookingUpdate = (payload: any) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    switch (eventType) {
      case 'INSERT':
        addNotification({
          type: 'ride',
          title: 'Nouvelle réservation',
          message: `Votre réservation de ${newRecord.pickup_location} vers ${newRecord.destination_location} a été créée.`,
          priority: 'normal',
          category: 'transport',
          metadata: { bookingId: newRecord.id, type: 'ride_created' },
          actionUrl: `/bookings/${newRecord.id}`
        });
        break;
      
      case 'UPDATE':
        if (oldRecord.status !== newRecord.status) {
          const statusMessages = {
            confirmed: { message: 'Votre réservation a été confirmée', priority: 'high' as const },
            driver_assigned: { message: 'Un chauffeur a été assigné à votre course', priority: 'high' as const },
            driver_arrived: { message: 'Votre chauffeur est arrivé', priority: 'high' as const },
            in_progress: { message: 'Votre course a commencé', priority: 'normal' as const },
            completed: { message: 'Votre course est terminée', priority: 'normal' as const },
            cancelled: { message: 'Votre réservation a été annulée', priority: 'normal' as const }
          };
          
          const statusInfo = statusMessages[newRecord.status as keyof typeof statusMessages];
          if (statusInfo) {
            addNotification({
              type: newRecord.status === 'cancelled' ? 'warning' : 'success',
              title: 'Statut de réservation mis à jour',
              message: statusInfo.message,
              priority: statusInfo.priority,
              category: 'transport',
              metadata: { bookingId: newRecord.id, status: newRecord.status },
              actionUrl: `/bookings/${newRecord.id}`
            });
          }
        }
        break;
    }
  };

  const handleDeliveryUpdate = (payload: any) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    if (eventType === 'INSERT') {
      addNotification({
        type: 'delivery',
        title: 'Nouvelle commande de livraison',
        message: `Livraison ${newRecord.delivery_type} de ${newRecord.pickup_location} vers ${newRecord.delivery_location}`,
        priority: 'normal',
        category: 'delivery',
        metadata: { deliveryId: newRecord.id, type: 'delivery_created' },
        actionUrl: `/deliveries/${newRecord.id}`
      });
    } else if (eventType === 'UPDATE' && oldRecord.status !== newRecord.status) {
      const statusMessages = {
        confirmed: 'Votre livraison a été confirmée',
        picked_up: 'Votre colis a été récupéré',
        in_transit: 'Votre colis est en transit',
        delivered: 'Votre colis a été livré',
        cancelled: 'Votre livraison a été annulée'
      };
      
      addNotification({
        type: newRecord.status === 'cancelled' ? 'warning' : 'success',
        title: 'Livraison mise à jour',
        message: statusMessages[newRecord.status as keyof typeof statusMessages] || 'Statut mis à jour',
        priority: newRecord.status === 'delivered' ? 'high' : 'normal',
        category: 'delivery',
        metadata: { deliveryId: newRecord.id, status: newRecord.status },
        actionUrl: `/deliveries/${newRecord.id}`
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
        priority: newRecord.status === 'delivered' ? 'high' : 'normal',
        category: 'marketplace',
        metadata: { orderId: newRecord.id, status: newRecord.status },
        actionUrl: `/marketplace/orders/${newRecord.id}`
      });
    }
  };

  const handleChatUpdate = (payload: any) => {
    const { eventType, new: newRecord } = payload;
    
    if (eventType === 'INSERT' && newRecord.sender_id !== user?.id) {
      addNotification({
        type: 'chat',
        title: 'Nouveau message',
        message: newRecord.content.substring(0, 100) + (newRecord.content.length > 100 ? '...' : ''),
        priority: 'normal',
        category: 'chat',
        metadata: { messageId: newRecord.id, conversationId: newRecord.conversation_id },
        actionUrl: `/chat/${newRecord.conversation_id}`
      });
    }
  };

  const handleLotteryUpdate = (payload: any) => {
    const { eventType, new: newRecord } = payload;
    
    if (eventType === 'INSERT') {
      addNotification({
        type: 'reward',
        title: '🎉 Félicitations ! Vous avez gagné !',
        message: `Vous avez remporté ${newRecord.prize_value} CDF à la loterie !`,
        priority: 'high',
        category: 'lottery',
        metadata: { winId: newRecord.id, amount: newRecord.prize_value },
        actionUrl: '/lottery'
      });
    }
  };

  const handleChallengeUpdate = (payload: any) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    if (eventType === 'UPDATE' && !oldRecord.is_completed && newRecord.is_completed) {
      addNotification({
        type: 'reward',
        title: '🏆 Défi terminé !',
        message: 'Félicitations ! Vous avez terminé un défi. Réclamez votre récompense !',
        priority: 'high',
        category: 'challenges',
        metadata: { challengeId: newRecord.challenge_id, driverChallengeId: newRecord.id },
        actionUrl: '/driver/challenges'
      });
    }
  };

  const handleDriverBookingUpdate = (payload: any) => {
    const { eventType, new: newRecord } = payload;
    
    if (eventType === 'INSERT') {
      addNotification({
        type: 'info',
        title: 'Nouvelle course assignée',
        message: `Course de ${newRecord.pickup_location} vers ${newRecord.destination_location}`,
        priority: 'high',
        category: 'driver',
        metadata: { bookingId: newRecord.id, type: 'ride_assigned' },
        actionUrl: `/driver/rides/${newRecord.id}`
      });
    }
  };

  const handleDriverRequestUpdate = (payload: any) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    if (eventType === 'UPDATE' && oldRecord.status !== newRecord.status) {
      const statusMessages = {
        approved: { message: 'Votre demande de chauffeur a été approuvée! 🎉', type: 'success' as const },
        rejected: { message: 'Votre demande de chauffeur a été rejetée', type: 'error' as const },
        pending_admin: { message: 'Votre demande est en cours de validation admin', type: 'info' as const }
      };
      
      const statusInfo = statusMessages[newRecord.status as keyof typeof statusMessages];
      if (statusInfo) {
        addNotification({
          type: statusInfo.type,
          title: 'Demande chauffeur mise à jour',
          message: statusInfo.message,
          priority: newRecord.status === 'approved' ? 'high' : 'normal',
          category: 'driver',
          metadata: { requestId: newRecord.id, status: newRecord.status },
          actionUrl: '/driver/profile'
        });
      }
    }
  };

  const handleCreditUpdate = (payload: any) => {
    const { eventType, new: newRecord } = payload;
    
    if (eventType === 'INSERT') {
      const isTopup = newRecord.transaction_type === 'credit' && newRecord.description?.includes('Recharge');
      const isLowBalance = newRecord.transaction_type === 'debit' && newRecord.balance_after < 1000; // Less than 1000 CDF
      
      if (isTopup) {
        addNotification({
          type: 'success',
          title: 'Recharge effectuée',
          message: `Votre compte a été rechargé de ${newRecord.amount} CDF`,
          priority: 'normal',
          category: 'wallet',
          metadata: { transactionId: newRecord.id, amount: newRecord.amount },
          actionUrl: '/driver/wallet'
        });
      } else if (isLowBalance) {
        addNotification({
          type: 'warning',
          title: 'Solde faible',
          message: `Votre solde est faible (${newRecord.balance_after} CDF). Rechargez votre compte.`,
          priority: 'high',
          category: 'wallet',
          metadata: { transactionId: newRecord.id, balance: newRecord.balance_after },
          actionUrl: '/driver/wallet'
        });
      }
    }
  };

  const handleSupportTicketUpdate = (payload: any) => {
    const { eventType, new: newRecord } = payload;
    
    if (eventType === 'INSERT') {
      addNotification({
        type: 'info',
        title: 'Nouveau ticket de support',
        message: `Ticket #${newRecord.ticket_number}: ${newRecord.subject}`,
        priority: newRecord.priority === 'high' ? 'high' : 'normal',
        category: 'support',
        metadata: { ticketId: newRecord.id, ticketNumber: newRecord.ticket_number },
        actionUrl: `/admin/support/${newRecord.id}`
      });
    }
  };

  const handleNewDriverRequest = (payload: any) => {
    const { new: newRecord } = payload;
    
    addNotification({
      type: 'info',
      title: 'Nouvelle demande chauffeur',
      message: `Demande de validation pour ${newRecord.license_number}`,
      priority: 'normal',
      category: 'admin',
      metadata: { requestId: newRecord.id, licenseNumber: newRecord.license_number },
      actionUrl: `/admin/drivers/requests/${newRecord.id}`
    });
  };

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    if (user?.id) {
      localStorage.removeItem(`notifications_${user.id}`);
    }
  }, [user?.id]);

  const removeNotification = useCallback((notificationId: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
  }, []);

  const getNotificationsByCategory = useCallback((category: string) => {
    return notifications.filter(notif => notif.category === category);
  }, [notifications]);

  const searchNotifications = useCallback((query: string) => {
    if (!query.trim()) return notifications;
    
    const lowercaseQuery = query.toLowerCase();
    return notifications.filter(notif =>
      notif.title.toLowerCase().includes(lowercaseQuery) ||
      notif.message.toLowerCase().includes(lowercaseQuery) ||
      notif.category?.toLowerCase().includes(lowercaseQuery) ||
      notif.type.toLowerCase().includes(lowercaseQuery)
    );
  }, [notifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    addNotification,
    removeNotification,
    getNotificationsByCategory,
    searchNotifications
  };
};