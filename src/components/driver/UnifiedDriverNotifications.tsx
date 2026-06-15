import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUnifiedDispatcher, UnifiedOrderNotification } from '@/hooks/useUnifiedDispatcher';
import { Car, Package, ShoppingBag, Clock, MapPin, Euro, CheckCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UnifiedDriverNotificationsProps {
  className?: string;
}

const UnifiedDriverNotifications: React.FC<UnifiedDriverNotificationsProps> = ({ className }) => {
  const { 
    pendingNotifications, 
    acceptOrder, 
    rejectOrder, 
    loading 
  } = useUnifiedDispatcher();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'taxi':
        return <Car className="h-5 w-5" />;
      case 'delivery':
        return <Package className="h-5 w-5" />;
      case 'marketplace':
        return <ShoppingBag className="h-5 w-5" />;
      default:
        return <Package className="h-5 w-5" />;
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'taxi':
        return 'Course';
      case 'delivery':
        return 'Livraison';
      case 'marketplace':
        return 'Marketplace';
      default:
        return 'Commande';
    }
  };

  const handleAccept = async (notification: UnifiedOrderNotification) => {
    setProcessingId(notification.id);
    try {
      await acceptOrder(notification);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = (notificationId: string) => {
    rejectOrder(notificationId);
  };

  if (pendingNotifications.length === 0) {
    return (
      <Card className={cn("border-border/50", className)}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <div className="text-muted-foreground text-sm">
              Aucune nouvelle commande pour le moment
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Assurez-vous d'être en ligne pour recevoir des notifications
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("border-border/50", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <div className="relative">
            <CheckCircle className="h-5 w-5 text-primary" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          </div>
          Nouvelles commandes ({pendingNotifications.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          <div className="p-4 space-y-3">
            {pendingNotifications.map((notification) => (
              <Card key={notification.id} className="border border-border/50 hover:border-primary/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getNotificationIcon(notification.type)}
                      <Badge variant="outline" className="text-xs">
                        {getTypeLabel(notification.type)}
                      </Badge>
                      <div className={cn("w-2 h-2 rounded-full", getUrgencyColor(notification.urgency))} />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(notification.created_at).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <h4 className="font-semibold text-sm">{notification.title}</h4>
                    <p className="text-sm text-muted-foreground">{notification.message}</p>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span>{notification.location}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Euro className="h-3 w-3" />
                        <span>{notification.estimatedPrice.toLocaleString()} CDF</span>
                      </div>
                      {notification.distance && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{notification.distance.toFixed(1)} km</span>
                        </div>
                      )}
                    </div>

                    {notification.type === 'marketplace' && (
                      <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                        <div className="text-xs text-yellow-800">
                          <strong>Paiement à la livraison :</strong> {notification.data.order?.total_amount?.toLocaleString()} CDF
                        </div>
                        <div className="text-xs text-yellow-700 mt-1">
                          Vous encaissez l'argent du client + votre commission de livraison
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleAccept(notification)}
                      disabled={loading || processingId === notification.id}
                      className="flex-1"
                    >
                      {processingId === notification.id ? (
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Acceptation...
                        </div>
                      ) : (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Accepter
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReject(notification.id)}
                      disabled={loading || processingId === notification.id}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default UnifiedDriverNotifications;