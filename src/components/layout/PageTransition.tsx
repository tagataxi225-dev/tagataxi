/**
 * PAGE TRANSITION COMPONENT - Premium UX
 * Transitions fluides entre pages avec support de direction
 */

import { ReactNode, useMemo } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { cn } from '@/lib/utils';

type TransitionType = 'fade' | 'slideLeft' | 'slideRight' | 'slideUp' | 'slideDown' | 'scale';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
  type?: TransitionType;
  duration?: number;
  delay?: number;
}

// Variants optimisés pour 60fps
const transitionVariants: Record<TransitionType, Variants> = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  },
  slideLeft: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  },
  slideRight: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 }
  },
  slideUp: {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 }
  },
  slideDown: {
    initial: { opacity: 0, y: -16 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 8 }
  },
  scale: {
    initial: { opacity: 0, scale: 0.98 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.98 }
  }
};

export const PageTransition = ({ 
  children, 
  className,
  type = 'slideUp',
  duration = 0.25,
  delay = 0
}: PageTransitionProps) => {
  const variants = transitionVariants[type];
  
  // Vérifier les préférences de reduced motion
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  if (prefersReducedMotion) {
    return (
      <div className={cn("w-full", className)}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      className={cn("w-full", className)}
      initial="initial"
      animate="animate"
      exit="exit"
      variants={variants}
      transition={{
        duration,
        delay,
        ease: [0.25, 0.1, 0.25, 1] // Easing premium
      }}
      style={{
        willChange: 'transform, opacity',
        transform: 'translateZ(0)' // Force GPU
      }}
    >
      {children}
    </motion.div>
  );
};

// Version avec AnimatePresence pour routing
interface AnimatedPageProps {
  children: ReactNode;
  className?: string;
  pageKey: string;
  type?: TransitionType;
}

export const AnimatedPage = ({ 
  children, 
  className, 
  pageKey,
  type = 'slideUp' 
}: AnimatedPageProps) => {
  return (
    <AnimatePresence mode="wait">
      <PageTransition key={pageKey} className={className} type={type}>
        {children}
      </PageTransition>
    </AnimatePresence>
  );
};

export default PageTransition;