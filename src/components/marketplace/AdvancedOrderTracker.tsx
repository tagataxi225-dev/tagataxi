import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useMarketplaceOrders } from '@/hooks/useMarketplaceOrders';
import { useOrderNotifications } from '@/hooks/useOrderNotifications';
import { supabase } from '@/integrations/supabase/client';
import { 
  Package, 
  MapPin, 
  Clock, 
  CheckCircle, 
  Truck, 
  User, 
  Star,
  Bell,
  ArrowLeft,
  Timer,
  CreditCard,
  PackageCheck,
  Navigation,
  CircleDot,
  Sparkles
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { OrderCompletionDialog } from './orders/OrderCompletionDialog';
import { formatCurrency, getCurrencyByCity, type Currency } from '@/utils/formatCurrency';
import { cn } from '@/lib/utils';

interface OrderStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  active: boolean;
  timestamp?: string;
  estimated?: string;
  icon: React.ComponentType<any>;
}

export const AdvancedOrderTracker: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { orders, loading } = useMarketplaceOrders();
  const { notifications, unreadCount } = useOrderNotifications();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [realtimeUpdates, setRealtimeUpdates] = useState<any>({});

  // Real-time order updates
  useEffect(() => {
    if (!user || orders.length === 0) return;

    const channels = orders.map(order => {
      const channel = supabase.channel(`order-${order.id}`)
        .on('broadcast', {
          event: 'order_status_updated'
        }, (payload) => {
          setRealtimeUpdates(prev => ({
            ...prev,
            [order.id]: payload.payload
          }));
        })
        .subscribe();

      return channel;
    });

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [user, orders]);

  const getAdvancedOrderSteps = (order: any): OrderStep[] => {
    const currentStatus = order.status;
    
    const baseSteps: OrderStep[] = [
      {
        id: 'payment',
        title: 'Paiement validé',
        description: 'Votre paiement a été sécurisé',
        completed: order.payment_status !== 'pending',
        active: order.payment_status === 'pending',
        timestamp: order.created_at,
        icon: CreditCard
      },
      {
        id: 'pending',
        title: 'En attente',
        description: 'Confirmation du vendeur',
        completed: ['confirmed', 'preparing', 'ready_for_pickup', 'in_transit', 'delivered', 'completed'].includes(currentStatus),
        active: currentStatus === 'pending',
        timestamp: order.created_at,
        estimated: 'Sous 30 min',
        icon: Clock
      },
      {
        id: 'confirmed',
        title: 'Confirmée',
        description: 'Le vendeur a accepté la commande',
        completed: ['pending_buyer_approval', 'preparing', 'ready_for_pickup', 'in_transit', 'delivered', 'completed'].includes(currentStatus),
        active: currentStatus === 'confirmed',
        timestamp: order.confirmed_at,
        icon: CheckCircle
      },
      {
        id: 'pending_buyer_approval',
        title: 'Approbation frais',
        description: 'Validez les frais de livraison proposés',
        completed: ['preparing', 'ready_for_pickup', 'in_transit', 'delivered', 'completed'].includes(currentStatus),
        active: currentStatus === 'pending_buyer_approval',
        timestamp: order.pending_buyer_approval_at,
        icon: CreditCard
      }
    ];

    if (order.delivery_method === 'delivery') {
      baseSteps.push(
        {
          id: 'preparing',
          title: 'En préparation',
          description: 'Votre commande est préparée',
          completed: ['ready_for_pickup', 'in_transit', 'delivered', 'completed'].includes(currentStatus),
          active: currentStatus === 'preparing',
          timestamp: order.preparing_at,
          icon: Package
        },
        {
          id: 'ready',
          title: 'Prête',
          description: 'En attente du livreur',
          completed: ['in_transit', 'delivered', 'completed'].includes(currentStatus),
          active: currentStatus === 'ready_for_pickup',
          timestamp: order.ready_for_pickup_at,
          icon: PackageCheck
        },
        {
          id: 'transit',
          title: 'En livraison',
          description: 'Le livreur est en route',
          completed: ['delivered', 'completed'].includes(currentStatus),
          active: currentStatus === 'in_transit',
          timestamp: order.in_transit_at,
          estimated: order.estimated_delivery_time,
          icon: Truck
        },
        {
          id: 'delivered',
          title: 'Livrée',
          description: 'Commande reçue',
          completed: currentStatus === 'completed',
          active: currentStatus === 'delivered',
          timestamp: order.delivered_at,
          icon: MapPin
        }
      );
    } else {
      baseSteps.push(
        {
          id: 'preparing',
          title: 'En préparation',
          description: 'Le vendeur prépare votre commande',
          completed: ['ready_for_pickup', 'completed'].includes(currentStatus),
          active: currentStatus === 'preparing',
          timestamp: order.preparing_at,
          icon: Package
        },
        {
          id: 'ready',
          title: 'Prête à récupérer',
          description: 'Rendez-vous chez le vendeur',
          completed: currentStatus === 'completed',
          active: currentStatus === 'ready_for_pickup',
          timestamp: order.ready_for_pickup_at,
          icon: PackageCheck
        }
      );
    }

    baseSteps.push({
      id: 'completed',
      title: 'Terminée',
      description: 'Merci pour votre achat !',
      completed: currentStatus === 'completed',
      active: false,
      timestamp: order.completed_at,
      icon: Sparkles
    });

    return baseSteps;
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string }> = {
      pending_payment: { label: 'Paiement...', variant: 'destructive', className: 'bg-amber-500' },
      pending: { label: 'En attente', variant: 'secondary', className: 'bg-slate-500' },
      confirmed: { label: 'Confirmée', variant: 'default', className: 'bg-blue-500' },
      pending_buyer_approval: { label: 'Approbation frais', variant: 'secondary', className: 'bg-yellow-500' },
      preparing: { label: 'Préparation', variant: 'secondary', className: 'bg-purple-500' },
      ready_for_pickup: { label: 'Prête', variant: 'default', className: 'bg-orange-500' },
      in_transit: { label: 'En livraison', variant: 'default', className: 'bg-cyan-500' },
      delivered: { label: 'Livrée', variant: 'secondary', className: 'bg-emerald-500' },
      completed: { label: 'Terminée', variant: 'outline', className: 'bg-green-600' },
      cancelled: { label: 'Annulée', variant: 'destructive', className: 'bg-red-500' }
    };
    return configs[status] || { label: status, variant: 'outline' as const, className: 'bg-gray-500' };
  };

  const renderModernTimeline = (steps: OrderStep[]) => {
    const activeIndex = steps.findIndex(s => s.active);
    const progressPercent = activeIndex >= 0 
      ? (activeIndex / (steps.length - 1)) * 100 
      : steps.every(s => s.completed) ? 100 : 0;

    return (
      <div className="relative py-4">
        {/* Ligne de progression */}
        <div className="absolute left-6 top-8 bottom-8 w-1 bg-muted rounded-full overflow-hidden">
          <motion.div 
            className="w-full bg-gradient-to-b from-primary via-primary to-primary/50 rounded-full"
            initial={{ height: 0 }}
            animate={{ height: `${progressPercent}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>

        <div className="space-y-1">
          {steps.map((step, index) => {
            const IconComponent = step.icon;
            const isLast = index === steps.length - 1;
            
            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.08, duration: 0.3 }}
                className="relative"
              >
                <div className={`
                  flex items-start gap-4 p-3 rounded-xl transition-all duration-300
                  ${step.active ? 'bg-primary/10 border border-primary/30' : ''}
                  ${step.completed && !step.active ? 'opacity-90' : ''}
                  ${!step.completed && !step.active ? 'opacity-50' : ''}
                `}>
                  {/* Icône */}
                  <div className="relative z-10 flex-shrink-0">
                    <motion.div 
                      className={`
                        w-12 h-12 rounded-full flex items-center justify-center shadow-lg
                        ${step.completed 
                          ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground' 
                          : step.active 
                            ? 'bg-primary text-primary-foreground ring-4 ring-primary/30' 
                            : 'bg-muted text-muted-foreground'
                        }
                      `}
                      animate={step.active ? { scale: [1, 1.05, 1] } : {}}
                      transition={{ repeat: Infinity, duration: 2 }}
                    >
                      <IconComponent className="w-5 h-5" />
                    </motion.div>
                    
                    {/* Badge de complétion */}
                    {step.completed && (
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shadow-md"
                      >
                        <CheckCircle className="w-3 h-3 text-white" />
                      </motion.div>
                    )}
                    
                    {/* Indicateur LIVE */}
                    {step.active && (
                      <motion.div 
                        className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-red-500 rounded text-[10px] font-bold text-white shadow-md"
                        animate={{ opacity: [1, 0.5, 1] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                      >
                        LIVE
                      </motion.div>
                    )}
                  </div>

                  {/* Contenu */}
                  <div className="flex-1 min-w-0 pt-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className={`font-semibold text-sm ${step.active ? 'text-primary' : step.completed ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {step.title}
                      </h4>
                      {step.timestamp && step.completed && (
                        <span className="text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                          {format(new Date(step.timestamp), 'HH:mm', { locale: fr })}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {step.description}
                    </p>
                    
                    {step.active && step.estimated && (
                      <motion.div 
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-1.5 mt-2 text-xs text-primary font-medium"
                      >
                        <Timer className="w-3.5 h-3.5" />
                        <span>Estimé: {step.estimated}</span>
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  };

  const getCardStatus = (status: string): { label: string; badge: string; bar: string } => {
    if (status === 'completed' || status === 'delivered') {
      return { label: 'Terminée', badge: 'bg-green-50 text-green-700', bar: 'bg-green-500' };
    }
    if (status === 'ready_for_pickup') {
      return { label: 'Prête', badge: 'bg-blue-50 text-blue-700', bar: 'bg-blue-500' };
    }
    if (status === 'cancelled') {
      return { label: 'Annulée', badge: 'bg-red-50 text-red-700', bar: 'bg-red-500' };
    }
    return { label: 'En cours', badge: 'bg-orange-50 text-orange-700', bar: 'bg-orange-500' };
  };

  const getProgressPercent = (status: string): number => {
    if (status === 'completed') return 100;
    if (status === 'delivered') return 90;
    if (status === 'in_transit') return 70;
    if (status === 'ready_for_pickup') return 55;
    if (status === 'preparing') return 40;
    if (status === 'pending_buyer_approval') return 20;
    if (status === 'confirmed') return 15;
    if (status === 'cancelled') return 100;
    return 10;
  };

  const renderOrderCard = (order: any) => {
    const realtimeData = realtimeUpdates[order.id];
    const currentStatus = realtimeData?.new_status || order.status;
    const cardStatus = getCardStatus(currentStatus);
    const progressPercent = getProgressPercent(currentStatus);

    return (
      <motion.div
        key={order.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileTap={{ scale: 0.99 }}
        transition={{ duration: 0.2 }}
        onClick={() => setSelectedOrder(order)}
        className="bg-white rounded-2xl shadow-sm mx-4 mb-3 p-4 cursor-pointer"
        style={{ touchAction: 'manipulation' }}
      >
        <div className="flex gap-3">
          {/* Image */}
          <div className="relative flex-shrink-0">
            {order.product?.images?.[0] ? (
              <img
                src={order.product.images[0]}
                alt={order.product.title}
                className="w-16 h-16 rounded-xl object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center">
                <Package className="w-6 h-6 text-gray-300" />
              </div>
            )}
            {realtimeData && (
              <motion.div
                className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-sm text-gray-900 truncate flex-1">
                {order.product?.title || 'Produit'}
              </h3>
              <span className={cn('rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap shrink-0', cardStatus.badge)}>
                {cardStatus.label}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              #{order.id.slice(0, 8).toUpperCase()}
            </p>
            <p className="text-red-600 font-bold text-sm mt-1" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {formatCurrency(order.total_amount || 0, getCurrencyByCity(order.delivery_address || ''))}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {formatDistanceToNow(new Date(order.created_at), { addSuffix: true, locale: fr })}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-1 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            className={cn('h-full', cardStatus.bar)}
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </motion.div>
    );
  };

  const renderOrderDetails = () => {
    if (!selectedOrder) return null;

    const steps = getAdvancedOrderSteps(selectedOrder);
    const statusConfig = getStatusConfig(selectedOrder.status);
    
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setSelectedOrder(null)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h2 className="font-bold text-lg">Commande #{selectedOrder.id.slice(0, 8).toUpperCase()}</h2>
            <p className="text-xs text-muted-foreground">
              {format(new Date(selectedOrder.created_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}
            </p>
          </div>
          <Badge variant={statusConfig.variant} className="text-sm">
            {statusConfig.label}
          </Badge>
        </div>

        {/* Produit */}
        <Card className="overflow-hidden border-0 shadow-lg">
          <div className={`h-1 ${statusConfig.className}`} />
          <CardContent className="p-4">
            <div className="flex gap-4">
              {selectedOrder.product?.images?.[0] ? (
                <img
                  src={selectedOrder.product.images[0]}
                  alt={selectedOrder.product.title}
                  className="w-24 h-24 object-cover rounded-xl"
                />
              ) : (
                <div className="w-24 h-24 bg-muted rounded-xl flex items-center justify-center">
                  <Package className="w-10 h-10 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1">
                <h3 className="font-semibold mb-1">{selectedOrder.product?.title}</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  {selectedOrder.quantity} × {formatCurrency(selectedOrder.unit_price || 0, getCurrencyByCity(selectedOrder.delivery_address || ''))}
                </p>
                <p className="text-xl font-bold text-primary">
                  {formatCurrency(selectedOrder.total_amount || 0, getCurrencyByCity(selectedOrder.delivery_address || ''))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Suivi en direct - pour les commandes en cours */}
        {['confirmed', 'pending_buyer_approval', 'preparing', 'ready_for_pickup', 'in_transit'].includes(selectedOrder.status) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="overflow-hidden border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center">
                    <Navigation className="w-7 h-7 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">Suivi en temps réel</h3>
                    <p className="text-sm text-muted-foreground">Voir la position du livreur</p>
                  </div>
                  <Button 
                    onClick={() => navigate(`/tracking/marketplace/${selectedOrder.id}`)}
                    size="sm"
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    Suivre
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Timeline moderne */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CircleDot className="w-5 h-5 text-primary" />
              Suivi de commande
              {['confirmed', 'preparing', 'ready_for_pickup', 'in_transit', 'delivered'].includes(selectedOrder.status) && (
                <motion.span 
                  className="ml-auto px-2 py-0.5 bg-green-500/10 text-green-600 text-xs font-medium rounded-full"
                  animate={{ opacity: [1, 0.6, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  ● En cours
                </motion.span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {renderModernTimeline(steps)}
          </CardContent>
        </Card>

        {/* Bouton confirmer réception - pour les commandes livrées */}
        {selectedOrder.status === 'delivered' && selectedOrder.buyer_id === user?.id && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-2 border-dashed border-primary/50 bg-gradient-to-br from-primary/5 to-primary/10">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <PackageCheck className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Commande reçue ?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Confirmez la réception pour libérer le paiement au vendeur
                </p>
                <Button 
                  size="lg" 
                  className="w-full gap-2"
                  onClick={() => setShowCompletionDialog(true)}
                >
                  <CheckCircle className="w-5 h-5" />
                  Confirmer la réception
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Adresse de livraison */}
        {selectedOrder.delivery_address && (
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium mb-1">Adresse de livraison</p>
                  <p className="text-sm text-muted-foreground">{selectedOrder.delivery_address}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="bg-card rounded-xl p-4 animate-pulse">
            <div className="flex gap-4">
              <div className="w-20 h-20 bg-muted rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
                <div className="h-4 bg-muted rounded w-1/3" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (selectedOrder) {
    return (
      <>
        {renderOrderDetails()}
        
        {/* ✅ Dialog de complétion avec notation ET libération escrow */}
        <OrderCompletionDialog
          isOpen={showCompletionDialog}
          onClose={() => setShowCompletionDialog(false)}
          order={selectedOrder}
          onComplete={() => {
            setShowCompletionDialog(false);
            setSelectedOrder(null);
          }}
        />
      </>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="font-bold text-xl">Mes Commandes</h2>
          <p className="text-gray-400 text-sm">
            Suivi en temps réel
          </p>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          className="relative"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
              {unreadCount}
            </span>
          )}
        </Button>
      </div>

      {orders.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Aucune commande</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Vos achats apparaîtront ici
            </p>
            <Button onClick={() => navigate('/marketplace')}>
              Explorer le marché
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {orders.map(order => renderOrderCard(order))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
