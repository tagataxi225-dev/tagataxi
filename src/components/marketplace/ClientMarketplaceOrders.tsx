import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Star, Package, Clock, CheckCircle, Truck, MessageSquare, MapPin } from 'lucide-react';
import { useMarketplaceOrders } from '@/hooks/useMarketplaceOrders';
import { useAuth } from '@/hooks/useAuth';
import { useUniversalChat } from '@/hooks/useUniversalChat';
import { useChat } from '@/components/chat/ChatProvider';
import { formatDistance } from 'date-fns';
import { fr } from 'date-fns/locale';
import { RatingDialog } from '@/components/rating/RatingDialog';
import { useToast } from '@/hooks/use-toast';

export const ClientMarketplaceOrders: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { orders, loading, completeOrder } = useMarketplaceOrders();
  const { createOrFindConversation } = useUniversalChat();
  const { openChat } = useChat();
  
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'confirmed': return 'bg-blue-500';
      case 'delivered': return 'bg-green-500';
      case 'completed': return 'bg-emerald-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return Clock;
      case 'confirmed': return Package;
      case 'delivered': return Truck;
      case 'completed': return CheckCircle;
      default: return Package;
    }
  };

  const handleCompleteOrder = async (orderId: string) => {
    try {
      await completeOrder(orderId);
      toast({
        title: '✅ Commande confirmée',
        description: 'La commande a été marquée comme reçue avec succès',
      });
    } catch (error) {
      toast({
        title: '❌ Erreur',
        description: 'Impossible de confirmer la réception',
        variant: 'destructive',
      });
    }
  };

  const handleStartChat = async (productId: string, sellerId: string, productTitle: string) => {
    try {
      const conversation = await createOrFindConversation(
        'marketplace',
        sellerId,
        productId,
        `Discussion: ${productTitle}`
      );
      
      if (conversation) {
        openChat({
          contextType: 'marketplace',
          contextId: productId,
          participantId: sellerId,
          title: `💬 Chat avec le vendeur`,
          quickActions: [
            { label: "Où est ma commande ?", action: () => {} },
            { label: "Changer l'adresse", action: () => {} },
            { label: "Annuler la commande", action: () => {} }
          ]
        });

        toast({
          title: '💬 Chat ouvert',
          description: 'Vous pouvez maintenant discuter avec le vendeur'
        });
      }
    } catch (error: any) {
      console.error('Erreur ouverture chat:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible d\'ouvrir le chat',
        variant: 'destructive'
      });
    }
  };

  const handleRateClick = (order: any) => {
    setSelectedOrder(order);
    setShowRatingDialog(true);
  };

  const buyerOrders = orders.filter(order => order.buyer_id === user?.id);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="space-y-2">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-20 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (buyerOrders.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Aucune commande</h3>
        <p className="text-muted-foreground">Vos commandes marketplace apparaîtront ici</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {buyerOrders.map((order) => {
          const StatusIcon = getStatusIcon(order.status);
          const canRate = order.status === 'delivered' || order.status === 'completed';
          
          return (
            <Card key={order.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${getStatusColor(order.status)}`}>
                      <StatusIcon className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{order.product?.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {formatDistance(new Date(order.created_at), new Date(), {
                          addSuffix: true,
                          locale: fr
                        })}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="capitalize">
                    {order.status === 'pending' ? 'En attente' :
                     order.status === 'confirmed' ? 'Confirmée' :
                     order.status === 'delivered' ? 'Livrée' :
                     order.status === 'completed' ? 'Terminée' :
                     order.status}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-4">
                  {/* Product Info */}
                  <div className="flex items-center gap-3">
                    {order.product?.images?.[0] && (
                      <img
                        src={order.product.images[0]}
                        alt={order.product.title}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">
                        Quantité: {order.quantity}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Prix unitaire: {order.unit_price.toLocaleString()} CDF
                      </p>
                      <p className="font-semibold">
                        Total: {order.total_amount.toLocaleString()} CDF
                      </p>
                    </div>
                  </div>

                  {/* Seller Info */}
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <Avatar className="h-10 w-10">
                      {order.seller?.avatar_url ? (
                        <img
                          src={order.seller.avatar_url}
                          alt={order.seller.display_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white font-semibold">
                          {order.seller?.display_name?.[0]?.toUpperCase()}
                        </div>
                      )}
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{order.seller?.display_name}</p>
                      <p className="text-sm text-muted-foreground">Vendeur</p>
                    </div>
                  </div>

                  {/* Delivery Info */}
                  {order.delivery_address && (
                    <div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
                      <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Adresse de livraison</p>
                        <p className="text-sm text-muted-foreground">{order.delivery_address}</p>
                        <p className="text-sm text-muted-foreground">
                          Méthode: {order.delivery_method === 'pickup' ? 'Retrait' : 
                                   order.delivery_method === 'delivery' ? 'Livraison' : 
                                   order.delivery_method}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStartChat(order.product_id, order.seller_id, order.product?.title || 'Produit')}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Contacter le vendeur
                    </Button>

                    {order.status === 'delivered' && (
                      <Button
                        size="sm"
                        onClick={() => handleCompleteOrder(order.id)}
                        variant="default"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Confirmer réception
                      </Button>
                    )}

                    {canRate && (
                      <Button
                        size="sm"
                        onClick={() => handleRateClick(order)}
                        variant="secondary"
                        className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 border-amber-500/20"
                      >
                        <Star className="h-4 w-4 mr-2" />
                        Noter le vendeur
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Rating Dialog */}
      {selectedOrder && (
        <RatingDialog
          open={showRatingDialog}
          onOpenChange={setShowRatingDialog}
          ratedUserId={selectedOrder.seller_id}
          ratedUserName={selectedOrder.seller?.display_name || 'Vendeur'}
          ratedUserType="seller"
          orderId={selectedOrder.id}
          orderType="marketplace"
          onSuccess={() => {
            toast({
              title: '⭐ Merci pour votre avis !',
              description: 'Votre évaluation a été enregistrée avec succès',
            });
            setShowRatingDialog(false);
            setSelectedOrder(null);
          }}
        />
      )}
    </>
  );
};
