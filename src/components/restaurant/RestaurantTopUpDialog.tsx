import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, CreditCard, Smartphone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { SuccessConfetti } from '@/components/wallet/SuccessConfetti';
import { cn } from '@/lib/utils';
import orangeMoneyLogo from '@/assets/orange-money-logo.webp';
import airtelMoneyLogo from '@/assets/airtel-money-logo.png';
import mpesaLogo from '@/assets/mpesa-logo.png';

interface RestaurantTopUpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentBalance: number;
  onSuccess: () => void;
  onTopUp: (amount: number, method: string, phone: string) => Promise<void>;
  loading?: boolean;
}

const SUGGESTED_AMOUNTS = [
  { label: '10k CDF', value: 10000 },
  { label: '25k CDF', value: 25000 },
  { label: '50k CDF', value: 50000 },
  { label: '100k CDF', value: 100000 },
];

export const RestaurantTopUpDialog: React.FC<RestaurantTopUpDialogProps> = ({
  open,
  onOpenChange,
  currentBalance,
  onSuccess,
  onTopUp,
  loading = false
}) => {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'orange_money' | 'm_pesa' | 'airtel_money'>('orange_money');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);

  const handleAmountSelect = (value: number) => {
    setAmount(value.toString());
  };

  const handleContinue = () => {
    const amountNum = parseInt(amount);
    
    if (!amountNum || amountNum < 5000) {
      toast({
        title: "Montant invalide",
        description: "Le montant minimum est 5 000 CDF",
        variant: "destructive"
      });
      return;
    }

    if (amountNum > 500000) {
      toast({
        title: "Montant trop élevé",
        description: "Le montant maximum est 500 000 CDF",
        variant: "destructive"
      });
      return;
    }

    setStep(2);
  };

  const handleSubmit = async () => {
    if (!phoneNumber || phoneNumber.length < 9) {
      toast({
        title: "Numéro invalide",
        description: "Veuillez entrer un numéro de téléphone valide",
        variant: "destructive"
      });
      return;
    }

    try {
      await onTopUp(parseInt(amount), paymentMethod, phoneNumber);
      setShowConfetti(true);
      
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 2000);
    } catch (error) {
      // Error already handled in parent
    }
  };

  const handleClose = () => {
    setStep(1);
    setAmount('');
    setPhoneNumber('');
    setShowConfetti(false);
    onOpenChange(false);
  };

  const fees = parseInt(amount) * 0.02;
  const total = parseInt(amount) || 0;

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md max-h-[85vh] sm:max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="flex-shrink-0 px-6 pt-6">
            <DialogTitle>Recharger mon wallet</DialogTitle>
            <DialogDescription>
              Solde actuel: <span className="font-bold text-foreground">{currentBalance.toLocaleString()} CDF</span>
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 overflow-y-auto px-6">
            <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4 pb-4"
              >
                {/* Montant */}
                <div className="space-y-2">
                  <Label>Montant à recharger</Label>
                  <Input
                    type="number"
                    placeholder="Entrez le montant"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min={5000}
                    max={500000}
                  />
                  <p className="text-xs text-muted-foreground">
                    Min: 5 000 CDF • Max: 500 000 CDF
                  </p>
                </div>

                {/* Suggestions */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {SUGGESTED_AMOUNTS.map((suggested) => (
                    <Button
                      key={suggested.value}
                      variant={amount === suggested.value.toString() ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleAmountSelect(suggested.value)}
                      className="text-xs"
                    >
                      {suggested.label}
                    </Button>
                  ))}
                </div>

                <Button onClick={handleContinue} className="w-full" size="lg">
                  Continuer
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4 py-4 pb-24"
              >
                {/* Récapitulatif */}
                <div className="p-3 sm:p-4 bg-muted rounded-lg space-y-2">
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span>Montant</span>
                    <span className="font-bold">{parseInt(amount).toLocaleString()} CDF</span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm text-muted-foreground">
                    <span>Frais (2%)</span>
                    <span>{fees.toLocaleString()} CDF</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-bold text-sm sm:text-base">
                    <span>Total</span>
                    <span className="text-primary">{total.toLocaleString()} CDF</span>
                  </div>
                </div>

                {/* Méthode de paiement */}
                <div className="space-y-2">
                  <Label>Méthode de paiement</Label>
                  <RadioGroup value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
                    <div className={cn(
                      "flex items-center space-x-2 sm:space-x-3 p-3 sm:p-4 border-2 rounded-lg cursor-pointer transition-all",
                      paymentMethod === "orange_money" 
                        ? "border-orange-500 bg-orange-50/50 shadow-sm dark:bg-orange-950/20" 
                        : "border-border hover:bg-muted"
                    )}>
                      <RadioGroupItem value="orange_money" id="orange" />
                      <Label htmlFor="orange" className="flex items-center gap-2 sm:gap-3 cursor-pointer flex-1">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-orange-50 rounded-lg dark:bg-orange-950/50">
                          <img 
                            src={orangeMoneyLogo} 
                            alt="Orange Money"
                            className="w-5 h-5 sm:w-6 sm:h-6 object-contain"
                          />
                        </div>
                        <span className="font-medium text-sm sm:text-base">Orange Money</span>
                      </Label>
                    </div>
                    
                    <div className={cn(
                      "flex items-center space-x-2 sm:space-x-3 p-3 sm:p-4 border-2 rounded-lg cursor-pointer transition-all",
                      paymentMethod === "m_pesa" 
                        ? "border-green-500 bg-green-50/50 shadow-sm dark:bg-green-950/20" 
                        : "border-border hover:bg-muted"
                    )}>
                      <RadioGroupItem value="m_pesa" id="mpesa" />
                      <Label htmlFor="mpesa" className="flex items-center gap-2 sm:gap-3 cursor-pointer flex-1">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-green-50 rounded-lg dark:bg-green-950/50">
                          <img 
                            src={mpesaLogo} 
                            alt="M-Pesa"
                            className="w-5 h-5 sm:w-6 sm:h-6 object-contain"
                          />
                        </div>
                        <span className="font-medium text-sm sm:text-base">M-Pesa</span>
                      </Label>
                    </div>
                    
                    <div className={cn(
                      "flex items-center space-x-2 sm:space-x-3 p-3 sm:p-4 border-2 rounded-lg cursor-pointer transition-all",
                      paymentMethod === "airtel_money" 
                        ? "border-red-500 bg-red-50/50 shadow-sm dark:bg-red-950/20" 
                        : "border-border hover:bg-muted"
                    )}>
                      <RadioGroupItem value="airtel_money" id="airtel" />
                      <Label htmlFor="airtel" className="flex items-center gap-2 sm:gap-3 cursor-pointer flex-1">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-red-50 rounded-lg dark:bg-red-950/50">
                          <img 
                            src={airtelMoneyLogo} 
                            alt="Airtel Money"
                            className="w-5 h-5 sm:w-6 sm:h-6 object-contain"
                          />
                        </div>
                        <span className="font-medium text-sm sm:text-base">Airtel Money</span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Numéro de téléphone */}
                <div className="space-y-2">
                  <Label>Numéro de téléphone</Label>
                  <Input
                    type="tel"
                    placeholder="Ex: 0812345678"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Entrez le numéro associé à votre compte Mobile Money
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          </ScrollArea>

          {/* Boutons fixes en bas */}
          {step === 2 && (
            <div className="flex-shrink-0 border-t bg-background px-6 py-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setStep(1)} 
                  className="w-full sm:flex-1"
                  size="lg"
                >
                  Retour
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  disabled={loading} 
                  className="w-full sm:flex-1"
                  size="lg"
                >
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Confirmer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <SuccessConfetti show={showConfetti} />
    </>
  );
};
