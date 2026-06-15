import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePartnerPromotions, type PromotionType, type PlanKey } from "@/hooks/usePartnerPromotions";
import { usePartnerRentals, type RentalVehicle } from "@/hooks/usePartnerRentals";
import PromotionPaymentSheet from "./PromotionPaymentSheet";
import { formatCurrency } from "@/utils/formatCurrency";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sparkles, Building2, Car, CheckCircle2, Clock, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface Props {
  partnerId: string;
  userId: string;
  companyName?: string;
}

export default function PartnerPromotionCenter({ partnerId, userId, companyName }: Props) {
  const { promotions, wallet, packs, purchasePromotion, getActivePromotion } = usePartnerPromotions(partnerId, userId);
  const { vehicles } = usePartnerRentals();
  const isMobile = useIsMobile();

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<PromotionType>('agency_boost');
  const [selectedPlan, setSelectedPlan] = useState<{ key: PlanKey; label: string; days: number; price: number } | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<RentalVehicle | null>(null);

  const approvedVehicles = vehicles.filter(v => v.moderation_status === 'approved');
  const agencyPack = packs.find(p => p.type === 'agency_boost')!;
  const vehiclePack = packs.find(p => p.type === 'vehicle_boost')!;
  const activeAgencyPromo = getActivePromotion('agency_boost');

  const openPayment = (type: PromotionType, plan: typeof selectedPlan, vehicle?: RentalVehicle) => {
    setSelectedType(type);
    setSelectedPlan(plan);
    setSelectedVehicle(vehicle || null);
    setPaymentOpen(true);
  };

  const handleConfirmPayment = () => {
    if (!selectedPlan) return;
    purchasePromotion.mutate(
      { type: selectedType, targetId: selectedVehicle?.id, planKey: selectedPlan.key },
      { onSuccess: () => setPaymentOpen(false) }
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-1">
        <div className="inline-flex items-center gap-2 bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 px-3 py-1.5 rounded-full text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5" /> Mise en avant payante
        </div>
        <p className="text-sm text-muted-foreground">
          Boostez la visibilité de votre agence et de vos véhicules
        </p>
      </div>

      {/* === SECTION 1: Boost Agence === */}
      <Card className="border-2 border-amber-200 dark:border-amber-900/50 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="w-5 h-5 text-amber-600" />
              Boost Agence
            </CardTitle>
            {activeAgencyPromo && (
              <Badge className="bg-emerald-500 text-white text-[10px] gap-1">
                <CheckCircle2 className="w-3 h-3" />
                En vedette jusqu'au {format(new Date(activeAgencyPromo.expires_at), 'dd MMM', { locale: fr })}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {companyName || 'Votre agence'} apparaîtra en priorité sur la page location
          </p>
        </CardHeader>
        <CardContent className="pt-4">
          <div className={cn("grid gap-2", isMobile ? "grid-cols-2" : "grid-cols-4")}>
            {agencyPack.plans.map((plan) => {
              const isActive = activeAgencyPromo?.plan_key === plan.key;
              return (
                <button
                  key={plan.key}
                  onClick={() => openPayment('agency_boost', plan)}
                  disabled={!!activeAgencyPromo}
                  className={cn(
                    "relative rounded-xl border-2 p-3 text-center transition-all duration-200",
                    "hover:border-amber-400 hover:shadow-md",
                    activeAgencyPromo ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
                    plan.key === '7d' && !activeAgencyPromo
                      ? "border-amber-400 bg-amber-50/50 dark:bg-amber-950/20 ring-1 ring-amber-300"
                      : "border-border bg-background"
                  )}
                >
                  {plan.key === '7d' && !activeAgencyPromo && (
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                      POPULAIRE
                    </span>
                  )}
                  <p className="text-xs text-muted-foreground">{plan.label}</p>
                  <p className="text-lg font-bold mt-1">{formatCurrency(plan.price)}</p>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* === SECTION 2: Boost Véhicule === */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Car className="w-5 h-5 text-primary" />
            Boost Véhicule
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Mettez en avant une annonce spécifique dans les résultats
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {approvedVehicles.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Aucun véhicule approuvé disponible pour le boost
            </p>
          ) : (
            approvedVehicles.map((vehicle) => {
              const activePromo = getActivePromotion('vehicle_boost', vehicle.id);
              return (
                <div
                  key={vehicle.id}
                  className="flex items-center gap-3 p-3 rounded-xl border bg-background hover:bg-muted/30 transition-colors"
                >
                  {/* Vehicle thumbnail */}
                  <div className="w-14 h-14 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
                    {vehicle.images?.[0] ? (
                      <img src={vehicle.images[0]} alt={vehicle.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Car className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{vehicle.brand} {vehicle.model}</p>
                    <p className="text-xs text-muted-foreground">{formatCurrency(vehicle.daily_rate)}/jour</p>
                    {activePromo && (
                      <Badge variant="secondary" className="mt-1 text-[10px] gap-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                        <Star className="w-3 h-3" />
                        Boost actif → {format(new Date(activePromo.expires_at), 'dd MMM', { locale: fr })}
                      </Badge>
                    )}
                  </div>

                  {/* Action */}
                  {!activePromo ? (
                    <VehicleBoostSelector
                      plans={vehiclePack.plans}
                      onSelect={(plan) => openPayment('vehicle_boost', plan, vehicle)}
                      isMobile={isMobile}
                    />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Payment Drawer */}
      {selectedPlan && (
        <PromotionPaymentSheet
          open={paymentOpen}
          onOpenChange={setPaymentOpen}
          type={selectedType}
          planLabel={selectedPlan.label}
          planDays={selectedPlan.days}
          price={selectedPlan.price}
          walletBalance={wallet?.balance || 0}
          walletBonus={wallet?.bonus || 0}
          targetName={selectedVehicle ? `${selectedVehicle.brand} ${selectedVehicle.model}` : companyName}
          isPurchasing={purchasePromotion.isPending}
          onConfirm={handleConfirmPayment}
        />
      )}
    </div>
  );
}

// Small sub-component for vehicle boost plan selection
function VehicleBoostSelector({
  plans,
  onSelect,
  isMobile,
}: {
  plans: { key: PlanKey; label: string; days: number; price: number }[];
  onSelect: (plan: { key: PlanKey; label: string; days: number; price: number }) => void;
  isMobile: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  if (!expanded) {
    return (
      <Button
        size="sm"
        variant="outline"
        className="rounded-xl text-xs gap-1 border-primary/30 text-primary hover:bg-primary/5"
        onClick={() => setExpanded(true)}
      >
        <Sparkles className="w-3 h-3" /> Booster
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {plans.map((plan) => (
        <button
          key={plan.key}
          onClick={() => { onSelect(plan); setExpanded(false); }}
          className="text-[10px] bg-primary/5 hover:bg-primary/10 text-primary rounded-lg px-2 py-1 transition-colors text-right whitespace-nowrap"
        >
          {plan.label} — {formatCurrency(plan.price)}
        </button>
      ))}
    </div>
  );
}
