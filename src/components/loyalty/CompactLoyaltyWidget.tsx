import { motion } from 'framer-motion';
import { Sparkles, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useLoyaltyPoints, TIER_CONFIG, CONVERSION_RATE, LoyaltyTier } from '@/hooks/useLoyaltyPoints';
import { useNavigate } from 'react-router-dom';

export const CompactLoyaltyWidget = () => {
  const navigate = useNavigate();
  const { loyaltyData, loading, getNextTierProgress } = useLoyaltyPoints();

  if (loading || !loyaltyData) {
    return (
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
        <CardContent className="p-4">
          <div className="animate-pulse space-y-2">
            <div className="h-3 bg-muted rounded w-1/2" />
            <div className="h-6 bg-muted rounded w-3/4" />
            <div className="h-1.5 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentTier = (loyaltyData.tier?.toLowerCase() || 'bronze') as LoyaltyTier;
  const tierConfig = TIER_CONFIG[currentTier] || TIER_CONFIG.bronze;
  const { nextTier, progress, pointsNeeded } = getNextTierProgress();
  
  const pointsBalance = (loyaltyData as any).current_points || 0;
  const cdfValue = (pointsBalance / CONVERSION_RATE.points) * CONVERSION_RATE.cdf;

  return (
    <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-background to-primary/5">
      <CardContent className="p-4 space-y-3">
        {/* Ligne 1: Badge + Points */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${tierConfig.color} flex items-center justify-center text-lg shadow`}>
              {tierConfig.icon}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{tierConfig.name}</p>
              <p className="text-xl font-bold">
                {pointsBalance.toLocaleString()}
                <span className="text-xs text-muted-foreground ml-1">pts</span>
              </p>
            </div>
          </div>
          <Sparkles className="w-5 h-5 text-primary" />
        </div>

        {/* Ligne 2: Taux conversion */}
        <p className="text-xs text-muted-foreground text-center">
          ≈ {cdfValue.toLocaleString()} CDF • {CONVERSION_RATE.label}
        </p>

        {/* Ligne 3: Progress bar */}
        {nextTier && (
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Prochain: {TIER_CONFIG[nextTier].name}
              </span>
              <span className="font-medium">{pointsNeeded.toLocaleString()}</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>
        )}

        {/* Ligne 4: Bouton conversion ROSE */}
        <Button 
          onClick={() => navigate('/loyalty')}
          className="w-full bg-pink-500 hover:bg-pink-600 text-white h-9 text-sm"
          disabled={pointsBalance < 100}
        >
          Convertir en crédit →
        </Button>

        {/* Ligne 5: Grid Gagnés/Dépensés */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t">
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
