import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';
import { useAuth } from './useAuth';

interface NotificationPreferences {
  push_notifications: boolean;
  email_notifications: boolean;
  sms_notifications: boolean;
  promotion_notifications: boolean;
  order_updates: boolean;
  driver_updates: boolean;
  payment_alerts: boolean;
}

interface UserPreferences {
  id?: string;
  language: string;
  currency: string;
  timezone: string;
  notification_preferences: any;
  app_theme: string;
  default_payment_method?: string;
  auto_save_addresses: boolean;
  share_location: boolean;
}

const defaultPreferences: UserPreferences = {
  language: 'fr',
  currency: 'CDF',
  timezone: 'Africa/Kinshasa',
  notification_preferences: {
    push_notifications: true,
    email_notifications: true,
    sms_notifications: false,
    promotion_notifications: true,
    order_updates: true,
    driver_updates: true,
    payment_alerts: true,
  },
  app_theme: 'light',
  auto_save_addresses: true,
  share_location: true,
};

export const useUserPreferences = () => {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchPreferences();
    }
  }, [user]);

  const fetchPreferences = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code === 'PGRST116') {
        // Aucune préférence trouvée, utiliser les valeurs par défaut
        await createDefaultPreferences();
      } else if (error) {
        throw error;
      } else {
        setPreferences(data);
      }
    } catch (error: any) {
      console.error('Erreur lors de la récupération des préférences:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger vos préférences.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createDefaultPreferences = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .insert({
          ...defaultPreferences,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      setPreferences(data);
    } catch (error: any) {
      console.error('Erreur lors de la création des préférences par défaut:', error);
    }
  };

  const updatePreferences = async (updates: Partial<UserPreferences>) => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setPreferences(prev => ({ ...prev, ...data }));
      
      toast({
        title: "Préférences mises à jour",
        description: "Vos paramètres ont été sauvegardés.",
      });

      return data;
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour des préférences:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder vos préférences.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateNotificationPreference = async (key: keyof NotificationPreferences, value: boolean) => {
    const newNotificationPrefs = {
      ...preferences.notification_preferences,
      [key]: value,
    };

    await updatePreferences({
      notification_preferences: newNotificationPrefs,
    });
  };

  const toggleNotification = (key: keyof NotificationPreferences) => {
    updateNotificationPreference(key, !preferences.notification_preferences[key]);
  };

  const updateLanguage = async (language: string) => {
    await updatePreferences({ language });
  };

  const updateTheme = async (theme: string) => {
    await updatePreferences({ app_theme: theme });
    // Theme application is handled by next-themes via useTheme().setTheme()
    // No manual classList manipulation needed
  };

  const updateCurrency = async (currency: string) => {
    await updatePreferences({ currency });
  };

  const updateDefaultPaymentMethod = async (method: string) => {
    await updatePreferences({ default_payment_method: method });
  };

  const toggleAutoSaveAddresses = async () => {
    await updatePreferences({ auto_save_addresses: !preferences.auto_save_addresses });
  };

  const toggleShareLocation = async () => {
    await updatePreferences({ share_location: !preferences.share_location });
  };

  // Fonction utilitaire pour obtenir le libellé de la langue
  const getLanguageLabel = (lang: string) => {
    switch (lang) {
      case 'fr': return 'Français';
      case 'en': return 'English';
      default: return lang;
    }
  };

  // Fonction utilitaire pour obtenir le libellé du thème
  const getThemeLabel = (theme: string) => {
    switch (theme) {
      case 'light': return 'Clair';
      case 'dark': return 'Sombre';
      case 'system': return 'Système';
      default: return theme;
    }
  };

  return {
    preferences,
    updatePreferences,
    updateNotificationPreference,
    toggleNotification,
    updateLanguage,
    updateTheme,
    updateCurrency,
    updateDefaultPaymentMethod,
    toggleAutoSaveAddresses,
    toggleShareLocation,
    getLanguageLabel,
    getThemeLabel,
    isLoading,
    refetch: fetchPreferences,
  };
};