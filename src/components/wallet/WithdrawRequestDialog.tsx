/**
 * 💸 Drawer de demande de retrait pour clients
 */

import { useState } from 'react';
import { Drawer } from 'vaul';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Banknote, CheckCircle, X, Info, Clock } from 'lucide-react';
import { OperatorSelector } from './OperatorSelector';
import { QuickAmountSelector } from './QuickAmountSelector';

// Logos
import airtelMoneyLogo from '@/assets/airtel-money-logo.png';
import orangeMoneyLogo from '@/assets/orange-money-logo.webp';
import mpesaLogo from '@/assets/mpesa-logo.png';

interface WithdrawRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentBalance: number;
  currency?: string;
  userType?: 'client' | 'driver' | 'vendor' | 'partner';
  onSuccess?: () => void;
}

const PROVIDER_MAP: Record<string, { id: string; fee: number }> = {
  orange: { id: 'orange_money', fee: 2 },
  airtel: { id: 'airtel_money', fee: 2 },
  mpesa: { id: 'm_pesa', fee: 2 },
};

const MIN_WITHDRAW = 5000;
const MAX_WITHDRAW = 1000000;
const QUICK_AMOUNTS = [5000, 10000, 20000, 50000];

export const WithdrawRequestDialog = ({ 
  open, 
  onOpenChange, 
  currentBalance, 
  currency = 'CDF',
  userType = 'client',
  onSuccess 
}: WithdrawRequestDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [amount, setAmount] = useState('');
  const [operator, setOperator] = useState<'airtel' | 'orange' | 'mpesa' | ''>('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const parsedAmount = parseInt(amount) || 0;
  const providerInfo = operator ? PROVIDER_MAP[operator] : null;
  const fee = providerInfo ? Math.ceil(parsedAmount * providerInfo.fee / 100) : 0;
  const netAmount = parsedAmount - fee;

  const handleWithdraw = async () => {
    if (parsedAmount < MIN_WITHDRAW) {
      toast({ title: "Montant trop faible", description: `Minimum: ${MIN_WITHDRAW.toLocaleString()} ${currency}`, variant: "destructive" });
      return;
    }
    if (parsedAmount > currentBalance) {
      toast({ title: "Solde insuffisant", description: "Votre solde est insuffisant pour ce retrait", variant: "destructive" });
      return;
    }
    if (!operator) {
      toast({ title: "Opérateur requis", description: "Veuillez sélectionner un opérateur", variant: "destructive" });
      return;
    }
    if (!phoneNumber || phoneNumber.length < 9) {
      toast({ title: "Numéro invalide", description: "Veuillez entrer un numéro valide", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non connecté');

      const { data, error } = await supabase.functions.invoke('escrow-management', {
        body: {
          action: 'process_withdrawal',
          confirmationData: {
            userId: user.id,
            amount: parsedAmount,
            withdrawalMethod: 'mobile_money',
            paymentDetails: {
              userType,
              mobileMoneyProvider: providerInfo?.id,
              mobileMoneyPhone: `+243${phoneNumber}`
            }
          }
        }
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.message || 'Erreur lors du retrait');

      setSuccess(true);
      toast({ title: "Demande envoyée", description: "Votre demande de retrait est en attente de validation" });

      setTimeout(() => {
        onSuccess?.();
        onOpenChange(false);
        setSuccess(false);
        setAmount('');
        setPhoneNumber('');
        setOperator('');
      }, 2000);
    } catch (error: any) {
      console.error('Withdraw error:', error);
      toast({ title: "Erreur de retrait", description: error.message || "Une erreur est survenue", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAmount = (val: number) => {
    setAmount(String(val));
  };

  const canSubmit = parsedAmount >= MIN_WITHDRAW && parsedAmount <= currentBalance && !!operator && phoneNumber.length >= 9 && !loading;

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-2xl outline-none">
          <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted-foreground/20 my-3" />
          
          <div className="overflow-y-auto max-h-[85vh] px-5 pb-6">
            {success ? (
              /* Écran succès */
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Demande envoyée !</h3>
                <p className="text-sm text-muted-foreground text-center max-w-xs">
                  Votre retrait de {parsedAmount.toLocaleString()} {currency} est en cours de traitement.
                </p>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2.5">
                    <Banknote className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-bold text-foreground">Retirer</h2>
                  </div>
                  <button onClick={() => onOpenChange(false)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                    <X className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>

                {/* Solde */}
                <div className="bg-muted/40 rounded-xl px-4 py-3 flex items-center justify-between mb-5">
                  <span className="text-sm text-muted-foreground">Solde disponible</span>
                  <span className="text-sm font-bold text-foreground">
                    {currentBalance.toLocaleString('fr-CD')} {currency}
                  </span>
                </div>

                <div className="space-y-5">
                  {/* Montant */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Montant ({currency})
                    </label>
                    <Input
                      type="number"
                      placeholder="10 000"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="h-12 rounded-xl bg-muted/30 border-border/50 text-xl font-bold text-center"
                      min={MIN_WITHDRAW}
                      max={Math.min(currentBalance, MAX_WITHDRAW)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Min: {MIN_WITHDRAW.toLocaleString()} · Max: {Math.min(currentBalance, MAX_WITHDRAW).toLocaleString()} {currency}
                    </p>
                  </div>

                  {/* Quick amounts */}
                  <div className="grid grid-cols-4 gap-2">
                    {QUICK_AMOUNTS.map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => handleQuickAmount(val)}
                        className={`px-2 py-2 rounded-xl text-xs font-semibold transition-all duration-150 ${
                          parsedAmount === val
                            ? 'bg-primary text-primary-foreground border border-primary shadow-sm'
                            : 'bg-muted/50 border border-border/60 text-foreground hover:bg-muted hover:border-border'
                        }`}
                      >
                        {val.toLocaleString('fr-CD')}
                      </button>
                    ))}
                  </div>

                  {/* Opérateur */}
                  <OperatorSelector
                    selected={operator}
                    onSelect={setOperator}
                  />

                  {/* Numéro */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Numéro de réception
                    </label>
                    <div className="flex items-center h-12 rounded-xl border border-border/50 bg-muted/30 overflow-hidden">
                      <span className="px-3 text-sm font-medium text-muted-foreground border-r border-border/50 h-full flex items-center bg-muted/50">
                        +243
                      </span>
                      <input
                        type="tel"
                        placeholder="812 345 678"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                        maxLength={9}
                        className="flex-1 h-full px-3 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/60"
                      />
                    </div>
                  </div>

                  {/* Résumé */}
                  {parsedAmount >= MIN_WITHDRAW && operator && (
                    <div className="bg-muted/30 rounded-xl p-4 space-y-2.5">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Montant</span>
                        <span className="font-medium text-foreground">{parsedAmount.toLocaleString('fr-CD')} {currency}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Frais ({providerInfo?.fee}%)</span>
                        <span className="font-medium text-foreground">-{fee.toLocaleString('fr-CD')} {currency}</span>
                      </div>
                      <div className="border-t border-border/50 pt-2.5 flex justify-between text-sm">
                        <span className="font-semibold text-foreground">Vous recevrez</span>
                        <span className="font-bold text-primary">{netAmount.toLocaleString('fr-CD')} {currency}</span>
                      </div>
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span>Les retraits sont traités sous 24-48h</span>
                  </div>

                  {/* Boutons */}
                  <div className="flex gap-3 pt-1">
                    <Button
                      variant="ghost"
                      onClick={() => onOpenChange(false)}
                      disabled={loading}
                      className="flex-1 h-12 rounded-xl"
                    >
                      Annuler
                    </Button>
                    <Button
                      onClick={handleWithdraw}
                      disabled={!canSubmit}
                      className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Traitement...
                        </>
                      ) : (
                        <>
                          <Banknote className="w-4 h-4 mr-2" />
                          Demander
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};
