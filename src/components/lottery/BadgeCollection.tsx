import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Check, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  CONGOLESE_BADGES,
  BADGE_RARITY_ORDER,
  BADGE_RARITY_CONFIG,
  CongoleseBadge,
  checkBadgeRequirement
} from '@/types/congolese-badges';

interface BadgeCollectionProps {
  earnedBadges: string[];
  stats: {
    cardsScratched: number;
    megaCards: number;
    consecutiveDays: number;
    xpEarned: number;
  };
}

export const BadgeCollection: React.FC<BadgeCollectionProps> = ({
  earnedBadges,
  stats
}) => {
  // Grouper les badges par rareté
  const badgesByRarity = BADGE_RARITY_ORDER.map(rarity => ({
    rarity,
    badges: Object.values(CONGOLESE_BADGES).filter(b => b.rarity === rarity)
  }));

  // Calculer la progression vers un badge
  const getBadgeProgress = (badge: CongoleseBadge): number => {
    let current = 0;
    switch (badge.requirementType) {
      case 'cards_scratched':
        current = stats.cardsScratched;
        break;
      case 'mega_cards':
        current = stats.megaCards;
        break;
      case 'consecutive_days':
        current = stats.consecutiveDays;
        break;
      case 'xp_earned':
        current = stats.xpEarned;
        break;
      case 'first_action':
        current = stats.cardsScratched > 0 ? 1 : 0;
        break;
    }
    return Math.min(100, (current / badge.requirementValue) * 100);
  };

  const earnedCount = earnedBadges.length;
  const totalCount = Object.keys(CONGOLESE_BADGES).length;

  return (
    <Card className="border-0 bg-gradient-to-br from-background to-muted/30">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="text-2xl">🏅</span>
            Mes Badges Congolais
          </span>
          <Badge variant="secondary" className="text-sm">
            {earnedCount}/{totalCount}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Progression globale */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Collection</span>
            <span className="font-medium">{Math.round((earnedCount / totalCount) * 100)}%</span>
          </div>
          <Progress value={(earnedCount / totalCount) * 100} className="h-2" />
        </div>

        {/* Badges par rareté */}
        {badgesByRarity.map(({ rarity, badges }) => (
          <div key={rarity} className="space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-2 capitalize">
              {rarity === 'legendary' && '✨'}
              {rarity === 'epic' && '💜'}
              {rarity === 'rare' && '💙'}
              {rarity === 'common' && '⚪'}
              {rarity === 'legendary' ? 'Légendaire' :
               rarity === 'epic' ? 'Épique' :
               rarity === 'rare' ? 'Rare' : 'Commun'}
              <Badge variant="outline" className="text-xs">
                {badges.filter(b => earnedBadges.includes(b.id)).length}/{badges.length}
              </Badge>
            </h4>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              <AnimatePresence>
                {badges.map((badge) => {
                  const isEarned = earnedBadges.includes(badge.id);
                  const progress = getBadgeProgress(badge);
                  const config = BADGE_RARITY_CONFIG[badge.rarity];

                  return (
                    <motion.div
                      key={badge.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ scale: 1.05 }}
                      className={cn(
                        'relative p-3 rounded-xl border-2 text-center transition-all',
                        config.bg,
                        isEarned ? config.border : 'border-dashed border-muted-foreground/30',
                        isEarned && config.glow
                      )}
                    >
                      {/* Effet de brillance pour les badges gagnés */}
                      {isEarned && badge.rarity === 'legendary' && (
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-200/30 to-transparent rounded-xl"
                          animate={{ x: ['-100%', '200%'] }}
                          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                        />
                      )}

                      {/* Icône du badge */}
                      <div className="relative">
                        <span 
                          className={cn(
                            'text-3xl block',
                            !isEarned && 'grayscale opacity-40'
                          )}
                        >
                          {badge.icon}
                        </span>
                        
                        {/* Indicateur de statut */}
                        {isEarned ? (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center"
                          >
                            <Check className="h-3 w-3 text-white" />
                          </motion.div>
                        ) : (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-muted rounded-full flex items-center justify-center">
                            <Lock className="h-3 w-3 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      {/* Nom du badge */}
                      <p className={cn(
                        'text-xs font-medium mt-2 line-clamp-2',
                        !isEarned && 'text-muted-foreground'
                      )}>
                        {badge.name}
                      </p>

                      {/* Progression si pas encore gagné */}
                      {!isEarned && (
                        <div className="mt-2">
                          <Progress value={progress} className="h-1" />
                          <p className="text-[10px] text-muted-foreground mt-1">
                            {Math.round(progress)}%
                          </p>
                        </div>
                      )}

                      {/* Ville associée */}
                      {badge.cityVibe && (
                        <Badge 
                          variant="outline" 
                          className="text-[10px] mt-1 px-1"
                        >
                          📍 {badge.cityVibe}
                        </Badge>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        ))}

        {/* Message d'encouragement */}
        {earnedCount < totalCount && (
          <div className="text-center py-4 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 inline mr-1" />
            Continue à gratter pour débloquer plus de badges !
          </div>
        )}
      </CardContent>
    </Card>
  );
};
