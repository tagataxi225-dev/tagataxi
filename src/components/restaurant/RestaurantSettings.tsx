import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Bell, Clock, Shield, Globe, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { RestaurantImageSettings } from './RestaurantImageSettings';

export function RestaurantSettings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    notifications: {
      newOrders: true,
      orderUpdates: true,
      marketing: false,
      emailNotifications: true,
    },
    business: {
      acceptNewOrders: true,
      autoConfirm: false,
      defaultPrepTime: 15,
    },
    account: {
      language: 'fr',
      timezone: 'Africa/Kinshasa',
    },
  });

  const handleSave = () => {
    toast({
      title: 'Paramètres enregistrés',
      description: 'Vos modifications ont été sauvegardées',
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Paramètres</h2>
        <p className="text-muted-foreground mt-1">
          Gérez les paramètres de votre compte restaurant
        </p>
      </div>

      {/* Images du restaurant */}
      <RestaurantImageSettings />

      <Separator className="my-6" />

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>
            Gérez vos préférences de notification
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="new-orders">Nouvelles commandes</Label>
              <p className="text-sm text-muted-foreground">
                Recevoir une notification pour chaque nouvelle commande
              </p>
            </div>
            <Switch
              id="new-orders"
              checked={settings.notifications.newOrders}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  notifications: { ...settings.notifications, newOrders: checked },
                })
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="order-updates">Mises à jour commandes</Label>
              <p className="text-sm text-muted-foreground">
                Notifications lors des changements de statut
              </p>
            </div>
            <Switch
              id="order-updates"
              checked={settings.notifications.orderUpdates}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  notifications: { ...settings.notifications, orderUpdates: checked },
                })
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="email-notif">Notifications par email</Label>
              <p className="text-sm text-muted-foreground">
                Recevoir aussi les notifications par email
              </p>
            </div>
            <Switch
              id="email-notif"
              checked={settings.notifications.emailNotifications}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  notifications: { ...settings.notifications, emailNotifications: checked },
                })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Paramètres Business */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Préférences restaurant
          </CardTitle>
          <CardDescription>
            Configuration de votre activité
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="accept-orders">Accepter de nouvelles commandes</Label>
              <p className="text-sm text-muted-foreground">
                Désactivez si vous êtes fermé ou débordé
              </p>
            </div>
            <Switch
              id="accept-orders"
              checked={settings.business.acceptNewOrders}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  business: { ...settings.business, acceptNewOrders: checked },
                })
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto-confirm">Confirmation automatique</Label>
              <p className="text-sm text-muted-foreground">
                Confirmer automatiquement les nouvelles commandes
              </p>
            </div>
            <Switch
              id="auto-confirm"
              checked={settings.business.autoConfirm}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  business: { ...settings.business, autoConfirm: checked },
                })
              }
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="prep-time">Temps de préparation par défaut (minutes)</Label>
            <Input
              id="prep-time"
              type="number"
              value={settings.business.defaultPrepTime}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  business: { ...settings.business, defaultPrepTime: parseInt(e.target.value) || 15 },
                })
              }
              min="5"
              max="120"
            />
          </div>
        </CardContent>
      </Card>

      {/* Paramètres compte */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Paramètres du compte
          </CardTitle>
          <CardDescription>
            Sécurité et préférences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="language">Langue</Label>
            <select
              id="language"
              className="w-full px-3 py-2 rounded-md border bg-background"
              value={settings.account.language}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  account: { ...settings.account, language: e.target.value },
                })
              }
            >
              <option value="fr">Français</option>
              <option value="en">English</option>
            </select>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Changer le mot de passe</Label>
            <Button variant="outline" className="w-full">
              Modifier le mot de passe
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bouton sauvegarder */}
      <Button onClick={handleSave} className="w-full" size="lg">
        <Save className="h-4 w-4 mr-2" />
        Enregistrer les modifications
      </Button>
    </div>
  );
}
