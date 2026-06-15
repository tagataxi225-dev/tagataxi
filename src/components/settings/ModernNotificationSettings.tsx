import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { Bell, Volume2, Clock, MapPin, Moon, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useModernNotifications } from '@/hooks/useModernNotifications';

export const ModernNotificationSettings: React.FC = () => {
  const { preferences, updatePreferences } = useUserPreferences();
  const { showToast } = useModernNotifications();

  const notificationPrefs = preferences.notification_preferences || {};

  const handleToggle = async (key: string, value: boolean) => {
    await updatePreferences({
      notification_preferences: {
        ...notificationPrefs,
        [key]: value
      }
    });
  };

  const handleVolumeChange = async (value: number[]) => {
    await updatePreferences({
      notification_preferences: {
        ...notificationPrefs,
        notification_sound_volume: value[0]
      }
    });
  };

  const handleDurationChange = async (duration: string) => {
    await updatePreferences({
      notification_preferences: {
        ...notificationPrefs,
        notification_duration: parseInt(duration)
      }
    });
  };

  const handlePositionChange = async (position: string) => {
    await updatePreferences({
      notification_preferences: {
        ...notificationPrefs,
        notification_position: position
      }
    });
  };

  const handleTestNotification = () => {
    showToast({
      type: 'transport',
      priority: 'high',
      title: 'Test de notification',
      message: 'Voici à quoi ressemblera une notification moderne!',
      badge: '🚗 Transport'
    });
  };

  const notificationTypes = [
    { key: 'transport', label: 'Transport VTC', icon: '🚗' },
    { key: 'delivery', label: 'Livraison', icon: '📦' },
    { key: 'marketplace', label: 'Marketplace', icon: '🛒' },
    { key: 'lottery', label: 'Loterie', icon: '🎰' },
    { key: 'wallet', label: 'Portefeuille', icon: '💰' },
    { key: 'chat', label: 'Chat', icon: '💬' },
    { key: 'system', label: 'Système', icon: '⚙️' }
  ];

  const typesEnabled = notificationPrefs.notification_types_enabled || {};

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Bell className="h-6 w-6" />
          Notifications Modernes
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Personnalisez vos notifications push et toasts visuels
        </p>
      </div>

      {/* Test Button */}
      <Card>
        <CardHeader>
          <CardTitle>Tester les notifications</CardTitle>
          <CardDescription>
            Voir un aperçu des notifications modernes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleTestNotification} className="w-full">
            <Bell className="h-4 w-4 mr-2" />
            Afficher une notification test
          </Button>
        </CardContent>
      </Card>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Paramètres généraux
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="toast-enabled">Toasts visuels</Label>
              <p className="text-sm text-muted-foreground">
                Afficher les notifications en haut de l'écran
              </p>
            </div>
            <Switch
              id="toast-enabled"
              checked={notificationPrefs.notification_toast_enabled !== false}
              onCheckedChange={(checked) => handleToggle('notification_toast_enabled', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="sound-enabled">Sons de notification</Label>
              <p className="text-sm text-muted-foreground">
                Jouer un son lors des notifications
              </p>
            </div>
            <Switch
              id="sound-enabled"
              checked={notificationPrefs.notification_sound_enabled !== false}
              onCheckedChange={(checked) => handleToggle('notification_sound_enabled', checked)}
            />
          </div>

          {notificationPrefs.notification_sound_enabled !== false && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4" />
                  Volume
                </Label>
                <span className="text-sm text-muted-foreground">
                  {notificationPrefs.notification_sound_volume || 70}%
                </span>
              </div>
              <Slider
                value={[notificationPrefs.notification_sound_volume || 70]}
                onValueChange={handleVolumeChange}
                max={100}
                step={5}
                className="w-full"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Display Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Affichage
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="duration">Durée d'affichage</Label>
            <Select
              value={String(notificationPrefs.notification_duration || 6000)}
              onValueChange={handleDurationChange}
            >
              <SelectTrigger id="duration">
                <SelectValue placeholder="Choisir la durée" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3000">3 secondes</SelectItem>
                <SelectItem value="5000">5 secondes</SelectItem>
                <SelectItem value="6000">6 secondes (recommandé)</SelectItem>
                <SelectItem value="8000">8 secondes</SelectItem>
                <SelectItem value="10000">10 secondes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="position" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Position
            </Label>
            <Select
              value={notificationPrefs.notification_position || 'top-center'}
              onValueChange={handlePositionChange}
            >
              <SelectTrigger id="position">
                <SelectValue placeholder="Position des toasts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="top-center">Haut centre (recommandé)</SelectItem>
                <SelectItem value="top-right">Haut droite</SelectItem>
                <SelectItem value="top-left">Haut gauche</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Do Not Disturb */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Moon className="h-5 w-5" />
            Ne pas déranger
          </CardTitle>
          <CardDescription>
            Désactiver les notifications pendant certaines heures
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="dnd-enabled">Activer le mode silencieux</Label>
              <p className="text-sm text-muted-foreground">
                De 22h00 à 07h00 par défaut
              </p>
            </div>
            <Switch
              id="dnd-enabled"
              checked={notificationPrefs.notification_do_not_disturb === true}
              onCheckedChange={(checked) => handleToggle('notification_do_not_disturb', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Filter by Type */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres par service
          </CardTitle>
          <CardDescription>
            Choisir les types de notifications à recevoir
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {notificationTypes.map((type) => (
            <div key={type.key} className="flex items-center justify-between">
              <Label htmlFor={`type-${type.key}`} className="flex items-center gap-2">
                <span>{type.icon}</span>
                {type.label}
              </Label>
              <Switch
                id={`type-${type.key}`}
                checked={typesEnabled[type.key] !== false}
                onCheckedChange={(checked) => {
                  handleToggle('notification_types_enabled', {
                    ...typesEnabled,
                    [type.key]: checked
                  } as any);
                }}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};
