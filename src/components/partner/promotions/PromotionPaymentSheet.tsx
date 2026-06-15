import { useState } from "react";
import { Drawer, DrawerContent, DrawerHandle, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/utils/formatCurrency";
import { Wallet, Sparkles, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PromotionType, PlanKey } from "@/hooks/usePartnerPromotions";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: PromotionType;
  planLabel: string;
  planDays: number;
  price: number;
  walletBalance: number;
  walletBonus: number;
  targetName?: string;
  isPurchasing: boolean;
  onConfirm: () => void;
}

export default function PromotionPaymentSheet({
  open, onOpenChange, type, planLabel, planDays, price,
  walletBalance, walletBonus, targetName, isPurchasing, onConfirm,
}: Props) {
  const [success, setSuccess] = useState(false);
  const totalAvailable = walletBalance + walletBonus;
  const canPay = totalAvailable >= price;
  const bonusUsed = Math.min(walletBonus, price);
  const balanceUsed = price - bonusUsed;

  const boostLabel = type === 'agency_boost' ? '🏢 Boost Agence' : '🚗 Boost Véhicule';

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Drawer open={open} onOpenChange={(v) => { if (!isPurchasing) { setSuccess(false); onOpenChange(v); } }}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHandle />
        <DrawerHeader className="text-center pb-2">
          <DrawerTitle className="text-lg">{boostLabel}</DrawerTitle>
          <DrawerDescription>
            {targetName ? `${targetName} — ` : ''}{planLabel}
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-5 pb-4 space-y-4">
          {/* Price card */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-4 text-white">
            <p className="text-xs text-slate-400 mb-1">Montant à payer</p>
            <p className="text-2xl font-bold">{formatCurrency(price)}</p>
            <p className="text-xs text-slate-400 mt-1">Durée : {planDays} jours</p>
          </div>

          {/* Wallet balance */}
          <div className="bg-muted/50 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Wallet className="w-4 h-4" />
              Solde TembeaPay
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Bonus</span>
              <span className="font-medium">{formatCurrency(walletBonus)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Principal</span>
              <span className="font-medium">{formatCurrency(walletBalance)}</span>
            </div>
            <div className="border-t border-border pt-2 flex justify-between text-sm font-semibold">
              <span>Total disponible</span>
              <span className={cn(canPay ? "text-emerald-600" : "text-destructive")}>
                {formatCurrency(totalAvailable)}
              </span>
            </div>
          </div>

          {/* Payment breakdown */}
          {canPay && (
            <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-xl p-3 space-y-1">
              <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 mb-1">Détail du paiement</p>
              {bonusUsed > 0 && (
                <div className="flex justify-between text-xs text-emerald-600 dark:text-emerald-400">
                  <span>Bonus utilisé</span>
                  <span>-{formatCurrency(bonusUsed)}</span>
                </div>
              )}
              {balanceUsed > 0 && (
                <div className="flex justify-between text-xs text-emerald-600 dark:text-emerald-400">
                  <span>Solde principal</span>
                  <span>-{formatCurrency(balanceUsed)}</span>
                </div>
              )}
            </div>
          )}

          {/* Insufficient balance */}
          {!canPay && (
            <div className="bg-destructive/10 rounded-xl p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-destructive">Solde insuffisant</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Il vous manque {formatCurrency(price - totalAvailable)}. Rechargez votre portefeuille.
                </p>
              </div>
            </div>
          )}
        </div>

        <DrawerFooter className="pt-0">
          <Button
            onClick={handleConfirm}
            disabled={!canPay || isPurchasing}
            className="w-full rounded-xl h-12 text-base font-semibold bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white shadow-lg"
          >
            {isPurchasing ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Traitement...</>
            ) : (
              <><Sparkles className="w-5 h-5 mr-2" /> Payer avec TembeaPay</>
            )}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
