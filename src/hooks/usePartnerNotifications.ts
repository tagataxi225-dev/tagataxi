import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface PartnerNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  is_read: boolean;
  created_at: string;
  action_url?: string;
  metadata?: any;
}

export const usePartnerNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<PartnerNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      setLoading(true);

      const [userNotifRes, orderNotifRes] = await Promise.all([
        supabase
          .from('user_notifications')
          .select('id, title, message, type, is_read, created_at, action_url, metadata')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50),
        supabase
          .from('order_notifications')
          .select('id, title, message, notification_type, is_read, created_at, metadata')
          .or(`partner_id.eq.${user.id},recipient_id.eq.${user.id}`)
          .order('created_at', { ascending: false })
          .limit(50),
      ]);

      if (userNotifRes.error) throw userNotifRes.error;

      const fromUserNotif: PartnerNotification[] = (userNotifRes.data || []).map(n => ({
        id: n.id,
        title: n.title || 'Notification',
        message: n.message || '',
        type: (n.type as 'info' | 'warning' | 'success' | 'error') || 'info',
        is_read: n.is_read,
        created_at: n.created_at,
        action_url: n.action_url || undefined,
        metadata: n.metadata
      }));

      const fromOrderNotif: PartnerNotification[] = (orderNotifRes.data || []).map(n => ({
        id: `order-${n.id}`,
        title: n.title || 'Notification',
        message: n.message || '',
        type: 'info' as const,
        is_read: n.is_read,
        created_at: n.created_at,
        action_url: undefined,
        metadata: n.metadata
      }));

      const merged = [...fromUserNotif, ...fromOrderNotif].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setNotifications(merged);
      setUnreadCount(merged.filter(n => !n.is_read).length);

    } catch (error) {
      console.error('Error fetching partner notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('user_notifications')
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
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);

    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();

      const userNotifChannel = supabase
        .channel('partner-notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'user_notifications',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            fetchNotifications();
          }
        )
        .subscribe();

      const orderNotifChannel = supabase
        .channel('partner-order-notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'order_notifications',
            filter: `partner_id=eq.${user.id}`
          },
          () => {
            fetchNotifications();
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'order_notifications',
            filter: `recipient_id=eq.${user.id}`
          },
          () => {
            fetchNotifications();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(userNotifChannel);
        supabase.removeChannel(orderNotifChannel);
      };
    }
  }, [user]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refresh: fetchNotifications
  };
};
