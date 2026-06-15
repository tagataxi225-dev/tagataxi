import { useCallback } from 'react';

type HapticIntensity = 'light' | 'medium' | 'heavy';

const vibrationPatterns: Record<HapticIntensity, number | number[]> = {
  light: 10,
  medium: 20,
  heavy: [30, 10, 30],
};

export const useHapticFeedback = () => {
  const triggerHaptic = useCallback(async (intensity: HapticIntensity = 'medium') => {
    try {
      const { Capacitor } = await import('@capacitor/core');
      if (Capacitor.isNativePlatform()) {
        const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
        const styleMap: Record<HapticIntensity, typeof ImpactStyle[keyof typeof ImpactStyle]> = {
          light: ImpactStyle.Light,
          medium: ImpactStyle.Medium,
          heavy: ImpactStyle.Heavy,
        };
        await Haptics.impact({ style: styleMap[intensity] });
        return;
      }
    } catch {}
    try { navigator.vibrate?.(vibrationPatterns[intensity]); } catch {}
  }, []);

  const triggerSuccess = useCallback(async () => {
    try {
      const { Capacitor } = await import('@capacitor/core');
      if (Capacitor.isNativePlatform()) {
        const { Haptics, NotificationType } = await import('@capacitor/haptics');
        await Haptics.notification({ type: NotificationType.Success });
        return;
      }
    } catch {}
    try { navigator.vibrate?.([10, 50, 10, 50, 30]); } catch {}
  }, []);

  const triggerError = useCallback(async () => {
    try {
      const { Capacitor } = await import('@capacitor/core');
      if (Capacitor.isNativePlatform()) {
        const { Haptics, NotificationType } = await import('@capacitor/haptics');
        await Haptics.notification({ type: NotificationType.Error });
        return;
      }
    } catch {}
    try { navigator.vibrate?.([50, 30, 50]); } catch {}
  }, []);

  return { triggerHaptic, triggerSuccess, triggerError };
};
