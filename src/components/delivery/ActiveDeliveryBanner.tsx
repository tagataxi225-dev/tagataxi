/**
 * Bannière minimaliste affichant les livraisons actives sur l'accueil
 * Design soft-modern cohérent avec la charte Tembea
 */

import { motion } from 'framer-motion';
import { Package, ChevronRight, Clock, Truck, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ActiveDeliveryOrder {
  id: string;
  status: string;
  delivery_type: string;
  pickup_location: string;
  delivery_location: string;
  estimated_price: number | null;
  recipient_name: string;
}

interface ActiveDeliveryBannerProps {
  orders: ActiveDeliveryOrder[];
  onOrderClick: (orderId: string) => void;
}

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'pending':
      return { label: 'En attente', color: 'text-amber-600', bgColor: 'bg-amber-500/10', icon: Clock, pulse: true };
    case 'confirmed':
      return { label: 'Confirmée', color: 'text-blue-600', bgColor: 'bg-blue-500/10', icon: Check, pulse: false };
    case 'driver_assigned':
      return { label: 'Livreur assigné', color: 'text-purple-600', bgColor: 'bg-purple-500/10', icon: Truck, pulse: false };
    case 'picked_up':
      return { label: 'En collecte', color: 'text-orange-600', bgColor: 'bg-orange-500/10', icon: Package, pulse: false };
    case 'in_transit':
      return { label: 'En route', color: 'text-primary', bgColor: 'bg-primary/10', icon: Truck, pulse: true };
    default:
      return { label: status, color: 'text-muted-foreground', bgColor: 'bg-muted', icon: Package, pulse: false };
  }
};

const getDeliveryTypeLabel = (type: string) => {
  switch (type?.toLowerCase()) {
    case 'flash': return 'Flash';
    case 'flex': return 'Flex';
    case 'maxicharge': return 'Maxi';
    default: return type;
  }
};

export const ActiveDeliveryBanner = ({ orders, onOrderClick }: ActiveDeliveryBannerProps) => {
  if (!orders || orders.length === 0) return null;

  // Show only the most recent order in the banner
  const order = orders[0];
  const statusConfig = getStatusConfig(order.status);
  const StatusIcon = statusConfig.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="mx-4 mb-4"
    >
      <button
        onClick={() => onOrderClick(order.id)}
        className="w-full text-left"
      >
        <div className="p-3 bg-card border border-border/50 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            {/* Left: Icon + Info */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                statusConfig.bgColor
              )}>
                <StatusIcon className={cn("w-5 h-5", statusConfig.color)} />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-foreground truncate">
                    Livraison en cours
                  </p>
                  {statusConfig.pulse && (
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  #{order.id.slice(-8)} • {statusConfig.label}
                </p>
              </div>
            </div>

            {/* Right: Badge + Chevron */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge 
                variant="secondary" 
                className={cn(
                  "text-xs font-medium px-2 py-0.5",
                  statusConfig.bgColor,
                  statusConfig.color
                )}
              >
                {getDeliveryTypeLabel(order.delivery_type)}
              </Badge>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>

          {/* Show count if multiple orders */}
          {orders.length > 1 && (
            <div className="mt-2 pt-2 border-t border-border/30">
              <p className="text-xs text-muted-foreground text-center">
                +{orders.length - 1} autre{orders.length > 2 ? 's' : ''} livraison{orders.length > 2 ? 's' : ''} en cours
              </p>
            </div>
          )}
        </div>
      </button>
    </motion.div>
  );
};

export default ActiveDeliveryBanner;
