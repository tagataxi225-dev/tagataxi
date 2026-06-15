import { useState, useEffect, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

interface NotificationPermissionState {
  permission: NotificationPermission;
  supported: boolean;
  requesting: boolean;
}

export const useNotificationPermissions = () => {
  const [state, setState] = useState<NotificationPermissionState>({
    permission: 'default',
    supported: 'Notification' in window,
    requesting: false
  });

  useEffect(() => {
    if ('Notification' in window) {
      setState(prev => ({
        ...prev,
        permission: Notification.permission
      }));
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!state.supported) {
      toast({
        title: "Non supporté",
        description: "Les notifications ne sont pas supportées par votre navigateur",
        variant: "destructive"
      });
      return false;
    }

    if (state.permission === 'granted') {
      return true;
    }

    setState(prev => ({ ...prev, requesting: true }));

    try {
      const permission = await Notification.requestPermission();
      setState(prev => ({
        ...prev,
        permission,
        requesting: false
      }));

      if (permission === 'granted') {
        toast({
          title: "Notifications activées",
          description: "Vous recevrez maintenant les notifications push",
        });
        return true;
      } else {
        toast({
          title: "Permissions refusées",
          description: "Vous pouvez les réactiver dans les paramètres de votre navigateur",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      setState(prev => ({ ...prev, requesting: false }));
      toast({
        title: "Erreur",
        description: "Impossible de demander les permissions de notification",
        variant: "destructive"
      });
      return false;
    }
  }, [state.supported, state.permission]);

  const showNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (state.permission !== 'granted') {
      return null;
    }

    try {
      const notification = new Notification(title, {
        icon: '/android-chrome-192x192.png',
        badge: '/android-chrome-192x192.png',
        tag: 'kwenda-notification',
        ...options
      });

      return notification;
    } catch (error) {
      console.error('Error showing notification:', error);
      return null;
    }
  }, [state.permission]);

  return {
    ...state,
    requestPermission,
    showNotification,
    isGranted: state.permission === 'granted',
    isDenied: state.permission === 'denied'
  };
};