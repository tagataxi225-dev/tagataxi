import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useMarketplaceOrders } from '@/hooks/useMarketplaceOrders';
import { Package, MapPin, Clock, CheckCircle, Truck, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface OrderStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  timestamp?: string;
  icon: React.ComponentType<any>;
}

export const OrderTracker: React.FC = () => {
  const { user } = useAuth();
  const { orders, loading } = useMarketplaceOrders();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const getOrderSteps = (order: any): OrderStep[] => {
    const baseSteps: OrderStep[] = [
      {
        id: 'created',
        title: 'Commande créée',
        description: 'Votre commande a été enregistrée',
        completed: true,
        timestamp: order.created_at,
        icon: Package
      },
      {
        id: 'confirmed',
        title: 'Confirmée par le vendeur',
        description: 'Le vendeur a confirmé la disponibilité',
        completed: !!order.confirmed_at,
        timestamp: order.confirmed_at,
        icon: CheckCircle
      }
    ];

    if (order.delivery_method === 'delivery') {
      baseSteps.push(
        {
          id: 'preparing',
          title: 'Préparation',
          description: 'Le vendeur prépare votre commande',
          completed: !!order.confirmed_at,
          icon: User
        },
        {
          id: 'pickup',
          title: 'Collecte',
          description: 'Le livreur récupère votre commande',
          completed: false,
          icon: Truck
        },
        {
          id: 'delivery',
          title: 'En livraison',
          description: 'Votre commande est en route',
          completed: false,
          icon: MapPin
        },
        {
          id: 'delivered',
          title: 'Livrée',
          description: 'Commande livrée avec succès',
          completed: !!order.delivered_at,
          timestamp: order.delivered_at,
          icon: CheckCircle
        }
      );
    } else {
      baseSteps.push(
        {
          id: 'ready',
          title: 'Prêt pour collecte',
          description: 'Votre commande est prête',
          completed: !!order.confirmed_at,
          icon: Clock
        },
        {
          id: 'collected',
          title: 'Collectée',
          description: 'Vous avez récupéré votre commande',
          completed: !!order.completed_at,
          timestamp: order.completed_at,
          icon: CheckCircle
        }
      );
    }

    return baseSteps;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="destructive">En attente</Badge>;
      case 'confirmed':
        return <Badge variant="default">Confirmée</Badge>;
      case 'preparing':
        return <Badge variant="secondary">En préparation</Badge>;
      case 'in_delivery':
        return <Badge variant="default">En livraison</Badge>;
      case 'delivered':
        return <Badge variant="secondary">Livrée</Badge>;
      case 'completed':
        return <Badge variant="secondary">Terminée</Badge>;
      case 'cancelled':
        return <Badge variant="outline">Annulée</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const renderOrdersList = () => (
    <div className="space-y-4">
      {orders.map(order => (
        <Card key={order.id} className="cursor-pointer" onClick={() => setSelectedOrder(order)}>
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-medium">Produit commandé</h3>
                <p className="text-sm text-muted-foreground">
                  Commande #{order.id.slice(0, 8)}
                </p>
              </div>
              {getStatusBadge(order.status)}
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Quantité:</span>
                <span className="ml-1 font-medium">{order.quantity}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Total:</span>
                <span className="ml-1 font-medium">{order.total_amount.toLocaleString()} CDF</span>
              </div>
            </div>

            <div className="flex justify-between items-center mt-3">
              <span className="text-xs text-muted-foreground">
                {format(new Date(order.created_at), 'dd/MM/yyyy à HH:mm', { locale: fr })}
              </span>
              <Badge variant="outline" className="text-xs">
                {order.delivery_method === 'delivery' ? 'Livraison' : 'Collecte'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderOrderDetails = () => {
    if (!selectedOrder) return null;

    const steps = getOrderSteps(selectedOrder);

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="ghost" size="sm" onClick={() => setSelectedOrder(null)}>
            ← Retour
          </Button>
          <h2 className="text-lg font-semibold">
            Commande #{selectedOrder.id.slice(0, 8)}
          </h2>
        </div>

        {/* Order Info */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-4">
              <img
                src={selectedOrder.marketplace_products?.images?.[0] || 
                     'https://images.unsplash.com/photo-1581090464777-f3220bbe1b8b?w=100&h=100&fit=crop'}
                alt={selectedOrder.marketplace_products?.title}
                className="w-16 h-16 object-cover rounded-lg"
              />
              <div className="flex-1">
                <h3 className="font-medium">{selectedOrder.marketplace_products?.title}</h3>
                <p className="text-sm text-muted-foreground">
                  Quantité: {selectedOrder.quantity}
                </p>
                <p className="font-semibold text-primary">
                  {selectedOrder.total_amount.toLocaleString()} CDF
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Delivery Address */}
        {selectedOrder.delivery_address && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Adresse de livraison
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{selectedOrder.delivery_address}</p>
            </CardContent>
          </Card>
        )}

        {/* Order Timeline */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Suivi de commande</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {steps.map((step, index) => {
                const IconComponent = step.icon;
                return (
                  <div key={step.id} className="flex gap-4">
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center
                      ${step.completed 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted text-muted-foreground'
                      }
                    `}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    
                    <div className="flex-1">
                      <h4 className={`font-medium ${step.completed ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {step.title}
                      </h4>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                      {step.timestamp && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(step.timestamp), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                        </p>
                      )}
                    </div>
                    
                    {step.completed && (
                      <CheckCircle className="w-5 h-5 text-green-500 mt-2" />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        {selectedOrder.notes && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{selectedOrder.notes}</p>
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
          <div key={index} className="bg-card rounded-lg p-4 animate-pulse">
            <div className="h-4 bg-muted rounded mb-2"></div>
            <div className="h-3 bg-muted rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (selectedOrder) {
    return renderOrderDetails();
  }

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Mes Commandes</h2>
        <p className="text-sm text-muted-foreground">
          Suivez l'état de vos commandes en temps réel
        </p>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-medium mb-2">Aucune commande</h3>
            <p className="text-sm text-muted-foreground">
              Vos commandes apparaîtront ici une fois que vous aurez effectué des achats
            </p>
          </CardContent>
        </Card>
      ) : (
        renderOrdersList()
      )}
    </div>
  );
};