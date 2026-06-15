import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimationController } from '@/services/AnimationController';

interface SmoothTransitionWrapperProps {
  children: ReactNode;
  isLoading: boolean;
  loadingComponent: ReactNode;
  onTransitionComplete?: () => void;
}

/**
 * ⚡ WRAPPER DE TRANSITION INVISIBLE
 * Crossfade parfait sans délai ni flash blanc
 * Optimisé pour transitions instantanées
 */
export const SmoothTransitionWrapper = ({
  children,
  isLoading,
  loadingComponent,
  onTransitionComplete,
}: SmoothTransitionWrapperProps) => {
  const animConfig = AnimationController.getRecommendedConfig();

  return (
    <div className="relative w-full h-full">
      <AnimatePresence mode="wait" onExitComplete={onTransitionComplete}>
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute inset-0 z-50"
          >
            {loadingComponent}
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={false}
            animate={{ opacity: 1 }}
            className="w-full h-full"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
