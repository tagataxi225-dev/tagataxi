import { useState, useMemo } from "react";
import { useVendorNotifications, VendorNotificationType } from "@/hooks/useVendorNotifications";
import { VendorProductModerationNotification } from "./VendorProductModerationNotification";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Bell, 
  Package, 
  DollarSign, 
  ShoppingCart, 
  Star, 
  Settings,
  Volume2,
  VolumeX
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { pushNotificationService } from "@/services/pushNotificationService";
import { useToast } from "@/hooks/use-toast";

type NotificationCategory = 'all' | 'orders' | 'payments' | 'products' | 'reviews';

export const VendorNotificationCenter = () => {
  const { toast } = useToast();
  const { 
    notifications, 
    unreadCount, 
    loading, 
    markAsRead, 
    markAllAsRead 
  } = useVendorNotifications();

  const [activeCategory, setActiveCategory] = useState<NotificationCategory>('all');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(false);

  // Filtrer les notifications par catégorie
  const filteredNotifications = useMemo(() => {
    if (activeCategory === 'all') return notifications;

    const categoryMap: Record<NotificationCategory, VendorNotificationType[]> = {
      all: [],
      orders: ['new_order', 'order_confirmed'],
      payments: ['payment_received'],
      products: ['product_approved', 'product_rejected', 'product_flagged', 'low_stock_alert'],
      reviews: ['review_received'],
    };

    const types = categoryMap[activeCategory] || [];
    return notifications.filter(n => {
      const notifType = n.type || n.notification_type;
      return types.includes(notifType as VendorNotificationType);
    });
  }, [notifications, activeCategory]);

  // Compter les notifications par catégorie
  const categoryCounts = useMemo(() => {
    const counts = {
      orders: 0,
      payments: 0,
      products: 0,
      reviews: 0,
    };

    notifications.forEach(n => {
      const notifType = n.type || n.notification_type;
      if (['new_order', 'order_confirmed'].includes(notifType)) counts.orders++;
      if (notifType === 'payment_received') counts.payments++;
      if (['product_approved', 'product_rejected', 'product_flagged', 'low_stock_alert'].includes(notifType)) counts.products++;
      if (notifType === 'review_received') counts.reviews++;
    });

    return counts;
  }, [notifications]);

  const handlePushToggle = async (enabled: boolean) => {
    if (enabled) {
      const granted = await pushNotificationService.requestPermission();
      if (granted) {
        setPushEnabled(true);
        toast({
          title: "Notifications push activées",
          description: "Vous recevrez des notifications même lorsque l'onglet est fermé",
        });
      } else {
        toast({
          title: "Permission refusée",
          description: "Vous devez autoriser les notifications dans votre navigateur",
          variant: "destructive",
        });
      }
    } else {
      setPushEnabled(false);
      toast({
        title: "Notifications push désactivées",
      });
    }
  };

  const getCategoryIcon = (category: NotificationCategory) => {
    switch (category) {
      case 'orders':
        return <ShoppingCart className="h-4 w-4" />;
      case 'payments':
        return <DollarSign className="h-4 w-4" />;
      case 'products':
        return <Package className="h-4 w-4" />;
      case 'reviews':
        return <Star className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Centre de Notifications</CardTitle>
          <CardDescription>Chargement...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Centre de Notifications</CardTitle>
            <CardDescription>
              {unreadCount > 0 ? `${unreadCount} notification${unreadCount > 1 ? 's' : ''} non lue${unreadCount > 1 ? 's' : ''}` : 'Aucune notification non lue'}
            </CardDescription>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              Tout marquer comme lu
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as NotificationCategory)}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all" className="flex items-center gap-1">
              <Bell className="h-4 w-4" />
              Toutes
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            
            <TabsTrigger value="orders" className="flex items-center gap-1">
              {getCategoryIcon('orders')}
              Commandes
              {categoryCounts.orders > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {categoryCounts.orders}
                </Badge>
              )}
            </TabsTrigger>
            
            <TabsTrigger value="payments" className="flex items-center gap-1">
              {getCategoryIcon('payments')}
              Paiements
              {categoryCounts.payments > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {categoryCounts.payments}
                </Badge>
              )}
            </TabsTrigger>
            
            <TabsTrigger value="products" className="flex items-center gap-1">
              {getCategoryIcon('products')}
              Produits
              {categoryCounts.products > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {categoryCounts.products}
                </Badge>
              )}
            </TabsTrigger>
            
            <TabsTrigger value="reviews" className="flex items-center gap-1">
              {getCategoryIcon('reviews')}
              Avis
              {categoryCounts.reviews > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {categoryCounts.reviews}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Paramètres de notifications */}
          <div className="mt-4 p-4 border rounded-lg space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="sound-toggle">Sons de notification</Label>
              </div>
              <div className="flex items-center gap-2">
                {soundEnabled ? (
                  <Volume2 className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <VolumeX className="h-4 w-4 text-muted-foreground" />
                )}
                <Switch
                  id="sound-toggle"
                  checked={soundEnabled}
                  onCheckedChange={setSoundEnabled}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="push-toggle">Notifications push navigateur</Label>
              </div>
              <Switch
                id="push-toggle"
                checked={pushEnabled}
                onCheckedChange={handlePushToggle}
              />
            </div>
          </div>

          <TabsContent value={activeCategory} className="mt-4">
            <ScrollArea className="h-[600px]">
              {filteredNotifications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Aucune notification dans cette catégorie
                </div>
              ) : (
                <div>
                  {filteredNotifications.map((notification) => {
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

                    // Standard notification display
                    return (
                      <div
                        key={notification.id}
                        className={`p-4 border-b hover:bg-muted/50 cursor-pointer transition-colors ${
                          !notification.is_read ? 'bg-muted/30' : ''
                        }`}
                        onClick={() => !notification.is_read && markAsRead(notification.id)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="font-semibold">{notification.title}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {formatDistanceToNow(new Date(notification.created_at), {
                                addSuffix: true,
                                locale: fr,
                              })}
                            </p>
                          </div>
                          {!notification.is_read && (
                            <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
