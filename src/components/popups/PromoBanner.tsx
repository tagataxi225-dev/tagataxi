import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PromoBannerProps {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  onDismiss?: () => void;
  autoDismiss?: number;
  gradient?: string;
  icon?: React.ReactNode;
}

export const PromoBanner = ({
  message,
  actionLabel = 'Découvrir',
  onAction,
  onDismiss,
  autoDismiss = 10000,
  gradient = 'from-orange-500 to-red-500',
  icon
}: PromoBannerProps) => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    if (autoDismiss > 0) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, autoDismiss);
      return () => clearTimeout(timer);
    }
  }, [autoDismiss]);

  const handleDismiss = () => {
    setShow(false);
    onDismiss?.();
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed top-0 inset-x-0 z-50"
        >
          <div className={`bg-gradient-to-r ${gradient} text-white shadow-lg`}>
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-between h-14 gap-3">
                {/* Icon */}
                {icon && (
                  <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                    {icon}
                  </div>
                )}

                {/* Message */}
                <p className="flex-1 text-sm font-semibold truncate">
                  {message}
                </p>

                {/* Action Button */}
                {onAction && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="flex-shrink-0 h-8 text-xs font-bold bg-white/20 hover:bg-white/30 border-white/30"
                    onClick={onAction}
                  >
                    {actionLabel}
                    <ChevronRight className="w-3 h-3 ml-1" />
                  </Button>
                )}

                {/* Close Button */}
                <button
                  onClick={handleDismiss}
                  className="flex-shrink-0 w-8 h-8 flex items-center justify-center hover:bg-white/20 rounded-full transition-colors"
                  aria-label="Fermer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
