import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Loader2, CheckCircle2, Lock } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { QuickAmountSelector } from './QuickAmountSelector';
import { OperatorSelector } from './OperatorSelector';
import { cn } from '@/lib/utils';

type Operator = 'orange' | 'wave';
type UserType = 'client' | 'partner' | 'vendor' | 'restaurant';

interface UnifiedTopUpModalProps {
  open: boolean;
  onClose: () => void;
  userType: UserType;
  walletBalance: number;
  currency?: string;
  onSuccess?: () => void;
}

const QUICK_AMOUNTS: Record<UserType, number[]> = {
  client: [1000, 2500, 5000, 10000, 25000],
  restaurant: [5000, 10000, 25000, 50000, 100000],
  partner: [25000, 50000, 100000, 250000, 500000],
  vendor: [10000, 25000, 50000, 100000, 200000]
};

const ORDER_TYPES: Record<UserType, string> = {
  client: 'wallet_topup',
  restaurant: 'wallet_topup',
  partner: 'partner_credit',
  vendor: 'vendor_credit'
};

export const UnifiedTopUpModal: React.FC<UnifiedTopUpModalProps> = ({
  open,
  onClose,
  userType,
  walletBalance,
  currency = 'XOF',
  onSuccess
}) => {
  const [amount, setAmount] = useState<string>('');
  const [selectedQuickAmount, setSelectedQuickAmount] = useState<number | null>(null);
  const [provider, setProvider] = useState<Operator | ''>('');
  const [phone, setPhone] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [amountError, setAmountError] = useState<string>('');
  const [phoneError, setPhoneError] = useState<string>('');

  const quickAmounts = QUICK_AMOUNTS[userType];

  const handleQuickAmountSelect = (quickAmount: number) => {
    setAmount(quickAmount.toString());
    setSelectedQuickAmount(quickAmount);
    setAmountError('');
  };

  const handleAmountChange = (value: string) => {
    setAmount(value);
    setSelectedQuickAmount(null);
    
    const numAmount = Number(value);
    if (!value || isNaN(numAmount)) {
      setAmountError('Montant invalide');
    } else if (numAmount < 500) {
      setAmountError('Montant minimum : 500 XOF');
    } else if (numAmount > 500000) {
      setAmountError('Montant maximum : 500 000 XOF');
    } else if (provider === 'orange' && numAmount % 100 !== 0) {
      setAmountError('Orange Money : montant doit être multiple de 100');
    } else {
      setAmountError('');
    }
  };

  const handlePhoneChange = (value: string) => {
    setPhone(value);
    
    if (!value) {
      setPhoneError('');
      return;
    }
    
    const cleanPhone = value.replace(/[\s\-\(\)]/g, '');

    // Format Côte d'Ivoire : +225XXXXXXXXXX ou 0XXXXXXXXX (10 chiffres)
    const phoneWithPrefixRegex = /^\+?225[0-9]{10}$/;
    const phoneWithoutPrefixRegex = /^0[0-9]{9}$/;

    if (!phoneWithPrefixRegex.test(cleanPhone) && !phoneWithoutPrefixRegex.test(cleanPhone)) {
      setPhoneError('Format invalide. Ex: +2250712345678 ou 0712345678');
    } else {
      setPhoneError('');
    }
  };

  const handleTopUp = async () => {
    if (!provider) {
      toast.error('Veuillez sélectionner un opérateur');
      return;
    }

    if (!amount || Number(amount) < 500) {
      setAmountError('Montant minimum : 500 XOF');
      return;
    }

    if (!phone) {
      setPhoneError('Numéro de téléphone requis');
      return;
    }

    // Re-valider le numéro avant soumission (format Côte d'Ivoire)
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    const phoneWithPrefixRegex = /^\+?225[0-9]{10}$/;
    const phoneWithoutPrefixRegex = /^0[0-9]{9}$/;

    if (!phoneWithPrefixRegex.test(cleanPhone) && !phoneWithoutPrefixRegex.test(cleanPhone)) {
      setPhoneError('Format invalide. Ex: +2250712345678 ou 0712345678');
      toast.error('Format de numéro invalide');
      return;
    }

    if (amountError || phoneError) return;

    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data, error } = await supabase.functions.invoke('mobile-money-payment', {
        body: {
          amount: Number(amount),
          provider,
          phoneNumber: phone,
          currency,
          orderType: ORDER_TYPES[userType],
          userType
        }
      });

      if (error) throw error;

      if (data?.payment_url) {
        toast.success('Redirection vers Orange Money...', {
          description: 'Complétez le paiement sur votre téléphone'
        });
        
        // Redirection vers Orange Money
        window.location.href = data.payment_url;
      } else {
        toast.success(`Rechargement de ${Number(amount).toLocaleString()} ${currency} initié !`);
        resetForm();
        onSuccess?.();
        onClose();
      }
    } catch (error: any) {
      console.error('Error topping up:', error);
      toast.error(error.message || 'Erreur lors du rechargement');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setAmount('');
    setSelectedQuickAmount(null);
    setProvider('');
    setPhone('');
    setAmountError('');
    setPhoneError('');
  };

  useEffect(() => {
    if (!open) resetForm();
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent 
        side="bottom" 
        className="h-auto max-h-[85vh] rounded-t-3xl border-t border-border/50 bg-background/95 backdrop-blur-xl p-0"
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1.5 bg-muted-foreground/20 rounded-full" />
        </div>

        <SheetHeader className="px-4 pb-3 border-b border-border/40 bg-muted/30">
          <SheetTitle className="text-xl font-bold text-foreground">
            Rechargez votre portefeuille
          </SheetTitle>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 flex items-center gap-2 flex-wrap"
          >
            <div className="px-3 py-1.5 rounded-full bg-muted/50 border border-border/60">
              <p className="text-xs font-medium text-muted-foreground">
                Solde actuel : {walletBalance.toLocaleString()} {currency}
              </p>
            </div>
          </motion.div>
        </SheetHeader>

        <div className="overflow-y-auto p-4 space-y-4" style={{ maxHeight: 'calc(85vh - 120px)' }}>
          {/* Montants rapides */}
          <div>
            <Label className="text-sm font-semibold text-foreground mb-3 block">
              Montants suggérés
            </Label>
            <QuickAmountSelector
              amounts={quickAmounts}
              selectedAmount={selectedQuickAmount}
              onSelect={handleQuickAmountSelect}
              currency={currency}
            />
          </div>

          {/* Montant personnalisé */}
          <div>
            <Label htmlFor="custom-amount" className="text-sm font-semibold text-foreground mb-2 block">
              Montant personnalisé
            </Label>
            <Input
              id="custom-amount"
              type="number"
              placeholder="Entrez un montant"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              className="bg-muted/50 border-border text-foreground placeholder:text-muted-foreground focus:border-primary"
            />
            {amountError && (
              <p className="text-xs text-destructive mt-1">{amountError}</p>
            )}
          </div>

          {/* Sélection opérateur */}
          <div>
            <Label className="text-sm font-semibold text-foreground mb-3 block">
              Opérateur Mobile Money
            </Label>
            <OperatorSelector
              selected={provider}
              onSelect={(op) => setProvider(op as Operator)}
            />
          </div>

          {/* Numéro de téléphone */}
          <div>
            <Label htmlFor="phone" className="text-sm font-semibold text-foreground mb-2 block">
              Numéro de téléphone
            </Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="phone"
                type="tel"
                placeholder="0712345678 (10 chiffres)"
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                className="pl-10 bg-muted/50 border-border text-foreground placeholder:text-muted-foreground focus:border-primary"
              />
            </div>
            {phoneError && (
              <p className="text-xs text-destructive mt-1">{phoneError}</p>
            )}
            {!phoneError && phone && (
              <p className="text-xs text-muted-foreground mt-1">
                Format accepté: +225XXXXXXXXXX ou 0XXXXXXXXX (10 chiffres)
              </p>
            )}
          </div>

          {/* Bouton de confirmation */}
          <Button
            onClick={handleTopUp}
            disabled={loading || !amount || !provider || !phone || !!amountError || !!phoneError}
            className="w-full h-13 rounded-2xl text-base font-bold bg-primary hover:bg-primary/90"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Traitement en cours...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-5 w-5" />
                Confirmer le rechargement
              </>
            )}
          </Button>

          {/* Info sécurité */}
          <div className="pt-3 border-t border-border/40">
            <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1.5">
              <Lock className="h-3 w-3" />
              Paiement sécurisé par Orange Money
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
