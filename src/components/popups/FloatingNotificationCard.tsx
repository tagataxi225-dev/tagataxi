import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Package, Flame, Zap, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

type NotificationType = 'product_added' | 'order_confirmed' | 'promo_available' | 'delivery_flash';

interface FloatingNotificationCardProps {
  show: boolean;
  type: NotificationType;
  message: string;
  onClose: () => void;
  actionLabel?: string;
  onAction?: () => void;
  autoDismiss?: number;
}

const iconMap = {
  product_added: CheckCircle,
  order_confirmed: Package,
  promo_available: Flame,
  delivery_flash: Zap,
};

const colorMap = {
  product_added: 'text-green-600',
  order_confirmed: 'text-primary',
  promo_available: 'text-orange-600',
  delivery_flash: 'text-[#F4B223]',
};

export const FloatingNotificationCard = ({
  show,
  type,
  message,
  onClose,
  actionLabel,
  onAction,
  autoDismiss = 3000
}: FloatingNotificationCardProps) => {
  const Icon = iconMap[type];

  useEffect(() => {
    if (show && autoDismiss > 0) {
      const timer = setTimeout(onClose, autoDismiss);
      return () => clearTimeout(timer);
    }
  }, [show, autoDismiss, onClose]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed top-1/3 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-sm"
        >
          <div className="bg-card/95 backdrop-blur-md border border-border/20 shadow-xl rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <Icon className={`w-6 h-6 flex-shrink-0 ${colorMap[type]}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{message}</p>
                {actionLabel && onAction && (
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 mt-1 font-semibold"
                    onClick={() => {
                      onAction();
                      onClose();
                    }}
                  >
                    {actionLabel}
                  </Button>
                )}
              </div>
              <button
                onClick={onClose}
                className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
