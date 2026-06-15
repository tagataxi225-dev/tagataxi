/**
 * 💳 Dialog de paiement Mobile Money pour abonnements
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Loader2, CreditCard } from 'lucide-react';

interface MobileMoneyPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planId: string;
  planName: string;
  planPrice: number;
  currency: string;
  onSuccess: () => void;
}

export const MobileMoneyPaymentDialog = ({
  open,
  onOpenChange,
  planId,
  planName,
  planPrice,
  currency,
  onSuccess
}: MobileMoneyPaymentDialogProps) => {
  const { user } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState<'orange_money' | 'mpesa' | 'airtel_money'>('orange_money');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    if (!user || !phoneNumber) {
      toast.error('Veuillez renseigner votre numéro de téléphone');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('mobile-money-subscription', {
        body: {
          plan_id: planId,
          payment_method: paymentMethod,
          phone_number: phoneNumber,
          driver_id: user.id
        }
      });

      if (error) throw error;

      if (data.success) {
        toast.success('✅ Paiement réussi !', {
          description: data.message
        });
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error('Échec du paiement', {
          description: data.message || data.error
        });
      }
    } catch (error: any) {
      console.error('Erreur paiement Mobile Money:', error);
      toast.error('Erreur lors du paiement', {
        description: error.message || 'Veuillez réessayer'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Paiement Mobile Money</DialogTitle>
          <DialogDescription>
            Payez votre abonnement {planName} via Mobile Money
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Résumé */}
          <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Abonnement</span>
              <span className="font-medium text-foreground">{planName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Montant</span>
              <span className="text-lg font-bold text-primary">
                {planPrice.toLocaleString()} {currency}
              </span>
            </div>
          </div>

          {/* Méthode de paiement */}
          <div className="space-y-3">
            <Label>Méthode de paiement</Label>
            <RadioGroup value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)}>
              <div className="flex items-center space-x-3 border rounded-lg p-3 cursor-pointer hover:bg-muted/50">
                <RadioGroupItem value="orange_money" id="orange_money" />
                <Label htmlFor="orange_money" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🟠</span>
                    <span className="font-medium">Orange Money</span>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-3 border rounded-lg p-3 cursor-pointer hover:bg-muted/50">
                <RadioGroupItem value="mpesa" id="mpesa" />
                <Label htmlFor="mpesa" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🟢</span>
                    <span className="font-medium">M-Pesa</span>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-3 border rounded-lg p-3 cursor-pointer hover:bg-muted/50">
                <RadioGroupItem value="airtel_money" id="airtel_money" />
                <Label htmlFor="airtel_money" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🔴</span>
                    <span className="font-medium">Airtel Money</span>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Numéro de téléphone */}
          <div className="space-y-2">
            <Label htmlFor="phone">Numéro de téléphone</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+243 XXX XXX XXX"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Saisissez le numéro associé à votre compte {
                paymentMethod === 'orange_money' ? 'Orange Money' :
                paymentMethod === 'mpesa' ? 'M-Pesa' :
                'Airtel Money'
              }
            </p>
          </div>

          {/* Boutons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              onClick={handlePayment}
              disabled={loading || !phoneNumber}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Traitement...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Payer {planPrice.toLocaleString()} {currency}
                </>
              )}
            </Button>
          </div>

          {/* Avertissement */}
          <p className="text-xs text-center text-muted-foreground">
            Un SMS de confirmation vous sera envoyé. Suivez les instructions pour finaliser le paiement.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};