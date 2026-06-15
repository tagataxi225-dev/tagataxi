import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Car, Gift } from 'lucide-react';
import { WinsGalleryGrid } from './WinsGalleryGrid';
import { TombolaHeader } from './TombolaHeader';
import { ProgressRoad } from './ProgressRoad';
import { useKwendaGratta } from '@/hooks/useKwendaGratta';
import { useScratchProgress } from '@/hooks/useScratchProgress';
import { Button } from '@/components/ui/button';

export interface KwendaGrattaDashboardProps {
  hideHeader?: boolean;
}

export const KwendaGrattaDashboard: React.FC<KwendaGrattaDashboardProps> = ({ 
  hideHeader = false 
}) => {
  const {
    cards,
    loading: cardsLoading,
    canClaimDailyCard,
    isFirstTime,
    claimDailyCard,
    scratchCard,
    revealCard,
  } = useKwendaGratta();

  const { progress, loading: progressLoading } = useScratchProgress();

  const [claiming, setClaiming] = useState(false);

  // Première visite: claim automatique
  useEffect(() => {
    const hasVisited = localStorage.getItem('kwenda_gratta_visited');
    
    if (!hasVisited && !cardsLoading && isFirstTime && canClaimDailyCard) {
      localStorage.setItem('kwenda_gratta_visited', 'true');
      handleClaimDaily();
    }
  }, [cardsLoading, isFirstTime, canClaimDailyCard]);

  const handleClaimDaily = async () => {
    setClaiming(true);
    try {
      await claimDailyCard();
    } finally {
      setClaiming(false);
    }
  };

  const loading = cardsLoading || progressLoading;

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <Sparkles className="h-8 w-8 text-primary" />
        </motion.div>
      </div>
    );
  }

  const unscratchedCount = cards.filter(c => !c.scratch_revealed_at && c.scratch_percentage < 50).length;

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col pb-20">
      {/* Header avec total des gains */}
      {!hideHeader && (
        <div className="px-4 pt-4">
          <TombolaHeader 
            totalWinnings={progress.totalWinnings}
            currency={progress.currency}
          />
        </div>
      )}

      {/* Progress Road */}
      <div className="mt-4">
        <ProgressRoad
          steps={progress.steps}
          actionsRemaining={progress.actionsRemaining}
          percentage={progress.percentage}
        />
      </div>

      {/* Bouton carte du jour */}
      {canClaimDailyCard && (
        <div className="px-4 py-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            <Button
              onClick={handleClaimDaily}
              disabled={claiming}
              className="w-full py-6 text-base font-semibold rounded-2xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg"
            >
              <Gift className="h-5 w-5 mr-2" />
              {claiming ? 'Chargement...' : '🎁 Récupérer ma carte du jour'}
            </Button>
          </motion.div>
        </div>
      )}

      {/* Message quand aucune carte disponible */}
      {unscratchedCount === 0 && !canClaimDailyCard && (
        <div className="px-4 py-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-sm border border-border p-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center flex-shrink-0">
                <Car className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <h2 className="text-base font-semibold text-foreground">
                  Continue d'utiliser Tembea !
                </h2>
                <p className="text-sm text-muted-foreground">
                  Plus que <span className="text-primary font-semibold">{progress.actionsRemaining}</span> actions pour ta prochaine carte
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Wins Gallery Grid - grattage direct inline */}
      <WinsGalleryGrid 
        wins={cards as any[]}
        className="mt-2"
        onScratch={scratchCard}
        onReveal={revealCard}
      />
    </div>
  );
};
