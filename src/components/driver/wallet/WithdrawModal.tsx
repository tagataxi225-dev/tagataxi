/**
 * 💸 Modal de retrait TembeaPay avec Stepper UX (100% manuel)
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Loader2, Banknote, AlertCircle, Check, ArrowRight, 
  ArrowLeft, Clock, Smartphone, CheckCircle2 
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { cityDetectionService } from '@/services/cityDetectionService';
import { getCityOrDefault } from '@/config/coveredCities';

function getPhonePrefix() {
  const selected = cityDetectionService.getSelectedCity();
  const cityName = selected?.name
    ?? (Intl.DateTimeFormat().resolvedOptions().timeZone === 'Africa/Abidjan' ? 'Abidjan' : 'Kinshasa');
  const isAbidjan = getCityOrDefault(cityName) === 'Abidjan';
  return isAbidjan
    ? { prefix: '+225', flag: '🇨🇮' }
    : { prefix: '+243', flag: '🇨🇩' };
}

interface WithdrawModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentBalance: number;
  onSuccess: () => void;
}

const WITHDRAW_PROVIDERS = [
  { id: 'airtel', name: 'Airtel Money', color: 'bg-red-500', fee: 2 },
  { id: 'orange', name: 'Orange Money', color: 'bg-orange-500', fee: 2 },
  { id: 'mpesa', name: 'M-Pesa', color: 'bg-green-500', fee: 2 }
];

const MIN_WITHDRAW = 5000;
const MAX_WITHDRAW = 1000000;

const QUICK_AMOUNTS = [10000, 25000, 50000, 100000];

type Step = 1 | 2 | 3;

export const WithdrawModal = ({ open, onOpenChange, currentBalance, onSuccess }: WithdrawModalProps) => {
  const { toast } = useToast();
  const phoneInfo = getPhonePrefix();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<Step>(1);
  const [amount, setAmount] = useState('');
  const [provider, setProvider] = useState('airtel');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [success, setSuccess] = useState(false);

  const selectedProvider = WITHDRAW_PROVIDERS.find(p => p.id === provider);
  const parsedAmount = parseInt(amount) || 0;
  const fee = Math.ceil(parsedAmount * (selectedProvider?.fee || 0) / 100);
  const total = parsedAmount + fee;

  const resetForm = () => {
    setStep(1);
    setAmount('');
    setPhoneNumber('');
    setSuccess(false);
  };

  const handleClose = () => {
    if (!loading) {
      resetForm();
      onOpenChange(false);
    }
  };

  const canProceedStep1 = parsedAmount >= MIN_WITHDRAW && total <= currentBalance;
  const canProceedStep2 = phoneNumber.length >= 9;

  const handleWithdraw = async () => {
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non connecté');

      const { data, error } = await supabase.functions.invoke('escrow-management', {
        body: {
          action: 'process_withdrawal',
          confirmationData: {
            userId: user.id,
            amount: total,
            withdrawalMethod: 'mobile_money',
            paymentDetails: {
              userType: 'driver',
              mobileMoneyProvider: provider,
              mobileMoneyPhone: `${phoneInfo.prefix}${phoneNumber}`
            }
          }
        }
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.message || 'Erreur lors du retrait');

      setSuccess(true);

      toast({
        title: "⏳ Demande envoyée",
        description: data.message,
      });

      onSuccess();
    } catch (error: any) {
      console.error('Withdraw error:', error);
      toast({
        title: "Erreur de retrait",
        description: error.message || "Une erreur est survenue",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { number: 1, label: 'Montant' },
    { number: 2, label: 'Méthode' },
    { number: 3, label: 'Confirmation' }
  ];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Banknote className="w-5 h-5 text-primary" />
            Retirer mes fonds
          </DialogTitle>
        </DialogHeader>

        {/* Stepper */}
        {!success && (
          <div className="flex items-center justify-between mb-6">
            {steps.map((s, i) => (
              <div key={s.number} className="flex items-center">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                  step >= s.number 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted text-muted-foreground"
                )}>
                  {step > s.number ? <Check className="w-4 h-4" /> : s.number}
                </div>
                <span className={cn(
                  "ml-2 text-sm hidden sm:block",
                  step >= s.number ? "text-foreground" : "text-muted-foreground"
                )}>
                  {s.label}
                </span>
                {i < steps.length - 1 && (
                  <div className={cn(
                    "w-8 h-0.5 mx-2",
                    step > s.number ? "bg-primary" : "bg-muted"
                  )} />
                )}
              </div>
            ))}
          </div>
        )}

        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-8 text-center space-y-4"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="w-20 h-20 rounded-full mx-auto flex items-center justify-center bg-yellow-100 dark:bg-yellow-900/30"
              >
                <Clock className="w-10 h-10 text-yellow-600" />
              </motion.div>
              
              <div>
                <h3 className="text-xl font-bold">Demande envoyée</h3>
                <p className="text-muted-foreground mt-2">
                  Votre demande de retrait de {parsedAmount.toLocaleString()} CDF sera traitée sous 1-24h.
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Paiement vers: {phoneInfo.prefix}{phoneNumber}
                </p>
              </div>

              <Button onClick={handleClose} className="w-full">
                Fermer
              </Button>
            </motion.div>
          ) : (
            <>
              {/* Step 1: Montant */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <Alert>
                    <AlertCircle className="w-4 h-4" />
                    <AlertDescription>
                      Solde disponible: <strong>{currentBalance.toLocaleString()} CDF</strong>
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-3">
                    <Label>Montant à retirer (CDF)</Label>
                    <Input
                      type="number"
                      placeholder="10000"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      min={MIN_WITHDRAW}
                      max={Math.min(currentBalance, MAX_WITHDRAW)}
                      step="1000"
                      className="text-lg h-12"
                    />
                    
                    {/* Montants rapides */}
                    <div className="flex flex-wrap gap-2">
                      {QUICK_AMOUNTS.filter(a => a + (a * 0.02) <= currentBalance).map((quickAmount) => (
                        <Button
                          key={quickAmount}
                          variant={parsedAmount === quickAmount ? "default" : "outline"}
                          size="sm"
                          onClick={() => setAmount(quickAmount.toString())}
                        >
                          {quickAmount.toLocaleString()}
                        </Button>
                      ))}
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Minimum: {MIN_WITHDRAW.toLocaleString()} CDF
                    </p>
                  </div>

                  {/* Info traitement manuel */}
                  {parsedAmount > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
                    >
                      <Clock className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-blue-700 dark:text-blue-400">Traitement manuel</p>
                        <p className="text-xs text-blue-600 dark:text-blue-500">
                          Votre demande sera traitée sous 1-24h par notre équipe
                        </p>
                      </div>
                    </motion.div>
                  )}

                  <Button
                    onClick={() => setStep(2)}
                    disabled={!canProceedStep1}
                    className="w-full"
                  >
                    Continuer
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </motion.div>
              )}

              {/* Step 2: Méthode & Téléphone */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="space-y-3">
                    <Label>Moyen de retrait</Label>
                    <RadioGroup value={provider} onValueChange={setProvider}>
                      {WITHDRAW_PROVIDERS.map((p) => (
                        <motion.div
                          key={p.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={cn(
                            "flex items-center justify-between border rounded-lg p-4 cursor-pointer transition-colors",
                            provider === p.id ? "border-primary bg-primary/5" : "hover:bg-accent"
                          )}
                          onClick={() => setProvider(p.id)}
                        >
                          <div className="flex items-center space-x-3">
                            <RadioGroupItem value={p.id} id={p.id} />
                            <Label htmlFor={p.id} className="flex items-center gap-3 cursor-pointer">
                              <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", p.color)}>
                                <Smartphone className="w-5 h-5 text-white" />
                              </div>
                              <span className="font-medium">{p.name}</span>
                            </Label>
                          </div>
                          <span className="text-sm text-muted-foreground">Frais: {p.fee}%</span>
                        </motion.div>
                      ))}
                    </RadioGroup>
                  </div>

                  <div className="space-y-3">
                    <Label>Numéro où recevoir le paiement</Label>
                    <div className="flex gap-2">
                      <span className="flex items-center px-3 border rounded-l-md bg-muted text-sm font-medium">
                        {phoneInfo.prefix}
                      </span>
                      <Input
                        type="tel"
                        placeholder="812345678"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                        maxLength={9}
                        className="rounded-l-none text-lg"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Ce numéro recevra le paiement Mobile Money
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Retour
                    </Button>
                    <Button onClick={() => setStep(3)} disabled={!canProceedStep2} className="flex-1">
                      Continuer
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Confirmation */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="bg-muted/50 rounded-xl p-5 space-y-4 border">
                    <h4 className="font-semibold text-center">Récapitulatif du retrait</h4>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Montant demandé</span>
                        <span className="font-medium">{parsedAmount.toLocaleString()} CDF</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Frais ({selectedProvider?.fee}%)</span>
                        <span className="font-medium">{fee.toLocaleString()} CDF</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Opérateur</span>
                        <span className="font-medium">{selectedProvider?.name}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Numéro de réception</span>
                        <span className="font-medium">{phoneInfo.prefix}{phoneNumber}</span>
                      </div>
                      
                      <div className="border-t pt-3">
                        <div className="flex justify-between">
                          <span className="font-semibold">Total débité</span>
                          <span className="font-bold text-lg text-primary">{total.toLocaleString()} CDF</span>
                        </div>
                      </div>
                    </div>

                    {/* Info traitement */}
                    <div className="flex items-center justify-center gap-2 py-2 rounded-lg text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                      <Clock className="w-4 h-4" />
                      <span>Traitement sous 1-24h</span>
                    </div>
                  </div>

                  <Alert>
                    <AlertCircle className="w-4 h-4" />
                    <AlertDescription className="text-xs">
                      Notre équipe effectuera le paiement vers le numéro indiqué après vérification. Vous recevrez une notification une fois le paiement effectué.
                    </AlertDescription>
                  </Alert>

                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setStep(2)} disabled={loading} className="flex-1">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Retour
                    </Button>
                    <Button 
                      onClick={handleWithdraw} 
                      disabled={loading} 
                      className="flex-1"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Envoi...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Confirmer le retrait
                        </>
                      )}
                    </Button>
                  </div>
                </motion.div>
              )}
            </>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};
