import { useState } from 'react';
import { Lock, Wallet, CreditCard, Smartphone } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

export type PaymentMethod = 'wallet' | 'orange_money' | 'mpesa' | 'airtel_money' | 'card';

interface UnifiedPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: number;
  currency?: string;
  walletBalance?: number;
  onConfirm: (method: PaymentMethod) => void;
  title?: string;
  description?: string;
}

export const UnifiedPaymentModal = ({
  open,
  onOpenChange,
  amount,
  currency = 'CDF',
  walletBalance = 0,
  onConfirm,
  title = 'Choisir le mode de paiement',
  description
}: UnifiedPaymentModalProps) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('wallet');

  const paymentMethods = [
    {
      id: 'wallet' as PaymentMethod,
      label: 'TembeaPay Wallet',
      icon: Wallet,
      color: 'text-primary',
      description: `Solde: ${walletBalance.toLocaleString()} ${currency}`,
      disabled: walletBalance < amount
    },
    {
      id: 'orange_money' as PaymentMethod,
      label: 'Orange Money',
      icon: Smartphone,
      color: 'text-orange-600',
      description: 'Paiement mobile'
    },
    {
      id: 'mpesa' as PaymentMethod,
      label: 'M-Pesa',
      icon: Smartphone,
      color: 'text-green-600',
      description: 'Vodacom M-Pesa'
    },
    {
      id: 'airtel_money' as PaymentMethod,
      label: 'Airtel Money',
      icon: Smartphone,
      color: 'text-red-600',
      description: 'Paiement Airtel'
    },
    {
      id: 'card' as PaymentMethod,
      label: 'Carte bancaire',
      icon: CreditCard,
      color: 'text-blue-600',
      description: 'Visa / Mastercard'
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-green-600/20">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center animate-bounce-subtle">
              <Lock className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <DialogTitle className="text-center text-xl">{title}</DialogTitle>
          {description && (
            <p className="text-center text-sm text-muted-foreground">{description}</p>
          )}
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Amount */}
          <div className="text-center py-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Montant à payer</p>
            <p className="text-3xl font-extrabold text-primary">
              {amount.toLocaleString()} {currency}
            </p>
          </div>

          <Separator />

          {/* Payment Methods */}
          <RadioGroup value={selectedMethod} onValueChange={(v) => setSelectedMethod(v as PaymentMethod)}>
            <div className="space-y-2">
              {paymentMethods.map((method) => {
                const Icon = method.icon;
                return (
                  <div
                    key={method.id}
                    className={`flex items-center space-x-3 p-3 rounded-lg border-2 transition-colors cursor-pointer ${
                      selectedMethod === method.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    } ${method.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => !method.disabled && setSelectedMethod(method.id)}
                  >
                    <RadioGroupItem value={method.id} id={method.id} disabled={method.disabled} />
                    <Label
                      htmlFor={method.id}
                      className="flex items-center gap-3 flex-1 cursor-pointer"
                    >
                      <Icon className={`w-5 h-5 ${method.color}`} />
                      <div className="flex-1">
                        <p className="font-semibold">{method.label}</p>
                        <p className="text-xs text-muted-foreground">{method.description}</p>
                      </div>
                    </Label>
                  </div>
                );
              })}
            </div>
          </RadioGroup>

          {/* Security Message */}
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-2">
            <Lock className="w-3 h-3" />
            <span>Paiement 100% sécurisé</span>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Annuler
          </Button>
          <Button
            onClick={() => {
              onConfirm(selectedMethod);
              onOpenChange(false);
            }}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            Confirmer le paiement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
