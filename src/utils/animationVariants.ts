/**
 * 🎬 ANIMATION VARIANTS RÉUTILISABLES
 * Centralise toutes les animations Framer Motion pour réduire l'overhead
 */

import { Variants } from 'framer-motion';

// Card animations
export const cardVariants: Variants = {
  hidden: { 
    opacity: 0, 
    y: 20,
    transition: { duration: 0.2 }
  },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.25, ease: 'easeOut' }
  },
  exit: { 
    opacity: 0, 
    scale: 0.95,
    transition: { duration: 0.15 }
  }
};

// Fade animations
export const fadeInVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.2 }
  }
};

export const fadeInUpVariants: Variants = {
  hidden: { 
    opacity: 0, 
    y: 10 
  },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.25, ease: 'easeOut' }
  }
};

// Scale animations
export const scaleVariants: Variants = {
  hidden: { 
    scale: 0.95, 
    opacity: 0 
  },
  visible: { 
    scale: 1, 
    opacity: 1,
    transition: { duration: 0.2, ease: 'easeOut' }
  }
};

// Slide animations
export const slideInRightVariants: Variants = {
  hidden: { 
    x: '100%',
    opacity: 0
  },
  visible: { 
    x: 0,
    opacity: 1,
    transition: { duration: 0.3, ease: 'easeOut' }
  },
  exit: {
    x: '100%',
    opacity: 0,
    transition: { duration: 0.2 }
  }
};

export const slideInLeftVariants: Variants = {
  hidden: { 
    x: '-100%',
    opacity: 0
  },
  visible: { 
    x: 0,
    opacity: 1,
    transition: { duration: 0.3, ease: 'easeOut' }
  },
  exit: {
    x: '-100%',
    opacity: 0,
    transition: { duration: 0.2 }
  }
};

// Stagger container
export const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1
    }
  }
};

// Badge/Badge counter animation
export const badgeVariants: Variants = {
  hidden: { 
    scale: 0,
    opacity: 0 
  },
  visible: { 
    scale: 1,
    opacity: 1,
    transition: { 
      type: 'spring',
      stiffness: 500,
      damping: 30
    }
  }
};

// Modal/Dialog animations
export const modalVariants: Variants = {
  hidden: { 
    opacity: 0,
    scale: 0.95,
    y: 20
  },
  visible: { 
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { 
      duration: 0.2,
      ease: 'easeOut'
    }
  },
  exit: { 
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: { 
      duration: 0.15
    }
  }
};

// Button hover/tap animations
export const buttonVariants = {
  hover: { scale: 1.05 },
  tap: { scale: 0.95 }
};

/**
 * Vérifie si les animations doivent être désactivées
 */
export const shouldReduceMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  return mediaQuery.matches;
};

/**
 * Obtient les variants appropriés selon les préférences
 */
export const getResponsiveVariants = (variants: Variants): Variants | false => {
  return shouldReduceMotion() ? false : variants;
};
