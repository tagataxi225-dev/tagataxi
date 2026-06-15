import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import {
  Settings as SettingsIcon, Bell, MapPin, Shield,
  Languages, Moon, Volume2, Vibrate, Car
} from 'lucide-react';

export const DriverSettings: React.FC = () => {
  const [settings, setSettings] = React.useState({
    // Notifications
    newRidesNotifications: true,
    messagesNotifications: true,
    earningsNotifications: true,
    challengesNotifications: true,
    pushNotifications: true,
    soundNotifications: true,
    vibration: true,
    
    // Préférences travail
    autoAccept: false,
    doNotDisturb: false,
    acceptanceRadius: 5, // km
    
    // Apparence
    darkMode: false,
    language: 'fr',
  });

  const handleToggle = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    toast.success('Paramètre mis à jour');
  };

  const handleRadiusChange = (value: number[]) => {
    setSettings(prev => ({ ...prev, acceptanceRadius: value[0] }));
  };

  return (
    <div className="space-y-6 pb-24">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5" />
            Paramètres du compte
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Notifications */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Notifications</h3>
            </div>

            <div className="space-y-3 pl-7">
              <div className="flex items-center justify-between">
                <Label htmlFor="new-rides" className="cursor-pointer">
                  Nouvelles courses
                </Label>
                <Switch
                  id="new-rides"
                  checked={settings.newRidesNotifications}
                  onCheckedChange={() => handleToggle('newRidesNotifications')}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="messages" className="cursor-pointer">
                  Messages clients
                </Label>
                <Switch
                  id="messages"
                  checked={settings.messagesNotifications}
                  onCheckedChange={() => handleToggle('messagesNotifications')}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="earnings" className="cursor-pointer">
                  Gains reçus
                </Label>
                <Switch
                  id="earnings"
                  checked={settings.earningsNotifications}
                  onCheckedChange={() => handleToggle('earningsNotifications')}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="challenges" className="cursor-pointer">
                  Challenges terminés
                </Label>
                <Switch
                  id="challenges"
                  checked={settings.challengesNotifications}
                  onCheckedChange={() => handleToggle('challengesNotifications')}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  <Label htmlFor="push" className="cursor-pointer">
                    Notifications push
                  </Label>
                </div>
                <Switch
                  id="push"
                  checked={settings.pushNotifications}
                  onCheckedChange={() => handleToggle('pushNotifications')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4" />
                  <Label htmlFor="sound" className="cursor-pointer">
                    Son
                  </Label>
                </div>
                <Switch
                  id="sound"
                  checked={settings.soundNotifications}
                  onCheckedChange={() => handleToggle('soundNotifications')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Vibrate className="h-4 w-4" />
                  <Label htmlFor="vibration" className="cursor-pointer">
                    Vibration
                  </Label>
                </div>
                <Switch
                  id="vibration"
                  checked={settings.vibration}
                  onCheckedChange={() => handleToggle('vibration')}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Préférences de travail */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Car className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Préférences de travail</h3>
            </div>

            <div className="space-y-4 pl-7">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="radius">
                    Rayon d'acceptation : {settings.acceptanceRadius} km
                  </Label>
                </div>
                <Slider
                  id="radius"
                  value={[settings.acceptanceRadius]}
                  onValueChange={handleRadiusChange}
                  min={1}
                  max={20}
                  step={1}
                  className="w-full"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auto-accept" className="cursor-pointer">
                    Acceptation automatique
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Accepter automatiquement les courses dans votre rayon
                  </p>
                </div>
                <Switch
                  id="auto-accept"
                  checked={settings.autoAccept}
                  onCheckedChange={() => handleToggle('autoAccept')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="dnd" className="cursor-pointer">
                    Mode "Ne pas déranger"
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Suspendre temporairement toutes les alertes
                  </p>
                </div>
                <Switch
                  id="dnd"
                  checked={settings.doNotDisturb}
                  onCheckedChange={() => handleToggle('doNotDisturb')}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Apparence */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Moon className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Apparence</h3>
            </div>

            <div className="space-y-3 pl-7">
              <div className="flex items-center justify-between">
                <Label htmlFor="dark-mode" className="cursor-pointer">
                  Mode sombre
                </Label>
                <Switch
                  id="dark-mode"
                  checked={settings.darkMode}
                  onCheckedChange={() => handleToggle('darkMode')}
                />
              </div>

              <div className="flex items-center gap-2">
                <Languages className="h-4 w-4" />
                <Label>Langue : Français</Label>
              </div>
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="space-y-3">
            <Button variant="outline" className="w-full" onClick={() => toast.info('Bientôt disponible')}>
              <Shield className="h-4 w-4 mr-2" />
              Modifier le mot de passe
            </Button>

            <Button variant="outline" className="w-full" onClick={() => toast.info('Bientôt disponible')}>
              <MapPin className="h-4 w-4 mr-2" />
              Gérer les zones préférées
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DriverSettings;
