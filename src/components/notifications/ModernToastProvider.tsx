import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ModernToast, ModernToastProps, ToastType, ToastPriority } from './ModernToast';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { useNotificationSound } from '@/hooks/useNotificationSound';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { NOTIFICATION_CONFIG, getDurationByPriority } from '@/config/notificationConfig';

interface ToastItem extends Omit<ModernToastProps, 'onDismiss'> {
  createdAt: number;
  duration: number;
}

interface ModernToastContextType {
  showToast: (options: Omit<ToastItem, 'id' | 'createdAt' | 'duration'> & { duration?: number }) => string;
  dismissToast: (id: string) => void;
  dismissAll: () => void;
  toasts: ToastItem[];
}

const ModernToastContext = createContext<ModernToastContextType | null>(null);

export const useModernToast = () => {
  const context = useContext(ModernToastContext);
  if (!context) {
    throw new Error('useModernToast must be used within ModernToastProvider');
  }
  return context;
};

// Convenience methods
export const toast = {
  show: (title: string, options?: Partial<Omit<ToastItem, 'id' | 'createdAt' | 'title'>>) => {
    // Will be connected via ref
    return toastRef.current?.showToast({ title, ...options }) ?? '';
  },
  success: (title: string, message?: string) => {
    return toastRef.current?.showToast({ title, message, type: 'success' }) ?? '';
  },
  error: (title: string, message?: string) => {
    return toastRef.current?.showToast({ title, message, type: 'error', priority: 'high' }) ?? '';
  },
  warning: (title: string, message?: string) => {
    return toastRef.current?.showToast({ title, message, type: 'warning' }) ?? '';
  },
  info: (title: string, message?: string) => {
    return toastRef.current?.showToast({ title, message, type: 'info' }) ?? '';
  },
  transport: (title: string, message?: string) => {
    return toastRef.current?.showToast({ title, message, type: 'transport' }) ?? '';
  },
  delivery: (title: string, message?: string) => {
    return toastRef.current?.showToast({ title, message, type: 'delivery' }) ?? '';
  },
  payment: (title: string, message?: string) => {
    return toastRef.current?.showToast({ title, message, type: 'payment' }) ?? '';
  },
  marketplace: (title: string, message?: string) => {
    return toastRef.current?.showToast({ title, message, type: 'marketplace' }) ?? '';
  },
  dismiss: (id: string) => toastRef.current?.dismissToast(id),
  dismissAll: () => toastRef.current?.dismissAll()
};

// Global ref for convenience methods
const toastRef = { current: null as ModernToastContextType | null };

const MAX_VISIBLE_TOASTS = 3;

interface ModernToastProviderProps {
  children: React.ReactNode;
}

export const ModernToastProvider: React.FC<ModernToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const { preferences } = useUserPreferences();
  const { playNotificationSound } = useNotificationSound({
    enabled: preferences.notification_preferences?.notification_sound_enabled ?? true,
    volume: (preferences.notification_preferences?.notification_sound_volume ?? 70) / 100
  });

  const dismissToast = useCallback((id: string) => {
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

  const showToast = useCallback((options: Omit<ToastItem, 'id' | 'createdAt' | 'duration'> & { duration?: number }) => {
    const id = crypto.randomUUID();
    const priority = options.priority || 'normal';
    const duration = options.duration ?? getDurationByPriority(priority);
    
    const newToast: ToastItem = {
      ...options,
      id,
      createdAt: Date.now(),
      duration
    };

    // Haptic feedback on mobile
    if (Capacitor.isNativePlatform()) {
      const impactMap: Record<ToastPriority, ImpactStyle> = {
        urgent: ImpactStyle.Heavy,
        high: ImpactStyle.Medium,
        normal: ImpactStyle.Light,
        low: ImpactStyle.Light
      };
      Haptics.impact({ style: impactMap[priority] }).catch(console.warn);
    }

    // Play sound
    if (preferences.notification_preferences?.notification_sound_enabled !== false) {
      const soundKey = `${options.type || 'info'}.notification`;
      playNotificationSound(soundKey);
    }

    setToasts(prev => {
      // Priority sorting: urgent first, then high, etc.
      const priorityOrder: Record<ToastPriority, number> = { urgent: 0, high: 1, normal: 2, low: 3 };
      const withNew = [...prev, newToast];
      withNew.sort((a, b) => priorityOrder[a.priority || 'normal'] - priorityOrder[b.priority || 'normal']);
      
      // Keep only max toasts
      return withNew.slice(0, 10);
    });

    // Auto dismiss
    if (duration > 0) {
      const timeout = setTimeout(() => {
        dismissToast(id);
      }, duration);
      timeoutsRef.current.set(id, timeout);
    }

    return id;
  }, [dismissToast, preferences, playNotificationSound]);

  // Connect ref for convenience methods
  useEffect(() => {
    toastRef.current = { showToast, dismissToast, dismissAll, toasts };
  }, [showToast, dismissToast, dismissAll, toasts]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  const visibleToasts = toasts.slice(0, MAX_VISIBLE_TOASTS);

  return (
    <ModernToastContext.Provider value={{ showToast, dismissToast, dismissAll, toasts }}>
      {children}
      
      {/* Toast container - positioned ABOVE header with z-[9999] */}
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
                  zIndex: 100 - index,
                  transform: index > 0 ? `scale(${1 - index * 0.03})` : undefined,
                  opacity: index > 0 ? 1 - index * 0.1 : 1
                }}
              >
                <ModernToast
                  {...toast}
                  onDismiss={dismissToast}
                />
              </div>
            ))}
          </AnimatePresence>
          
          {/* Hidden toasts count */}
          {toasts.length > MAX_VISIBLE_TOASTS && (
            <div className="text-center text-xs text-muted-foreground pointer-events-auto">
              +{toasts.length - MAX_VISIBLE_TOASTS} autres notifications
            </div>
          )}
        </div>
      </div>
    </ModernToastContext.Provider>
  );
};

export default ModernToastProvider;
