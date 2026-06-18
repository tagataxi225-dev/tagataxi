import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { 
  Loader2, 
  CreditCard, 
  Wallet, 
  Check, 
  AlertTriangle,
  Crown,
  Zap,
  Star,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  commission_rate: number;
  max_products: number | null;
  features: string[];
}

interface VendorSubscriptionPaymentDialogProps {
  open: boolean;
  onClose: () => void;
  plan: SubscriptionPlan | null;
  walletBalance: number;
  currentCommissionRate: number;
  onConfirm: () => Promise<void>;
  isProcessing: boolean;
}

export const VendorSubscriptionPaymentDialog = ({
  open,
  onClose,
  plan,
  walletBalance,
  currentCommissionRate,
  onConfirm,
  isProcessing
}: VendorSubscriptionPaymentDialogProps) => {
  if (!plan) return null;

  const hasEnoughBalance = walletBalance >= plan.price;
  const balanceAfterPayment = walletBalance - plan.price;
  const commissionSaving = currentCommissionRate - plan.commission_rate;

  const getPlanIcon = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'premium':
        return <Crown className="h-8 w-8 text-amber-500" />;
      case 'standard':
        return <Zap className="h-8 w-8 text-blue-500" />;
      default:
        return <Star className="h-8 w-8 text-slate-500" />;
    }
  };

  const getPlanGradient = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'premium':
        return 'from-amber-500/20 via-yellow-500/10 to-orange-500/20';
      case 'standard':
        return 'from-blue-500/20 via-cyan-500/10 to-sky-500/20';
      default:
        return 'from-slate-500/20 via-gray-500/10 to-zinc-500/20';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Confirmation d'abonnement
          </DialogTitle>
          <DialogDescription>
            Vérifiez les détails avant de confirmer
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Plan sélectionné */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className={`p-4 bg-gradient-to-br ${getPlanGradient(plan.name)} border-0`}>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-background/80 backdrop-blur-sm">
                  {getPlanIcon(plan.name)}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </div>
              </div>
              
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-green-500/20 text-green-700">
                    {plan.commission_rate}% commission
                  </Badge>
                  {commissionSaving > 0 && (
                    <Badge variant="outline" className="text-green-600 border-green-500/50">
                      -{commissionSaving}% économisé
                    </Badge>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Wallet balance */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-4 bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Wallet className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Votre wallet TAGA</p>
                  <p className="font-bold text-lg">
                    {walletBalance.toLocaleString()} CDF
                  </p>
                </div>
              </div>

              {hasEnoughBalance && (
                <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Après paiement:</span>
                  <span className="font-semibold text-green-600">
                    {balanceAfterPayment.toLocaleString()} CDF
                  </span>
                </div>
              )}

              {!hasEnoughBalance && (
                <div className="mt-3 pt-3 border-t border-border/50">
                  <div className="flex items-center gap-2 text-amber-600">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      Solde insuffisant (manque {(plan.price - walletBalance).toLocaleString()} CDF)
                    </span>
                  </div>
                </div>
              )}
            </Card>
          </motion.div>

          {/* Prix à payer */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-between p-4 rounded-xl bg-primary/5 border border-primary/20"
          >
            <span className="font-medium">Montant à payer</span>
            <span className="text-2xl font-bold text-primary">
              {plan.price.toLocaleString()} CDF
            </span>
          </motion.div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1"
            >
              Annuler
            </Button>
            
            {hasEnoughBalance ? (
              <Button
                onClick={onConfirm}
                disabled={isProcessing}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Paiement...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Confirmer
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={() => {
                  onClose();
                  // Navigate to wallet recharge - using window location for simplicity
                  window.location.href = '/vendeur?tab=wallet';
                }}
                className="flex-1 bg-amber-500 hover:bg-amber-600"
              >
                <Wallet className="h-4 w-4 mr-2" />
                Recharger
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
