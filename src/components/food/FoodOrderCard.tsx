import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, MapPin, Phone, XCircle, User, Truck } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { FoodOrder, FoodOrderStatus } from '@/hooks/useFoodClientOrders';
import { formatCurrency, getCurrencyByCity } from '@/utils/formatCurrency';
import { useNavigate } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface FoodOrderCardProps {
  order: FoodOrder;
  onCancel?: (orderId: string, reason: string) => void;
  isCancelling?: boolean;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: 'En attente', color: 'bg-yellow-500' },
  confirmed: { label: 'Confirmée', color: 'bg-blue-500' },
  preparing: { label: 'En préparation', color: 'bg-orange-500' },
  ready: { label: 'Prête', color: 'bg-green-400' },
  pending_delivery_approval: { label: 'Approbation livraison', color: 'bg-amber-500' },
  driver_assigned: { label: 'Livreur assigné', color: 'bg-indigo-500' },
  picked_up: { label: 'Récupérée', color: 'bg-purple-500' },
  in_transit: { label: 'En livraison', color: 'bg-purple-600' },
  delivering: { label: 'En livraison', color: 'bg-purple-600' },
  delivered: { label: 'Livrée', color: 'bg-green-600' },
  cancelled: { label: 'Annulée', color: 'bg-red-500' },
};

const DEFAULT_STATUS = { label: 'Inconnu', color: 'bg-gray-500' };

/** Extract short order ID: "FOOD-1765317263365-118" → "#118" */
const formatOrderNumber = (orderNumber: string): string => {
  const parts = orderNumber.split('-');
  return `#${parts[parts.length - 1] || orderNumber}`;
};

export const FoodOrderCard = ({ order, onCancel, isCancelling }: FoodOrderCardProps) => {
  const navigate = useNavigate();
  const statusConfig = STATUS_CONFIG[order.status] || DEFAULT_STATUS;
  const canCancel = ['pending', 'confirmed'].includes(order.status);
  const isActiveOrder = ['confirmed', 'preparing', 'ready', 'delivering', 'in_transit', 'pending_delivery_approval', 'driver_assigned', 'picked_up'].includes(order.status);
  const showDriverContact = ['driver_assigned', 'picked_up', 'in_transit', 'delivering'].includes(order.status) && order.driver_id;

  const currency = getCurrencyByCity(order.delivery_address || '');
  const formatPrice = (price: number) => formatCurrency(price, currency);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <Card className="overflow-hidden border border-border/40 bg-card shadow-sm">
        {/* Header - compact */}
        <div className="px-4 py-3 bg-muted/30 border-b border-border/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              {order.restaurant_logo && (
                <img
                  src={order.restaurant_logo}
                  alt={order.restaurant_name}
                  className="w-9 h-9 rounded-full object-cover border border-border/50 flex-shrink-0"
                />
              )}
              <div className="min-w-0">
                <h3 className="font-semibold text-sm text-foreground truncate">{order.restaurant_name}</h3>
                <p className="text-xs text-muted-foreground">
                  {formatOrderNumber(order.order_number)} · {format(new Date(order.created_at), 'dd MMM, HH:mm', { locale: fr })}
                </p>
              </div>
            </div>
            
            <Badge className={`${statusConfig.color} text-white text-xs px-2 py-0.5 font-medium flex-shrink-0`}>
              {statusConfig.label}
            </Badge>
          </div>
        </div>

        {/* Items - compact list */}
        <div className="px-4 py-2.5">
          {order.items.map((item, index) => (
            <div key={index} className="flex items-center justify-between py-1.5 text-sm">
              <div className="flex items-center gap-2 min-w-0">
                {item.image_url && (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-8 h-8 rounded object-cover flex-shrink-0"
                  />
                )}
                <span className="text-foreground truncate">
                  {item.quantity}× {item.name}
                </span>
              </div>
              <span className="text-sm text-muted-foreground ml-2 flex-shrink-0">
                {formatPrice(item.price * item.quantity)}
              </span>
            </div>
          ))}
        </div>

        {/* Driver contact - post-assignment statuses */}
        {showDriverContact && (
          <div className="px-4 py-2.5 bg-muted/20 border-t border-border/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {order.driver_photo ? (
                  <img 
                    src={order.driver_photo} 
                    alt={order.driver_name || 'Livreur'}
                    className="w-8 h-8 rounded-full object-cover border border-border/50"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <Truck className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {order.driver_name || 'Livreur'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {order.status === 'driver_assigned' ? 'Assigné' : 
                     order.status === 'picked_up' ? 'Récupérée' : 'En route'}
                  </p>
                </div>
              </div>
              {order.driver_phone && (
                <Button 
                  variant="outline" 
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => window.open(`tel:${order.driver_phone}`, '_self')}
                >
                  <Phone className="w-3.5 h-3.5 mr-1" />
                  Appeler
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Delivery address */}
        <div className="px-4 py-2 border-t border-border/20">
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            <p className="truncate">{order.delivery_address}</p>
          </div>
        </div>

        {/* Footer - total + actions */}
        <div className="px-4 py-3 border-t border-border/30 bg-muted/10 flex items-center justify-between gap-2">
          <div>
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-lg font-bold text-foreground">
              {formatPrice(order.total_amount + order.delivery_fee)}
            </p>
          </div>

          <div className="flex gap-2">
            {isActiveOrder && (
              <Button
                variant="default"
                size="sm"
                className="h-8 text-xs"
                onClick={() => navigate(`/unified-tracking/food/${order.id}`)}
              >
                <MapPin className="w-3.5 h-3.5 mr-1" />
                Suivre
              </Button>
            )}
            
            {canCancel && onCancel && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="h-8 text-xs"
                    disabled={isCancelling}
                  >
                    <XCircle className="w-3.5 h-3.5 mr-1" />
                    Annuler
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Annuler la commande ?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Êtes-vous sûr de vouloir annuler cette commande ? Cette action est irréversible.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Garder</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onCancel(order.id, 'Annulé par le client')}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Confirmer l'annulation
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
