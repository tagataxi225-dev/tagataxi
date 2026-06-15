import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useVendorNotifications } from "@/hooks/useVendorNotifications";
import { VendorProductModerationNotification } from "./VendorProductModerationNotification";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

export default function VendorNotificationBadge() {
  const { 
    notifications, 
    unreadCount, 
    loading, 
    markAsRead, 
    markAllAsRead 
  } = useVendorNotifications();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_order':
        return '🛒';
      case 'order_confirmed':
        return '✅';
      case 'payment_received':
        return '💰';
      case 'product_approved':
        return '✅';
      case 'product_rejected':
        return '❌';
      case 'product_flagged':
        return '⚠️';
      case 'low_stock_alert':
        return '📦';
      case 'review_received':
        return '⭐';
      default:
        return '📢';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'new_order':
        return 'bg-orange-500';
      case 'order_confirmed':
        return 'bg-green-500';
      case 'payment_received':
        return 'bg-blue-500';
      case 'product_approved':
        return 'bg-green-600';
      case 'product_rejected':
        return 'bg-red-600';
      case 'product_flagged':
        return 'bg-amber-600';
      case 'low_stock_alert':
        return 'bg-purple-600';
      case 'review_received':
        return 'bg-yellow-600';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <Button variant="ghost" size="sm" disabled>
        <Bell className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h4 className="font-semibold">Notifications</h4>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={markAllAsRead}
              className="text-xs"
            >
              Tout marquer lu
            </Button>
          )}
        </div>
        
        <ScrollArea className="max-h-96">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              Aucune notification
            </div>
          ) : (
            <div>
              {notifications.slice(0, 10).map((notification) => {
                const notifType = notification.type || notification.notification_type;
                
                // Use rich component for product moderation notifications
                if (['product_approved', 'product_rejected', 'product_flagged'].includes(notifType)) {
                  return (
                    <VendorProductModerationNotification
                      key={notification.id}
                      notification={notification}
                      onMarkAsRead={markAsRead}
                    />
                  );
                }

                // Standard notification display for other types
                return (
                  <div
                    key={notification.id}
                    className={`p-3 border-b last:border-b-0 cursor-pointer hover:bg-muted/50 transition-colors ${
                      !notification.is_read ? 'bg-muted/30' : ''
                    }`}
                    onClick={() => !notification.is_read && markAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm ${getNotificationColor(notifType)}`}>
                        {getNotificationIcon(notifType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h5 className="font-medium text-sm truncate">
                            {notification.title}
                          </h5>
                          {!notification.is_read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {formatDistanceToNow(new Date(notification.created_at), {
                            addSuffix: true,
                            locale: fr,
                          })}
                        </p>
                        {notification.metadata?.total_amount && (
                          <p className="text-xs font-medium text-primary mt-1">
                            {Number(notification.metadata.total_amount).toLocaleString()} CDF
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {notifications.length > 10 && (
                <div className="p-3 text-center">
                  <Button variant="ghost" size="sm" className="text-xs">
                    Voir plus ({notifications.length - 10} restantes)
                  </Button>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}