import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti';
import { Rarity, RARITY_CONFIG, ScratchCardPrize } from '@/types/scratch-card';
import { Sparkles, Gift } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { SuccessConfetti } from '@/components/wallet/SuccessConfetti';

interface PrizeRevealAnimationProps {
  show: boolean;
  prize: ScratchCardPrize;
  onComplete: () => void;
}

export const PrizeRevealAnimation: React.FC<PrizeRevealAnimationProps> = ({
  show,
  prize,
  onComplete
}) => {
  const config = RARITY_CONFIG[prize.rarity];

  useEffect(() => {
    if (!show) return;

    // Vibration pattern based on rarity
    if ('vibrate' in navigator) {
      const patterns: Record<Rarity, number[]> = {
        common: [50],
        rare: [100, 50, 100],
        epic: [100, 50, 100, 50, 150],
        legendary: [100, 50, 100, 50, 200, 50, 200]
      };
      navigator.vibrate(patterns[prize.rarity]);
    }

    // Auto-complete after animation
    const timer = setTimeout(() => {
      onComplete();
    }, 4000);

    return () => clearTimeout(timer);
  }, [show, prize.rarity, onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Confetti effect */}
          {config.confetti > 0 && (
            <SuccessConfetti show={true} onComplete={() => {}} />
          )}

          {/* Prize reveal overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0, rotateY: -180 }}
              animate={{ 
                scale: 1, 
                opacity: 1, 
                rotateY: 0,
              }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: 'spring', duration: 0.6 }}
              className={`relative bg-gradient-to-br ${config.bgGradient} backdrop-blur-md border-2 rounded-2xl p-8 text-center max-w-sm w-full`}
              style={{ 
                borderColor: config.color,
                boxShadow: `0 0 40px ${config.glowColor}`
              }}
            >
              {/* Sparkles */}
              {Array.from({ length: config.sparkles }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ 
                    opacity: 0, 
                    scale: 0,
                    x: 0,
                    y: 0
                  }}
                  animate={{ 
                    opacity: [0, 1, 0],
                    scale: [0, 1.5, 0],
                    x: (Math.random() - 0.5) * 200,
                    y: (Math.random() - 0.5) * 200
                  }}
                  transition={{
                    duration: 1.5,
                    delay: Math.random() * 0.5,
                    repeat: Infinity,
                    repeatDelay: Math.random() * 2
                  }}
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                >
                  <Sparkles size={16} style={{ color: config.color }} />
                </motion.div>
              ))}

              {/* Rarity badge */}
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Badge 
                  variant="outline" 
                  className="mb-4"
                  style={{ 
                    borderColor: config.color,
                    color: config.color
                  }}
                >
                  {config.label}
                </Badge>
              </motion.div>

              {/* Prize icon */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ 
                  type: 'spring',
                  delay: 0.3,
                  duration: 0.6
                }}
                className="text-6xl mb-4"
              >
                {prize.image_url || <Gift size={64} style={{ color: config.color }} className="mx-auto" />}
              </motion.div>

              {/* Prize name */}
              <motion.h3
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-2xl font-bold mb-2"
                style={{ color: config.color }}
              >
                Félicitations ! 🎉
              </motion.h3>

              {/* Prize value */}
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-4xl font-bold mb-2"
                style={{ color: config.color }}
              >
                {prize.name}
              </motion.p>

              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-lg text-muted-foreground"
              >
                {prize.reward_type === 'cash' ? `${prize.value} ${prize.currency}` : 
                 prize.reward_type === 'points' ? `${prize.value} points` :
                 'Cadeau physique'}
              </motion.p>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
