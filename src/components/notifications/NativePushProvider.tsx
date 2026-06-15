/**
 * Provider pour les notifications push natives via Capacitor
 * Gère FCM (Android) et APNS (iOS)
 */

import { useEffect, useCallback, createContext, useContext, useState, ReactNode } from 'react';
import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { unifiedNotificationService, NotificationCategory } from '@/services/unifiedNotificationService';
import { secureLog } from '@/utils/secureLogger';

interface NativePushContextType {
  isRegistered: boolean;
  token: string | null;
  permissionGranted: boolean;
  error: string | null;
  requestPermission: () => Promise<boolean>;
  clearNotifications: () => Promise<void>;
}

const NativePushContext = createContext<NativePushContextType | null>(null);

export const useNativePush = () => {
  const context = useContext(NativePushContext);
  if (!context) {
    // Retourner un état par défaut si hors du provider (web)
    return {
      isRegistered: false,
      token: null,
      permissionGranted: false,
      error: null,
      requestPermission: async () => false,
      clearNotifications: async () => {}
    };
  }
  return context;
};

interface NativePushProviderProps {
  children: ReactNode;
}

export const NativePushProvider = ({ children }: NativePushProviderProps) => {
  const { user } = useAuth();
  const [isRegistered, setIsRegistered] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isMobile = Capacitor.isNativePlatform();

  // Enregistrer le token dans Supabase
  const saveToken = useCallback(async (pushToken: string) => {
    if (!user) return;

    try {
      const { error: saveError } = await supabase
        .from('push_notification_tokens')
        .upsert({
          user_id: user.id,
          token: pushToken,
          platform: Capacitor.getPlatform(),
          is_active: true,
          device_name: Capacitor.getPlatform(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,token,platform' });

      if (saveError) {
        secureLog.error('Error saving push token:', saveError);
        setError(saveError.message);
      } else {
        secureLog.log('✅ Push token saved');
        setIsRegistered(true);
        setToken(pushToken);
      }
    } catch (err) {
      secureLog.error('Error in saveToken:', err);
      setError('Failed to save token');
    }
  }, [user]);

  // Déterminer la catégorie depuis les données de la notification
  const getCategoryFromData = (data: any): NotificationCategory => {
    if (data?.category) return data.category as NotificationCategory;
    if (data?.type?.includes('transport')) return 'transport';
    if (data?.type?.includes('delivery')) return 'delivery';
    if (data?.type?.includes('rental')) return 'rental';
    if (data?.type?.includes('marketplace')) return 'marketplace';
    if (data?.type?.includes('lottery')) return 'lottery';
    if (data?.type?.includes('chat')) return 'chat';
    if (data?.type?.includes('payment')) return 'payment';
    return 'system';
  };

  // Gérer une notification reçue en foreground
  const handleForegroundNotification = useCallback(async (notification: PushNotificationSchema) => {
    secureLog.log('📩 Push notification received:', notification.title);
    
    const category = getCategoryFromData(notification.data);
    
    await unifiedNotificationService.notify({
      title: notification.title || 'Nouvelle notification',
      message: notification.body || '',
      category,
      priority: notification.data?.priority || 'normal',
      action: notification.data?.url ? {
        label: 'Voir',
        url: notification.data.url
      } : undefined
    });
  }, []);

  // Gérer un clic sur notification (background)
  const handleNotificationAction = useCallback(async (action: ActionPerformed) => {
    secureLog.log('🔔 Push notification action:', action.actionId);
    
    const notification = action.notification;
    const data = notification.data;
    
    // Navigation basée sur les données
    if (data?.url) {
      window.location.href = data.url;
    } else if (data?.type) {
      // Navigation automatique selon le type
      const routes: Record<string, string> = {
        transport: '/transport',
        delivery: '/delivery',
        rental: '/rental',
        marketplace: '/marketplace',
        lottery: '/lottery',
        food: '/food'
      };
      const route = Object.entries(routes).find(([key]) => data.type.includes(key));
      if (route) {
        window.location.href = route[1];
      }
    }
  }, []);

  // Demander les permissions et enregistrer
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isMobile) {
      secureLog.warn('Push notifications only available on mobile');
      return false;
    }

    try {
      const permResult = await PushNotifications.requestPermissions();
      
      if (permResult.receive === 'granted') {
        setPermissionGranted(true);
        await PushNotifications.register();
        return true;
      } else {
        setPermissionGranted(false);
        setError('Permission denied');
        return false;
      }
    } catch (err) {
      secureLog.error('Error requesting push permission:', err);
      setError(String(err));
      return false;
    }
  }, [isMobile]);

  // Effacer toutes les notifications
  const clearNotifications = useCallback(async (): Promise<void> => {
    if (!isMobile) return;
    
    try {
      await PushNotifications.removeAllDeliveredNotifications();
      secureLog.log('✅ All notifications cleared');
    } catch (err) {
      secureLog.error('Error clearing notifications:', err);
    }
  }, [isMobile]);

  // Setup des listeners
  useEffect(() => {
    if (!isMobile) return;

    let registrationListener: any;
    let registrationErrorListener: any;
    let notificationReceivedListener: any;
    let notificationActionListener: any;

    const setupListeners = async () => {
      registrationListener = await PushNotifications.addListener('registration', (token: Token) => {
        secureLog.log('✅ Push registration success');
        saveToken(token.value);
      });

      registrationErrorListener = await PushNotifications.addListener('registrationError', (err: any) => {
        secureLog.error('❌ Push registration error:', err);
        setError(err.error || 'Registration failed');
        setIsRegistered(false);
      });

      notificationReceivedListener = await PushNotifications.addListener(
        'pushNotificationReceived',
        handleForegroundNotification
      );

      notificationActionListener = await PushNotifications.addListener(
        'pushNotificationActionPerformed',
        handleNotificationAction
      );
    };

    setupListeners();

    return () => {
      registrationListener?.remove();
      registrationErrorListener?.remove();
      notificationReceivedListener?.remove();
      notificationActionListener?.remove();
    };
  }, [isMobile, saveToken, handleForegroundNotification, handleNotificationAction]);

  // Auto-register quand user est connecté
  useEffect(() => {
    if (isMobile && user && !isRegistered) {
      requestPermission();
    }
  }, [isMobile, user, isRegistered, requestPermission]);

  const value: NativePushContextType = {
    isRegistered,
    token,
    permissionGranted,
    error,
    requestPermission,
    clearNotifications
  };

  return (
    <NativePushContext.Provider value={value}>
      {children}
    </NativePushContext.Provider>
  );
};
