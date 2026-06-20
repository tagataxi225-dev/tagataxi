import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Smartphone } from 'lucide-react';
import { isMobileApp } from '@/services/platformDetection';

const DISMISS_KEY = 'taga-top-banner-dismissed';
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 jours

export const AppDownloadTopBanner = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Ne pas afficher dans l'app Capacitor native
    if (isMobileApp()) {
      setIsVisible(false);
      return;
    }

    // Afficher UNIQUEMENT sur la landing page "/"
    if (window.location.pathname !== '/' && window.location.pathname !== '/landing') {
      setIsVisible(false);
      return;
    }

    // Vérifier si le banner a été fermé récemment
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt) {
      const elapsed = Date.now() - parseInt(dismissedAt);
      if (elapsed < DISMISS_DURATION) {
        setIsVisible(false);
        return;
      }
    }

    // Afficher le banner
    setIsVisible(true);
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed top-0 left-0 right-0 z-[9999] w-full bg-primary text-primary-foreground"
        >
          <div className="mx-auto w-full max-w-5xl px-3 sm:px-4">
            <div className="flex items-center gap-2 sm:gap-3 py-2 min-w-0">
              {/* Icône (masquée sur mobile pour gagner de la place) */}
              <div className="hidden sm:flex items-center justify-center w-8 h-8 rounded-full bg-white/10 shrink-0">
                <Smartphone className="w-4 h-4" />
              </div>

              {/* Contenu */}
              <div className="flex-1 min-w-0">
                <p className="text-[13px] sm:text-sm font-medium truncate">
                  📱 L'app TAGA arrive bientôt
                </p>
              </div>

              {/* Badge "Bientôt" (pas de lien tant que l'app n'est pas publiée) */}
              <span className="shrink-0 inline-flex items-center px-2.5 py-1 bg-white/15 text-white text-xs font-semibold rounded-lg select-none">
                Bientôt
              </span>

              {/* Bouton fermer — zone tactile suffisante, fiable sur mobile */}
              <button
                type="button"
                onClick={handleDismiss}
                onTouchEnd={(e) => { e.preventDefault(); handleDismiss(); }}
                aria-label="Fermer la bannière"
                style={{ touchAction: 'manipulation' }}
                className="shrink-0 flex items-center justify-center h-9 w-9 -mr-1 rounded-full text-white/80 hover:text-white hover:bg-white/15 active:bg-white/25 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
