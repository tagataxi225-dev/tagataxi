import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useLoyaltyPoints, TIER_CONFIG, CONVERSION_RATE, LoyaltyTier } from '@/hooks/useLoyaltyPoints';

export const LoyaltyPointsWidget = () => {
  const { loyaltyData, loading, redeeming, redeemPoints, getNextTierProgress } = useLoyaltyPoints();
  const [redeemDialogOpen, setRedeemDialogOpen] = useState(false);
  const [pointsToRedeem, setPointsToRedeem] = useState('');
  const [redeemType, setRedeemType] = useState<'wallet' | 'marketplace'>('wallet');

  if (loading || !loyaltyData) {
    return (
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="h-8 bg-muted rounded w-3/4" />
            <div className="h-2 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Normaliser le tier
  const currentTier = (loyaltyData.tier?.toLowerCase() || 'bronze') as LoyaltyTier;
  const tierConfig = TIER_CONFIG[currentTier] || TIER_CONFIG.bronze;
  const { nextTier, progress, pointsNeeded } = getNextTierProgress();
  
  // S'assurer que current_points est un nombre
  const pointsBalance = (loyaltyData as any).current_points || 0;
  const cdfValue = (pointsBalance / CONVERSION_RATE.points) * CONVERSION_RATE.cdf;

  const handleRedeem = async () => {
    const points = parseInt(pointsToRedeem);
    if (isNaN(points) || points <= 0) return;

    const result = await redeemPoints(points, redeemType);
    if (result) {
      setRedeemDialogOpen(false);
      setPointsToRedeem('');
    }
  };

  return (
    <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-background via-background to-primary/5">
      <CardContent className="p-6">
        {/* Header avec Badge Tier */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={`w-12 h-12 rounded-full bg-gradient-to-br ${tierConfig.color} flex items-center justify-center text-2xl shadow-lg`}
            >
              {tierConfig.icon}
            </motion.div>
            <div>
              <p className="text-sm text-muted-foreground">Niveau de fidélité</p>
              <p className={`text-lg font-bold ${tierConfig.textColor}`}>
                {tierConfig.name}
              </p>
            </div>
          </div>
          <Sparkles className="w-6 h-6 text-primary animate-pulse" />
        </div>

        {/* Solde Points */}
        <div className="mb-4">
          <div className="flex items-baseline gap-2 mb-1">
            <motion.span
              key={pointsBalance}
              initial={{ scale: 1.2, color: 'rgb(var(--primary))' }}
              animate={{ scale: 1, color: 'currentColor' }}
              className="text-3xl font-bold"
            >
              {pointsBalance.toLocaleString()}
            </motion.span>
            <span className="text-muted-foreground">points</span>
          </div>
          <p className="text-xs text-muted-foreground">
            ≈ {cdfValue.toLocaleString()} CDF • {CONVERSION_RATE.label}
          </p>
        </div>

        {/* Progression vers prochain tier */}
        {nextTier && (
          <div className="mb-4 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Prochain niveau: {TIER_CONFIG[nextTier].name}
              </span>
              <span className="font-medium">{pointsNeeded.toLocaleString()} pts</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Bouton Conversion */}
        <Dialog open={redeemDialogOpen} onOpenChange={setRedeemDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 group"
              disabled={pointsBalance < 100}
            >
              Convertir en crédit
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Convertir vos points</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Nombre de points à convertir</Label>
                <Input
                  type="number"
                  placeholder="Ex: 1000"
                  value={pointsToRedeem}
                  onChange={(e) => setPointsToRedeem(e.target.value)}
                  min="100"
                  max={pointsBalance}
                  step="100"
                />
                <p className="text-xs text-muted-foreground">
                  Solde disponible: {pointsBalance.toLocaleString()} points
                </p>
                {pointsToRedeem && parseInt(pointsToRedeem) >= 100 && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm font-medium text-primary"
                  >
                    = {((parseInt(pointsToRedeem) / CONVERSION_RATE.points) * CONVERSION_RATE.cdf).toLocaleString()} CDF
                  </motion.p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Type de conversion</Label>
                <RadioGroup value={redeemType} onValueChange={(v) => setRedeemType(v as any)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="wallet" id="wallet" />
                    <Label htmlFor="wallet" className="font-normal cursor-pointer">
                      Crédit TAGAPay (disponible immédiatement)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="marketplace" id="marketplace" />
                    <Label htmlFor="marketplace" className="font-normal cursor-pointer">
                      Réduction Marketplace (lors du prochain achat)
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <Button
                onClick={handleRedeem}
                disabled={!pointsToRedeem || parseInt(pointsToRedeem) < 100 || redeeming}
                className="w-full"
              >
                {redeeming ? 'Conversion en cours...' : 'Confirmer la conversion'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Statistiques */}
        <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Gagnés</p>
            <p className="text-sm font-semibold">{((loyaltyData as any).total_earned_points || 0).toLocaleString()}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Dépensés</p>
            <p className="text-sm font-semibold">{((loyaltyData as any).total_spent_points || 0).toLocaleString()}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};