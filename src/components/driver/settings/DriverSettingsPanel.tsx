/**
 * 🔧 Panneau de réglages chauffeur
 */

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  LogOut, 
  Bell, 
  Moon, 
  Globe, 
  Shield, 
  HelpCircle,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';

interface DriverSettingsPanelProps {
  onClose: () => void;
}

export const DriverSettingsPanel = ({ onClose }: DriverSettingsPanelProps) => {
  const { signOut } = useAuth();
  const { t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [notifications, setNotifications] = useState(true);

  const handleSignOut = async () => {
    try {
      setIsLoggingOut(true);
      await signOut();
      toast.success(t('driver.logout_success'));
      onClose();
    } catch (error) {
      console.error('Erreur déconnexion:', error);
      toast.error(t('driver.logout_error'));
    } finally {
      setIsLoggingOut(false);
    }
  };

  const settingsItems = [
    {
      icon: Bell,
      label: t('driver_settings.notifications'),
      description: t('driver_settings.notifications_desc'),
      action: (
        <Switch 
          checked={notifications} 
          onCheckedChange={setNotifications}
        />
      )
    },
    {
      icon: Moon,
      label: t('driver_settings.dark_mode'),
      description: t('driver_settings.dark_mode_desc'),
      action: (
        <Switch 
          checked={theme === 'dark'} 
          onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
        />
      )
    },
    {
      icon: Globe,
      label: t('driver_settings.language'),
      description: t('driver_settings.language_value'),
      action: <ChevronRight className="w-5 h-5 text-muted-foreground" />
    },
    {
      icon: Shield,
      label: t('driver_settings.privacy'),
      description: t('driver_settings.privacy_desc'),
      action: <ChevronRight className="w-5 h-5 text-muted-foreground" />
    },
    {
      icon: HelpCircle,
      label: t('driver_settings.help'),
      description: t('driver_settings.help_desc'),
      action: <ChevronRight className="w-5 h-5 text-muted-foreground" />
    }
  ];

  return (
    <div className="space-y-4">
      {/* Settings Items */}
      <div className="space-y-2">
        {settingsItems.map((item, index) => (
          <div 
            key={index}
            className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-muted">
                <item.icon className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <Label className="font-medium">{item.label}</Label>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
            </div>
            {item.action}
          </div>
        ))}
      </div>

      <Separator />

      {/* Déconnexion */}
      <Button
        variant="destructive"
        className="w-full"
        onClick={handleSignOut}
        disabled={isLoggingOut}
      >
        {isLoggingOut ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            {t('driver.logging_out')}
          </>
        ) : (
          <>
            <LogOut className="w-4 h-4 mr-2" />
            {t('driver.disconnect')}
          </>
        )}
      </Button>
    </div>
  );
};
