import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bell, 
  BellOff, 
  Check, 
  Trash2, 
  Settings, 
  Package,
  Truck,
  MapPin,
  Clock,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';

interface DeliveryNotification {
  id: string;
  type: 'status_update' | 'driver_assigned' | 'pickup_confirmed' | 'delivered' | 'delayed' | 'cancelled';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  orderId: string;
  metadata?: any;
}

interface DeliveryNotificationCenterProps {
  userId: string;
  onNotificationClick?: (notification: DeliveryNotification) => void;
}

const notificationIcons = {
  status_update: Package,
  driver_assigned: Truck,
  pickup_confirmed: CheckCircle2,
  delivered: CheckCircle2,
  delayed: Clock,
  cancelled: AlertCircle
};

const notificationColors = {
  status_update: 'text-blue-500',
  driver_assigned: 'text-purple-500',
  pickup_confirmed: 'text-yellow-500',
  delivered: 'text-green-500',
  delayed: 'text-orange-500',
  cancelled: 'text-red-500'
};

export default function DeliveryNotificationCenter({
  userId,
  onNotificationClick
}: DeliveryNotificationCenterProps) {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<DeliveryNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Load notifications
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        // Simuler des notifications depuis l'historique de statut
        const { data, error } = await supabase
          .from('delivery_status_history')
          .select('*')
          .order('changed_at', { ascending: false })
          .limit(50);

        if (error) throw error;
        const mappedNotifications = (data || []).map(item => ({
          id: item.id,
          type: 'status_update' as const,
          title: `Statut mis à jour: ${item.status}`,
          message: item.notes || 'Votre commande a été mise à jour',
          timestamp: item.changed_at,
          read: false,
          orderId: item.delivery_order_id,
          metadata: item.metadata
        }));
        setNotifications(mappedNotifications);
      } catch (error) {
        console.error('Error loading notifications:', error);
      }
    };

    loadNotifications();
  }, [userId]);

  // Real-time notification subscription
  useEffect(() => {
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'delivery_notifications',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        const newNotification = payload.new as DeliveryNotification;
        setNotifications(prev => [newNotification, ...prev.slice(0, 49)]);
        
        // Show toast notification
        if (notificationsEnabled) {
          toast({
            title: newNotification.title,
            description: newNotification.message
          });

          // Browser notification
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(`TAGA Delivery - ${newNotification.title}`, {
              body: newNotification.message,
              icon: '/favicon.ico'
            });
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, notificationsEnabled]);

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('delivery_notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => prev.map(notif =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      ));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    setLoading(true);
    try {
      const unreadIds = notifications
        .filter(n => !n.read)
        .map(n => n.id);

      if (unreadIds.length > 0) {
        const { error } = await supabase
          .from('delivery_notifications')
          .update({ read: true })
          .in('id', unreadIds);

        if (error) throw error;

        setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
        toast({
          title: "Toutes marquées comme lues",
          description: "Toutes les notifications ont été marquées comme lues"
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la mise à jour",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('delivery_notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // Clear all notifications
  const clearAll = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('delivery_notifications')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;

      setNotifications([]);
      toast({
        title: "Succès",
        description: "Toutes les notifications ont été supprimées"
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la suppression",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Request notification permission
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        toast({
          title: "Notifications activées",
          description: "Les notifications navigateur sont maintenant activées"
        });
      }
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'À l\'instant';
    } else if (diffInHours < 24) {
      return `Il y a ${Math.floor(diffInHours)}h`;
    } else {
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short'
      });
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unreadCount}
              </Badge>
            )}
          </CardTitle>
          
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setNotificationsEnabled(!notificationsEnabled)}
            >
              {notificationsEnabled ? (
                <Bell className="h-4 w-4" />
              ) : (
                <BellOff className="h-4 w-4" />
              )}
            </Button>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={markAllAsRead}
              disabled={loading || unreadCount === 0}
            >
              <Check className="h-4 w-4" />
            </Button>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={clearAll}
              disabled={loading || notifications.length === 0}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {!notificationsEnabled && (
          <div className="text-sm text-muted-foreground">
            Notifications désactivées
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-3">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucune notification</p>
              </div>
            ) : (
              <AnimatePresence>
                {notifications.map((notification) => {
                  const IconComponent = notificationIcons[notification.type];
                  const iconColor = notificationColors[notification.type];
                  
                  return (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      layout
                      className={`
                        p-3 rounded-lg border cursor-pointer transition-colors
                        ${notification.read 
                          ? 'bg-background border-border' 
                          : 'bg-muted/50 border-primary/20'
                        }
                        hover:bg-muted/80
                      `}
                      onClick={() => {
                        if (!notification.read) {
                          markAsRead(notification.id);
                        }
                        onNotificationClick?.(notification);
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`
                          w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                          ${notification.read ? 'bg-muted' : 'bg-primary/10'}
                        `}>
                          <IconComponent className={`h-4 w-4 ${iconColor}`} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className={`
                              text-sm font-medium truncate
                              ${notification.read ? 'text-muted-foreground' : 'text-foreground'}
                            `}>
                              {notification.title}
                            </h4>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <span className="text-xs text-muted-foreground">
                                {formatTimestamp(notification.timestamp)}
                              </span>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotification(notification.id);
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          
                          <p className={`
                            text-xs mb-2
                            ${notification.read ? 'text-muted-foreground' : 'text-foreground'}
                          `}>
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              #{notification.orderId.slice(-8)}
                            </Badge>
                            
                            {!notification.read && (
                              <div className="w-2 h-2 bg-primary rounded-full" />
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>
        </ScrollArea>
      </CardContent>

      {/* Permission request */}
      {('Notification' in window && Notification.permission === 'default') && (
        <div className="p-4 border-t">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={requestNotificationPermission}
          >
            Activer les notifications navigateur
          </Button>
        </div>
      )}
    </Card>
  );
}