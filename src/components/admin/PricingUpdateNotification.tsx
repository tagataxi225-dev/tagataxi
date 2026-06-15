import { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PricingUpdateNotificationProps {
  lastUpdate?: Date;
}

export const PricingUpdateNotification = ({ lastUpdate }: PricingUpdateNotificationProps) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (lastUpdate) {
      setShow(true);
      const timer = setTimeout(() => setShow(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [lastUpdate]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-4 right-4 z-50"
        >
          <Alert className="bg-primary/10 border-primary/20 text-primary">
            <Bell className="h-4 w-4" />
            <AlertDescription className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Tarifs mis à jour et synchronisés sur l'application client
            </AlertDescription>
          </Alert>
        </motion.div>
      )}
    </AnimatePresence>
  );
};