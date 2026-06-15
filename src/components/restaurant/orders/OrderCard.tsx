import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Phone, MapPin, Clock, ChevronRight, ExternalLink, User, Lock, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface OrderItem {
  name: string;
  quantity: number;
  price?: number;
}

interface OrderCardProps {
  order: {
    id: string;
    order_number: string;
    status: string;
    created_at: string;
    items: OrderItem[];
    total_amount: number;
    delivery_phone: string;
    delivery_address: string;
    delivery_coordinates?: { lat: number; lng: number };
    estimated_preparation_time?: number;
    customer?: {
      display_name?: string | null;
      phone_number?: string | null;
    } | null;
    payment_status?: string;
    driver_id?: string | null;
    delivery_fee?: number;
  };
  elapsedMinutes: number;
  onConfirm?: (prepTime: number) => void;
  onStatusChange?: (newStatus: string) => void;
  nextStatus?: string;
  showDeliveryPanel?: React.ReactNode;
  index?: number;
  onRefresh?: () => void;
}

const STATUS_CONFIG = {
  pending: { label: 'Nouveau', color: 'bg-blue-500', nextAction: 'Confirmer' },
  confirmed: { label: 'Confirmé', color: 'bg-purple-500', nextAction: 'Commencer' },
  preparing: { label: 'En préparation', color: 'bg-orange-500', nextAction: 'Marquer prêt' },
  ready: { label: 'Prêt', color: 'bg-green-500', nextAction: 'Récupéré' },
  picked_up: { label: 'Récupéré', color: 'bg-emerald-500', nextAction: '' },
  delivered: { label: 'Livré', color: 'bg-emerald-600', nextAction: '' },
  cancelled: { label: 'Annulé', color: 'bg-destructive', nextAction: '' },
};

export const OrderCard = ({
  order,
  elapsedMinutes,
  onConfirm,
  onStatusChange,
  nextStatus,
  showDeliveryPanel,
  index = 0,
  onRefresh
}: OrderCardProps) => {
  const statusConfig = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
  
  const getTimerColor = () => {
    if (order.status === 'pending' && elapsedMinutes > 5) return 'text-destructive';
    if (order.status === 'preparing' && elapsedMinutes > 30) return 'text-destructive';
    if (elapsedMinutes > 15) return 'text-orange-500';
    return 'text-muted-foreground';
  };

  const isUrgent = order.status === 'pending' && elapsedMinutes > 5;

  // Fallback: profiles.phone_number -> delivery_phone
  const customerPhone = order.customer?.phone_number || order.delivery_phone;

  const handleCall = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (customerPhone) {
      window.location.href = `tel:${customerPhone}`;
    }
  };

  const handleOpenMap = (e: React.MouseEvent) => {
    e.stopPropagation();
    const query = order.delivery_coordinates 
      ? `${order.delivery_coordinates.lat},${order.delivery_coordinates.lng}`
      : encodeURIComponent(order.delivery_address);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };


  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
    >
      <Card className={cn(
        "hover:shadow-lg transition-all cursor-pointer group border-l-4",
        isUrgent && "animate-pulse border-l-destructive bg-destructive/5",
        !isUrgent && "border-l-transparent"
      )}>
        <CardContent className="p-4 space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-base">#{order.order_number}</span>
                {isUrgent && (
                  <Badge variant="destructive" className="text-xs animate-pulse">
                    Urgent
                  </Badge>
                )}
              </div>
              <div className={cn("flex items-center gap-1 text-sm", getTimerColor())}>
                <Clock className="h-3.5 w-3.5" />
                <span>{elapsedMinutes} min</span>
              </div>
            </div>
            <div className="text-right space-y-1">
              <p className="font-bold text-primary text-lg">{order.total_amount.toLocaleString()} CDF</p>
              <div className="flex items-center gap-1.5 justify-end">
                {order.payment_status === 'paid' && (
                  <Badge variant="outline" className="text-xs gap-1 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800">
                    <Lock className="h-2.5 w-2.5" />
                    Escrow
                  </Badge>
                )}
                <Badge className={cn(statusConfig.color, "text-white text-xs")}>
                  {statusConfig.label}
                </Badge>
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="bg-muted/50 rounded-lg p-3 space-y-1.5">
            {order.items.slice(0, 3).map((item, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span className="text-foreground">{item.quantity}x {item.name}</span>
                {item.price && (
                  <span className="text-muted-foreground">{(item.quantity * item.price).toLocaleString()} CDF</span>
                )}
              </div>
            ))}
            {order.items.length > 3 && (
              <p className="text-xs text-muted-foreground pt-1">+{order.items.length - 3} autre(s)</p>
            )}
          </div>

          {/* Nom du client */}
          {order.customer?.display_name && (
            <div className="flex items-center gap-2 text-sm font-medium">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{order.customer.display_name}</span>
            </div>
          )}

          {/* Contact - Clickable */}
          <div className="flex gap-2">
            {customerPhone ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs h-9"
                  onClick={handleCall}
                >
                  <Phone className="h-3.5 w-3.5 mr-1.5" />
                  {customerPhone}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950/30"
                  onClick={(e) => {
                    e.stopPropagation();
                    const cleaned = customerPhone.replace(/[^0-9+]/g, '');
                    window.open(`https://wa.me/${cleaned}`, '_blank');
                  }}
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                </Button>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground h-9 border rounded-md">
                <Phone className="h-3.5 w-3.5 mr-1.5 opacity-50" />
                Téléphone non renseigné
              </div>
            )}
            {!showDeliveryPanel && (
              <Button
                variant="outline"
                size="sm"
                className="h-9"
                onClick={handleOpenMap}
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>

          {/* Address - only when delivery panel is NOT shown */}
          {!showDeliveryPanel && (
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              {/^-?\d+\.\d+,\s*-?\d+\.\d+$/.test(order.delivery_address?.trim() || '') ? (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${order.delivery_address.trim()}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  📍 Position GPS du client
                </a>
              ) : (
                <span className="line-clamp-2">{order.delivery_address}</span>
              )}
            </div>
          )}

          {/* Actions */}
          {order.status === 'pending' && onConfirm ? (
            <div className="grid grid-cols-3 gap-2 pt-1">
              <Button size="sm" onClick={() => onConfirm(15)} className="text-xs">
                15 min
              </Button>
              <Button size="sm" variant="secondary" onClick={() => onConfirm(20)} className="text-xs">
                20 min
              </Button>
              <Button size="sm" variant="outline" onClick={() => onConfirm(30)} className="text-xs">
                30 min
              </Button>
            </div>
          ) : showDeliveryPanel ? (
            <div className="pt-1">{showDeliveryPanel}</div>
          ) : nextStatus && onStatusChange ? (
            <Button
              size="sm"
              variant="outline"
              className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
              onClick={() => onStatusChange(nextStatus)}
            >
              <span>{statusConfig.nextAction}</span>
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : null}
        </CardContent>
      </Card>
    </motion.div>
  );
};
