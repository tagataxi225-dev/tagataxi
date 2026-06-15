import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PromoSlider } from './MarketplacePromoSlider';

interface AutoHideMarketplacePromoSliderProps {
  onPromoClick?: (action: string) => void;
  autoplayDelay?: number;
}

/**
 * Slider auto-hide pour marketplace
 * - Affiche PromoSlider pendant 6 secondes
 * - Animation slide-up + fade-out
 * - Bouton de réaffichage après disparition
 */
export const AutoHideMarketplacePromoSlider = ({ 
  onPromoClick,
  autoplayDelay = 5000 
}: AutoHideMarketplacePromoSliderProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);

  // Auto-hide après 12 secondes (animation douce)
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 12000);
    
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
  };

  const handleReshow = () => {
    setIsVisible(true);
    setIsDismissed(false);
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {isVisible && (
          <motion.div
            initial={{ opacity: 1, height: 'auto', marginBottom: '0.75rem' }}
            exit={{ 
              opacity: 0, 
              height: 0,
              marginBottom: 0,
              paddingTop: 0,
              paddingBottom: 0,
              transition: { 
                // Animation séquencée ultra-smooth (1.5s total)
                opacity: { 
                  duration: 0.6, 
                  ease: [0.32, 0.72, 0, 1] 
                },
                height: { 
                  duration: 1.2, 
                  ease: [0.32, 0.72, 0, 1], 
                  delay: 0.3 
                },
                marginBottom: { 
                  duration: 1.2, 
                  ease: [0.32, 0.72, 0, 1], 
                  delay: 0.3 
                },
                paddingTop: { 
                  duration: 1.2, 
                  ease: [0.32, 0.72, 0, 1], 
                  delay: 0.3 
                },
                paddingBottom: { 
                  duration: 1.2, 
                  ease: [0.32, 0.72, 0, 1], 
                  delay: 0.3 
                }
              }
            }}
            className="relative"
          >
            <PromoSlider 
              onPromoClick={onPromoClick}
              autoplayDelay={autoplayDelay}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bouton de réaffichage - Soft style */}
      {!isVisible && !isDismissed && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.4,
            ease: [0.16, 1, 0.3, 1],
            delay: 0.1
          }}
          className="mb-3 px-4"
        >
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleReshow}
            className="w-full bg-muted/40 hover:bg-muted/60 border border-border/40 rounded-2xl text-muted-foreground hover:text-foreground transition-all duration-200"
          >
            <div className="w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-950/50 flex items-center justify-center mr-2">
              <Sparkles className="h-3.5 w-3.5 text-violet-500" />
            </div>
            Voir les promotions
          </Button>
        </motion.div>
      )}
    </>
  );
};
