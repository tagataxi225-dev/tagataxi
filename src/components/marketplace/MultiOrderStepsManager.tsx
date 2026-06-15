import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMarketplaceOrders } from "@/hooks/useMarketplaceOrders";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Clock, 
  CheckCircle, 
  Package, 
  Truck, 
  MapPin, 
  User, 
  Timer,
  ShoppingBag,
  Filter,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  RefreshCw
} from "lucide-react";

interface MarketplaceOrder {
  id: string;
  buyer_id: string;
  seller_id: string;
  product_id: string;
  quantity: number;
  total_amount: number;
  delivery_method: 'pickup' | 'delivery';
  delivery_address?: string;
  status: string;
  vendor_confirmation_status: string;
  confirmed_at?: string;
  preparing_at?: string;
  ready_for_pickup_at?: string;
  assigned_to_driver_at?: string;
  picked_up_by_driver_at?: string;
  in_transit_at?: string;
  delivered_at?: string;
  completed_at?: string;
  created_at: string;
  product?: {
    title: string;
    price: number;
  };
  buyer?: {
    display_name: string;
  };
}

interface Props {
  orders: MarketplaceOrder[];
  onOrderUpdate: () => void;
}

type StatusFilter = 'all' | 'confirmed' | 'preparing' | 'ready_for_pickup' | 'assigned_to_driver';

export default function MultiOrderStepsManager({ orders, onOrderUpdate }: Props) {
  const { updateOrderStatus } = useMarketplaceOrders();
  const { toast } = useToast();
  const [processing, setProcessing] = useState<Set<string>>(new Set());
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // Filter orders that are confirmed and need step management
  const confirmedOrders = orders.filter(order => 
    ['confirmed', 'preparing', 'ready_for_pickup', 'assigned_to_driver'].includes(order.status)
  );

  // Group orders by status for better organization
  const groupedOrders = useMemo(() => {
    const filtered = statusFilter === 'all' 
      ? confirmedOrders 
      : confirmedOrders.filter(order => order.status === statusFilter);

    return {
      confirmed: filtered.filter(order => order.status === 'confirmed'),
      preparing: filtered.filter(order => order.status === 'preparing'),
      ready_for_pickup: filtered.filter(order => order.status === 'ready_for_pickup'),
      assigned_to_driver: filtered.filter(order => order.status === 'assigned_to_driver'),
    };
  }, [confirmedOrders, statusFilter]);

  // Get orders that need immediate action
  const urgentOrders = useMemo(() => {
    return confirmedOrders.filter(order => {
      const now = new Date();
      const createdAt = new Date(order.created_at);
      const hoursSinceCreated = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
      
      return (
        (order.status === 'confirmed' && hoursSinceCreated > 1) ||
        (order.status === 'preparing' && hoursSinceCreated > 3) ||
        (order.status === 'ready_for_pickup' && hoursSinceCreated > 6)
      );
    });
  }, [confirmedOrders]);

  const handleStepAction = async (orderId: string, newStatus: string, actionLabel: string) => {
    setProcessing(prev => new Set(prev).add(orderId));
    try {
      await updateOrderStatus(orderId, newStatus);
      
      toast({
        title: "Étape validée",
        description: `${actionLabel} avec succès.`,
      });
      
      onOrderUpdate();
    } catch (error) {
      console.error('Error updating order step:', error);
      toast({
        title: "Erreur",
        description: "Impossible de valider cette étape. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setProcessing(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };

  const handleBatchAction = async (orderIds: string[], newStatus: string, actionLabel: string) => {
    for (const orderId of orderIds) {
      setProcessing(prev => new Set(prev).add(orderId));
    }

    try {
      await Promise.all(
        orderIds.map(orderId => updateOrderStatus(orderId, newStatus))
      );
      
      toast({
        title: "Actions groupées terminées",
        description: `${orderIds.length} commandes mises à jour avec succès.`,
      });
      
      onOrderUpdate();
    } catch (error) {
      console.error('Error updating orders:', error);
      toast({
        title: "Erreur",
        description: "Certaines actions ont échoué. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      for (const orderId of orderIds) {
        setProcessing(prev => {
          const newSet = new Set(prev);
          newSet.delete(orderId);
          return newSet;
        });
      }
    }
  };

  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const getOrderSteps = (order: MarketplaceOrder) => {
    const isPickup = order.delivery_method === 'pickup';
    
    if (isPickup) {
      return [
        {
          id: 'confirmed',
          label: 'Commande confirmée',
          icon: CheckCircle,
          completed: !!order.confirmed_at,
          current: order.status === 'confirmed',
          action: null
        },
        {
          id: 'preparing',
          label: 'Préparation en cours',
          icon: Package,
          completed: !!order.preparing_at,
          current: order.status === 'preparing',
          action: order.status === 'confirmed' ? {
            label: 'Commencer la préparation',
            newStatus: 'preparing'
          } : null
        },
        {
          id: 'ready_for_pickup',
          label: 'Prêt pour retrait',
          icon: ShoppingBag,
          completed: !!order.ready_for_pickup_at,
          current: order.status === 'ready_for_pickup',
          action: order.status === 'preparing' ? {
            label: 'Marquer comme prêt',
            newStatus: 'ready_for_pickup'
          } : null
        },
        {
          id: 'completed',
          label: 'Commande récupérée',
          icon: User,
          completed: !!order.completed_at,
          current: order.status === 'completed',
          action: order.status === 'ready_for_pickup' ? {
            label: 'Confirmer le retrait',
            newStatus: 'completed'
          } : null
        }
      ];
    } else {
      return [
        {
          id: 'confirmed',
          label: 'Commande confirmée',
          icon: CheckCircle,
          completed: !!order.confirmed_at,
          current: order.status === 'confirmed',
          action: null
        },
        {
          id: 'preparing',
          label: 'Préparation en cours',
          icon: Package,
          completed: !!order.preparing_at,
          current: order.status === 'preparing',
          action: order.status === 'confirmed' ? {
            label: 'Commencer la préparation',
            newStatus: 'preparing'
          } : null
        },
        {
          id: 'ready_for_pickup',
          label: 'Prêt pour collecte',
          icon: Timer,
          completed: !!order.ready_for_pickup_at,
          current: order.status === 'ready_for_pickup',
          action: order.status === 'preparing' ? {
            label: 'Prêt pour livraison',
            newStatus: 'ready_for_pickup'
          } : null
        },
        {
          id: 'assigned_to_driver',
          label: 'Assigné au livreur',
          icon: Truck,
          completed: !!order.assigned_to_driver_at,
          current: order.status === 'assigned_to_driver',
          action: null,
          note: 'En attente d\'un livreur disponible'
        }
      ];
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'confirmed': { label: 'Confirmé', variant: 'default' as const },
      'preparing': { label: 'En préparation', variant: 'secondary' as const },
      'ready_for_pickup': { label: 'Prêt', variant: 'outline' as const },
      'assigned_to_driver': { label: 'Assigné livreur', variant: 'destructive' as const },
      'completed': { label: 'Terminé', variant: 'default' as const }
    };
    
    const config = statusMap[status as keyof typeof statusMap];
    return (
      <Badge variant={config?.variant || 'secondary'}>
        {config?.label || status}
      </Badge>
    );
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'confirmed': 'border-blue-200 bg-blue-50',
      'preparing': 'border-orange-200 bg-orange-50',
      'ready_for_pickup': 'border-green-200 bg-green-50',
      'assigned_to_driver': 'border-purple-200 bg-purple-50'
    };
    return colors[status as keyof typeof colors] || 'border-gray-200 bg-gray-50';
  };

  const renderOrderCard = (order: MarketplaceOrder, isCompact = false) => {
    const steps = getOrderSteps(order);
    const currentStep = steps.find(step => step.current);
    const nextAction = steps.find(step => step.action)?.action;
    const isExpanded = expandedOrders.has(order.id);
    const isUrgent = urgentOrders.includes(order);
    const isProcessing = processing.has(order.id);

    return (
      <motion.div
        key={order.id}
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.2 }}
      >
        <Card className={`
          ${getStatusColor(order.status)} 
          ${isUrgent ? 'ring-2 ring-red-200' : ''}
          ${selectedOrder === order.id ? 'ring-2 ring-primary' : ''}
          transition-all duration-200 hover:shadow-md cursor-pointer
        `}>
          <CardHeader 
            className="pb-3 cursor-pointer"
            onClick={() => isCompact ? toggleOrderExpansion(order.id) : setSelectedOrder(order.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isCompact && (
                  <Button variant="ghost" size="sm" className="p-0 w-6 h-6">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                )}
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    {order.product?.title || 'Produit'}
                    {isUrgent && <AlertCircle className="h-4 w-4 text-red-500" />}
                    {isProcessing && <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />}
                  </CardTitle>
                  <div className="text-sm text-muted-foreground">
                    {order.buyer?.display_name || 'Client'} • 
                    Qté: {order.quantity} • 
                    {Number(order.total_amount).toLocaleString()} FC
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(order.status)}
                <Badge variant="outline">
                  {order.delivery_method === 'pickup' ? 'Retrait' : 'Livraison'}
                </Badge>
              </div>
            </div>

            {/* Quick action button for compact view */}
            {isCompact && nextAction && (
              <div className="flex items-center justify-between mt-2">
                <div className="text-sm text-muted-foreground">
                  Prochaine étape: {currentStep?.label}
                </div>
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStepAction(order.id, nextAction.newStatus, nextAction.label);
                  }}
                  disabled={isProcessing}
                  className="h-7"
                >
                  {nextAction.label}
                </Button>
              </div>
            )}
          </CardHeader>

          <AnimatePresence>
            {(!isCompact || isExpanded) && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{ overflow: 'hidden' }}
              >
                <CardContent className="space-y-4">
                  {order.delivery_address && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {order.delivery_address}
                    </div>
                  )}

                  {/* Progress Steps */}
                  <div className="space-y-3">
                    {steps.map((step, index) => {
                      const Icon = step.icon;
                      const isLast = index === steps.length - 1;
                      
                      return (
                        <div key={step.id} className="flex items-center gap-3 relative">
                          <div className={`
                            flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border-2
                            ${step.completed 
                              ? 'bg-primary border-primary text-primary-foreground' 
                              : step.current 
                                ? 'bg-primary/10 border-primary text-primary' 
                                : 'bg-muted border-muted-foreground/30 text-muted-foreground'
                            }
                          `}>
                            <Icon className="h-4 w-4" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className={`
                              font-medium text-sm
                              ${step.completed 
                                ? 'text-foreground' 
                                : step.current 
                                  ? 'text-primary' 
                                  : 'text-muted-foreground'
                              }
                            `}>
                              {step.label}
                            </div>
                            {step.note && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {step.note}
                              </div>
                            )}
                          </div>

                          {step.action && (
                            <Button
                              size="sm"
                              onClick={() => handleStepAction(
                                order.id, 
                                step.action!.newStatus, 
                                step.action!.label
                              )}
                              disabled={isProcessing}
                              className="flex-shrink-0"
                            >
                              {isProcessing ? (
                                <>
                                  <Clock className="h-3 w-3 mr-1 animate-spin" />
                                  En cours...
                                </>
                              ) : (
                                step.action.label
                              )}
                            </Button>
                          )}

                          {!isLast && (
                            <div className={`
                              absolute left-4 mt-8 w-0.5 h-6 
                              ${step.completed ? 'bg-primary' : 'bg-muted-foreground/30'}
                            `} />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Special note for delivery orders waiting for driver */}
                  {order.delivery_method === 'delivery' && order.status === 'ready_for_pickup' && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mt-4">
                      <div className="flex items-center gap-2 text-orange-800">
                        <Truck className="h-4 w-4" />
                        <span className="font-medium text-sm">
                          En attente d'un livreur disponible
                        </span>
                      </div>
                      <p className="text-xs text-orange-700 mt-1">
                        Votre commande sera automatiquement assignée à un livreur dès qu'un sera disponible.
                      </p>
                    </div>
                  )}
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>
    );
  };

  if (confirmedOrders.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Aucune commande à traiter</h3>
          <p className="text-muted-foreground">
            Les commandes confirmées apparaîtront ici pour validation des étapes.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with filters and batch actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">
            Gestion des étapes ({confirmedOrders.length})
          </h3>
          {urgentOrders.length > 0 && (
            <Badge variant="destructive" className="ml-2">
              {urgentOrders.length} urgent{urgentOrders.length > 1 ? 's' : ''}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const readyOrders = groupedOrders.preparing.map(o => o.id);
              if (readyOrders.length > 0) {
                handleBatchAction(readyOrders, 'ready_for_pickup', 'Marquer comme prêt');
              }
            }}
            disabled={groupedOrders.preparing.length === 0}
          >
            Tout marquer prêt ({groupedOrders.preparing.length})
          </Button>
        </div>
      </div>

      {/* Status filters */}
      <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">Toutes ({confirmedOrders.length})</TabsTrigger>
          <TabsTrigger value="confirmed">Confirmé ({groupedOrders.confirmed.length})</TabsTrigger>
          <TabsTrigger value="preparing">Préparation ({groupedOrders.preparing.length})</TabsTrigger>
          <TabsTrigger value="ready_for_pickup">Prêt ({groupedOrders.ready_for_pickup.length})</TabsTrigger>
          <TabsTrigger value="assigned_to_driver">Assigné ({groupedOrders.assigned_to_driver.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4 mt-6">
          <motion.div 
            className="space-y-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {confirmedOrders.map((order) => renderOrderCard(order, true))}
          </motion.div>
        </TabsContent>

        {Object.entries(groupedOrders).map(([status, orders]) => (
          <TabsContent key={status} value={status} className="space-y-4 mt-6">
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {orders.map((order) => renderOrderCard(order, false))}
            </motion.div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}