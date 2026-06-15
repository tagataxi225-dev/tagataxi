import React, { useState } from 'react';
import { X, Bell, Package, DollarSign, ShoppingCart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useVendorNotifications } from '@/hooks/useVendorNotifications';
import { VendorProductModerationNotification } from '@/components/marketplace/VendorProductModerationNotification';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface VendorNotificationCenterProps {
  open: boolean;
  onClose: () => void;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'product_approved':
    case 'product_rejected':
      return Package;
    case 'new_order':
      return ShoppingCart;
    case 'payment_received':
      return DollarSign;
    default:
      return Bell;
  }
};

const getNotificationColor = (type: string) => {
  switch (type) {
    case 'product_approved':
      return 'text-green-500 bg-green-50';
    case 'product_rejected':
      return 'text-red-500 bg-red-50';
    case 'new_order':
      return 'text-blue-500 bg-blue-50';
    case 'payment_received':
      return 'text-green-500 bg-green-50';
    default:
      return 'text-gray-500 bg-gray-50';
  }
};

export const VendorNotificationCenter: React.FC<VendorNotificationCenterProps> = ({
  open,
  onClose
}) => {
  const { 
    notifications, 
    unreadCount, 
    loading, 
    markAsRead, 
    markAllAsRead 
  } = useVendorNotifications();

  const [filterType, setFilterType] = useState<string>('all');

  const filteredNotifications = filterType === 'all'
    ? notifications
    : notifications.filter(n => n.notification_type === filterType);

  const orderNotifications = notifications.filter(n => n.notification_type === 'new_order');
  const productNotifications = notifications.filter(n => 
    n.notification_type.includes('product_')
  );
  const paymentNotifications = notifications.filter(n => 
    n.notification_type === 'payment_received'
  );

  const filters = [
    { id: 'all', label: 'Toutes', count: notifications.length },
    { id: 'new_order', label: 'Commandes', count: orderNotifications.length },
    { id: 'product', label: 'Produits', count: productNotifications.length },
    { id: 'payment_received', label: 'Paiements', count: paymentNotifications.length },
  ];

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0">
        <SheetHeader className="p-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <SheetTitle>Notifications</SheetTitle>
              {unreadCount > 0 && (
                <Badge variant="destructive">{unreadCount}</Badge>
              )}
            </div>
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={markAllAsRead}
              >
                Tout marquer comme lu
              </Button>
            )}
          </div>

          {/* Filters */}
          <div className="flex gap-2 overflow-x-auto pt-4 scrollbar-hide">
            {filters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setFilterType(filter.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  filterType === filter.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {filter.label}
                <Badge 
                  variant={filterType === filter.id ? 'secondary' : 'outline'}
                  className="text-xs"
                >
                  {filter.count}
                </Badge>
              </button>
            ))}
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100dvh-140px)]">
          <div className="p-4 space-y-2">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Chargement...
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Aucune notification</p>
              </div>
            ) : (
              filteredNotifications.map((notification) => {
                const Icon = getNotificationIcon(notification.notification_type);
                const colorClass = getNotificationColor(notification.notification_type);

                if (notification.notification_type.includes('product_')) {
                  return (
                    <div key={notification.id}>
                      <VendorProductModerationNotification
                        notification={notification}
                        onMarkAsRead={() => markAsRead(notification.id)}
                      />
                    </div>
                  );
                }

                return (
                  <motion.button
                    key={notification.id}
                    onClick={() => markAsRead(notification.id)}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className={`w-full p-4 rounded-lg border text-left transition-colors ${
                      notification.is_read 
                        ? 'bg-background hover:bg-muted/50' 
                        : 'bg-primary/5 hover:bg-primary/10 border-primary/20'
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className={`h-10 w-10 rounded-lg ${colorClass} flex items-center justify-center flex-shrink-0`}>
                        <Icon className="h-5 w-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-semibold text-sm">
                            {notification.title}
                          </h4>
                          {!notification.is_read && (
                            <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                          )}
                        </div>
                        
                        <p className="text-sm text-muted-foreground mt-1">
                          {notification.message}
                        </p>
                        
                        <p className="text-xs text-muted-foreground mt-2">
                          {formatDistanceToNow(new Date(notification.created_at), {
                            addSuffix: true,
                            locale: fr
                          })}
                        </p>
                      </div>
                    </div>
                  </motion.button>
                );
              })
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
