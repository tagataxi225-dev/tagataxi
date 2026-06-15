import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { DriverValidationStatus } from './DriverValidationStatus';
import { DriverCodeManager } from './DriverCodeManager';
import { ServiceTypeSelector, ServiceType } from './ServiceTypeSelector';
import { User, Car, Bell, Shield, Save, Upload, Phone, Mail } from 'lucide-react';

interface ProfileData {
  display_name: string;
  phone_number: string;
  avatar_url?: string;
  user_type: string;
}

interface VehicleData {
  vehicle_type: string;
  vehicle_model: string;
  vehicle_plate: string;
  vehicle_year: number;
  license_number: string;
  insurance_number: string;
  service_type?: ServiceType;
}

interface SettingsData {
  language: string;
  currency: string;
  notifications_enabled: boolean;
  push_notifications: boolean;
  email_notifications: boolean;
  sms_notifications: boolean;
  location_sharing: boolean;
  dark_mode: boolean;
}

export const DriverProfileEditor: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [profileData, setProfileData] = useState<ProfileData>({
    display_name: '',
    phone_number: '',
    avatar_url: '',
    user_type: 'chauffeur'
  });

  const [vehicleData, setVehicleData] = useState<VehicleData>({
    vehicle_type: '',
    vehicle_model: '',
    vehicle_plate: '',
    vehicle_year: new Date().getFullYear(),
    license_number: '',
    insurance_number: ''
  });

  const [settingsData, setSettingsData] = useState<SettingsData>({
    language: 'fr',
    currency: 'CDF',
    notifications_enabled: true,
    push_notifications: true,
    email_notifications: true,
    sms_notifications: false,
    location_sharing: true,
    dark_mode: false
  });

  useEffect(() => {
    if (user) {
      loadProfileData();
      loadVehicleData();
      loadSettingsData();
    }
  }, [user]);

  const loadProfileData = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setProfileData({
          display_name: data.display_name || '',
          phone_number: data.phone_number || '',
          avatar_url: data.avatar_url || '',
          user_type: data.user_type || 'chauffeur'
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const loadVehicleData = async () => {
    try {
      const { data, error } = await supabase
        .from('driver_requests')
        .select('*')
        .eq('user_id', user?.id)
        .eq('status', 'approved')
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setVehicleData({
          vehicle_type: data.vehicle_type || '',
          vehicle_model: data.vehicle_model || '',
          vehicle_plate: data.vehicle_plate || '',
          vehicle_year: data.vehicle_year || new Date().getFullYear(),
          license_number: data.license_number || '',
          insurance_number: data.insurance_number || ''
        });
      }
    } catch (error) {
      console.error('Error loading vehicle data:', error);
    }
  };

  const loadSettingsData = async () => {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setSettingsData({
          language: data.language || 'fr',
          currency: data.currency || 'CDF',
          notifications_enabled: data.notifications_enabled ?? true,
          push_notifications: data.push_notifications ?? true,
          email_notifications: data.email_notifications ?? true,
          sms_notifications: data.sms_notifications ?? false,
          location_sharing: data.location_sharing ?? true,
          dark_mode: data.dark_mode ?? false
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user?.id,
          ...profileData,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Profil mis à jour avec succès",
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder le profil",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user?.id,
          ...settingsData,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Paramètres mis à jour avec succès",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les paramètres",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(filePath);

      setProfileData({ ...profileData, avatar_url: data.publicUrl });

      toast({
        title: "Succès",
        description: "Photo de profil mise à jour",
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Erreur",
        description: "Impossible de télécharger la photo",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile" className="flex items-center space-x-2">
            <User className="w-4 h-4" />
            <span>{t('profile.profile')}</span>
          </TabsTrigger>
          <TabsTrigger value="vehicle" className="flex items-center space-x-2">
            <Car className="w-4 h-4" />
            <span>{t('driver.vehicle')}</span>
          </TabsTrigger>
          <TabsTrigger value="validation" className="flex items-center space-x-2">
            <Shield className="w-4 h-4" />
            <span>{t('validation.validation')}</span>
          </TabsTrigger>
          <TabsTrigger value="partner" className="flex items-center space-x-2">
            <User className="w-4 h-4" />
            <span>Partenaire</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center space-x-2">
            <Bell className="w-4 h-4" />
            <span>{t('profile.settings')}</span>
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>Informations personnelles</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center space-x-4">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={profileData.avatar_url} />
                  <AvatarFallback>
                    {profileData.display_name?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Label htmlFor="avatar-upload" className="cursor-pointer">
                    <Button variant="outline" size="sm" asChild>
                      <span>
                        <Upload className="w-4 h-4 mr-2" />
                        Changer la photo
                      </span>
                    </Button>
                  </Label>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    JPG, PNG ou GIF. Max 2MB.
                  </p>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="display_name">Nom complet</Label>
                  <Input
                    id="display_name"
                    value={profileData.display_name}
                    onChange={(e) => setProfileData({ ...profileData, display_name: e.target.value })}
                    placeholder="Votre nom complet"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone_number">Numéro de téléphone</Label>
                  <div className="flex">
                    <div className="flex items-center px-3 border border-r-0 border-input bg-muted rounded-l-md">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <Input
                      id="phone_number"
                      value={profileData.phone_number}
                      onChange={(e) => setProfileData({ ...profileData, phone_number: e.target.value })}
                      placeholder="+243 XXX XXX XXX"
                      className="rounded-l-none"
                    />
                  </div>
                </div>
              </div>

              <Button onClick={saveProfile} disabled={saving} className="w-full">
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Sauvegarde...' : 'Sauvegarder le profil'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vehicle Tab */}
        <TabsContent value="vehicle">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Car className="w-5 h-5" />
                <span>Informations du véhicule</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vehicle_type">Type de véhicule</Label>
                  <Select value={vehicleData.vehicle_type} onValueChange={(value) => setVehicleData({ ...vehicleData, vehicle_type: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez le type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="taxi-voiture">Taxi voiture</SelectItem>
                      <SelectItem value="moto-taxi">Moto-taxi</SelectItem>
                      <SelectItem value="taxi-bus">Taxi-bus</SelectItem>
                      <SelectItem value="bus-transco">Bus Transco</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vehicle_model">Modèle</Label>
                  <Input
                    id="vehicle_model"
                    value={vehicleData.vehicle_model}
                    onChange={(e) => setVehicleData({ ...vehicleData, vehicle_model: e.target.value })}
                    placeholder="Ex: Toyota Corolla"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vehicle_plate">Plaque d'immatriculation</Label>
                  <Input
                    id="vehicle_plate"
                    value={vehicleData.vehicle_plate}
                    onChange={(e) => setVehicleData({ ...vehicleData, vehicle_plate: e.target.value })}
                    placeholder="Ex: AA 123 CD"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vehicle_year">Année</Label>
                  <Input
                    id="vehicle_year"
                    type="number"
                    value={vehicleData.vehicle_year}
                    onChange={(e) => setVehicleData({ ...vehicleData, vehicle_year: parseInt(e.target.value) })}
                    placeholder="2020"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="license_number">Numéro de permis</Label>
                  <Input
                    id="license_number"
                    value={vehicleData.license_number}
                    onChange={(e) => setVehicleData({ ...vehicleData, license_number: e.target.value })}
                    placeholder="Votre numéro de permis"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="insurance_number">Numéro d'assurance</Label>
                  <Input
                    id="insurance_number"
                    value={vehicleData.insurance_number}
                    onChange={(e) => setVehicleData({ ...vehicleData, insurance_number: e.target.value })}
                    placeholder="Votre numéro d'assurance"
                  />
                </div>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <Shield className="w-4 h-4 inline mr-2" />
                  Les modifications des informations du véhicule nécessitent une vérification.
                  Contactez le support pour toute modification.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="w-5 h-5" />
                <span>Paramètres et notifications</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Language & Currency */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="language">Langue</Label>
                  <Select value={settingsData.language} onValueChange={(value) => setSettingsData({ ...settingsData, language: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="ln">Lingala</SelectItem>
                      <SelectItem value="kg">Kikongo</SelectItem>
                      <SelectItem value="lua">Tshiluba</SelectItem>
                      <SelectItem value="sw">Swahili</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">Devise</Label>
                  <Select value={settingsData.currency} onValueChange={(value) => setSettingsData({ ...settingsData, currency: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CDF">Franc Congolais (CDF)</SelectItem>
                      <SelectItem value="USD">Dollar Américain (USD)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Notifications */}
              <div className="space-y-4">
                <h3 className="font-medium">Notifications</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="notifications_enabled">Notifications générales</Label>
                      <p className="text-sm text-muted-foreground">Activer toutes les notifications</p>
                    </div>
                    <Switch
                      id="notifications_enabled"
                      checked={settingsData.notifications_enabled}
                      onCheckedChange={(checked) => setSettingsData({ ...settingsData, notifications_enabled: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="push_notifications">Notifications push</Label>
                      <p className="text-sm text-muted-foreground">Nouvelles courses et messages</p>
                    </div>
                    <Switch
                      id="push_notifications"
                      checked={settingsData.push_notifications}
                      onCheckedChange={(checked) => setSettingsData({ ...settingsData, push_notifications: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="email_notifications">Notifications email</Label>
                      <p className="text-sm text-muted-foreground">Résumés et factures</p>
                    </div>
                    <Switch
                      id="email_notifications"
                      checked={settingsData.email_notifications}
                      onCheckedChange={(checked) => setSettingsData({ ...settingsData, email_notifications: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="sms_notifications">Notifications SMS</Label>
                      <p className="text-sm text-muted-foreground">Alertes urgentes</p>
                    </div>
                    <Switch
                      id="sms_notifications"
                      checked={settingsData.sms_notifications}
                      onCheckedChange={(checked) => setSettingsData({ ...settingsData, sms_notifications: checked })}
                    />
                  </div>
                </div>
              </div>

              {/* Privacy */}
              <div className="space-y-4">
                <h3 className="font-medium">Confidentialité</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="location_sharing">Partage de position</Label>
                      <p className="text-sm text-muted-foreground">Permettre aux clients de voir votre position</p>
                    </div>
                    <Switch
                      id="location_sharing"
                      checked={settingsData.location_sharing}
                      onCheckedChange={(checked) => setSettingsData({ ...settingsData, location_sharing: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="dark_mode">Mode sombre</Label>
                      <p className="text-sm text-muted-foreground">Interface sombre pour les yeux</p>
                    </div>
                    <Switch
                      id="dark_mode"
                      checked={settingsData.dark_mode}
                      onCheckedChange={(checked) => setSettingsData({ ...settingsData, dark_mode: checked })}
                    />
                  </div>
                </div>
              </div>

              <Button onClick={saveSettings} disabled={saving} className="w-full">
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Sauvegarde...' : 'Sauvegarder les paramètres'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Validation Tab */}
        <TabsContent value="validation">
          <DriverValidationStatus />
        </TabsContent>

        {/* Partner Tab */}
        <TabsContent value="partner">
          <DriverCodeManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};