import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Wallet, 
  CreditCard, 
  Smartphone, 
  CheckCircle2, 
  Loader2,
  Car,
  Calendar,
  Shield,
  Info
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import confetti from 'canvas-confetti';
import { OperatorSelector } from '@/components/wallet/OperatorSelector';
import { AnimatePresence, motion } from 'framer-motion';

interface DepositPaymentSheetProps {
  isOpen: boolean;
  onClose: () => void;
  booking: {
    id: string;
    total_price?: number;
    total_amount?: number;
    deposit_amount?: number;
    deposit_percentage?: number;
    remaining_amount?: number;
    start_date: string;
    end_date: string;
    rental_vehicles?: {
      brand: string;
      model: string;
      year: number;
      images?: string[];
    };
  } | null;
  walletBalance: number;
  onPayDeposit: (bookingId: string, amount: number, method: 'wallet' | 'mobile_money') => Promise<boolean>;
  isProcessing: boolean;
}

export const DepositPaymentSheet: React.FC<DepositPaymentSheetProps> = ({
  isOpen,
  onClose,
  booking,
  walletBalance,
  onPayDeposit,
  isProcessing
}) => {
  const [selectedMethod, setSelectedMethod] = useState<'wallet' | 'mobile_money'>('wallet');
  const [selectedOperator, setSelectedOperator] = useState<'airtel' | 'orange' | 'mpesa' | ''>('');

  if (!booking) return null;

  const totalPrice = booking.total_price || booking.total_amount || 0;
  const depositPercentage = booking.deposit_percentage || 30;
  const depositAmount = booking.deposit_amount || Math.round(totalPrice * (depositPercentage / 100));
  const remainingAmount = booking.remaining_amount || totalPrice - depositAmount;
  
  const vehicle = booking.rental_vehicles;
  const canPayWithWallet = walletBalance >= depositAmount;

  const handlePayment = async () => {
    const success = await onPayDeposit(booking.id, depositAmount, selectedMethod);
    if (success) {
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#22c55e', '#10b981', '#34d399', '#6ee7b7']
      });
      onClose();
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl overflow-y-auto">
        <SheetHeader className="text-left pb-4 border-b">
          <SheetTitle className="text-xl flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Paiement de l'acompte
          </SheetTitle>
        </SheetHeader>

        <div className="py-6 space-y-6">
          {/* Véhicule */}
          {vehicle && (
            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl">
              {vehicle.images?.[0] ? (
                <img 
                  src={vehicle.images[0]} 
                  alt={`${vehicle.brand} ${vehicle.model}`}
                  className="w-20 h-20 object-cover rounded-lg"
                />
              ) : (
                <div className="w-20 h-20 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Car className="h-8 w-8 text-primary" />
                </div>
              )}
              <div>
                <h3 className="font-semibold text-lg">{vehicle.brand} {vehicle.model}</h3>
                <p className="text-sm text-muted-foreground">Année {vehicle.year}</p>
                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {format(new Date(booking.start_date), 'dd MMM', { locale: fr })} - {format(new Date(booking.end_date), 'dd MMM yyyy', { locale: fr })}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Récapitulatif des montants */}
          <div className="space-y-4 p-4 bg-card border rounded-xl">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Récapitulatif</h4>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total location</span>
                <span className="font-medium">{totalPrice.toLocaleString()} CDF</span>
              </div>
              
              <div className="h-px bg-border" />
              
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20">
                    Acompte {depositPercentage}%
                  </Badge>
                  <span className="text-sm text-muted-foreground">à payer maintenant</span>
                </div>
                <span className="text-xl font-bold text-green-600">{depositAmount.toLocaleString()} CDF</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Reste à payer au partenaire</span>
                <span className="font-medium text-muted-foreground">{remainingAmount.toLocaleString()} CDF</span>
              </div>
            </div>

            {/* Barre de progression */}
            <div className="pt-2">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Progression du paiement</span>
                <span>{depositPercentage}%</span>
              </div>
              <Progress value={depositPercentage} className="h-2" />
            </div>
          </div>

          {/* Info */}
          <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-700 dark:text-blue-300">
              <p className="font-medium mb-1">Comment ça marche ?</p>
              <ul className="list-disc list-inside space-y-1 text-blue-600/80 dark:text-blue-400/80">
                <li>Payez l'acompte ({depositPercentage}%) pour confirmer la réservation</li>
                <li>Le reste ({100 - depositPercentage}%) sera à régler au partenaire le jour de la location</li>
                <li>L'acompte garantit la réservation du véhicule</li>
              </ul>
            </div>
          </div>

          {/* Méthodes de paiement */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Mode de paiement</h4>
            
            <button
              onClick={() => { setSelectedMethod('wallet'); setSelectedOperator(''); }}
              disabled={!canPayWithWallet}
              className={`w-full p-4 rounded-xl border-2 transition-all flex items-center justify-between ${
                selectedMethod === 'wallet' && canPayWithWallet
                  ? 'border-primary bg-primary/5' 
                  : canPayWithWallet 
                    ? 'border-border hover:border-primary/50' 
                    : 'border-border/50 bg-muted/30 opacity-60 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-lg ${selectedMethod === 'wallet' && canPayWithWallet ? 'bg-primary/20' : 'bg-muted'}`}>
                  <Wallet className={`h-5 w-5 ${selectedMethod === 'wallet' && canPayWithWallet ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                <div className="text-left">
                  <p className="font-medium">Wallet TembeaPay</p>
                  <p className="text-sm text-muted-foreground">
                    Solde: {walletBalance.toLocaleString()} CDF
                    {!canPayWithWallet && <span className="text-red-500 ml-1">(insuffisant)</span>}
                  </p>
                </div>
              </div>
              {selectedMethod === 'wallet' && canPayWithWallet && (
                <CheckCircle2 className="h-5 w-5 text-primary" />
              )}
            </button>

            <button
              onClick={() => setSelectedMethod('mobile_money')}
              className={`w-full p-4 rounded-xl border-2 transition-all flex items-center justify-between ${
                selectedMethod === 'mobile_money'
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-lg ${selectedMethod === 'mobile_money' ? 'bg-primary/20' : 'bg-muted'}`}>
                  <Smartphone className={`h-5 w-5 ${selectedMethod === 'mobile_money' ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                <div className="text-left">
                  <p className="font-medium">Mobile Money</p>
                  <p className="text-sm text-muted-foreground">Orange Money, M-Pesa, Airtel Money</p>
                </div>
              </div>
              {selectedMethod === 'mobile_money' && (
                <CheckCircle2 className="h-5 w-5 text-primary" />
              )}
            </button>

            {/* Sélecteur d'opérateur Mobile Money */}
            <AnimatePresence>
              {selectedMethod === 'mobile_money' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="pt-1">
                    <OperatorSelector
                      selected={selectedOperator}
                      onSelect={setSelectedOperator}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Bouton de paiement fixe */}
        <div className="sticky bottom-0 pt-4 pb-6 bg-background border-t">
          <Button
            onClick={handlePayment}
            disabled={isProcessing || (selectedMethod === 'wallet' && !canPayWithWallet) || (selectedMethod === 'mobile_money' && !selectedOperator)}
            className="w-full h-14 text-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Traitement en cours...
              </>
            ) : (
              <>
                <Shield className="h-5 w-5 mr-2" />
                Payer l'acompte: {depositAmount.toLocaleString()} CDF
              </>
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};