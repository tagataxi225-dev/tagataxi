import React from 'react';
import { X, Bell, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useOrderNotifications } from '@/hooks/useOrderNotifications';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'order_confirmed':
    case 'order_completed':
    case 'order_delivered':
      return <CheckCircle className="h-4 w-4 text-success" />;
    case 'order_preparing':
    case 'order_in_transit':
      return <Clock className="h-4 w-4 text-warning" />;
    case 'order_cancelled':
    case 'order_failed':
      return <AlertCircle className="h-4 w-4 text-destructive" />;
    default:
      return <Bell className="h-4 w-4 text-congo-blue" />;
  }
};

const getNotificationBadgeVariant = (type: string) => {
  switch (type) {
    case 'order_confirmed':
    case 'order_completed':
    case 'order_delivered':
      return 'default';
    case 'order_preparing':
    case 'order_in_transit':
      return 'secondary';
    case 'order_cancelled':
    case 'order_failed':
      return 'destructive';
    default:
      return 'outline';
  }
};

export const NotificationPanel: React.FC<NotificationPanelProps> = ({ isOpen, onClose }) => {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useOrderNotifications();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="fixed right-0 top-0 h-full w-full max-w-md bg-background border-l shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-gradient-congo-subtle">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Bell className="h-5 w-5 text-congo-red" />
                {unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-congo-red rounded-full animate-pulse" />
                )}
              </div>
              <div>
                <h2 className="font-semibold text-lg">Notifications</h2>
                <p className="text-sm text-muted-foreground">
                  {unreadCount} non lue{unreadCount !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={markAllAsRead}
                  className="text-xs"
                >
                  Tout marquer
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <ScrollArea className="flex-1 h-full">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-congo-red" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <Bell className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="font-medium mb-2">Aucune notification</h3>
                <p className="text-sm text-muted-foreground">
                  Vous êtes à jour ! Les nouvelles notifications apparaîtront ici.
                </p>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                {notifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "p-4 rounded-lg border transition-all duration-200 cursor-pointer hover:shadow-md",
                      notification.is_read 
                        ? "bg-muted/30 border-border/50" 
                        : "bg-card border-congo-yellow/30 shadow-sm"
                    )}
                    onClick={() => !notification.is_read && markAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {getNotificationIcon(notification.notification_type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className={cn(
                            "font-medium text-sm leading-tight",
                            !notification.is_read && "text-foreground"
                          )}>
                            {notification.title}
                          </h4>
                          {!notification.is_read && (
                            <div className="w-2 h-2 bg-congo-red rounded-full flex-shrink-0 mt-1" />
                          )}
                        </div>
                        
                        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center justify-between mt-3">
                          <Badge 
                            variant={getNotificationBadgeVariant(notification.notification_type)}
                            className="text-xs"
                          >
                            {notification.notification_type.replace('_', ' ')}
                          </Badge>
                          
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(notification.created_at), { 
                              addSuffix: true,
                              locale: fr 
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </ScrollArea>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};