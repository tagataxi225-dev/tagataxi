import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { useMarketplaceOrders } from "@/hooks/useMarketplaceOrders";
import { useToast } from "@/hooks/use-toast";
import { 
  Package, 
  User, 
  MapPin, 
  Clock, 
  CheckCircle, 
  Truck, 
  ShoppingBag,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  ChefHat,
  Timer,
  Car
} from "lucide-react";
import VendorSelfDeliveryButton from './VendorSelfDeliveryButton';
import { motion } from "framer-motion";

interface MarketplaceOrder {
  id: string;
  status: string;
  delivery_method: string;
  created_at: string;
  confirmed_at?: string;
  preparation_started_at?: string;
  ready_at?: string;
  driver_assigned_at?: string;
  picked_up_at?: string;
  delivered_at?: string;
  profiles?: {
    display_name: string;
  };
  marketplace_products?: {
    title: string;
    price: number;
  };
  quantity: number;
  total_amount: number;
  delivery_address?: string;
}

interface Props {
  orders: MarketplaceOrder[];
  onOrderUpdate: () => void;
}

type StatusFilter = 'all' | 'confirmed' | 'preparing' | 'ready_for_pickup' | 'assigned' | 'picked_up';

export default function MultiOrderStepsSlider({ orders, onOrderUpdate }: Props) {
  const { updateOrderStatus } = useMarketplaceOrders();
  const { toast } = useToast();
  const [processing, setProcessing] = useState<string[]>([]);
  const [currentOrderIndex, setCurrentOrderIndex] = useState(0);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const confirmedOrders = useMemo(() => {
    return orders.filter(order => 
      order.status !== 'pending' && 
      order.status !== 'cancelled' &&
      order.status !== 'delivered' &&
      order.status !== 'completed'
    );
  }, [orders]);

  const filteredOrders = useMemo(() => {
    if (statusFilter === 'all') return confirmedOrders;
    return confirmedOrders.filter(order => order.status === statusFilter);
  }, [confirmedOrders, statusFilter]);

  const urgentOrders = useMemo(() => {
    const now = new Date();
    return confirmedOrders.filter(order => {
      const createdAt = new Date(order.created_at);
      const hoursSinceCreated = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
      
      return (
        (order.status === 'confirmed' && hoursSinceCreated > 2) ||
        (order.status === 'preparing' && hoursSinceCreated > 4) ||
        (order.status === 'ready_for_pickup' && hoursSinceCreated > 1)
      );
    });
  }, [confirmedOrders]);

  const handleStepAction = useCallback(async (orderId: string, newStatus: string, additionalData: any = {}) => {
    setProcessing(prev => [...prev, orderId]);
    
    try {
      await updateOrderStatus(orderId, newStatus, additionalData);
      
      const statusMessages = {
        'preparing': 'Commande mise en préparation',
        'ready_for_pickup': 'Commande prête pour récupération',
        'assigned': 'Chauffeur assigné à la commande',
        'picked_up': 'Commande récupérée par le livreur',
        'delivered': 'Commande livrée avec succès'
      };
      
      toast({
        title: "Statut mis à jour",
        description: statusMessages[newStatus as keyof typeof statusMessages] || `Statut changé vers ${newStatus}`,
      });
      
      onOrderUpdate();
      
      // Navigate to next order if current action completed the workflow
      if (newStatus === 'delivered' && currentOrderIndex < filteredOrders.length - 1) {
        setCurrentOrderIndex(currentOrderIndex + 1);
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut de la commande.",
        variant: "destructive",
      });
    } finally {
      setProcessing(prev => prev.filter(id => id !== orderId));
    }
  }, [updateOrderStatus, toast, onOrderUpdate, currentOrderIndex, filteredOrders.length]);

  const getOrderSteps = useCallback((order: MarketplaceOrder) => {
    const baseSteps = [
      {
        id: 'confirmed',
        label: 'Confirmée',
        icon: CheckCircle,
        completed: !!order.confirmed_at,
        current: order.status === 'confirmed',
        action: null
      },
      {
        id: 'preparing',
        label: 'En préparation',
        icon: ChefHat,
        completed: !!order.preparation_started_at,
        current: order.status === 'preparing',
        action: order.status === 'confirmed' ? {
          label: 'Commencer la préparation',
          onClick: () => handleStepAction(order.id, 'preparing', {
            preparation_started_at: new Date().toISOString()
          })
        } : null
      },
      {
        id: 'ready_for_pickup',
        label: order.delivery_method === 'pickup' ? 'Prête pour retrait' : 'Prête pour livraison',
        icon: order.delivery_method === 'pickup' ? ShoppingBag : Package,
        completed: !!order.ready_at,
        current: order.status === 'ready_for_pickup',
        action: order.status === 'preparing' ? {
          label: 'Marquer comme prête',
          onClick: () => handleStepAction(order.id, 'ready_for_pickup', {
            ready_at: new Date().toISOString()
          })
        } : null
      }
    ];

    if (order.delivery_method === 'delivery') {
      baseSteps.push(
        {
          id: 'assigned',
          label: 'Chauffeur assigné',
          icon: Car,
          completed: !!order.driver_assigned_at,
          current: order.status === 'assigned',
          action: order.status === 'ready_for_pickup' ? {
            label: 'Assigner un chauffeur',
            onClick: () => handleStepAction(order.id, 'assigned', {
              driver_assigned_at: new Date().toISOString()
            })
          } : null
        },
        {
          id: 'picked_up',
          label: 'Récupérée',
          icon: Truck,
          completed: !!order.picked_up_at,
          current: order.status === 'picked_up',
          action: order.status === 'assigned' ? {
            label: 'Marquer comme récupérée',
            onClick: () => handleStepAction(order.id, 'picked_up', {
              picked_up_at: new Date().toISOString()
            })
          } : null
        }
      );
    }

    return baseSteps;
  }, [handleStepAction]);

  const getStatusBadge = (status: string, isUrgent: boolean = false) => {
    const variants = {
      confirmed: { variant: "secondary" as const, icon: Clock, label: "Confirmée" },
      preparing: { variant: "default" as const, icon: ChefHat, label: "En préparation" },
      ready_for_pickup: { variant: "outline" as const, icon: Package, label: "Prête" },
      assigned: { variant: "outline" as const, icon: Car, label: "Assignée" },
      picked_up: { variant: "outline" as const, icon: Truck, label: "Récupérée" }
    };

    const config = variants[status as keyof typeof variants] || { variant: "secondary" as const, icon: Clock, label: status };
    const Icon = config.icon;

    return (
      <Badge 
        variant={isUrgent ? "destructive" : config.variant}
        className={isUrgent ? "animate-pulse" : ""}
      >
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
        {isUrgent && <AlertCircle className="h-3 w-3 ml-1" />}
      </Badge>
    );
  };

  if (confirmedOrders.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-xl p-8 text-center"
      >
        <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="h-8 w-8 text-white" />
        </div>
        <h3 className="text-heading-sm mb-2 text-foreground">Aucune commande à traiter</h3>
        <p className="text-muted-foreground text-body-sm">
          Toutes vos commandes ont été livrées ou sont en attente de confirmation.
        </p>
      </motion.div>
    );
  }

  if (filteredOrders.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-xl p-6 text-center"
      >
        <p className="text-muted-foreground">Aucune commande dans cette catégorie.</p>
        <Button 
          variant="outline" 
          onClick={() => setStatusFilter('all')}
          className="mt-4"
        >
          Voir toutes les commandes
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with progress and filters */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Package className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-heading-sm text-foreground">
                Gestion des étapes
              </h3>
              <p className="text-caption text-muted-foreground">
                {currentOrderIndex + 1} sur {filteredOrders.length} commandes
                {urgentOrders.length > 0 && (
                  <span className="text-destructive font-medium ml-2">
                    ({urgentOrders.length} urgente{urgentOrders.length > 1 ? 's' : ''})
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Navigation dots */}
          <div className="flex items-center gap-2">
            {filteredOrders.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentOrderIndex(index)}
                className={`w-2 h-2 rounded-full transition-all duration-200 ${
                  index === currentOrderIndex 
                    ? 'bg-primary w-4' 
                    : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                }`}
                aria-label={`Aller à la commande ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Status filters */}
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'all', label: 'Toutes', count: confirmedOrders.length },
            { key: 'confirmed', label: 'Confirmées', count: confirmedOrders.filter(o => o.status === 'confirmed').length },
            { key: 'preparing', label: 'En préparation', count: confirmedOrders.filter(o => o.status === 'preparing').length },
            { key: 'ready_for_pickup', label: 'Prêtes', count: confirmedOrders.filter(o => o.status === 'ready_for_pickup').length },
            { key: 'assigned', label: 'Assignées', count: confirmedOrders.filter(o => o.status === 'assigned').length }
          ].filter(filter => filter.count > 0).map(filter => (
            <Button
              key={filter.key}
              variant={statusFilter === filter.key ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setStatusFilter(filter.key as StatusFilter);
                setCurrentOrderIndex(0);
              }}
              className="text-xs"
            >
              {filter.label} ({filter.count})
            </Button>
          ))}
        </div>
      </motion.div>

      {/* Orders Carousel */}
      <div className="relative">
        <Carousel 
          className="w-full"
          opts={{
            align: "start",
            loop: false,
            startIndex: currentOrderIndex
          }}
        >
          <CarouselContent>
            {filteredOrders.map((order) => {
              const isUrgent = urgentOrders.some(urgentOrder => urgentOrder.id === order.id);
              const steps = getOrderSteps(order);
              const nextAction = steps.find(step => step.action);

              return (
                <CarouselItem key={order.id} className="w-full">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                     className={`glass rounded-xl overflow-hidden border shadow-elegant hover:shadow-glow transition-all duration-300 ${
                       isUrgent ? 'border-destructive/50 bg-destructive/5' : 'border-primary/20'
                     }`}
                   >
                     {/* Header */}
                     <div className={`px-3 py-2 border-b ${
                       isUrgent ? 'bg-destructive/10 border-destructive/20' : 'bg-gradient-primary/10 border-primary/20'
                     }`}>
                       <div className="flex items-center justify-between">
                         <div className="flex items-center gap-2">
                           <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                             isUrgent ? 'bg-destructive/20' : 'bg-primary/20'
                           }`}>
                             <Package className={`h-3 w-3 ${isUrgent ? 'text-destructive' : 'text-primary'}`} />
                           </div>
                           <div>
                             <h4 className="text-sm font-medium text-foreground">
                               {order.marketplace_products?.title || 'Produit inconnu'}
                             </h4>
                             <p className="text-xs text-muted-foreground">
                               {order.profiles?.display_name || 'Client anonyme'}
                             </p>
                           </div>
                         </div>
                        {getStatusBadge(order.status, isUrgent)}
                      </div>
                    </div>

                    <div className="p-3 space-y-3">
                       {/* Order details */}
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                         <div className="space-y-1">
                           <div className="flex items-center gap-1 text-muted-foreground text-xs">
                             <Package className="h-3 w-3" />
                             Qté: {order.quantity}
                           </div>
                           <div className="flex items-center gap-1 text-muted-foreground text-xs">
                             <MapPin className="h-3 w-3" />
                             {order.delivery_method === 'delivery' ? 'Livraison' : 'Retrait'}
                           </div>
                         </div>
                         <div className="text-right">
                           <p className="text-xs text-muted-foreground">Total</p>
                           <p className="text-sm font-bold text-foreground">
                             {Number(order.total_amount).toLocaleString()} FC
                           </p>
                         </div>
                        </div>

                        {/* Delivery address - Only for delivery orders */}
                        {order.delivery_method === 'delivery' && (
                          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <h6 className="text-sm font-medium text-foreground">Adresse de livraison</h6>
                            </div>
                            {order.delivery_address ? (
                              <p className="text-sm text-muted-foreground leading-relaxed pl-6 break-words">
                                {order.delivery_address}
                              </p>
                            ) : (
                              <p className="text-sm text-muted-foreground italic pl-6">
                                Adresse non spécifiée
                              </p>
                            )}
                          </div>
                        )}

                        {/* Self-delivery option */}
                       {order.delivery_method === 'delivery' && order.status === 'ready_for_pickup' && (
                         <VendorSelfDeliveryButton
                           orderId={order.id}
                           orderStatus={order.status}
                           onAssignment={onOrderUpdate}
                         />
                       )}

                       {/* Progress steps */}
                       <div className="space-y-2">
                         <h5 className="text-sm font-semibold text-foreground">Progression</h5>
                         <div className="space-y-2">
                           {steps.map((step, stepIndex) => {
                             const Icon = step.icon;
                             return (
                               <div
                                 key={step.id}
                                 className={`flex items-center gap-2 p-2 rounded-lg transition-all duration-200 ${
                                   step.completed ? 'bg-primary/10 border border-primary/20' :
                                   step.current ? 'bg-muted/50 border border-muted-foreground/30' :
                                   'bg-muted/20'
                                 }`}
                               >
                                 <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                   step.completed ? 'bg-primary text-white' :
                                   step.current ? 'bg-muted-foreground text-white' :
                                   'bg-muted text-muted-foreground'
                                 }`}>
                                   {step.completed ? (
                                     <CheckCircle className="h-3 w-3" />
                                   ) : (
                                     <Icon className="h-3 w-3" />
                                   )}
                                 </div>
                                 
                                 <div className="flex-1">
                                   <p className={`text-xs font-medium ${
                                     step.completed ? 'text-primary' :
                                     step.current ? 'text-foreground' :
                                     'text-muted-foreground'
                                   }`}>
                                     {step.label}
                                   </p>
                                 </div>

                                 {step.action && (
                                   <Button
                                     onClick={step.action.onClick}
                                     disabled={processing.includes(order.id)}
                                     className="bg-gradient-primary hover:shadow-glow transition-all duration-300 text-white font-medium"
                                     size="sm"
                                   >
                                      {processing.includes(order.id) ? (
                                       <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                      step.action.label
                                    )}
                                  </Button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Quick action if available */}
                      {nextAction && (
                         <div className="bg-gradient-card rounded-lg p-2 border border-primary/20">
                           <div className="flex items-center justify-between">
                             <div>
                               <p className="text-xs font-medium text-foreground">
                                 Prochaine action
                               </p>
                               <p className="text-xs text-muted-foreground">
                                 {nextAction.action?.label}
                               </p>
                             </div>
                             <Button
                               onClick={nextAction.action?.onClick}
                               disabled={processing.includes(order.id)}
                               className="bg-gradient-primary hover:shadow-glow transition-all duration-300 text-white font-medium"
                               size="sm"
                             >
                               <ChevronRight className="h-3 w-3 ml-1" />
                             </Button>
                           </div>
                         </div>
                      )}
                    </div>
                  </motion.div>
                </CarouselItem>
              );
            })}
          </CarouselContent>
          
          {/* Navigation arrows */}
          {filteredOrders.length > 1 && (
            <>
              <CarouselPrevious 
                className="absolute -left-12 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm border-primary/20 hover:bg-primary/10"
                onClick={() => setCurrentOrderIndex(Math.max(0, currentOrderIndex - 1))}
              />
              <CarouselNext 
                className="absolute -right-12 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm border-primary/20 hover:bg-primary/10"
                onClick={() => setCurrentOrderIndex(Math.min(filteredOrders.length - 1, currentOrderIndex + 1))}
              />
            </>
          )}
        </Carousel>

         {/* Quick navigation */}
         {filteredOrders.length > 1 && (
           <div className="flex justify-center gap-2 mt-2">
             <Button
               variant="outline"
               size="sm"
               onClick={() => setCurrentOrderIndex(Math.max(0, currentOrderIndex - 1))}
               disabled={currentOrderIndex === 0}
               className="flex items-center gap-1 text-xs"
             >
               <ChevronLeft className="h-3 w-3" />
               Précédente
             </Button>
             <Button
               variant="outline"
               size="sm"
               onClick={() => setCurrentOrderIndex(Math.min(filteredOrders.length - 1, currentOrderIndex + 1))}
               disabled={currentOrderIndex === filteredOrders.length - 1}
               className="flex items-center gap-1 text-xs"
             >
               Suivante
               <ChevronRight className="h-3 w-3" />
             </Button>
          </div>
        )}
      </div>
    </div>
  );
}