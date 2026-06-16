import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Phone } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useWallet } from '@/hooks/useWallet';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { useWalletValidation } from '@/hooks/useWalletValidation';
import { QuickAmountSelector } from './QuickAmountSelector';
import { OperatorSelector } from './OperatorSelector';
import { AnimatedTopUpButton } from './AnimatedTopUpButton';
import { cn } from '@/lib/utils';

type Operator = 'airtel' | 'orange' | 'mpesa';

interface TopUpModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  currency?: string;
  quickAmounts?: number[];
}

export const TopUpModal: React.FC<TopUpModalProps> = ({
  open,
  onClose,
  onSuccess,
  currency = 'XOF',
  quickAmounts = [1000, 2500, 5000, 10000, 25000]
}) => {
  const { topUpWallet, loading } = useWallet();
  const { triggerSuccess, triggerError } = useHapticFeedback();
  const { validateAmount, validatePhone, amountError, phoneError, clearErrors } = useWalletValidation();
  
  const [amount, setAmount] = useState<string>('');
  const [selectedQuickAmount, setSelectedQuickAmount] = useState<number | null>(null);
  const [provider, setProvider] = useState<Operator | ''>('');
  const [phone, setPhone] = useState<string>('');

  const handleQuickAmountSelect = (quickAmount: number) => {
    setAmount(quickAmount.toString());
    setSelectedQuickAmount(quickAmount);
    validateAmount(quickAmount.toString());
    triggerSuccess();
  };

  const handleAmountChange = (value: string) => {
    setAmount(value);
    setSelectedQuickAmount(null);
    validateAmount(value);
  };

  const handlePhoneChange = (value: string) => {
    setPhone(value);
    validatePhone(value);
  };

  const handleTopUp = async () => {
    if (!provider) {
      triggerError();
      return;
    }

    const amountValidation = validateAmount(amount);
    const phoneValidation = validatePhone(phone);

    if (!amountValidation.isValid || !phoneValidation.isValid) {
      triggerError();
      return;
    }

    const success = await topUpWallet(Number(amount), provider, phone);
    
    if (success) {
      triggerSuccess();
      resetForm();
      onSuccess?.();
      onClose();
    } else {
      triggerError();
    }
  };

  const resetForm = () => {
    setAmount('');
    setSelectedQuickAmount(null);
    setProvider('');
    setPhone('');
    clearErrors();
  };

  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        side="bottom"
        className={cn(
          "rounded-t-2xl max-h-[85vh] overflow-y-auto px-5 pb-8 pt-3",
          "bg-background border-t border-border/40"
        )}
      >
        {/* Handle bar */}
        <div className="flex justify-center mb-4">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        <SheetHeader className="pb-4 text-left">
          <SheetTitle className="text-lg font-bold text-foreground">
            Recharger
          </SheetTitle>
          <p className="text-sm text-muted-foreground -mt-1">TembeaPay • Mobile Money</p>
        </SheetHeader>

        <div className="space-y-5">
          {/* Quick Amount Selector */}
          <QuickAmountSelector
            amounts={quickAmounts}
            selectedAmount={selectedQuickAmount}
            onSelect={handleQuickAmountSelect}
            currency={currency}
          />

          {/* Custom Amount Input */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">
              Montant personnalisé (CDF)
            </Label>
            <Input
              type="number"
              inputMode="numeric"
              placeholder="2 500"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              className={cn(
                "h-12 text-xl font-bold text-center",
                "bg-muted/50 border border-border rounded-xl",
                "text-foreground placeholder:text-muted-foreground/50",
                "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20",
                amountError && "border-destructive focus-visible:ring-destructive/20"
              )}
            />
            <AnimatePresence>
              {amountError && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-xs text-destructive font-medium text-center"
                >
                  {amountError}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Operator Selector */}
          <OperatorSelector
            selected={provider}
            onSelect={(op) => {
              setProvider(op);
              triggerSuccess();
            }}
          />

          {/* Phone Input */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">
              Numéro de téléphone
            </Label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="tel"
                inputMode="tel"
                placeholder="0991234567"
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                className={cn(
                  "h-12 text-base pl-10 font-medium",
                  "bg-muted/50 border border-border rounded-xl",
                  "text-foreground placeholder:text-muted-foreground/50",
                  "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20",
                  phoneError && "border-destructive focus-visible:ring-destructive/20"
                )}
              />
            </div>
            <AnimatePresence>
              {phoneError && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-xs text-destructive font-medium"
                >
                  {phoneError}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Action Button */}
          <AnimatedTopUpButton
            onClick={handleTopUp}
            disabled={!amount || !provider || !phone || loading}
            loading={loading}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
};
