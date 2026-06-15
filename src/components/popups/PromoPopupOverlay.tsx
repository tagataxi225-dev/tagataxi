import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePromoPopup } from '@/hooks/usePromoPopup';

export const PromoPopupOverlay = () => {
  const { popup, isOpen, dismiss } = usePromoPopup();

  if (!popup) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-6"
          onClick={dismiss}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Card */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="relative w-full max-w-sm bg-card rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Hero Image */}
            <div className="w-full aspect-[4/3] overflow-hidden">
              <img
                src={popup.image_url}
                alt={popup.title}
                className="w-full h-full object-cover"
                loading="eager"
              />
            </div>

            {/* Content */}
            <div className="p-5 space-y-3 text-center">
              <h3 className="text-xl font-bold text-foreground leading-tight">
                {popup.title}
              </h3>
              {popup.description && (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {popup.description}
                </p>
              )}
              <Button
                onClick={dismiss}
                className="w-full h-12 text-base font-semibold rounded-xl"
                variant="congo"
              >
                {popup.cta_text || 'Découvrir'}
              </Button>
            </div>

            {/* Close button */}
            <button
              onClick={dismiss}
              className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
              aria-label="Fermer"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>

          {/* Bottom X circle (Yango style) */}
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.2 }}
            onClick={dismiss}
            className="absolute bottom-8 w-12 h-12 flex items-center justify-center rounded-full border-2 border-white/60 text-white hover:bg-white/20 transition-colors"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
