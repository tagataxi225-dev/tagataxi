import { useState, useCallback, useEffect } from 'react';
import { PushNotificationToastData } from '@/components/notifications/PushNotificationToast';
import { useNotificationSound } from './useNotificationSound';
import { useUserPreferences } from './useUserPreferences';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export const useModernNotifications = () => {
  const [toasts, setToasts] = useState<PushNotificationToastData[]>([]);
  const { preferences } = useUserPreferences();
  const { playNotificationSound } = useNotificationSound({
    enabled: preferences.notification_preferences?.notification_sound_enabled ?? true,
    volume: (preferences.notification_preferences?.notification_sound_volume ?? 70) / 100
  });

  const showToast = useCallback((notification: Omit<PushNotificationToastData, 'id' | 'timestamp'> & { id?: string }) => {
    const newToast: PushNotificationToastData = {
      ...notification,
      id: notification.id ?? crypto.randomUUID(),
      timestamp: Date.now()
    };

    setToasts(prev => [newToast, ...prev.slice(0, 9)]); // Max 10 en queue

    // Vibration haptique sur mobile
    if (Capacitor.isNativePlatform()) {
      const impactMap = {
        urgent: ImpactStyle.Heavy,
        high: ImpactStyle.Medium,
        normal: ImpactStyle.Light,
        low: ImpactStyle.Light
      };

      Haptics.impact({ style: impactMap[notification.priority] }).catch(console.warn);
    }

    // Son de notification
    if (preferences.notification_preferences?.notification_sound_enabled !== false) {
      playNotificationSound(`${notification.type}.notification`);
    }

    return newToast.id;
  }, [playNotificationSound, preferences]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Nettoyage automatique après 30 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setToasts(prev => prev.filter(toast => now - toast.timestamp < 30000));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return {
    toasts,
    showToast,
    removeToast,
    clearAllToasts
  };
};
