import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { 
  PremiumNotificationToast, 
  PremiumNotificationToastProps,
  PremiumToastType,
  PremiumToastPriority
} from './PremiumNotificationToast';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useNotificationSound } from '@/hooks/useNotificationSound';
import { NOTIFICATION_CONFIG } from '@/config/notificationConfig';

interface ToastItem extends Omit<PremiumNotificationToastProps, 'onDismiss'> {
  createdAt: number;
}

interface PremiumNotificationContextType {
  notify: (options: Omit<ToastItem, 'id' | 'createdAt'>) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
  toasts: ToastItem[];
}

const PremiumNotificationContext = createContext<PremiumNotificationContextType | null>(null);

// Global ref for external access
const notifyRef = { current: null as PremiumNotificationContextType | null };

export const usePremiumNotification = () => {
  const context = useContext(PremiumNotificationContext);
  if (!context) {
    throw new Error('usePremiumNotification must be used within PremiumNotificationContainer');
  }
  return context;
};

// Standalone notification functions
export const premiumNotify = {
  show: (title: string, options?: Partial<Omit<ToastItem, 'id' | 'createdAt' | 'title'>>) => {
    return notifyRef.current?.notify({ title, ...options }) ?? '';
  },
  success: (title: string, message?: string) => {
    return notifyRef.current?.notify({ title, message, type: 'success' }) ?? '';
  },
  error: (title: string, message?: string) => {
    return notifyRef.current?.notify({ title, message, type: 'error', priority: 'high' }) ?? '';
  },
  warning: (title: string, message?: string) => {
    return notifyRef.current?.notify({ title, message, type: 'warning' }) ?? '';
  },
  info: (title: string, message?: string) => {
    return notifyRef.current?.notify({ title, message, type: 'info' }) ?? '';
  },
  transport: (title: string, message?: string) => {
    return notifyRef.current?.notify({ title, message, type: 'transport' }) ?? '';
  },
  delivery: (title: string, message?: string) => {
    return notifyRef.current?.notify({ title, message, type: 'delivery' }) ?? '';
  },
  payment: (title: string, message?: string) => {
    return notifyRef.current?.notify({ title, message, type: 'payment' }) ?? '';
  },
  marketplace: (title: string, message?: string) => {
    return notifyRef.current?.notify({ title, message, type: 'marketplace' }) ?? '';
  },
  food: (title: string, message?: string) => {
    return notifyRef.current?.notify({ title, message, type: 'food' }) ?? '';
  },
  dismiss: (id: string) => notifyRef.current?.dismiss(id),
  dismissAll: () => notifyRef.current?.dismissAll()
};

const MAX_VISIBLE = 4;

interface Props {
  children: React.ReactNode;
}

export const PremiumNotificationContainer: React.FC<Props> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const { preferences } = useUserPreferences();
  const { playNotificationSound } = useNotificationSound({
    enabled: preferences.notification_preferences?.notification_sound_enabled ?? true,
    volume: (preferences.notification_preferences?.notification_sound_volume ?? 70) / 100
  });

  const dismiss = useCallback((id: string) => {
    const timeout = timeoutsRef.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      timeoutsRef.current.delete(id);
    }
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    timeoutsRef.current.clear();
    setToasts([]);
  }, []);

  const notify = useCallback((options: Omit<ToastItem, 'id' | 'createdAt'>) => {
    const id = crypto.randomUUID();
    const priority = options.priority || 'normal';
    const duration = options.duration ?? NOTIFICATION_CONFIG.PRIORITY_DURATIONS[priority] ?? 4000;

    const newToast: ToastItem = {
      ...options,
      id,
      createdAt: Date.now(),
      duration
    };

    // Haptic feedback
    if (Capacitor.isNativePlatform()) {
      const impactMap: Record<PremiumToastPriority, ImpactStyle> = {
        urgent: ImpactStyle.Heavy,
        high: ImpactStyle.Medium,
        normal: ImpactStyle.Light,
        low: ImpactStyle.Light
      };
      Haptics.impact({ style: impactMap[priority] }).catch(() => {});
    }

    // Sound
    if (preferences.notification_preferences?.notification_sound_enabled !== false) {
      playNotificationSound(`${options.type || 'info'}.notification`);
    }

    setToasts(prev => {
      const priorityOrder: Record<PremiumToastPriority, number> = { urgent: 0, high: 1, normal: 2, low: 3 };
      const withNew = [...prev, newToast];
      withNew.sort((a, b) => priorityOrder[a.priority || 'normal'] - priorityOrder[b.priority || 'normal']);
      return withNew.slice(0, 10);
    });

    return id;
  }, [preferences, playNotificationSound]);

  // Connect ref
  useEffect(() => {
    notifyRef.current = { notify, dismiss, dismissAll, toasts };
  }, [notify, dismiss, dismissAll, toasts]);

  // Cleanup
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  const visibleToasts = toasts.slice(0, MAX_VISIBLE);
  const hiddenCount = toasts.length - MAX_VISIBLE;

  return (
    <PremiumNotificationContext.Provider value={{ notify, dismiss, dismissAll, toasts }}>
      {children}

      {/* Fixed container at top - ABOVE EVERYTHING (z-[9999]) */}
      <div 
        className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none"
        style={{ paddingTop: 'max(env(safe-area-inset-top), 16px)' }}
        aria-live="polite"
        aria-label="Notifications"
      >
        <div className="max-w-md mx-auto px-4 space-y-2">
          <AnimatePresence mode="popLayout">
            {visibleToasts.map((toast, index) => (
              <div 
                key={toast.id} 
                className="pointer-events-auto"
                style={{ 
                  zIndex: 9999 - index,
                  transform: index > 0 ? `scale(${1 - index * 0.02})` : undefined,
                  opacity: index > 0 ? 1 - index * 0.08 : 1
                }}
              >
                <PremiumNotificationToast
                  {...toast}
                  onDismiss={dismiss}
                />
              </div>
            ))}
          </AnimatePresence>

          {/* Hidden count */}
          {hiddenCount > 0 && (
            <div className="text-center text-xs text-muted-foreground pointer-events-auto py-1">
              +{hiddenCount} autres notifications
            </div>
          )}
        </div>
      </div>
    </PremiumNotificationContext.Provider>
  );
};

export default PremiumNotificationContainer;
