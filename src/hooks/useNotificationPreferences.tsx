import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export interface NotificationPreferences {
  push_enabled: boolean;
  ride_updates: boolean;
  delivery_updates: boolean;
  payment_alerts: boolean;
  promotions: boolean;
  driver_updates: boolean;
  system_alerts: boolean;
  marketplace_updates: boolean;
  chat_messages: boolean;
  digest_frequency: 'none' | 'daily' | 'weekly';
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  sound_enabled: boolean;
  vibration_enabled: boolean;
  priority_only: boolean;
}

const defaultPreferences: NotificationPreferences = {
  push_enabled: true,
  ride_updates: true,
  delivery_updates: true,
  payment_alerts: true,
  promotions: false,
  driver_updates: true,
  system_alerts: true,
  marketplace_updates: true,
  chat_messages: true,
  digest_frequency: 'daily',
  quiet_hours_start: '22:00',
  quiet_hours_end: '08:00',
  sound_enabled: true,
  vibration_enabled: true,
  priority_only: false
};

export const useNotificationPreferences = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadPreferences();
    }
  }, [user?.id]);

  const loadPreferences = async () => {
    try {
      // Use localStorage fallback since the table doesn't exist in types yet
      const storageKey = `notification_preferences_${user?.id}`;
      const stored = localStorage.getItem(storageKey);
      
      if (stored) {
        setPreferences(JSON.parse(stored));
      }

    } catch (error: any) {
      console.error('Error loading notification preferences:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les préférences de notification",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async (newPreferences: Partial<NotificationPreferences>) => {
    if (!user?.id) return;

    setSaving(true);
    try {
      const updatedPreferences = { ...preferences, ...newPreferences };
      
      // Use localStorage fallback
      const storageKey = `notification_preferences_${user.id}`;
      localStorage.setItem(storageKey, JSON.stringify(updatedPreferences));

      setPreferences(updatedPreferences);
      
      toast({
        title: "Préférences sauvegardées",
        description: "Vos préférences de notification ont été mises à jour",
      });
    } catch (error: any) {
      console.error('Error saving notification preferences:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les préférences",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = async (key: keyof NotificationPreferences, value: any) => {
    await savePreferences({ [key]: value });
  };

  const isInQuietHours = (): boolean => {
    if (!preferences.quiet_hours_start || !preferences.quiet_hours_end) {
      return false;
    }

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMin] = preferences.quiet_hours_start.split(':').map(Number);
    const [endHour, endMin] = preferences.quiet_hours_end.split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Handle overnight quiet hours
      return currentTime >= startTime || currentTime <= endTime;
    }
  };

  const shouldShowNotification = (type: string, priority: 'low' | 'normal' | 'high' = 'normal'): boolean => {
    if (!preferences.push_enabled) return false;
    if (preferences.priority_only && priority === 'low') return false;
    if (isInQuietHours() && priority !== 'high') return false;

    const typeKey = `${type}_updates` as keyof NotificationPreferences;
    if (typeKey in preferences) {
      return Boolean(preferences[typeKey]);
    }

    return true;
  };

  return {
    preferences,
    loading,
    saving,
    updatePreference,
    savePreferences,
    shouldShowNotification,
    isInQuietHours
  };
};