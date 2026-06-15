/**
 * ⭐ Modal de demande de notation app
 * - Design moderne et non-intrusif
 * - Options : Noter, Plus tard, Ne plus demander
 */

import { motion, AnimatePresence } from 'framer-motion';
import { Star, X, Heart, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppRating } from '@/hooks/useAppRating';
import { cn } from '@/lib/utils';

interface AppRatingPromptProps {
  onClose?: () => void;
}

export const AppRatingPrompt = ({ onClose }: AppRatingPromptProps) => {
  const {
    showPrompt,
    setShowPrompt,
    platform,
    requestInAppReview,
    deferRating,
    neverAskAgain
  } = useAppRating();

  const handleClose = () => {
    setShowPrompt(false);
    onClose?.();
  };

  const handleRate = async () => {
    await requestInAppReview();
    onClose?.();
  };

  const handleDefer = () => {
    deferRating();
    onClose?.();
  };

  const handleNeverAsk = () => {
    neverAskAgain();
    onClose?.();
  };

  const getStoreName = () => {
    switch (platform) {
      case 'ios':
        return 'App Store';
      case 'android':
        return 'Play Store';
      default:
        return 'Store';
    }
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-4 bottom-20 z-[101] mx-auto max-w-sm"
          >
            <div className="relative overflow-hidden rounded-3xl bg-card border border-border shadow-2xl">
              {/* Background decoration */}
              <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-yellow-400/20 via-orange-400/10 to-transparent" />
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-yellow-400/10 rounded-full blur-3xl" />

              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition-colors z-10"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>

              {/* Content */}
              <div className="relative p-6 pt-8">
                {/* Icon */}
                <div className="flex justify-center mb-4">
                  <motion.div
                    animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="relative"
                  >
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
                      <Heart className="h-10 w-10 text-white" fill="white" />
                    </div>
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute -top-1 -right-1"
                    >
                      <Sparkles className="h-6 w-6 text-yellow-500" />
                    </motion.div>
                  </motion.div>
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-center mb-2">
                  Vous aimez Tembea ?
                </h3>

                {/* Description */}
                <p className="text-muted-foreground text-center text-sm mb-6">
                  Votre avis nous aide à améliorer l'application pour mieux vous servir !
                </p>

                {/* Stars preview */}
                <div className="flex justify-center gap-1 mb-6">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <motion.div
                      key={star}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * star }}
                    >
                      <Star 
                        className="h-8 w-8 text-yellow-400" 
                        fill="#facc15"
                      />
                    </motion.div>
                  ))}
                </div>

                {/* Action buttons */}
                <div className="space-y-3">
                  <Button
                    onClick={handleRate}
                    className="w-full h-12 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-semibold shadow-lg shadow-orange-500/25"
                  >
                    <Star className="h-5 w-5 mr-2" fill="white" />
                    Noter sur {getStoreName()}
                  </Button>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleDefer}
                      variant="outline"
                      className="flex-1"
                    >
                      Plus tard
                    </Button>
                    <Button
                      onClick={handleNeverAsk}
                      variant="ghost"
                      className="flex-1 text-muted-foreground"
                    >
                      Ne plus demander
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AppRatingPrompt;
