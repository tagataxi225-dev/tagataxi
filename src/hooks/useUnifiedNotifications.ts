import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type UserType = 'admin' | 'vendor' | 'driver' | 'client' | 'restaurant' | 'partner';

interface UnifiedNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  created_at: string;
  is_read?: boolean;
  read?: boolean;
  metadata?: any;
  priority?: string;
  severity?: string;
}

// ✅ Helper pour éviter les erreurs TypeScript avec dynamic table names
const fetchFromTable = async (tableName: string, userId: string, userIdField: string) => {
  let query = (supabase as any).from(tableName).select('*');
  
  // Ne pas filtrer par user_id pour les tables globales (admin_notifications)
  if (userIdField !== 'none') {
    query = query.eq(userIdField, userId);
  }
  
  const { data, error } = await query
    .order('created_at', { ascending: false })
    .limit(50);
  
  if (error) throw error;
  return data || [];
};

const TABLE_MAPPING: Record<UserType, string> = {
  'admin': 'admin_notifications',
  'vendor': 'vendor_product_notifications',
  'driver': 'delivery_driver_alerts',
  'client': 'delivery_notifications',
  'restaurant': 'food_notifications',
  'partner': 'delivery_notifications'
};

const FIELD_MAPPING: Record<string, { isRead: string; userId: string }> = {
  'admin_notifications': { isRead: 'is_read', userId: 'none' },
  'vendor_product_notifications': { isRead: 'is_read', userId: 'vendor_id' },
  'delivery_driver_alerts': { isRead: 'seen_at', userId: 'driver_id' },
  'delivery_notifications': { isRead: 'read', userId: 'user_id' },
  'food_notifications': { isRead: 'is_read', userId: 'restaurant_id' }
};

export const useUnifiedNotifications = (userType: UserType) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const tableName = TABLE_MAPPING[userType];
  const fields = FIELD_MAPPING[tableName];

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['unified-notifications', userType, user?.id],
    queryFn: async () => {
      if (!user?.id || !tableName) return [];

      try {
        const data = await fetchFromTable(
          tableName,
          user.id,
          fields.userId
        );

        // Normaliser les notifications
        return data.map((notif: any) => {
          const isRead = fields.isRead === 'seen_at' 
            ? !!notif.seen_at 
            : notif[fields.isRead] || false;

          return {
            id: notif.id,
            title: notif.title || notif.alert_type || 'Notification',
            message: notif.message || notif.order_details?.message || '',
            type: notif.type || notif.notification_type || notif.alert_type || 'general',
            created_at: notif.created_at || notif.sent_at,
            is_read: isRead,
            metadata: notif.metadata || notif.order_details || {},
            priority: notif.priority || 'normal',
            severity: notif.severity || 'info'
          } as UnifiedNotification;
        });
      } catch (error) {
        console.error(`Error fetching ${tableName}:`, error);
        return [];
      }
    },
    staleTime: 30000,
    refetchInterval: 60000,
    enabled: !!user?.id && !!tableName
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      if (!tableName) throw new Error('Invalid user type');

      const updateField = fields.isRead === 'seen_at' 
        ? { seen_at: new Date().toISOString() }
        : { [fields.isRead]: true };

      const { error } = await (supabase as any)
        .from(tableName)
        .update(updateField)
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unified-notifications', userType, user?.id] });
    }
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!tableName || !user?.id) throw new Error('Invalid configuration');

      const updateField = fields.isRead === 'seen_at' 
        ? { seen_at: new Date().toISOString() }
        : { [fields.isRead]: true };

      const builder = (supabase as any).from(tableName).update(updateField);
      
      // Filtrer par user_id si nécessaire
      const { error } = fields.userId !== 'none'
        ? await builder.eq(fields.userId, user.id)
        : await builder;

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unified-notifications', userType, user?.id] });
    }
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead: (id: string) => markAsReadMutation.mutate(id),
    markAllAsRead: () => markAllAsReadMutation.mutate(),
    isMarkingAsRead: markAsReadMutation.isPending || markAllAsReadMutation.isPending
  };
};
