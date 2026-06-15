import React, { useState } from 'react';
import { Settings, Bell, Shield, Globe, Users, Key } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

export const PartnerSettings: React.FC = () => {
  const [notifications, setNotifications] = useState({
    newDrivers: true,
    rentalRequests: true,
    commissionsReceived: true,
    vehicleMaintenance: true,
    driverMessages: true,
    pushEnabled: true,
    emailEnabled: true,
    smsEnabled: false,
  });

  const [preferences, setPreferences] = useState({
    autoAcceptDrivers: false,
    manualVehicleValidation: true,
    activeZones: ['Kinshasa', 'Lubumbashi'],
  });

  const handleSaveNotifications = () => {
    toast.success('Paramètres de notification enregistrés');
  };

  const handleSavePreferences = () => {
    toast.success('Préférences business enregistrées');
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Notifications */}
      <Card className="card-floating border-0">
        <CardHeader>
          <CardTitle className="text-heading-md flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Notifications
          </CardTitle>
          <CardDescription>Gérez vos préférences de notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="new-drivers" className="text-body-md">Nouveaux chauffeurs inscrits</Label>
              <Switch
                id="new-drivers"
                checked={notifications.newDrivers}
                onCheckedChange={(checked) => setNotifications({ ...notifications, newDrivers: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="rental-requests" className="text-body-md">Nouvelles demandes de location</Label>
              <Switch
                id="rental-requests"
                checked={notifications.rentalRequests}
                onCheckedChange={(checked) => setNotifications({ ...notifications, rentalRequests: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="commissions" className="text-body-md">Commissions reçues</Label>
              <Switch
                id="commissions"
                checked={notifications.commissionsReceived}
                onCheckedChange={(checked) => setNotifications({ ...notifications, commissionsReceived: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="maintenance" className="text-body-md">Alertes maintenance véhicules</Label>
              <Switch
                id="maintenance"
                checked={notifications.vehicleMaintenance}
                onCheckedChange={(checked) => setNotifications({ ...notifications, vehicleMaintenance: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="messages" className="text-body-md">Messages des chauffeurs</Label>
              <Switch
                id="messages"
                checked={notifications.driverMessages}
                onCheckedChange={(checked) => setNotifications({ ...notifications, driverMessages: checked })}
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <h4 className="text-body-md font-semibold">Canaux de notification</h4>
            <div className="flex items-center justify-between">
              <Label htmlFor="push" className="text-body-md">Notifications push</Label>
              <Switch
                id="push"
                checked={notifications.pushEnabled}
                onCheckedChange={(checked) => setNotifications({ ...notifications, pushEnabled: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="email" className="text-body-md">Email</Label>
              <Switch
                id="email"
                checked={notifications.emailEnabled}
                onCheckedChange={(checked) => setNotifications({ ...notifications, emailEnabled: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="sms" className="text-body-md">SMS</Label>
              <Switch
                id="sms"
                checked={notifications.smsEnabled}
                onCheckedChange={(checked) => setNotifications({ ...notifications, smsEnabled: checked })}
              />
            </div>
          </div>

          <Button onClick={handleSaveNotifications} className="w-full">
            Enregistrer les notifications
          </Button>
        </CardContent>
      </Card>

      {/* Préférences Business */}
      <Card className="card-floating border-0">
        <CardHeader>
          <CardTitle className="text-heading-md flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Préférences business
          </CardTitle>
          <CardDescription>Configurez le fonctionnement de votre entreprise</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto-accept" className="text-body-md">Acceptation automatique chauffeurs</Label>
              <p className="text-caption text-muted-foreground">Les chauffeurs sont automatiquement approuvés</p>
            </div>
            <Switch
              id="auto-accept"
              checked={preferences.autoAcceptDrivers}
              onCheckedChange={(checked) => setPreferences({ ...preferences, autoAcceptDrivers: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="manual-validation" className="text-body-md">Validation manuelle véhicules</Label>
              <p className="text-caption text-muted-foreground">Vérifier chaque véhicule avant publication</p>
            </div>
            <Switch
              id="manual-validation"
              checked={preferences.manualVehicleValidation}
              onCheckedChange={(checked) => setPreferences({ ...preferences, manualVehicleValidation: checked })}
            />
          </div>

          <Button onClick={handleSavePreferences} className="w-full">
            Enregistrer les préférences
          </Button>
        </CardContent>
      </Card>

      {/* Compte */}
      <Card className="card-floating border-0">
        <CardHeader>
          <CardTitle className="text-heading-md flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            Paramètres du compte
          </CardTitle>
          <CardDescription>Modifier les informations de connexion</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">Mot de passe actuel</Label>
            <Input id="current-password" type="password" placeholder="••••••••" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">Nouveau mot de passe</Label>
            <Input id="new-password" type="password" placeholder="••••••••" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
            <Input id="confirm-password" type="password" placeholder="••••••••" />
          </div>
          <Button onClick={() => toast.info('Fonctionnalité à venir')} className="w-full">
            Modifier le mot de passe
          </Button>
        </CardContent>
      </Card>

      {/* Langue & Région */}
      <Card className="card-floating border-0">
        <CardHeader>
          <CardTitle className="text-heading-md flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Langue & Région
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="language">Langue de l'application</Label>
            <Select defaultValue="fr">
              <SelectTrigger id="language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fr">Français</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="currency">Devise par défaut</Label>
            <Select defaultValue="CDF">
              <SelectTrigger id="currency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CDF">CDF (Franc Congolais)</SelectItem>
                <SelectItem value="XOF">XOF (Franc CFA)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => toast.success('Paramètres de langue enregistrés')} className="w-full">
            Enregistrer
          </Button>
        </CardContent>
      </Card>

      {/* Sécurité */}
      <Card className="card-floating border-0">
        <CardHeader>
          <CardTitle className="text-heading-md flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Sécurité
          </CardTitle>
          <CardDescription>Renforcez la sécurité de votre compte</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-body-md">Authentification à deux facteurs</Label>
              <p className="text-caption text-muted-foreground">Sécurisez votre compte avec 2FA</p>
            </div>
            <Button variant="outline" onClick={() => toast.info('Fonctionnalité à venir')}>
              Activer
            </Button>
          </div>
          <Separator />
          <div>
            <Button variant="outline" className="w-full" onClick={() => toast.info('Fonctionnalité à venir')}>
              Voir l'historique des connexions
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
