import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Car, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface CancellationNotificationProps {
  isOpen: boolean;
  onClose: () => void;
  onNewRide: () => void;
}

export const CancellationNotification = ({ 
  isOpen, 
  onClose, 
  onNewRide 
}: CancellationNotificationProps) => {
  const { t } = useLanguage();
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md"
        >
          <div className="bg-card border border-border rounded-xl shadow-2xl p-4">
            <div className="flex items-start gap-3">
              {/* Icône animée */}
              <motion.div
                animate={{ 
                  y: [0, -5, 0],
                  rotate: [0, -5, 5, 0] 
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
                className="bg-primary/10 p-2 rounded-lg shrink-0"
              >
                <Car className="h-6 w-6 text-primary" />
              </motion.div>
              
              {/* Contenu */}
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1">
                  {t('transport.booking_cancelled')}
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {t('transport.rebook_prompt')}
                </p>
                
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    onClick={onNewRide}
                    className="flex-1"
                  >
                    <Car className="h-4 w-4 mr-2" />
                    {t('transport.new_ride_button')}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={onClose}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
