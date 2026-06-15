/**
 * USE ANIMATED VALUE HOOK
 * Anime les changements de valeurs numériques de façon fluide
 * Idéal pour: prix, compteurs, distances, pourcentages
 */

import { useEffect, useState, useRef, useCallback } from 'react';

interface AnimationConfig {
  duration?: number;
  easing?: (t: number) => number;
  precision?: number;
}

// Fonctions d'easing optimisées
export const easings = {
  // Standard - polyvalent
  easeOutCubic: (t: number) => 1 - Math.pow(1 - t, 3),
  
  // Rapide au début - idéal pour prix
  easeOutExpo: (t: number) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
  
  // Doux - idéal pour compteurs
  easeInOutQuad: (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
  
  // Spring-like - idéal pour feedback visuel
  easeOutBack: (t: number) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
  
  // Linéaire
  linear: (t: number) => t
};

/**
 * Hook principal pour animer une valeur numérique
 */
export function useAnimatedValue(
  targetValue: number,
  config: AnimationConfig = {}
): number {
  const {
    duration = 300,
    easing = easings.easeOutCubic,
    precision = 0
  } = config;

  const [displayValue, setDisplayValue] = useState(targetValue);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const startValueRef = useRef<number>(targetValue);

  useEffect(() => {
    // Annuler l'animation précédente
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    const startValue = displayValue;
    const diff = targetValue - startValue;

    // Pas d'animation si la différence est négligeable
    if (Math.abs(diff) < 0.001) {
      setDisplayValue(targetValue);
      return;
    }

    startValueRef.current = startValue;
    startTimeRef.current = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easing(progress);
      
      const currentValue = startValueRef.current + diff * easedProgress;
      
      // Appliquer la précision
      const roundedValue = precision === 0 
        ? Math.round(currentValue)
        : Number(currentValue.toFixed(precision));
      
      setDisplayValue(roundedValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(targetValue);
        animationRef.current = null;
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [targetValue, duration, easing, precision]);

  return displayValue;
}

/**
 * Hook pour animer un prix avec formatage
 */
export function useAnimatedPrice(
  price: number,
  currency: string = 'CDF',
  duration: number = 400
): string {
  const animatedValue = useAnimatedValue(price, {
    duration,
    easing: easings.easeOutExpo,
    precision: 0
  });

  return `${animatedValue.toLocaleString('fr-FR')} ${currency}`;
}

/**
 * Hook pour animer un compteur
 */
export function useAnimatedCounter(
  count: number,
  duration: number = 300
): number {
  return useAnimatedValue(count, {
    duration,
    easing: easings.easeOutCubic,
    precision: 0
  });
}

/**
 * Hook pour animer une distance
 */
export function useAnimatedDistance(
  distanceKm: number,
  duration: number = 350
): string {
  const animatedValue = useAnimatedValue(distanceKm, {
    duration,
    easing: easings.easeOutCubic,
    precision: 1
  });

  return `${animatedValue} km`;
}

/**
 * Hook pour animer un pourcentage
 */
export function useAnimatedPercentage(
  percentage: number,
  duration: number = 400
): string {
  const animatedValue = useAnimatedValue(percentage, {
    duration,
    easing: easings.easeInOutQuad,
    precision: 0
  });

  return `${animatedValue}%`;
}

/**
 * Hook pour détecter si une valeur change
 * Utile pour déclencher des animations visuelles
 */
export function useValueChange(value: number | string): boolean {
  const [hasChanged, setHasChanged] = useState(false);
  const prevValueRef = useRef(value);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (prevValueRef.current !== value) {
      setHasChanged(true);
      prevValueRef.current = value;

      // Reset après l'animation
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        setHasChanged(false);
      }, 500);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value]);

  return hasChanged;
}

export default useAnimatedValue;
