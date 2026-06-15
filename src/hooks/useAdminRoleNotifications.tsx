import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { NOTIFICATION_CONFIG } from '@/config/notificationConfig';
import { notificationSoundService } from '@/services/notificationSound';

interface AdminRoleNotification {
  id: string;
  user_id: string;
  notification_type: string;
  title: string;
  message: string;
  priority: string;
  data?: any;
  is_read: boolean;
  created_at: string;
  category: string;
}

export const useAdminRoleNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AdminRoleNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Récupérer les notifications
  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('unified_notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.is_read).length || 0);
    } catch (error) {
      console.error('Error fetching admin role notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Marquer comme lu
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('unified_notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  // Marquer toutes comme lues
  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('unified_notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, [user]);

  // Dispatcher une notification (helper pour autres composants)
  const dispatchAdminNotification = useCallback(async (params: {
    event_type: string;
    entity_id: string;
    entity_type: string;
    title: string;
    message: string;
    severity?: 'info' | 'warning' | 'error' | 'success';
    metadata?: any;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
  }) => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-role-notification-dispatcher', {
        body: params
      });

      if (error) throw error;

      console.log('Admin notification dispatched:', data);
      return { success: true, data };
    } catch (error) {
      console.error('Error dispatching admin notification:', error);
      return { success: false, error };
    }
  }, []);

  // Subscription temps réel
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    fetchNotifications();

    // S'abonner aux nouvelles notifications pour cet admin
    const channel = supabase
      .channel('admin-role-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'unified_notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newNotification = payload.new as AdminRoleNotification;
          
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);

          // Afficher un toast selon la priorité et le type
          const duration = NOTIFICATION_CONFIG.DEFAULT_DURATION;
          const priority = newNotification.priority || 'normal';
          const category = newNotification.category || 'general';

          // Déterminer le type de toast selon la catégorie
          const isError = category.includes('error') || priority === 'urgent';
          const isWarning = category.includes('warning') || category.includes('alert');
          const isSuccess = category.includes('success') || category.includes('approved');

          // 🔊 Jouer son selon priorité/catégorie
          if (priority === 'urgent') {
            notificationSoundService.playNotificationSound('urgentAlert');
          } else if (isError) {
            notificationSoundService.playNotificationSound('error');
          } else if (isWarning) {
            notificationSoundService.playNotificationSound('warning');
          } else if (isSuccess) {
            notificationSoundService.playNotificationSound('success');
          } else {
            notificationSoundService.playNotificationSound('general');
          }

          if (isError) {
            toast.error(newNotification.title, {
              description: newNotification.message,
              duration,
              action: {
                label: 'Voir',
                onClick: () => {
                  markAsRead(newNotification.id);
                  if (newNotification.data?.entity_type) {
                    console.log('Navigate to:', newNotification.data);
                  }
                }
              }
            });
          } else if (isWarning) {
            toast.warning(newNotification.title, {
              description: newNotification.message,
              duration,
              action: {
                label: 'Voir',
                onClick: () => markAsRead(newNotification.id)
              }
            });
          } else if (isSuccess) {
            toast.success(newNotification.title, {
              description: newNotification.message,
              duration
            });
          } else if (priority === 'urgent' || priority === 'high') {
            toast.info(newNotification.title, {
              description: newNotification.message,
              duration: NOTIFICATION_CONFIG.CRITICAL_DURATION,
              action: {
                label: 'Voir',
                onClick: () => markAsRead(newNotification.id)
              }
            });
          }

          // Notification navigateur pour priorités élevées
          if ((priority === 'urgent' || priority === 'high') && Notification.permission === 'granted') {
            new Notification(newNotification.title, {
              body: newNotification.message,
              icon: '/app-icon.png',
              tag: newNotification.id,
              requireInteraction: priority === 'urgent'
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchNotifications, markAsRead]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    dispatchAdminNotification,
    refetch: fetchNotifications
  };
};
