import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Package, Truck, DollarSign, MessageSquare } from 'lucide-react';
import { DeliverySeparatePaymentDialog } from './DeliverySeparatePaymentDialog';

interface DeliveryFeeApprovalDialogProps {
  order: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApproved?: () => void;
  onOpenChat?: () => void;
}

export const DeliveryFeeApprovalDialog = ({ 
  order, 
  open, 
  onOpenChange,
  onApproved,
  onOpenChat 
}: DeliveryFeeApprovalDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [accepting, setAccepting] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  // Ne pas afficher si l'utilisateur n'est pas l'acheteur ou si le statut n'est pas correct
  if (!order || order.status !== 'pending_buyer_approval' || order.buyer_id !== user?.id) return null;

  const subtotal = order.unit_price * order.quantity;
  const deliveryFee = order.delivery_fee || 0;

  const handleAcceptFees = async () => {
    if (!user) return;
    
    setAccepting(true);

    try {
      const { error } = await supabase.functions.invoke('accept-delivery-fee', {
        body: {
          orderId: order.id,
          buyerId: user.id
        }
      });

      if (error) throw error;

      toast({ 
        title: "✅ Frais acceptés", 
        description: "Ouvrez le dialogue de paiement pour la livraison" 
      });
      
      onOpenChange(false);
      setShowPaymentDialog(true); // Ouvrir dialogue paiement séparé
    } catch (error: any) {
      console.error('Error accepting fees:', error);
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally {
      setAccepting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Frais de livraison proposés
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Produit */}
          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
            <Package className="h-5 w-5 mt-1 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium">{order.product?.title || 'Produit'}</p>
              <p className="text-sm text-muted-foreground">
                Quantité: {order.quantity} × {order.unit_price} CDF
              </p>
            </div>
          </div>

          {/* Mode de livraison */}
          {order.vendor_delivery_method && (
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <Truck className="h-5 w-5" />
              <div>
                <p className="text-sm font-medium">Mode de livraison</p>
                <Badge variant={order.vendor_delivery_method === 'kwenda' ? 'default' : 'secondary'}>
                  {order.vendor_delivery_method === 'kwenda' ? 'Livreur TAGA' : 'Livraison par le vendeur'}
                </Badge>
              </div>
            </div>
          )}

          {/* Résumé financier */}
          <div className="space-y-2 p-4 border rounded-lg">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Sous-total produit</span>
              <span className="font-medium">{subtotal} CDF</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Frais de livraison (à payer séparément)</span>
              <span className="font-semibold text-orange-600">{deliveryFee} CDF</span>
            </div>
          </div>

          {/* Message informatif */}
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              ℹ️ Vous payerez la livraison séparément après validation des frais.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                onOpenChange(false);
                onOpenChat?.();
              }}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Discuter
            </Button>
            <Button
              className="flex-1"
              onClick={handleAcceptFees}
              disabled={accepting}
            >
              {accepting ? 'Traitement...' : 'Accepter les frais'}
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* Dialogue de paiement séparé */}
      <DeliverySeparatePaymentDialog
        orderId={order.id}
        orderType="marketplace"
        productAmount={subtotal}
        deliveryFee={deliveryFee}
        open={showPaymentDialog}
        onClose={() => {
          setShowPaymentDialog(false);
          onApproved?.();
        }}
        onSuccess={() => {
          setShowPaymentDialog(false);
          onApproved?.();
        }}
      />
    </Dialog>
  );
};