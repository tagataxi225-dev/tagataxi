import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Moon, Sun, Volume2, VolumeX, Trash2, AlertTriangle, LogOut, Loader2, Bell, Shield, Globe, Smartphone, Lock, User, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNotificationPermissions } from '@/hooks/useNotificationPermissions';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';

export const UserSettings = () => {
  const { toast } = useToast();
  const { language, setLanguage, t } = useLanguage();
  const { user, signOut } = useAuth();
  
  // 🔔 Hooks de notifications
  const { requestPermission, isGranted, isDenied } = useNotificationPermissions();
  const { preferences, loading: prefsLoading, updatePreference, savePreferences } = useNotificationPreferences();
  
  // 🔧 État local pour les paramètres (non-notifications)
  const [settings, setSettings] = useState({
    // Privacy
    location_sharing: true,
    ride_history_visible: true,
    profile_visibility: 'public',
    
    // App preferences
    dark_mode: false,
    sound_effects: true,
    auto_location: true,
    offline_maps: false,
    
    // Security
    two_factor_auth: false,
    biometric_login: false,
    auto_logout: false,
  });

  const [loading, setLoading] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Charger les paramètres depuis Supabase au démarrage
  useEffect(() => {
    const loadSettings = async () => {
      if (!user?.id) return;
      
      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (error && error.code !== 'PGRST116') {
          throw error;
        }
        
        if (data) {
          setSettings({
            location_sharing: data.location_sharing ?? true,
            ride_history_visible: (data as any).ride_history_visible ?? true,
            profile_visibility: (data as any).profile_visibility ?? 'public',
            dark_mode: data.dark_mode ?? false,
            sound_effects: (data as any).sound_effects ?? true,
            auto_location: (data as any).auto_location ?? true,
            offline_maps: (data as any).offline_maps ?? false,
            two_factor_auth: (data as any).two_factor_auth ?? false,
            biometric_login: (data as any).biometric_login ?? false,
            auto_logout: (data as any).auto_logout ?? false
          });
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };
    
    loadSettings();
  }, [user?.id]);

  // Sync dark mode with next-themes
  const { theme: currentTheme, setTheme: setNextTheme } = useTheme();
  
  // Sync local state from next-themes on mount
  useEffect(() => {
    setSettings(prev => ({ ...prev, dark_mode: currentTheme === 'dark' }));
  }, [currentTheme]);

  const handleDarkModeToggle = (checked: boolean) => {
    handleSettingChange('dark_mode', checked);
    setNextTheme(checked ? 'dark' : 'light');
  };

  const handleSettingChange = (key: string, value: boolean | string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handlePushNotificationToggle = async (checked: boolean) => {
    if (checked && !isGranted) {
      const granted = await requestPermission();
      if (!granted) {
        toast({
          title: t('settings.permission_denied'),
          description: t('settings.permission_denied_desc'),
          variant: "destructive"
        });
        return;
      }
    }
    
    await updatePreference('push_enabled', checked);
  };

  const saveSettings = async () => {
    setLoading(true);
    try {
      // 1. Sauvegarder les préférences de notifications
      if (preferences) {
        await savePreferences(preferences);
      }
      
      // 2. Sauvegarder les autres paramètres dans user_settings
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user?.id,
          push_notifications: preferences?.push_enabled ?? true,
          email_notifications: preferences?.payment_alerts ?? true,
          sms_notifications: false,
          booking_reminders: preferences?.ride_updates ?? true,
          promotional_offers: preferences?.promotions ?? false,
          location_sharing: settings.location_sharing,
          ride_history_visible: settings.ride_history_visible,
          profile_visibility: settings.profile_visibility,
          dark_mode: settings.dark_mode,
          sound_effects: settings.sound_effects,
          auto_location: settings.auto_location,
          offline_maps: settings.offline_maps,
          two_factor_auth: settings.two_factor_auth,
          biometric_login: settings.biometric_login,
          auto_logout: settings.auto_logout
        }, {
          onConflict: 'user_id'
        });
      
      if (error) throw error;
      
      toast({
        title: t('settings.saved'),
        description: t('settings.saved_desc'),
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: t('common.error'),
        description: t('settings.save_error'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetSettings = async () => {
    const defaultSettings = {
      location_sharing: true,
      ride_history_visible: true,
      profile_visibility: 'public',
      dark_mode: false,
      sound_effects: true,
      auto_location: true,
      offline_maps: false,
      two_factor_auth: false,
      biometric_login: false,
      auto_logout: false,
    };
    
    setSettings(defaultSettings);
    
    // Réinitialiser aussi les préférences de notifications
    await savePreferences({
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
    });
    
    // Sauvegarder dans la base
    await saveSettings();
    
    toast({
      title: t('settings.reset'),
      description: t('settings.reset_desc'),
    });
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'SUPPRIMER') {
      toast({
        title: "Erreur",
        description: "Veuillez taper 'SUPPRIMER' pour confirmer.",
        variant: "destructive",
      });
      return;
    }

    setIsDeleting(true);
    
    try {
      // Call the edge function to delete user account
      const { error } = await supabase.functions.invoke('delete-user-account', {
        body: { user_id: user?.id }
      });

      if (error) throw error;

      toast({
        title: "Compte supprimé",
        description: "Votre compte a été supprimé définitivement. Vous allez être déconnecté.",
      });

      // Sign out the user
      await signOut();
      
    } catch (error) {
      console.error('Error deleting account:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le compte. Contactez le support.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeleteConfirmation('');
    }
  };

  const languageOptions = [
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'ln', name: 'Lingala', flag: '🇨🇩' },
    { code: 'kg', name: 'Kikongo', flag: '🇨🇩' },
    { code: 'lua', name: 'Tshiluba', flag: '🇨🇩' },
    { code: 'sw', name: 'Swahili', flag: '🇹🇿' },
  ];

  // Helper component for toggle items
  const ToggleItem = ({ label, desc, checked, onChange, icon }: { label: string; desc?: string; checked: boolean; onChange: (v: boolean) => void; icon?: React.ReactNode }) => (
    <div className="flex items-center justify-between py-2.5 border-b border-border/40 dark:border-border/30 last:border-b-0">
      <div className="space-y-0.5 flex-1 mr-3">
        <Label className="text-sm font-medium text-foreground">{label}</Label>
        {desc && <p className="text-xs text-muted-foreground leading-tight">{desc}</p>}
      </div>
      <div className="flex items-center gap-2">
        {icon}
        <Switch checked={checked} onCheckedChange={onChange} />
      </div>
    </div>
  );

  const SectionLabel = ({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) => (
    <div className="flex items-center gap-2 mb-2 px-1">
      <Icon className="w-3.5 h-3.5 text-foreground/60 dark:text-primary/70" />
      <h3 className="text-xs font-semibold text-foreground/60 dark:text-primary/70 uppercase tracking-wider">{children}</h3>
    </div>
  );

  return (
    <div className="space-y-3 pb-8 max-w-lg mx-auto">

      {/* Notifications */}
      <div>
        <SectionLabel icon={Bell}>{t('settings.notifications')}</SectionLabel>
        <div className="bg-white dark:bg-card/80 dark:backdrop-blur-sm rounded-xl p-3 border border-border/50 dark:border-border/60 shadow-sm dark:shadow-lg dark:shadow-black/20">
          <ToggleItem
            label={t('settings.push_notifications')}
            desc={t('settings.push_notifications_desc')}
            checked={preferences?.push_enabled ?? true}
            onChange={handlePushNotificationToggle}
          />
          <ToggleItem
            label={t('settings.email_notifications')}
            desc={t('settings.email_notifications_desc')}
            checked={preferences?.payment_alerts ?? true}
            onChange={(checked) => updatePreference('payment_alerts', checked)}
          />
          <ToggleItem
            label={t('settings.booking_reminders')}
            desc={t('settings.booking_reminders_desc')}
            checked={preferences?.ride_updates ?? true}
            onChange={(checked) => updatePreference('ride_updates', checked)}
          />
          <ToggleItem
            label={t('settings.promotional_offers')}
            desc={t('settings.promotional_offers_desc')}
            checked={preferences?.promotions ?? false}
            onChange={(checked) => updatePreference('promotions', checked)}
          />
        </div>
      </div>

      {/* Confidentialité */}
      <div>
        <SectionLabel icon={Shield}>{t('settings.privacy')}</SectionLabel>
        <div className="bg-white dark:bg-card/80 dark:backdrop-blur-sm rounded-xl p-3 border border-border/50 dark:border-border/60 shadow-sm dark:shadow-lg dark:shadow-black/20">
          <ToggleItem
            label={t('settings.location_sharing')}
            desc={t('settings.location_sharing_desc')}
            checked={settings.location_sharing}
            onChange={(checked) => handleSettingChange('location_sharing', checked)}
          />
          <ToggleItem
            label={t('settings.ride_history')}
            desc={t('settings.ride_history_desc')}
            checked={settings.ride_history_visible}
            onChange={(checked) => handleSettingChange('ride_history_visible', checked)}
          />
          <div className="py-3">
            <Label className="text-sm font-medium">{t('settings.profile_visibility')}</Label>
            <Select
              value={settings.profile_visibility}
              onValueChange={(value) => handleSettingChange('profile_visibility', value)}
            >
              <SelectTrigger className="mt-1.5 bg-muted/50 border-border/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">{t('settings.visibility_public')}</SelectItem>
                <SelectItem value="friends">{t('settings.visibility_friends')}</SelectItem>
                <SelectItem value="private">{t('settings.visibility_private')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Langue */}
      <div>
        <SectionLabel icon={Globe}>{t('settings.language')}</SectionLabel>
        <div className="bg-white dark:bg-card/80 dark:backdrop-blur-sm rounded-xl p-3 border border-border/50 dark:border-border/60 shadow-sm dark:shadow-lg dark:shadow-black/20">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-foreground">{t('settings.language_interface')}</Label>
            <Select
              value={language}
              onValueChange={(value) => setLanguage(value as any)}
            >
              <SelectTrigger className="bg-muted/50 border-border/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {languageOptions.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    <div className="flex items-center gap-2">
                      <span>{lang.flag}</span>
                      <span>{lang.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground/80">{t('settings.language_desc')}</p>
          </div>
        </div>
      </div>

      {/* Application */}
      <div>
        <SectionLabel icon={Smartphone}>{t('settings.app_preferences')}</SectionLabel>
        <div className="bg-white dark:bg-card/80 dark:backdrop-blur-sm rounded-xl p-3 border border-border/50 dark:border-border/60 shadow-sm dark:shadow-lg dark:shadow-black/20">
          <ToggleItem
            label={t('settings.dark_mode')}
            desc={t('settings.dark_mode_desc')}
            checked={settings.dark_mode}
            onChange={handleDarkModeToggle}
            icon={settings.dark_mode ? <Moon className="w-4 h-4 text-muted-foreground" /> : <Sun className="w-4 h-4 text-muted-foreground" />}
          />
          <ToggleItem
            label={t('settings.sound_effects')}
            desc={t('settings.sound_effects_desc')}
            checked={settings.sound_effects}
            onChange={(checked) => handleSettingChange('sound_effects', checked)}
            icon={settings.sound_effects ? <Volume2 className="w-4 h-4 text-muted-foreground" /> : <VolumeX className="w-4 h-4 text-muted-foreground" />}
          />
          <ToggleItem
            label={t('settings.auto_location')}
            desc={t('settings.auto_location_desc')}
            checked={settings.auto_location}
            onChange={(checked) => handleSettingChange('auto_location', checked)}
          />
          <ToggleItem
            label={t('settings.offline_maps')}
            desc={t('settings.offline_maps_desc')}
            checked={settings.offline_maps}
            onChange={(checked) => handleSettingChange('offline_maps', checked)}
          />
        </div>
      </div>

      {/* Sécurité */}
      <div>
        <SectionLabel icon={Lock}>{t('settings.security')}</SectionLabel>
        <div className="bg-white dark:bg-card/80 dark:backdrop-blur-sm rounded-xl p-3 border border-border/50 dark:border-border/60 shadow-sm dark:shadow-lg dark:shadow-black/20">
          <ToggleItem
            label={t('settings.two_factor')}
            desc={t('settings.two_factor_desc')}
            checked={settings.two_factor_auth}
            onChange={(checked) => handleSettingChange('two_factor_auth', checked)}
          />
          <ToggleItem
            label={t('settings.biometric')}
            desc={t('settings.biometric_desc')}
            checked={settings.biometric_login}
            onChange={(checked) => handleSettingChange('biometric_login', checked)}
          />
          <ToggleItem
            label={t('settings.auto_logout')}
            desc={t('settings.auto_logout_desc')}
            checked={settings.auto_logout}
            onChange={(checked) => handleSettingChange('auto_logout', checked)}
          />
        </div>
      </div>

      {/* Déconnexion */}
      <div>
        <SectionLabel icon={User}>Compte</SectionLabel>
        <div className="bg-white dark:bg-card/80 dark:backdrop-blur-sm rounded-xl p-3 border border-border/50 dark:border-border/60 shadow-sm dark:shadow-lg dark:shadow-black/20">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-foreground">Se déconnecter</p>
              <p className="text-xs text-muted-foreground/80">Déconnectez-vous de votre compte Tembea</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground"
              disabled={isLoggingOut}
              onClick={async () => {
                setIsLoggingOut(true);
                await signOut();
              }}
            >
              {isLoggingOut ? (
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              ) : (
                <LogOut className="w-4 h-4 mr-1.5" />
              )}
              {isLoggingOut ? 'Déconnexion...' : 'Déconnexion'}
            </Button>
          </div>
        </div>
      </div>

      {/* Zone dangereuse */}
      <div>
        <SectionLabel icon={AlertTriangle}>{t('settings.danger_zone')}</SectionLabel>
        <div className="bg-white dark:bg-card/80 dark:backdrop-blur-sm rounded-xl p-3 border border-destructive/40 dark:border-destructive/30 shadow-sm dark:shadow-lg dark:shadow-black/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
            <div className="flex-1 space-y-2">
              <p className="text-sm font-medium text-destructive">{t('settings.delete_account')}</p>
              <p className="text-xs text-muted-foreground">
                Action irréversible. Toutes vos données seront définitivement supprimées.
              </p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="rounded-xl mt-1">
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                    Supprimer mon compte
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-destructive">
                      Confirmer la suppression du compte
                    </AlertDialogTitle>
                    <AlertDialogDescription className="space-y-3">
                      <p><strong>ATTENTION :</strong> Cette action est définitive et irréversible.</p>
                      <p>Toutes vos données seront supprimées définitivement.</p>
                      <p>Pour confirmer, tapez <strong>"SUPPRIMER"</strong> ci-dessous :</p>
                      <Input
                        value={deleteConfirmation}
                        onChange={(e) => setDeleteConfirmation(e.target.value)}
                        placeholder="Tapez SUPPRIMER"
                        className="mt-2"
                      />
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setDeleteConfirmation('')}>Annuler</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      disabled={deleteConfirmation !== 'SUPPRIMER' || isDeleting}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      {isDeleting ? 'Suppression...' : 'Supprimer définitivement'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </div>

      {/* Bouton Sauvegarder unique */}
      <div className="pt-2 space-y-2">
        <Button
          onClick={saveSettings}
          disabled={loading}
          className="w-full h-11 rounded-xl text-sm font-semibold bg-primary hover:bg-primary/90"
        >
          <Check className="w-4 h-4 mr-1.5" />
          {loading ? t('settings.saving') : t('settings.save')}
        </Button>
        <button
          onClick={resetSettings}
          className="w-full text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
        >
          {t('settings.reset')}
        </button>
      </div>
    </div>
  );
};