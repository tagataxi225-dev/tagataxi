/**
 * 🔔 Hook pour écouter les notifications push en temps réel
 * S'abonne au channel Supabase Realtime broadcast pour recevoir
 * les notifications envoyées par l'admin via push-notifications-broadcast
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { notificationSoundService } from '@/services/notificationSound';

interface RealtimeNotificationPayload {
  id: string;
  title: string;
  message: string;
  type: string;
  priority: string;
  data?: Record<string, any>;
  timestamp: string;
}

type ToastType = 'chat' | 'delivery' | 'lottery' | 'marketplace' | 'system' | 'transport' | 'wallet';
type ToastPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface RealtimeToast {
  id: string;
  title: string;
  message: string;
  type: ToastType;
  priority: ToastPriority;
  timestamp: number;
}

export const useRealtimeNotifications = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toasts, setToasts] = useState<RealtimeToast[]>([]);

  // Load initial unread count
  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from('user_notification_logs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false)
      .then(({ count }) => {
        setUnreadCount(count || 0);
      });
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    // Request browser notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on('broadcast', { event: 'new_notification' }, ({ payload }) => {
        const notif = payload as RealtimeNotificationPayload;
        
        console.log('🔔 Notification reçue en temps réel:', notif);

        // Update unread count
        setUnreadCount(prev => prev + 1);

        // Add to toasts queue
        const validTypes: ToastType[] = ['chat', 'delivery', 'lottery', 'marketplace', 'system', 'transport', 'wallet'];
        const validPriorities: ToastPriority[] = ['low', 'normal', 'high', 'urgent'];
        
        setToasts(prev => [{
          id: notif.id,
          title: notif.title,
          message: notif.message,
          type: (validTypes.includes(notif.type as ToastType) ? notif.type : 'system') as ToastType,
          priority: (validPriorities.includes(notif.priority as ToastPriority) ? notif.priority : 'normal') as ToastPriority,
          timestamp: Date.now(),
        }, ...prev.slice(0, 9)]);

        // Show in-app toast based on priority
        const toastFn = notif.priority === 'urgent' || notif.priority === 'high'
          ? toast.warning
          : toast.info;

        toastFn(notif.title, {
          description: notif.message,
          duration: notif.priority === 'urgent' ? 15000 : 8000,
          icon: notif.type === 'promo' ? '🎉' : notif.type === 'urgent' ? '🚨' : '🔔',
        });

        // Play notification sound
        try {
          notificationSoundService.playNotificationSound(
            notif.priority === 'urgent' ? 'urgentAlert' : 'success'
          );
        } catch (e) {
          // Sound playback is optional
        }

        // Invalidate notification queries to refresh NotificationCenter
        queryClient.invalidateQueries({ queryKey: ['notification-logs'] });
        queryClient.invalidateQueries({ queryKey: ['user-notifications'] });

        // Show native browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(notif.title, {
            body: notif.message,
            icon: '/logo.png',
            tag: `push-${notif.id}`,
          });
        }
      })
      .subscribe((status) => {
        console.log(`📡 Realtime notifications channel (${user.id}):`, status);
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user?.id, queryClient]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return { unreadCount, toasts, removeToast };
};
