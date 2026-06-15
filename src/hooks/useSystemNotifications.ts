/**
 * 🔔 Hook Notifications Système Temps Réel
 * Écoute et affiche les notifications générées par les Edge Functions
 * (abonnements épuisés, courses consommées, etc.)
 */

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { AlertCircle, CheckCircle, Info, AlertTriangle, Zap } from 'lucide-react';

interface SystemNotification {
  id: string;
  user_id: string;
  notification_type: string;
  title: string;
  message: string;
  data: any;
  is_read: boolean;
  is_system_wide: boolean;
  priority: string;
  expires_at: string;
  created_at: string;
}

export const useSystemNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // 📥 Récupérer les notifications existantes
  const fetchNotifications = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('system_notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setNotifications(data || []);
      setUnreadCount((data || []).filter(n => !n.is_read).length);
    } catch (error) {
      console.error('❌ Erreur récupération notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // 🔔 Afficher un toast selon la priorité
  const showNotificationToast = (notification: SystemNotification) => {
    const severity = notification.priority === 'high' ? 'error' : 
                     notification.priority === 'low' ? 'info' : 'warning';

    switch (severity) {
      case 'error':
        toast.error(notification.title, {
          description: notification.message,
          duration: 8000
        });
        break;
      case 'warning':
        toast.warning(notification.title, {
          description: notification.message,
          duration: 6000
        });
        break;
      default:
        toast.info(notification.title, {
          description: notification.message,
          duration: 4000
        });
    }
  };

  // ✅ Marquer comme lu
  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('system_notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('❌ Erreur marquage notification:', error);
    }
  };

  // ✅ Marquer toutes comme lues
  const markAllAsRead = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('system_notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast.success('Toutes les notifications marquées comme lues');
    } catch (error) {
      console.error('❌ Erreur marquage global:', error);
    }
  };

  // 🗑️ Supprimer une notification
  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('system_notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      toast.success('Notification supprimée');
    } catch (error) {
      console.error('❌ Erreur suppression notification:', error);
    }
  };

  // 📡 Écoute temps réel
  useEffect(() => {
    if (!user) return;

    fetchNotifications();

    const channel = supabase
      .channel('system-notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'system_notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('🔔 Nouvelle notification système:', payload.new);
          const newNotification = payload.new as SystemNotification;

          // Ajouter à la liste
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);

          // Afficher toast
          showNotificationToast(newNotification);

          // Auto-marquer comme lu après 3s pour notifications basse priorité
          if (newNotification.priority === 'low') {
            setTimeout(() => {
              markAsRead(newNotification.id);
            }, 3000);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'system_notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('🔄 Notification mise à jour:', payload.new);
          setNotifications(prev =>
            prev.map(n => (n.id === payload.new.id ? (payload.new as SystemNotification) : n))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // 🔍 Filtrer par type
  const getNotificationsByType = (type: string) => {
    return notifications.filter(n => n.notification_type === type);
  };

  // 🔍 Récupérer seulement non lues
  const getUnreadNotifications = () => {
    return notifications.filter(n => !n.is_read);
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getNotificationsByType,
    getUnreadNotifications,
    refetch: fetchNotifications
  };
};
