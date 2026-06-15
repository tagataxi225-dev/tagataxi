import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSmartTips } from '@/hooks/useSmartTips';

type TipPosition = 'top' | 'bottom' | 'left' | 'right';

interface SmartTipProps {
  tipId: string;
  message: string;
  position?: TipPosition;
  targetSelector?: string;
  delay?: number;
}

export const SmartTip = ({
  tipId,
  message,
  position = 'bottom',
  targetSelector,
  delay = 500
}: SmartTipProps) => {
  const { shouldShowTip, markTipAsShown } = useSmartTips();
  const [show, setShow] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!shouldShowTip(tipId)) return;

    const timer = setTimeout(() => {
      if (targetSelector) {
        const element = document.querySelector(targetSelector);
        if (element) {
          const rect = element.getBoundingClientRect();
          let top = 0;
          let left = 0;

          switch (position) {
            case 'bottom':
              top = rect.bottom + 12;
              left = rect.left + rect.width / 2;
              break;
            case 'top':
              top = rect.top - 12;
              left = rect.left + rect.width / 2;
              break;
            case 'left':
              top = rect.top + rect.height / 2;
              left = rect.left - 12;
              break;
            case 'right':
              top = rect.top + rect.height / 2;
              left = rect.right + 12;
              break;
          }

          setCoords({ top, left });
        }
      }
      setShow(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [tipId, shouldShowTip, targetSelector, position, delay]);

  const handleDismiss = () => {
    markTipAsShown(tipId);
    setShow(false);
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom':
        return '-translate-x-1/2';
      case 'top':
        return '-translate-x-1/2 -translate-y-full';
      case 'left':
        return '-translate-y-1/2 -translate-x-full';
      case 'right':
        return '-translate-y-1/2';
      default:
        return '';
    }
  };

  const getArrowClasses = () => {
    const base = 'absolute w-0 h-0 border-solid';
    switch (position) {
      case 'bottom':
        return `${base} border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-[#F4B223]/10 -top-2 left-1/2 -translate-x-1/2`;
      case 'top':
        return `${base} border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-[#F4B223]/10 -bottom-2 left-1/2 -translate-x-1/2`;
      case 'left':
        return `${base} border-t-8 border-b-8 border-l-8 border-t-transparent border-b-transparent border-l-[#F4B223]/10 -right-2 top-1/2 -translate-y-1/2`;
      case 'right':
        return `${base} border-t-8 border-b-8 border-r-8 border-t-transparent border-b-transparent border-r-[#F4B223]/10 -left-2 top-1/2 -translate-y-1/2`;
      default:
        return '';
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2 }}
          className={`fixed z-[100] ${getPositionClasses()}`}
          style={{ top: coords.top, left: coords.left }}
        >
          <div className="relative max-w-xs bg-[#F4B223]/10 border-2 border-[#F4B223] rounded-xl p-4 shadow-lg animate-bounce-subtle">
            {/* Arrow */}
            <div className={getArrowClasses()} />
            
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-[#F4B223] flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{message}</p>
              </div>
              <button
                onClick={handleDismiss}
                className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <Button
              size="sm"
              variant="ghost"
              className="w-full mt-2 text-xs font-semibold text-[#F4B223] hover:bg-[#F4B223]/20"
              onClick={handleDismiss}
            >
              Compris !
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
