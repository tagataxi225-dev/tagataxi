import * as React from 'react';
import { motion, AnimatePresence, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';

interface FluidBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  maxHeight?: string;
  dismissible?: boolean;
  showHandle?: boolean;
}

export const FluidBottomSheet: React.FC<FluidBottomSheetProps> = ({
  isOpen,
  onClose,
  children,
  className,
  maxHeight = '85vh',
  dismissible = true,
  showHandle = true
}) => {
  const y = useMotionValue(0);
  const opacity = useTransform(y, [0, 200], [1, 0.5]);
  const backdropOpacity = useTransform(y, [0, 200], [0.5, 0]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (dismissible && info.velocity.y > 300) {
      onClose();
    } else if (dismissible && info.offset.y > 150) {
      onClose();
    } else {
      // Snap back
      y.set(0);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ opacity: backdropOpacity }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={dismissible ? onClose : undefined}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{
              type: 'spring',
              damping: 30,
              stiffness: 300,
              mass: 0.8
            }}
            drag={dismissible ? 'y' : false}
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            style={{ y, opacity }}
            className={cn(
              'fixed bottom-0 left-0 right-0 z-50',
              'bg-background rounded-t-3xl shadow-2xl',
              'touch-pan-y',
              className
            )}
          >
            {/* Handle bar */}
            {showHandle && (
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full" />
              </div>
            )}

            {/* Content */}
            <div
              className="overflow-y-auto overscroll-contain"
              style={{ maxHeight }}
            >
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default FluidBottomSheet;
