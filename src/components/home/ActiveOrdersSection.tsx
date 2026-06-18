/**
 * Section unifiée des commandes actives (taxi + livraison) sur l'accueil
 * Utilise les icônes 3D style Yango pour plus de modernité
 */

import { motion } from 'framer-motion';
import { ChevronRight, Clock, Check, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getVehicle3dIcon } from '@/utils/vehicle3dIcons';

interface ActiveOrder {
  id: string;
  type: 'taxi' | 'delivery';
  status: string;
  origin: string;
  destination: string;
  subLabel?: string;
}

interface ActiveOrdersSectionProps {
  taxiBookings: { id: string; status: string; pickup_location: string; destination: string; vehicle_type: string }[];
  deliveryOrders: { id: string; status: string; pickup_location: string; delivery_location: string; delivery_type: string }[];
  onTaxiClick: (bookingId: string) => void;
  onDeliveryClick: (orderId: string) => void;
}

const getStatusConfig = (status: string, type: 'taxi' | 'delivery') => {
  switch (status) {
    case 'pending':
      return { label: 'En attente', color: 'text-amber-600', bg: 'bg-amber-500/10', icon: Clock, pulse: true };
    case 'confirmed':
      return { label: 'Confirmée', color: 'text-blue-600', bg: 'bg-blue-500/10', icon: Check, pulse: false };
    case 'driver_assigned':
      return { label: type === 'taxi' ? 'Chauffeur assigné' : 'Livreur assigné', color: 'text-purple-600', bg: 'bg-purple-500/10', pulse: false };
    case 'in_progress':
    case 'in_transit':
      return { label: 'En route', color: 'text-blue-600', bg: 'bg-blue-500/10', pulse: true };
    case 'picked_up':
      return { label: 'Collecté', color: 'text-orange-600', bg: 'bg-orange-500/10', pulse: false };
    default:
      return { label: status, color: 'text-muted-foreground', bg: 'bg-muted', pulse: false };
  }
};

const HIDDEN_STATUSES = ['cancelled', 'completed', 'rejected', 'expired'];

export const ActiveOrdersSection = ({ taxiBookings, deliveryOrders, onTaxiClick, onDeliveryClick }: ActiveOrdersSectionProps) => {
  const allOrders: ActiveOrder[] = [
    ...taxiBookings
      .filter(b => !HIDDEN_STATUSES.includes(b.status))
      .map(b => ({
        id: b.id,
        type: 'taxi' as const,
        status: b.status,
        origin: b.pickup_location,
        destination: b.destination,
        subLabel: b.vehicle_type
      })),
    ...deliveryOrders
      .filter(o => !HIDDEN_STATUSES.includes(o.status))
      .map(o => ({
        id: o.id,
        type: 'delivery' as const,
        status: o.status,
        origin: o.pickup_location,
        destination: o.delivery_location,
        subLabel: o.delivery_type
      }))
  ];

  if (allOrders.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mx-4 mb-4"
    >
      <div className="flex items-center justify-between mb-3 px-1">
        <p className="text-xs font-black text-foreground/40 uppercase tracking-widest">
          Suivi en direct
        </p>
        <div className="flex gap-1">
          <div className="w-1 h-1 rounded-full bg-primary animate-pulse" />
          <div className="w-1 h-1 rounded-full bg-primary animate-pulse delay-75" />
        </div>
      </div>
      <div className="space-y-3">
        {allOrders.map((order) => {
          const config = getStatusConfig(order.status, order.type);
          const icon3d = getVehicle3dIcon(order.subLabel || (order.type === 'taxi' ? 'eco' : 'flash'));

          return (
            <motion.button
              key={order.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => order.type === 'taxi' ? onTaxiClick(order.id) : onDeliveryClick(order.id)}
              className="w-full text-left group"
            >
              <div className="p-4 bg-card border border-border/40 rounded-[2rem] shadow-sm group-hover:shadow-md transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-14 h-14 rounded-2xl bg-muted/30 flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110">
                      <img 
                        src={icon3d} 
                        alt={order.type} 
                        className="w-10 h-10 object-contain filter drop-shadow-md"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-black text-sm text-foreground truncate">
                          {order.type === 'taxi' ? 'Course Taxi' : 'Livraison TAGA'}
                        </p>
                        {config.pulse && (
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <p className={cn("text-[11px] font-bold", config.color)}>
                          {config.label}
                        </p>
                        <span className="text-muted-foreground/30 text-[10px]">•</span>
                        <p className="text-[10px] text-muted-foreground font-medium truncate">
                          {order.destination}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <ChevronRight className="w-5 h-5 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                  </div>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
};

export default ActiveOrdersSection;
