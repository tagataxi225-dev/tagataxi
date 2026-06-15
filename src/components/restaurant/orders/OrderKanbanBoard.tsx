import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { useState, useRef } from 'react';
import { RestaurantOrderDeliveryPanel } from '../RestaurantOrderDeliveryPanel';
import { OrderCard } from './OrderCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Order {
  id: string;
  order_number: string;
  status: string;
  created_at: string;
  items: any[];
  total_amount: number;
  delivery_phone: string;
  delivery_address: string;
  delivery_coordinates?: { lat: number; lng: number };
  estimated_preparation_time?: number;
  driver_id?: string | null;
  customer?: {
    display_name?: string;
    phone_number?: string;
  };
}

interface OrderKanbanBoardProps {
  orders: Order[];
  onStatusChange: (orderId: string, newStatus: string) => void;
  onConfirmOrder: (orderId: string, prepTime: number) => void;
  restaurantAddress?: string;
  restaurantProfile?: {
    restaurant_name?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    phone_number?: string;
  };
  orderTimers?: { [key: string]: number };
}

const COLUMNS = [
  { id: 'pending', label: 'Nouveau', color: 'from-blue-500 to-cyan-500', nextStatus: 'confirmed' },
  { id: 'confirmed', label: 'Confirmé', color: 'from-purple-500 to-pink-500', nextStatus: 'preparing' },
  { id: 'preparing', label: 'Préparation', color: 'from-orange-500 to-red-500', nextStatus: 'ready' },
  { id: 'ready', label: 'Prêt', color: 'from-green-500 to-emerald-500', nextStatus: 'picked_up' },
];

export const OrderKanbanBoard = ({ 
  orders, 
  onStatusChange, 
  onConfirmOrder, 
  restaurantAddress = '', 
  restaurantProfile,
  orderTimers = {}
}: OrderKanbanBoardProps) => {
  const [activeColumn, setActiveColumn] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const getOrdersByStatus = (status: string) => {
    return orders.filter(order => order.status === status);
  };

  const scrollToColumn = (direction: 'left' | 'right') => {
    const newIndex = direction === 'left' 
      ? Math.max(0, activeColumn - 1)
      : Math.min(COLUMNS.length - 1, activeColumn + 1);
    setActiveColumn(newIndex);
    
    if (scrollRef.current) {
      const columnWidth = scrollRef.current.scrollWidth / COLUMNS.length;
      scrollRef.current.scrollTo({
        left: columnWidth * newIndex,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="space-y-3">
      {/* Mobile Column Indicators */}
      <div className="flex md:hidden items-center justify-between px-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => scrollToColumn('left')}
          disabled={activeColumn === 0}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <div className="flex gap-1.5">
          {COLUMNS.map((col, idx) => {
            const count = getOrdersByStatus(col.id).length;
            return (
              <button
                key={col.id}
                onClick={() => {
                  setActiveColumn(idx);
                  if (scrollRef.current) {
                    const columnWidth = scrollRef.current.scrollWidth / COLUMNS.length;
                    scrollRef.current.scrollTo({
                      left: columnWidth * idx,
                      behavior: 'smooth'
                    });
                  }
                }}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-all",
                  activeColumn === idx 
                    ? `bg-gradient-to-r ${col.color} text-white` 
                    : "bg-muted text-muted-foreground"
                )}
              >
                <span className="hidden xs:inline">{col.label.split(' ')[0]}</span>
                <span className="font-bold">{count}</span>
              </button>
            );
          })}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => scrollToColumn('right')}
          disabled={activeColumn === COLUMNS.length - 1}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Kanban Grid - Scrollable on mobile */}
      <div 
        ref={scrollRef}
        className="flex md:grid md:grid-cols-4 gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {COLUMNS.map((column, colIndex) => {
          const columnOrders = getOrdersByStatus(column.id);
          
          return (
            <div 
              key={column.id} 
              className="min-w-[85vw] sm:min-w-[70vw] md:min-w-0 snap-center space-y-3"
            >
              {/* Column Header */}
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: colIndex * 0.1 }}
                className={`rounded-xl bg-gradient-to-r ${column.color} p-3 md:p-4 text-white shadow-lg`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base md:text-lg">{column.label}</h3>
                  <Badge variant="secondary" className="bg-white/20 text-white border-0 text-sm">
                    {columnOrders.length}
                  </Badge>
                </div>
              </motion.div>

              {/* Orders */}
              <div className="space-y-3 min-h-[200px]">
                {columnOrders.map((order, index) => {
                  const elapsed = orderTimers[order.id] || 0;
                  
                  return (
                    <OrderCard
                      key={order.id}
                      order={order}
                      elapsedMinutes={elapsed}
                      onConfirm={order.status === 'pending' ? (prepTime) => onConfirmOrder(order.id, prepTime) : undefined}
                      onStatusChange={(status) => onStatusChange(order.id, status)}
                      nextStatus={column.nextStatus}
                      index={index}
                      showDeliveryPanel={['confirmed', 'preparing', 'ready'].includes(order.status) && !order.driver_id ? (
                        <RestaurantOrderDeliveryPanel
                          orderId={order.id}
                          orderStatus={order.status}
                          restaurantAddress={restaurantAddress}
                          deliveryAddress={order.delivery_address}
                          deliveryCoordinates={order.delivery_coordinates}
                          restaurantProfile={restaurantProfile}
                          deliveryPhone={order.delivery_phone}
                          orderNumber={order.order_number}
                          onStatusChange={() => window.location.reload()}
                        />
                      ) : undefined}
                    />
                  );
                })}

                {columnOrders.length === 0 && (
                  <div className="flex items-center justify-center h-32 text-muted-foreground text-sm border-2 border-dashed rounded-xl bg-muted/30">
                    Aucune commande
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
