import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CongoCard, CongoBadge } from '@/components/ui/CongoComponents';
import { Progress } from '@/components/ui/progress';
import { Trophy, TrendingUp, Target } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface ReferralProgressProps {
  userType: 'client' | 'driver' | 'admin' | 'partner';
  totalReferred: number;
  currentTier: string;
  currentReward: number;
}

export const ReferralProgress: React.FC<ReferralProgressProps> = ({
  userType,
  totalReferred,
  currentTier,
  currentReward
}) => {
  
  const getTierStructure = () => {
    if (userType === 'driver' || userType === 'admin' || userType === 'partner') {
      return {
        bronze: { min: 1, max: 5, reward: 2000, color: 'text-orange-600', bg: 'bg-orange-100' },
        silver: { min: 6, max: 15, reward: 3000, color: 'text-gray-500', bg: 'bg-gray-100' },
        gold: { min: 16, max: 30, reward: 5000, color: 'text-yellow-500', bg: 'bg-yellow-100' },
        platinum: { min: 31, max: Infinity, reward: 8000, color: 'text-purple-600', bg: 'bg-purple-100' }
      };
    } else {
      return {
        bronze: { min: 1, max: 10, reward: 500, color: 'text-orange-600', bg: 'bg-orange-100' },
        silver: { min: 11, max: 25, reward: 750, color: 'text-gray-500', bg: 'bg-gray-100' },
        gold: { min: 26, max: 50, reward: 1000, color: 'text-yellow-500', bg: 'bg-yellow-100' },
        platinum: { min: 51, max: Infinity, reward: 1500, color: 'text-purple-600', bg: 'bg-purple-100' }
      };
    }
  };

  const tiers = getTierStructure();
  const currentTierInfo = tiers[currentTier as keyof typeof tiers] || tiers.bronze;
  
  const getNextTier = () => {
    const tierKeys = Object.keys(tiers);
    const currentIndex = tierKeys.indexOf(currentTier);
    if (currentIndex < tierKeys.length - 1) {
      return {
        name: tierKeys[currentIndex + 1],
        ...tiers[tierKeys[currentIndex + 1] as keyof typeof tiers]
      };
    }
    return null;
  };

  const nextTier = getNextTier();
  const progress = nextTier ? Math.min((totalReferred / nextTier.min) * 100, 100) : 100;
  const remaining = nextTier ? Math.max(nextTier.min - totalReferred, 0) : 0;

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'bronze': return '🥉';
      case 'silver': return '🥈';
      case 'gold': return '🥇';
      case 'platinum': return '💎';
      default: return '🥉';
    }
  };

  return (
    <div className="space-y-4">
      {/* Niveau actuel */}
      <CongoCard variant="default" className="bg-gradient-congo-subtle border-congo-green/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Trophy className="h-5 w-5 text-congo-yellow" />
              Niveau Actuel
            </CardTitle>
            <CongoBadge variant="success">
              {getTierIcon(currentTier)} {currentTier.toUpperCase()}
            </CongoBadge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Récompense par parrainage</p>
              <p className="text-2xl font-bold text-congo-green">{formatCurrency(currentReward)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Parrainages réalisés</p>
              <p className="text-2xl font-bold text-foreground">{totalReferred}</p>
            </div>
          </div>

          {nextTier && (
            <>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-1">
                    <Target className="h-3 w-3" />
                    Progression vers {nextTier.name}
                  </span>
                  <span>{totalReferred}/{nextTier.min}</span>
                </div>
                <Progress value={progress} className="h-2" />
                <div className="text-xs text-muted-foreground">
                  Plus que {remaining} parrainage{remaining > 1 ? 's' : ''} pour débloquer{' '}
                  <span className="font-semibold text-foreground">
                    {formatCurrency(nextTier.reward)} par parrainage
                  </span>
                </div>
              </div>
            </>
          )}

          {currentTier === 'platinum' && (
            <div className="text-center p-4 bg-gradient-to-r from-purple-100 to-gold-100 rounded-lg">
              <p className="text-sm font-medium">🎉 Félicitations !</p>
              <p className="text-xs text-muted-foreground">
                Vous avez atteint le niveau maximum !
              </p>
            </div>
          )}
        </CardContent>
      </CongoCard>

      {/* Aperçu de tous les niveaux */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Système de Niveaux {userType === 'client' ? 'Client' : 'Chauffeur'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(tiers).map(([tierName, tierInfo]) => (
            <div 
              key={tierName}
              className={`p-3 rounded-lg border ${
                currentTier === tierName 
                  ? 'border-congo-green bg-congo-green/10' 
                  : 'border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{getTierIcon(tierName)}</span>
                  <div>
                    <p className="font-semibold capitalize">{tierName}</p>
                    <p className="text-xs text-muted-foreground">
                      {tierInfo.min === 1 ? '1' : tierInfo.min} - {tierInfo.max === Infinity ? '∞' : tierInfo.max} parrainages
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm">{formatCurrency(tierInfo.reward)}</p>
                  <p className="text-xs text-muted-foreground">par parrainage</p>
                </div>
              </div>
              {currentTier === tierName && (
                <CongoBadge variant="success" className="mt-2 text-xs">
                  Niveau Actuel
                </CongoBadge>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};