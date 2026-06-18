import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  Truck, 
  CheckCircle, 
  Clock, 
  MapPin,
  Store,
  Star
} from 'lucide-react';
import { OrderCompletionDialog } from './OrderCompletionDialog';

interface ClientOrderCardProps {
  order: any;
  onConfirmReceived?: () => void;
}

export const ClientOrderCard = ({ order, onConfirmReceived }: ClientOrderCardProps) => {
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);

  const canConfirm = order.status === 'delivered' && !order.completed_at;
  const isPending = order.status === 'pending' || order.vendor_confirmation_status === 'awaiting_confirmation';
  const isAwaitingApproval = order.status === 'pending_buyer_approval';

  const getStatusBadge = () => {
    switch (order.status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />En attente</Badge>;
      case 'pending_buyer_approval':
        return <Badge variant="default" className="bg-orange-500"><Clock className="h-3 w-3 mr-1" />Approbation requise</Badge>;
      case 'confirmed':
        return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Confirmée</Badge>;
      case 'preparing':
        return <Badge variant="default" className="bg-blue-500"><Package className="h-3 w-3 mr-1" />En préparation</Badge>;
      case 'ready_for_pickup':
        return <Badge variant="default" className="bg-purple-500"><Truck className="h-3 w-3 mr-1" />Prêt</Badge>;
      case 'in_transit':
        return <Badge variant="default" className="bg-indigo-500"><Truck className="h-3 w-3 mr-1" />En livraison</Badge>;
      case 'delivered':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Livré</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-emerald-600"><Star className="h-3 w-3 mr-1" />Complété</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Annulé</Badge>;
      default:
        return <Badge variant="outline">{order.status}</Badge>;
    }
  };

  const product = order.product || order.marketplace_products;
  const productImage = product?.images?.[0] || '/placeholder.svg';
  const productTitle = product?.title || 'Produit';
  const vendorName = order.vendor_info?.shop_name || order.seller?.display_name || 'Vendeur';

  return (
    <>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        <CardContent className="p-4">
          <div className="flex gap-4">
            {/* Image produit */}
            <div className="flex-shrink-0">
              <img
                src={productImage}
                alt={productTitle}
                className="w-20 h-20 object-cover rounded-lg"
              />
            </div>

            {/* Détails */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm truncate">{productTitle}</h3>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <Store className="h-3 w-3" />
                    <span className="truncate">{vendorName}</span>
                  </div>
                </div>
                {getStatusBadge()}
              </div>

              {/* Infos commande */}
              <div className="space-y-1 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Quantité:</span>
                  <span className="font-medium text-foreground">{order.quantity}x</span>
                </div>
                <div className="flex justify-between">
                  <span>Prix unitaire:</span>
                  <span className="font-medium text-foreground">{order.unit_price?.toLocaleString()} CDF</span>
                </div>
                {order.delivery_fee > 0 && (
                  <div className="flex justify-between">
                    <span>Frais livraison:</span>
                    <span className="font-medium text-foreground">{order.delivery_fee?.toLocaleString()} CDF</span>
                  </div>
                )}
                <div className="flex justify-between pt-1 border-t">
                  <span className="font-semibold">Total:</span>
                  <span className="font-bold text-primary">
                    {((order.total_amount || 0) + (order.delivery_fee || 0)).toLocaleString()} CDF
                  </span>
                </div>
              </div>

              {/* Statut paiement */}
              <div className="mt-2 flex items-center gap-2">
                {order.payment_status === 'paid' && (
                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                    ✓ Payé
                  </Badge>
                )}
                {order.vendor_delivery_method && (
                  <Badge variant="outline" className="text-xs">
                    {order.vendor_delivery_method === 'kwenda' ? '🚚 TAGA' : '📦 Vendeur'}
                  </Badge>
                )}
              </div>

              {/* Actions selon le statut */}
              <div className="mt-3">
                {canConfirm && (
                  <Button 
                    onClick={() => setShowCompletionDialog(true)}
                    className="w-full h-9 text-sm"
                    size="sm"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirmer la réception
                  </Button>
                )}

                {isPending && (
                  <div className="text-xs text-muted-foreground text-center py-2">
                    ⏳ En attente de validation par le vendeur
                  </div>
                )}

                {isAwaitingApproval && (
                  <div className="text-xs text-orange-600 dark:text-orange-400 text-center py-2 bg-orange-50 dark:bg-orange-950/20 rounded">
                    ⚠️ Frais de livraison proposés - Approbation requise
                  </div>
                )}

                {order.status === 'completed' && order.customer_rating && (
                  <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground py-2">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span>Noté {order.customer_rating}/5</span>
                  </div>
                )}
              </div>

              {/* Date */}
              <div className="mt-2 text-xs text-muted-foreground">
                Commandé le {new Date(order.created_at).toLocaleDateString('fr-FR', { 
                  day: '2-digit', 
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de complétion avec rating */}
      <OrderCompletionDialog
        isOpen={showCompletionDialog}
        onClose={() => setShowCompletionDialog(false)}
        order={order}
        onComplete={() => {
          setShowCompletionDialog(false);
          onConfirmReceived?.();
        }}
      />
    </>
  );
};
