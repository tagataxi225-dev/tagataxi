import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Clock, Sparkles, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import '@/styles/kwenda-gratta.css';

interface DailyCardBannerProps {
  available: boolean;
  nextCardAt: Date | null;
  onClaim: () => Promise<void>;
  loading?: boolean;
}

export const DailyCardBanner: React.FC<DailyCardBannerProps> = ({
  available,
  nextCardAt,
  onClaim,
  loading = false
}) => {
  const [claiming, setClaiming] = useState(false);
  const [countdown, setCountdown] = useState<string>('');

  // Calculer le compte à rebours
  useEffect(() => {
    if (!nextCardAt || available) {
      setCountdown('');
      return;
    }

    const updateCountdown = () => {
      const now = new Date();
      const diff = nextCardAt.getTime() - now.getTime();

      if (diff <= 0) {
        setCountdown('');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setCountdown(`${hours}h ${minutes}m ${seconds}s`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [nextCardAt, available]);

  const handleClaim = async () => {
    if (!available || claiming) return;
    
    setClaiming(true);
    try {
      await onClaim();
    } finally {
      setClaiming(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'daily-card-banner p-4 relative overflow-hidden',
        available && 'daily-card-pulse'
      )}
    >
      {/* Fond animé avec motifs wax */}
      <div className="absolute inset-0 african-totem-bg opacity-30" />
      
      {/* Effet de brillance animé */}
      {available && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
        />
      )}

      <div className="relative z-10 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <motion.div
            className={cn(
              'w-12 h-12 rounded-full flex items-center justify-center',
              available 
                ? 'bg-gradient-to-br from-yellow-400 to-orange-500' 
                : 'bg-muted'
            )}
            animate={available ? { 
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {available ? (
              <Gift className="h-6 w-6 text-white" />
            ) : (
              <Clock className="h-6 w-6 text-muted-foreground" />
            )}
          </motion.div>

          <div>
            <h3 className="font-bold text-sm flex items-center gap-2">
              {available ? (
                <>
                  <span>🎁 Ta carte du jour t'attend !</span>
                  <motion.span
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                  >
                    <Sparkles className="h-4 w-4 text-yellow-500" />
                  </motion.span>
                </>
              ) : (
                <span className="text-muted-foreground">Prochaine carte dans</span>
              )}
            </h3>
            <p className="text-xs text-muted-foreground">
              {available 
                ? 'Gratte et découvre ton bonus quotidien' 
                : countdown || 'Bientôt disponible'}
            </p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {available ? (
            <motion.div
              key="claim-btn"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <Button
                onClick={handleClaim}
                disabled={claiming || loading}
                className={cn(
                  'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600',
                  'text-white font-semibold shadow-lg',
                  'transition-all hover:scale-105'
                )}
              >
                {claiming ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <Sparkles className="h-4 w-4" />
                  </motion.div>
                ) : (
                  <>
                    Réclamer
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </>
                )}
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="countdown"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-right"
            >
              <div className="text-lg font-bold font-mono text-primary">
                {countdown}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Indicateurs tricolores RDC */}
      <div className="absolute bottom-0 left-0 right-0 h-1 flex">
        <div className="flex-1 bg-[hsl(var(--kwenda-blue))]" />
        <div className="flex-1 bg-[hsl(var(--kwenda-yellow))]" />
        <div className="flex-1 bg-[hsl(var(--kwenda-red))]" />
      </div>
    </motion.div>
  );
};
