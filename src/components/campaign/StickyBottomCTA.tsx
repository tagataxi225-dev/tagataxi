import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Zap, X } from 'lucide-react';
import { useCountdown } from '@/hooks/useCountdown';

interface StickyBottomCTAProps {
  targetDate: Date | null;
  onCtaClick: () => void;
  ctaText: string;
  campaignColors: {
    primary: string;
    accent: string;
  };
}

export const StickyBottomCTA: React.FC<StickyBottomCTAProps> = ({
  targetDate,
  onCtaClick,
  ctaText,
  campaignColors
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const { hours, minutes, isExpired } = useCountdown(targetDate);

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY;
      setIsVisible(scrolled > 500 && !isDismissed);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isDismissed]);

  if (isExpired) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
          style={{
            background: `linear-gradient(135deg, ${campaignColors.primary}, ${campaignColors.accent})`
          }}
        >
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-white flex-1">
                <Zap className="h-5 w-5 animate-pulse" />
                <div className="text-sm">
                  <p className="font-bold">Offre expire dans</p>
                  <p className="text-xs opacity-90">
                    {hours}h {minutes}min
                  </p>
                </div>
              </div>

              <Button
                size="sm"
                onClick={onCtaClick}
                className="bg-white text-foreground hover:bg-white/90 font-bold shadow-lg"
              >
                {ctaText}
              </Button>

              <button
                onClick={() => setIsDismissed(true)}
                className="text-white/80 hover:text-white p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
