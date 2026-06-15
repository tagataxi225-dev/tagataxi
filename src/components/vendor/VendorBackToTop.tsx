import React, { useState, useEffect, useCallback } from 'react';
import { ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';

interface VendorBackToTopProps {
  scrollContainerRef: React.RefObject<HTMLDivElement>;
  showAfter?: number;
}

export const VendorBackToTop: React.FC<VendorBackToTopProps> = ({
  scrollContainerRef,
  showAfter = 200,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setIsVisible(container.scrollTop > showAfter);
          ticking = false;
        });
        ticking = true;
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => container.removeEventListener('scroll', handleScroll);
  }, [scrollContainerRef, showAfter]);

  const scrollToTop = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    container.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' });
  }, [scrollContainerRef]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 8 }}
          transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
          onClick={scrollToTop}
          className={`fixed right-4 z-30 h-10 w-10 rounded-full flex items-center justify-center
            bg-background/90 backdrop-blur-sm border border-border/60 shadow-md
            text-foreground hover:bg-muted/80 active:scale-95 transition-colors
            ${isMobile ? 'bottom-24' : 'bottom-6'}`}
          aria-label="Retour en haut"
        >
          <ChevronUp className="h-5 w-5" />
        </motion.button>
      )}
    </AnimatePresence>
  );
};
