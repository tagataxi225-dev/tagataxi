import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Settings, Bell, Clock, Volume2, Vibrate, Zap } from 'lucide-react';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';
import { useNotificationPermissions } from '@/hooks/useNotificationPermissions';

const NotificationSettings: React.FC = () => {
  const { preferences, loading, saving, updatePreference } = useNotificationPreferences();
  const { permission, isGranted, requestPermission, requesting } = useNotificationPermissions();

  const notificationTypes = [
    {
      key: 'ride_updates',
      label: 'Mises à jour de course',
      description: 'Statut des courses en temps réel',
      icon: '🚗'
    },
    {
      key: 'delivery_updates',
      label: 'Mises à jour de livraison',
      description: 'Statut des livraisons en temps réel',
      icon: '📦'
    },
    {
      key: 'payment_alerts',
      label: 'Alertes de paiement',
      description: 'Confirmations de paiement et transactions',
      icon: '💳'
    },
    {
      key: 'marketplace_updates',
      label: 'Marketplace',
      description: 'Commandes et messages marketplace',
      icon: '🛒'
    },
    {
      key: 'chat_messages',
      label: 'Messages chat',
      description: 'Nouveaux messages de chat',
      icon: '💬'
    },
    {
      key: 'driver_updates',
      label: 'Mises à jour chauffeur',
      description: 'Position et arrivée du chauffeur',
      icon: '👨‍💼'
    },
    {
      key: 'system_alerts',
      label: 'Alertes système',
      description: 'Maintenance et mises à jour importantes',
      icon: '⚙️'
    },
    {
      key: 'promotions',
      label: 'Promotions',
      description: 'Offres spéciales et réductions',
      icon: '🎁'
    }
  ];

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Chargement des paramètres...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Browser Permissions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <span>Permissions du navigateur</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Notifications push</p>
              <p className="text-sm text-muted-foreground">
                Autoriser les notifications sur votre appareil
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Statut: {permission === 'granted' ? '✅ Autorisé' : permission === 'denied' ? '❌ Refusé' : '⏳ En attente'}
              </p>
            </div>
            {!isGranted && (
              <Button 
                onClick={requestPermission}
                disabled={requesting}
                variant="outline"
              >
                {requesting ? 'En cours...' : 'Activer'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Global Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Paramètres généraux</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Notifications activées</Label>
              <p className="text-sm text-muted-foreground">
                Activer/désactiver toutes les notifications
              </p>
            </div>
            <Switch
              checked={preferences.push_enabled}
              onCheckedChange={(checked) => updatePreference('push_enabled', checked)}
              disabled={saving}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Mode priorité uniquement</Label>
              <p className="text-sm text-muted-foreground">
                Recevoir seulement les notifications importantes
              </p>
            </div>
            <Switch
              checked={preferences.priority_only}
              onCheckedChange={(checked) => updatePreference('priority_only', checked)}
              disabled={saving}
            />
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <Volume2 className="h-4 w-4 text-muted-foreground" />
              <div className="flex items-center space-x-2">
                <Label className="text-sm">Son</Label>
                <Switch
                  checked={preferences.sound_enabled}
                  onCheckedChange={(checked) => updatePreference('sound_enabled', checked)}
                  disabled={saving}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Vibrate className="h-4 w-4 text-muted-foreground" />
              <div className="flex items-center space-x-2">
                <Label className="text-sm">Vibration</Label>
                <Switch
                  checked={preferences.vibration_enabled}
                  onCheckedChange={(checked) => updatePreference('vibration_enabled', checked)}
                  disabled={saving}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Label className="text-sm">Digest</Label>
              <Select
                value={preferences.digest_frequency}
                onValueChange={(value) => updatePreference('digest_frequency', value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun</SelectItem>
                  <SelectItem value="daily">Quotidien</SelectItem>
                  <SelectItem value="weekly">Hebdomadaire</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quiet Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Heures silencieuses</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Désactiver les notifications non urgentes pendant ces heures
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm">Début</Label>
              <Input
                type="time"
                value={preferences.quiet_hours_start || '22:00'}
                onChange={(e) => updatePreference('quiet_hours_start', e.target.value)}
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Fin</Label>
              <Input
                type="time"
                value={preferences.quiet_hours_end || '08:00'}
                onChange={(e) => updatePreference('quiet_hours_end', e.target.value)}
                disabled={saving}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Types */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5" />
            <span>Types de notifications</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {notificationTypes.map((type, index) => (
            <div key={type.key}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{type.icon}</span>
                  <div>
                    <p className="font-medium text-sm">{type.label}</p>
                    <p className="text-xs text-muted-foreground">{type.description}</p>
                  </div>
                </div>
                <Switch
                  checked={preferences[type.key as keyof typeof preferences] as boolean}
                  onCheckedChange={(checked) => updatePreference(type.key as keyof typeof preferences, checked)}
                  disabled={saving}
                />
              </div>
              {index < notificationTypes.length - 1 && <Separator className="mt-4" />}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationSettings;