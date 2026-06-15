import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMarketplaceOrders } from "@/hooks/useMarketplaceOrders";
import { useToast } from "@/hooks/use-toast";
import { 
  Clock, 
  CheckCircle, 
  Package, 
  Truck, 
  MapPin, 
  User, 
  Timer,
  ShoppingBag
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

export default function VendorOrderStepsManager({ orders, onOrderUpdate }: Props) {
  const { updateOrderStatus } = useMarketplaceOrders();
  const { toast } = useToast();
  const [processing, setProcessing] = useState<string | null>(null);

  // Filter orders that are confirmed and need step management
  const confirmedOrders = orders.filter(order => 
    ['confirmed', 'preparing', 'ready_for_pickup', 'assigned_to_driver'].includes(order.status)
  );

  const handleStepAction = async (orderId: string, newStatus: string, actionLabel: string) => {
    setProcessing(orderId);
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
      setProcessing(null);
    }
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
      <div className="flex items-center gap-2 mb-4">
        <Package className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">
          Gestion des étapes ({confirmedOrders.length})
        </h3>
      </div>

      {confirmedOrders.map((order) => {
        const steps = getOrderSteps(order);
        const currentStep = steps.find(step => step.current);
        
        return (
          <Card key={order.id} className="border-primary/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  {order.product?.title || 'Produit'}
                </CardTitle>
                <div className="flex items-center gap-2">
                  {getStatusBadge(order.status)}
                  <Badge variant="outline">
                    {order.delivery_method === 'pickup' ? 'Retrait' : 'Livraison'}
                  </Badge>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                Client: {order.buyer?.display_name || 'Client'} • 
                Quantité: {order.quantity} • 
                Total: {Number(order.total_amount).toLocaleString()} FC
              </div>
              {order.delivery_address && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {order.delivery_address}
                </div>
              )}
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Progress Steps */}
              <div className="space-y-3">
                {steps.map((step, index) => {
                  const Icon = step.icon;
                  const isLast = index === steps.length - 1;
                  
                  return (
                    <div key={step.id} className="flex items-center gap-3">
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
                          disabled={processing === order.id}
                          className="flex-shrink-0"
                        >
                          {processing === order.id ? (
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
          </Card>
        );
      })}
    </div>
  );
}