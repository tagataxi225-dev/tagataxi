import { useCallback } from 'react';
import { Rarity } from '@/types/scratch-card';

const VIBRATION_PATTERNS = {
  common: [50],
  rare: [50, 30, 50],
  epic: [100, 50, 100, 50, 100],
  legendary: [200, 100, 200, 100, 300]
};

export const useLotteryFeedback = () => {
  const playSound = useCallback((type: 'scratch' | 'reveal' | 'win' | 'claim') => {
    // Placeholder pour sons (optionnel)
    // const audio = new Audio(`/sounds/lottery/${type}.mp3`);
    // audio.volume = 0.3;
    // audio.play().catch(() => {});
  }, []);

  const vibrate = useCallback((pattern: number | number[]) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }, []);

  const vibrateByRarity = useCallback((rarity: Rarity) => {
    const pattern = VIBRATION_PATTERNS[rarity] || VIBRATION_PATTERNS.common;
    vibrate(pattern);
  }, [vibrate]);

  const vibrateLight = useCallback(() => {
    vibrate(10);
  }, [vibrate]);

  const vibrateMedium = useCallback(() => {
    vibrate([20, 10, 20]);
  }, [vibrate]);

  const vibrateHeavy = useCallback(() => {
    vibrate([50, 30, 50, 30, 50]);
  }, [vibrate]);

  return {
    playSound,
    vibrate,
    vibrateByRarity,
    vibrateLight,
    vibrateMedium,
    vibrateHeavy
  };
};
