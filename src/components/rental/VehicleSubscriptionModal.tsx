import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Check, Crown, Star, Zap, Sparkles, Truck, Car, Loader2 } from 'lucide-react';
import { SubscriptionPlan, useRentalVehicleSubscription } from '@/hooks/useRentalVehicleSubscription';
import { cn } from '@/lib/utils';
import { useWallet } from '@/hooks/useWallet';

interface VehicleSubscriptionModalProps {
  open: boolean;
  onClose: () => void;
  vehicleId: string;
  vehicleName: string;
  categoryName: string;
  onSuccess?: () => void;
}

export const VehicleSubscriptionModal: React.FC<VehicleSubscriptionModalProps> = ({
  open,
  onClose,
  vehicleId,
  vehicleName,
  categoryName,
  onSuccess
}) => {
  const { getPlansByCategory, subscribeVehicle } = useRentalVehicleSubscription();
  const { wallet } = useWallet();
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const plans = getPlansByCategory(categoryName);
  const selectedPlan = plans.find(p => p.id === selectedPlanId);
  const walletBalance = (wallet?.balance || 0) + (wallet?.bonus_balance || 0);

  const getTierIcon = (tier: string) => {
    switch (tier?.toUpperCase()) {
      case 'PLATINUM': return <Crown className="h-5 w-5" />;
      case 'GOLD': return <Star className="h-5 w-5" />;
      case 'SILVER': return <Sparkles className="h-5 w-5" />;
      default: return <Zap className="h-5 w-5" />;
    }
  };

  const getTierColors = (tier: string) => {
    switch (tier?.toUpperCase()) {
      case 'PLATINUM': return 'border-purple-500 bg-purple-500/5';
      case 'GOLD': return 'border-amber-500 bg-amber-500/5';
      case 'SILVER': return 'border-gray-400 bg-gray-400/5';
      default: return 'border-blue-500 bg-blue-500/5';
    }
  };

  const handleSubscribe = async () => {
    if (!selectedPlanId) return;
    
    setIsProcessing(true);
    try {
      await subscribeVehicle.mutateAsync({
        vehicleId,
        planId: selectedPlanId,
        paymentMethod: 'wallet'
      });
      onSuccess?.();
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  const isTruck = categoryName?.includes('Camion') || categoryName === 'Semi-Remorque';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isTruck ? <Truck className="h-5 w-5" /> : <Car className="h-5 w-5" />}
            Souscrire un abonnement
          </DialogTitle>
          <DialogDescription>
            Choisissez un plan pour activer <strong>{vehicleName}</strong> ({categoryName})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Plans disponibles */}
          <RadioGroup 
            value={selectedPlanId || ''} 
            onValueChange={setSelectedPlanId}
            className="grid grid-cols-1 md:grid-cols-2 gap-3"
          >
            {plans.map((plan) => {
              const isSelected = selectedPlanId === plan.id;
              const canAfford = walletBalance >= plan.monthly_price;
              
              return (
                <Label
                  key={plan.id}
                  htmlFor={plan.id}
                  className={cn(
                    "cursor-pointer",
                    !canAfford && "opacity-60 cursor-not-allowed"
                  )}
                >
                  <Card className={cn(
                    "relative transition-all duration-200",
                    getTierColors(plan.tier_name),
                    isSelected && "ring-2 ring-primary shadow-lg",
                    !canAfford && "grayscale"
                  )}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <RadioGroupItem 
                            value={plan.id} 
                            id={plan.id}
                            disabled={!canAfford}
                          />
                          {getTierIcon(plan.tier_name)}
                          <CardTitle className="text-base">{plan.tier_name}</CardTitle>
                        </div>
                        {plan.tier_name === 'GOLD' && (
                          <Badge variant="secondary" className="bg-amber-500/20 text-amber-600">
                            Populaire
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Prix */}
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold">
                          {plan.monthly_price.toLocaleString()}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {plan.currency}/mois
                        </span>
                      </div>

                      {/* Features */}
                      <ul className="space-y-1 text-sm">
                        <li className="flex items-center gap-2">
                          <Check className="h-3.5 w-3.5 text-green-500" />
                          <span>
                            {plan.max_vehicles === -1 ? 'Véhicules illimités' : `${plan.max_vehicles} véhicules max`}
                          </span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-3.5 w-3.5 text-green-500" />
                          <span>
                            {plan.max_photos >= 999 ? 'Photos illimitées' : `${plan.max_photos} photos max`}
                          </span>
                        </li>
                        {plan.priority_support && (
                          <li className="flex items-center gap-2">
                            <Check className="h-3.5 w-3.5 text-green-500" />
                            <span>Support prioritaire</span>
                          </li>
                        )}
                        {plan.featured_listing && (
                          <li className="flex items-center gap-2">
                            <Check className="h-3.5 w-3.5 text-green-500" />
                            <span>Mise en avant</span>
                          </li>
                        )}
                        {plan.analytics_access && (
                          <li className="flex items-center gap-2">
                            <Check className="h-3.5 w-3.5 text-green-500" />
                            <span>Analytics avancés</span>
                          </li>
                        )}
                        {plan.video_allowed && (
                          <li className="flex items-center gap-2">
                            <Check className="h-3.5 w-3.5 text-green-500" />
                            <span>Vidéos autorisées</span>
                          </li>
                        )}
                      </ul>

                      {!canAfford && (
                        <p className="text-xs text-destructive">
                          Solde insuffisant
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </Label>
              );
            })}
          </RadioGroup>

          {plans.length === 0 && (
            <Card className="py-8 text-center">
              <CardContent>
                <p className="text-muted-foreground">
                  Aucun plan disponible pour cette catégorie
                </p>
              </CardContent>
            </Card>
          )}

          {/* Résumé et paiement */}
          {selectedPlan && (
            <Card className="bg-muted/30">
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Plan sélectionné</span>
                  <span className="font-medium">{selectedPlan.tier_name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Montant</span>
                  <span className="font-bold text-lg">
                    {selectedPlan.monthly_price.toLocaleString()} {selectedPlan.currency}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Solde wallet</span>
                  <span className={cn(
                    walletBalance >= selectedPlan.monthly_price ? "text-green-600" : "text-destructive"
                  )}>
                    {walletBalance.toLocaleString()} CDF
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button 
            variant="outline" 
            onClick={onClose} 
            className="flex-1"
            disabled={isProcessing}
          >
            Annuler
          </Button>
          <Button 
            onClick={handleSubscribe}
            disabled={!selectedPlanId || isProcessing || (selectedPlan && walletBalance < selectedPlan.monthly_price)}
            className="flex-1"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Traitement...
              </>
            ) : (
              'Souscrire et activer'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
