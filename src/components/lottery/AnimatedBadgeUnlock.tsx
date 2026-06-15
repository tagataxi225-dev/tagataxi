/**
 * 🎉 Animation de Déverrouillage de Badge
 * Overlay plein écran avec effets spectaculaires
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CongoleseBadge, BADGE_RARITY_CONFIG } from '@/types/congolese-badges';
import { useGrattaSound } from '@/hooks/useGrattaSound';
import confetti from 'canvas-confetti';

interface AnimatedBadgeUnlockProps {
  badge: CongoleseBadge | null;
  open: boolean;
  onClose: () => void;
}

export const AnimatedBadgeUnlock: React.FC<AnimatedBadgeUnlockProps> = ({
  badge,
  open,
  onClose
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const { playChingSound } = useGrattaSound();

  useEffect(() => {
    if (open && badge) {
      // Délai pour montrer les détails
      const detailsTimer = setTimeout(() => setShowDetails(true), 800);

      // Son de victoire
      playChingSound(badge.rarity === 'legendary' ? 'mega' : badge.rarity === 'epic' ? 'rare' : 'active');

      // Confetti pour badges rares+
      if (badge.rarity === 'legendary' || badge.rarity === 'epic') {
        const colors = badge.rarity === 'legendary' 
          ? ['#FFD700', '#FFA500', '#FF6B00'] 
          : ['#9333EA', '#A855F7', '#C084FC'];

        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors
        });

        // Deuxième salve
        setTimeout(() => {
          confetti({
            particleCount: 50,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors
          });
          confetti({
            particleCount: 50,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors
          });
        }, 300);
      }

      return () => clearTimeout(detailsTimer);
    } else {
      setShowDetails(false);
    }
  }, [open, badge, playChingSound]);

  if (!badge) return null;

  const config = BADGE_RARITY_CONFIG[badge.rarity];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md"
          onClick={onClose}
        >
          {/* Bouton fermer */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white hover:bg-white/20"
            onClick={onClose}
          >
            <X className="h-6 w-6" />
          </Button>

          {/* Contenu principal */}
          <motion.div
            initial={{ scale: 0.3, opacity: 0, rotate: -180 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: 'spring', damping: 15, stiffness: 200 }}
            className="relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Rayons de lumière */}
            <motion.div
              className="absolute inset-0 -z-10"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1.5 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  className={cn(
                    "absolute left-1/2 top-1/2 h-40 w-1 origin-bottom",
                    badge.rarity === 'legendary' ? 'bg-gradient-to-t from-yellow-500/60 to-transparent' :
                    badge.rarity === 'epic' ? 'bg-gradient-to-t from-purple-500/60 to-transparent' :
                    'bg-gradient-to-t from-blue-500/60 to-transparent'
                  )}
                  style={{ transform: `rotate(${i * 30}deg) translateY(-100%)` }}
                  initial={{ opacity: 0, scaleY: 0 }}
                  animate={{ opacity: 1, scaleY: 1 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                />
              ))}
            </motion.div>

            {/* Badge container */}
            <div className="flex flex-col items-center">
              {/* Titre "Badge Débloqué" */}
              <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mb-6 text-center"
              >
                <div className="flex items-center gap-2 justify-center mb-2">
                  <Sparkles className="h-5 w-5 text-yellow-400" />
                  <span className="text-yellow-400 text-sm font-medium uppercase tracking-wider">
                    Badge Débloqué !
                  </span>
                  <Sparkles className="h-5 w-5 text-yellow-400" />
                </div>
              </motion.div>

              {/* Badge principal */}
              <motion.div
                animate={{ 
                  scale: [1, 1.05, 1],
                  rotate: [0, 2, -2, 0]
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity, 
                  repeatDelay: 1 
                }}
                className={cn(
                  "relative w-40 h-40 rounded-3xl flex items-center justify-center",
                  "bg-gradient-to-br shadow-2xl",
                  badge.rarity === 'legendary' ? 'from-yellow-400 via-orange-500 to-red-500' :
                  badge.rarity === 'epic' ? 'from-purple-400 via-purple-500 to-purple-700' :
                  badge.rarity === 'rare' ? 'from-blue-400 via-blue-500 to-blue-600' :
                  'from-gray-300 via-gray-400 to-gray-500'
                )}
              >
                {/* Effet shimmer pour légendaire */}
                {badge.rarity === 'legendary' && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent rounded-3xl"
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                  />
                )}

                {/* Étoiles orbitantes pour epic+ */}
                {(badge.rarity === 'legendary' || badge.rarity === 'epic') && (
                  <>
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="absolute"
                        animate={{ rotate: 360 }}
                        transition={{ 
                          duration: 4 + i, 
                          repeat: Infinity, 
                          ease: 'linear' 
                        }}
                        style={{ 
                          width: 120 + i * 20, 
                          height: 120 + i * 20 
                        }}
                      >
                        <Star 
                          className="absolute -top-2 left-1/2 -translate-x-1/2 h-4 w-4 text-white fill-white" 
                        />
                      </motion.div>
                    ))}
                  </>
                )}

                <span className="text-7xl relative z-10">
                  {badge.icon}
                </span>
              </motion.div>

              {/* Détails du badge */}
              <AnimatePresence>
                {showDetails && (
                  <motion.div
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 30, opacity: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mt-8 text-center max-w-sm"
                  >
                    <h2 className="text-2xl font-bold text-white mb-2">
                      {badge.name}
                    </h2>
                    <p className="text-white/70 text-sm mb-4">
                      {badge.description}
                    </p>

                    {badge.cityVibe && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.3, type: 'spring' }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white/90 text-sm"
                      >
                        📍 {badge.cityVibe}
                      </motion.div>
                    )}

                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.4, type: 'spring' }}
                      className="mt-6"
                    >
                      <Button 
                        onClick={onClose}
                        className={cn(
                          "px-8 py-3 rounded-full font-semibold text-white",
                          badge.rarity === 'legendary' ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600' :
                          badge.rarity === 'epic' ? 'bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800' :
                          'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
                        )}
                      >
                        🎉 Super !
                      </Button>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
