import { useCallback } from 'react';
import { premiumNotify } from '@/components/notifications/PremiumNotificationContainer';
import { toast as sonnerToast } from 'sonner';
import { PremiumToastType, PremiumToastPriority } from '@/components/notifications/PremiumNotificationToast';

interface NotifyOptions {
  title: string;
  message?: string;
  type?: PremiumToastType;
  priority?: PremiumToastPriority;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Hook unifié pour afficher des notifications
 * Utilise PremiumNotificationContainer par défaut
 * Avec fallback sur Sonner si nécessaire
 */
export const useUnifiedNotifications = () => {
  const notify = useCallback((options: NotifyOptions) => {
    const { title, message, type = 'info', priority = 'normal', duration, action } = options;

    // Use premium notification system
    return premiumNotify.show(title, {
      message,
      type,
      priority,
      duration,
      action
    });
  }, []);

  const success = useCallback((title: string, message?: string) => {
    return premiumNotify.success(title, message);
  }, []);

  const error = useCallback((title: string, message?: string) => {
    return premiumNotify.error(title, message);
  }, []);

  const warning = useCallback((title: string, message?: string) => {
    return premiumNotify.warning(title, message);
  }, []);

  const info = useCallback((title: string, message?: string) => {
    return premiumNotify.info(title, message);
  }, []);

  const transport = useCallback((title: string, message?: string) => {
    return premiumNotify.transport(title, message);
  }, []);

  const delivery = useCallback((title: string, message?: string) => {
    return premiumNotify.delivery(title, message);
  }, []);

  const payment = useCallback((title: string, message?: string) => {
    return premiumNotify.payment(title, message);
  }, []);

  const marketplace = useCallback((title: string, message?: string) => {
    return premiumNotify.marketplace(title, message);
  }, []);

  const food = useCallback((title: string, message?: string) => {
    return premiumNotify.food(title, message);
  }, []);

  const dismiss = useCallback((id: string) => {
    premiumNotify.dismiss(id);
  }, []);

  const dismissAll = useCallback(() => {
    premiumNotify.dismissAll();
  }, []);

  return {
    notify,
    success,
    error,
    warning,
    info,
    transport,
    delivery,
    payment,
    marketplace,
    food,
    dismiss,
    dismissAll
  };
};

// Standalone notify function for use outside of React components
export const unifiedNotify = premiumNotify;

export default useUnifiedNotifications;
