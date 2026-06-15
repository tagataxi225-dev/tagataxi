import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, MapPin, Phone, User, Clock } from "lucide-react";
import { DeliveryOrder } from "@/hooks/usePartnerDeliveries";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Props {
  order: DeliveryOrder;
  onUpdateStatus?: (orderId: string, status: DeliveryOrder["status"]) => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending': return 'bg-yellow-100 text-yellow-800';
    case 'driver_assigned': return 'bg-blue-100 text-blue-800';
    case 'picked_up': return 'bg-purple-100 text-purple-800';
    case 'in_transit': return 'bg-indigo-100 text-indigo-800';
    case 'delivered': return 'bg-green-100 text-green-800';
    case 'cancelled': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'pending': return 'En attente';
    case 'driver_assigned': return 'Assignée';
    case 'picked_up': return 'Récupérée';
    case 'in_transit': return 'En livraison';
    case 'delivered': return 'Livrée';
    case 'cancelled': return 'Annulée';
    default: return status;
  }
};

const getDeliveryTypeLabel = (type: string) => {
  switch (type) {
    case 'flash': return '⚡ Flash';
    case 'flex': return '📦 Flex';
    case 'maxicharge': return '🚚 Maxicharge';
    default: return type;
  }
};

export default function DeliveryOrderCard({ order, onUpdateStatus }: Props) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(order.status)}>
                {getStatusLabel(order.status)}
              </Badge>
              <Badge variant="outline">
                {getDeliveryTypeLabel(order.delivery_type)}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {format(new Date(order.created_at), "d MMM yyyy 'à' HH:mm", { locale: fr })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-primary">
              {order.final_price || order.estimated_price} CDF
            </p>
            <p className="text-xs text-muted-foreground">
              {order.payment_status === 'paid' ? '✓ Payé' : 'En attente'}
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Locations */}
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Récupération</p>
              <p className="text-sm font-medium truncate">{order.pickup_location}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Livraison</p>
              <p className="text-sm font-medium truncate">{order.delivery_location}</p>
            </div>
          </div>
        </div>

        {/* Package details */}
        <div className="bg-muted/50 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-medium">Détails du colis</p>
          </div>
          <p className="text-sm text-muted-foreground">{order.package_details}</p>
        </div>

        {/* Recipient info */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-medium">{order.recipient_name}</p>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{order.recipient_phone}</p>
          </div>
        </div>

        {/* Action buttons */}
        {onUpdateStatus && order.status !== 'delivered' && order.status !== 'cancelled' && (
          <div className="flex gap-2 pt-2">
            {order.status === 'pending' && (
              <Button 
                size="sm" 
                className="flex-1"
                onClick={() => onUpdateStatus(order.id, 'driver_assigned')}
              >
                Assigner
              </Button>
            )}
            {order.status === 'driver_assigned' && (
              <Button 
                size="sm" 
                className="flex-1"
                onClick={() => onUpdateStatus(order.id, 'picked_up')}
              >
                Confirmer récupération
              </Button>
            )}
            {order.status === 'picked_up' && (
              <Button 
                size="sm" 
                className="flex-1"
                onClick={() => onUpdateStatus(order.id, 'in_transit')}
              >
                En livraison
              </Button>
            )}
            {order.status === 'in_transit' && (
              <Button 
                size="sm" 
                variant="default"
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={() => onUpdateStatus(order.id, 'delivered')}
              >
                ✓ Livré
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
