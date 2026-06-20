/**
 * Dialog d'approbation des frais de livraison pour les commandes Food
 * Similaire au DeliveryFeeApprovalDialog marketplace
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { UtensilsCrossed, Truck, DollarSign, MessageSquare, Wallet, Banknote } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { formatCurrency } from '@/utils/formatCurrency';

interface FoodDeliveryFeeApprovalDialogProps {
  order: {
    id: string;
    status: string;
    customer_id: string;
    total_amount: number;
    delivery_fee: number;
    restaurant?: {
      name: string;
    };
    items?: any[];
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApproved?: () => void;
}

export const FoodDeliveryFeeApprovalDialog = ({ 
  order, 
  open, 
  onOpenChange,
  onApproved
}: FoodDeliveryFeeApprovalDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { wallet } = useWallet();
  const [accepting, setAccepting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'cash'>('wallet');

  // Ne pas afficher si l'utilisateur n'est pas le client ou si le statut n'est pas correct
  if (!order || order.status !== 'pending_delivery_approval' || order.customer_id !== user?.id) {
    return null;
  }

  const deliveryFee = order.delivery_fee || 0;
  const foodTotal = order.total_amount - deliveryFee;
  const mainBalance = wallet?.balance || 0;
  const bonusBalance = wallet?.bonus_balance || 0;
  const walletBalance = mainBalance + bonusBalance;
  const canPayWithWallet = walletBalance >= deliveryFee;

  const handleAcceptFees = async () => {
    if (!user) return;
    
    setAccepting(true);

    try {
      const { data, error } = await supabase.functions.invoke('accept-food-delivery-fee', {
        body: {
          orderId: order.id,
          customerId: user.id,
          paymentMethod: paymentMethod
        }
      });

      if (error) throw error;

      toast({ 
        title: "✅ Frais de livraison acceptés", 
        description: paymentMethod === 'wallet' 
          ? "Le montant a été débité de votre portefeuille"
          : "Vous paierez à la livraison"
      });
      
      onOpenChange(false);
      onApproved?.();
    } catch (error: any) {
      console.error('Error accepting food delivery fees:', error);
      toast({ 
        title: "Erreur", 
        description: error.message || "Impossible d'accepter les frais", 
        variant: "destructive" 
      });
    } finally {
      setAccepting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Frais de livraison
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Restaurant */}
          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
            <UtensilsCrossed className="h-5 w-5 mt-1 flex-shrink-0 text-orange-500" />
            <div className="flex-1">
              <p className="font-medium">{order.restaurant?.name || 'Restaurant'}</p>
              <p className="text-sm text-muted-foreground">
                {order.items?.length || 1} article(s) • {formatCurrency(foodTotal)}
              </p>
            </div>
          </div>

          {/* Mode de livraison */}
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
            <Truck className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium">Livreur TAGA</p>
              <p className="text-xs text-muted-foreground">
                Livraison rapide par un chauffeur vérifié
              </p>
            </div>
          </div>

          {/* Résumé financier */}
          <div className="space-y-2 p-4 border rounded-lg">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total commande</span>
              <span className="font-medium">{formatCurrency(foodTotal)}</span>
            </div>
            <div className="flex justify-between text-sm border-t pt-2">
              <span className="font-medium">Frais de livraison</span>
              <span className="font-bold text-primary">{formatCurrency(deliveryFee)}</span>
            </div>
          </div>

          {/* Choix du mode de paiement */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Mode de paiement livraison</p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={paymentMethod === 'wallet' ? 'default' : 'outline'}
                className="flex-col h-auto py-3"
                onClick={() => setPaymentMethod('wallet')}
                disabled={!canPayWithWallet}
              >
                <Wallet className="h-5 w-5 mb-1" />
                <span className="text-xs">TAGAPay</span>
                <span className="text-[10px] text-muted-foreground">
                  {formatCurrency(walletBalance)}
                  {bonusBalance > 0 && ` (dont ${formatCurrency(bonusBalance)} bonus)`}
                </span>
              </Button>
              <Button
                variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                className="flex-col h-auto py-3"
                onClick={() => setPaymentMethod('cash')}
              >
                <Banknote className="h-5 w-5 mb-1" />
                <span className="text-xs">Cash</span>
                <span className="text-[10px] text-muted-foreground">
                  À la livraison
                </span>
              </Button>
            </div>
          </div>

          {/* Avertissement si solde insuffisant */}
          {!canPayWithWallet && paymentMethod === 'wallet' && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                ⚠️ Solde insuffisant. Rechargez votre portefeuille ou payez en cash.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            <Button
              className="flex-1"
              onClick={handleAcceptFees}
              disabled={accepting || (paymentMethod === 'wallet' && !canPayWithWallet)}
            >
              {accepting ? 'Traitement...' : 'Confirmer'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FoodDeliveryFeeApprovalDialog;
