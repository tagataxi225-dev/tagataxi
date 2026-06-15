import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { isMobileApp } from '@/services/platformDetection';
import { PLAY_STORE_URL, APP_STORE_URL, getDevicePlatform } from '@/components/store/StoreButtons';

const DISMISS_KEY = 'kwenda-top-banner-dismissed';
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
          className="fixed top-0 left-0 right-0 z-[9999] bg-primary text-primary-foreground"
        >
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between gap-4 py-2.5">
              {/* Icône */}
              <div className="hidden sm:flex items-center justify-center w-8 h-8 rounded-full bg-white/10">
                <Smartphone className="w-4 h-4" />
              </div>

              {/* Contenu */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  📱 Téléchargez Tembea sur {getDevicePlatform() === 'ios' ? 'App Store' : 'Play Store'}
                </p>
              </div>

              {/* CTA Button */}
              <a
                href={getDevicePlatform() === 'ios' ? APP_STORE_URL : PLAY_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-black text-white text-xs font-medium rounded-lg hover:bg-gray-800 transition-colors"
              >
                Télécharger
              </a>

              {/* Bouton fermer */}
              <Button
                onClick={handleDismiss}
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
