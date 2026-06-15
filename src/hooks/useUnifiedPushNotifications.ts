/**
 * Hook unifié pour toutes les notifications push
 * Combine les notifications natives (Capacitor) et web (Browser)
 */

import { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { useNativePush } from '@/components/notifications/NativePushProvider';
import { unifiedNotificationService, NotificationCategory, UnifiedNotificationOptions } from '@/services/unifiedNotificationService';
import { useAuth } from '@/hooks/useAuth';
import { secureLog } from '@/utils/secureLogger';

interface BrowserPushState {
  permission: NotificationPermission;
  isSupported: boolean;
}

export const useUnifiedPushNotifications = () => {
  const { user } = useAuth();
  const nativePush = useNativePush();
  const [browserPush, setBrowserPush] = useState<BrowserPushState>({
    permission: 'default',
    isSupported: false
  });
  const [isInitialized, setIsInitialized] = useState(false);

  const isMobile = Capacitor.isNativePlatform();

  // Initialiser le service de notification
  useEffect(() => {
    const init = async () => {
      await unifiedNotificationService.initialize();
      setIsInitialized(true);
    };
    init();
  }, []);

  // Vérifier le support des notifications navigateur
  useEffect(() => {
    if (!isMobile && 'Notification' in window) {
      setBrowserPush({
        permission: Notification.permission,
        isSupported: true
      });
    }
  }, [isMobile]);

  // Demander les permissions (unifié)
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (isMobile) {
      return nativePush.requestPermission();
    } else if (browserPush.isSupported) {
      try {
        const permission = await Notification.requestPermission();
        setBrowserPush(prev => ({ ...prev, permission }));
        return permission === 'granted';
      } catch (error) {
        secureLog.error('Error requesting browser notification permission:', error);
        return false;
      }
    }
    return false;
  }, [isMobile, nativePush, browserPush.isSupported]);

  // Vérifier si les notifications sont activées
  const isEnabled = useCallback((): boolean => {
    if (isMobile) {
      return nativePush.permissionGranted;
    }
    return browserPush.permission === 'granted';
  }, [isMobile, nativePush.permissionGranted, browserPush.permission]);

  // Envoyer une notification (unifié)
  const notify = useCallback(async (options: UnifiedNotificationOptions): Promise<void> => {
    await unifiedNotificationService.notify(options);
  }, []);

  // Jouer un son
  const playSound = useCallback(async (category: NotificationCategory): Promise<void> => {
    await unifiedNotificationService.playSound(category);
  }, []);

  // Notifications spécifiques par service
  const notifyTransport = useCallback(async (
    type: 'driver_assigned' | 'driver_arrived' | 'in_progress' | 'completed',
    details?: string
  ): Promise<void> => {
    await unifiedNotificationService.notifyTransport(type, details);
  }, []);

  const notifyDelivery = useCallback(async (
    type: 'confirmed' | 'picked_up' | 'in_transit' | 'delivered',
    details?: string
  ): Promise<void> => {
    await unifiedNotificationService.notifyDelivery(type, details);
  }, []);

  const notifyRental = useCallback(async (
    type: 'pending' | 'approved_by_partner' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled',
    details?: string
  ): Promise<void> => {
    await unifiedNotificationService.notifyRental(type, details);
  }, []);

  const notifyPayment = useCallback(async (
    type: 'success' | 'failed' | 'pending',
    amount?: string
  ): Promise<void> => {
    await unifiedNotificationService.notifyPayment(type, amount);
  }, []);

  const notifyLottery = useCallback(async (won: boolean, prize?: string): Promise<void> => {
    await unifiedNotificationService.notifyLottery(won, prize);
  }, []);

  // Effacer les notifications
  const clearNotifications = useCallback(async (): Promise<void> => {
    if (isMobile) {
      await nativePush.clearNotifications();
    }
  }, [isMobile, nativePush]);

  // Obtenir les préférences
  const getPreferences = useCallback(() => {
    return unifiedNotificationService.getPreferences();
  }, []);

  // Sauvegarder les préférences
  const savePreferences = useCallback((prefs: Parameters<typeof unifiedNotificationService.savePreferences>[0]) => {
    unifiedNotificationService.savePreferences(prefs);
  }, []);

  return {
    // État
    isInitialized,
    isEnabled: isEnabled(),
    isMobile,
    token: isMobile ? nativePush.token : null,
    error: isMobile ? nativePush.error : null,
    
    // Actions
    requestPermission,
    notify,
    playSound,
    clearNotifications,
    
    // Notifications spécifiques
    notifyTransport,
    notifyDelivery,
    notifyRental,
    notifyPayment,
    notifyLottery,
    
    // Préférences
    getPreferences,
    savePreferences
  };
};
