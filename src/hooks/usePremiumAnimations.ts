/**
 * USE PREMIUM ANIMATIONS HOOK
 * Fournit des animations et micro-interactions premium
 * Respecte les préférences utilisateur (reduced-motion)
 */

import { useCallback, useMemo } from 'react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

// Types d'animations
export type AnimationType = 
  | 'fadeUp' 
  | 'fadeIn' 
  | 'scale' 
  | 'slideLeft' 
  | 'slideRight' 
  | 'slideUp' 
  | 'slideDown'
  | 'bounce';

// Configuration des animations
export const premiumTransitions = {
  // Courbes d'easing premium
  easing: {
    standard: [0.25, 0.1, 0.25, 1],      // CSS ease-out optimisé
    decelerate: [0, 0, 0.2, 1],           // Décélération naturelle
    accelerate: [0.4, 0, 1, 1],           // Accélération
    spring: [0.68, -0.55, 0.265, 1.55],   // Effet ressort
    smooth: [0.4, 0, 0.2, 1]              // Ultra fluide
  },
  
  // Durées optimisées
  duration: {
    instant: 100,
    fast: 150,
    normal: 250,
    slow: 400,
    dramatic: 600
  },
  
  // Délais pour stagger
  stagger: {
    tight: 30,
    normal: 50,
    loose: 80
  }
} as const;

// Variants Framer Motion pré-configurés
export const motionVariants = {
  fadeUp: {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 }
  },
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  },
  scale: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 }
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
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  },
  slideDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 }
  },
  bounce: {
    initial: { opacity: 0, scale: 0.3 },
    animate: { 
      opacity: 1, 
      scale: 1,
      transition: { type: 'spring', stiffness: 500, damping: 25 }
    },
    exit: { opacity: 0, scale: 0.3 }
  }
} as const;

// Hook principal
export function usePremiumAnimations() {
  // Vérifier si les animations réduites sont préférées
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // Feedback haptique natif
  const triggerHaptic = useCallback(async (style: 'light' | 'medium' | 'heavy' = 'light') => {
    if (!Capacitor.isNativePlatform()) return;
    
    try {
      const impactStyle = {
        light: ImpactStyle.Light,
        medium: ImpactStyle.Medium,
        heavy: ImpactStyle.Heavy
      }[style];
      
      await Haptics.impact({ style: impactStyle });
    } catch (error) {
      // Ignorer les erreurs de haptic
    }
  }, []);

  // Obtenir les props d'animation pour un type donné
  const getAnimationProps = useCallback((
    type: AnimationType,
    options?: {
      delay?: number;
      duration?: keyof typeof premiumTransitions.duration;
      disabled?: boolean;
    }
  ) => {
    if (prefersReducedMotion || options?.disabled) {
      return {
        initial: { opacity: 1 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.1 }
      };
    }

    const variant = motionVariants[type];
    const duration = premiumTransitions.duration[options?.duration || 'normal'] / 1000;

    return {
      ...variant,
      transition: {
        duration,
        ease: premiumTransitions.easing.standard,
        delay: options?.delay || 0
      }
    };
  }, [prefersReducedMotion]);

  // Props pour hover/tap interactifs
  const getInteractiveProps = useCallback((options?: {
    scale?: number;
    disabled?: boolean;
  }) => {
    if (prefersReducedMotion || options?.disabled) {
      return {};
    }

    const hoverScale = options?.scale || 1.02;
    const tapScale = 0.98;

    return {
      whileHover: { scale: hoverScale, y: -2 },
      whileTap: { scale: tapScale },
      transition: { 
        type: 'spring', 
        stiffness: 400, 
        damping: 25 
      }
    };
  }, [prefersReducedMotion]);

  // Générer des props de stagger pour listes
  const getStaggerProps = useCallback((index: number, options?: {
    baseDelay?: number;
    stagger?: keyof typeof premiumTransitions.stagger;
  }) => {
    if (prefersReducedMotion) {
      return { transition: { duration: 0.1 } };
    }

    const staggerDelay = premiumTransitions.stagger[options?.stagger || 'normal'];
    const baseDelay = options?.baseDelay || 0;

    return {
      transition: {
        duration: premiumTransitions.duration.normal / 1000,
        ease: premiumTransitions.easing.standard,
        delay: baseDelay + (index * staggerDelay) / 1000
      }
    };
  }, [prefersReducedMotion]);

  return {
    prefersReducedMotion,
    triggerHaptic,
    getAnimationProps,
    getInteractiveProps,
    getStaggerProps,
    motionVariants,
    transitions: premiumTransitions
  };
}

export default usePremiumAnimations;
