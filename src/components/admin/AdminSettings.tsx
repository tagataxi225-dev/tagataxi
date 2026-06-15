import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Settings, 
  Shield, 
  Bell, 
  CreditCard, 
  Mail, 
  MapPin, 
  Wrench,
  Save,
  AlertTriangle,
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AdminSetting {
  id: string;
  setting_key: string;
  setting_value: any;
  setting_type: string;
  description: string;
  is_active: boolean;
  requires_restart: boolean;
}

interface SystemNotification {
  id: string;
  notification_type: string;
  title: string;
  message: string;
  reference_id: string;
  is_sent: boolean;
  sent_at: string;
  created_at: string;
  user_id: string;
}

interface PaymentSetting {
  id: string;
  provider_name: string;
  provider_config: any;
  is_enabled: boolean;
  is_test_mode: boolean;
  supported_currencies: string[];
  minimum_amount: number;
  maximum_amount?: number;
  commission_rate: number;
}

export const AdminSettings: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<AdminSetting[]>([]);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSetting[]>([]);
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    loadAllSettings();
  }, []);

  const loadAllSettings = async () => {
    setLoading(true);
    try {
      const [settingsRes, notificationsRes, paymentsRes] = await Promise.all([
        supabase.from('admin_settings').select('*').order('setting_type', { ascending: true }),
        supabase.from('push_notifications').select('*').order('created_at', { ascending: false }),
        supabase.from('payment_settings').select('*').order('provider_name', { ascending: true })
      ]);

      if (settingsRes.data) setSettings(settingsRes.data);
      if (notificationsRes.data) setNotifications(notificationsRes.data);
      if (paymentsRes.data) setPaymentSettings(paymentsRes.data);
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les paramètres",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (settingKey: string, value: any) => {
    try {
      const { error } = await supabase
        .from('admin_settings')
        .update({ setting_value: value, updated_at: new Date().toISOString() })
        .eq('setting_key', settingKey);

      if (error) throw error;

      setSettings(prev => prev.map(setting => 
        setting.setting_key === settingKey 
          ? { ...setting, setting_value: value }
          : setting
      ));

      toast({
        title: "Paramètre mis à jour",
        description: `Le paramètre ${settingKey} a été modifié avec succès`,
      });
    } catch (error) {
      console.error('Error updating setting:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le paramètre",
        variant: "destructive",
      });
    }
  };

  const createSystemNotification = async (notification: { title: string; message: string; notification_type: string }) => {
    try {
      const { error } = await supabase
        .from('push_notifications')
        .insert([{
          title: notification.title,
          message: notification.message,
          notification_type: notification.notification_type,
          user_id: (await supabase.auth.getUser()).data.user?.id || ''
        }]);

      if (error) throw error;

      toast({
        title: "Notification créée",
        description: "La notification système a été créée avec succès",
      });

      loadAllSettings();
    } catch (error) {
      console.error('Error creating notification:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer la notification",
        variant: "destructive",
      });
    }
  };

  const getSettingsByType = (type: string) => {
    return settings.filter(setting => setting.setting_type === type);
  };

  const getSettingValue = (key: string) => {
    const setting = settings.find(s => s.setting_key === key);
    return setting ? setting.setting_value : null;
  };

  const SettingCard: React.FC<{ 
    setting: AdminSetting; 
    onUpdate: (key: string, value: any) => void 
  }> = ({ setting, onUpdate }) => {
    const [value, setValue] = useState(setting.setting_value);

    const handleChange = (newValue: any) => {
      setValue(newValue);
      onUpdate(setting.setting_key, newValue);
    };

    const renderInput = () => {
      if (typeof setting.setting_value === 'boolean') {
        return (
          <Switch
            checked={value}
            onCheckedChange={handleChange}
          />
        );
      }

      if (typeof setting.setting_value === 'number') {
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => handleChange(Number(e.target.value))}
          />
        );
      }

      return (
        <Input
          value={typeof value === 'string' ? value.replace(/"/g, '') : value}
          onChange={(e) => handleChange(`"${e.target.value}"`)}
        />
      );
    };

    return (
      <Card className="mb-4">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label className="text-sm font-medium">{setting.setting_key}</Label>
              <p className="text-xs text-muted-foreground mt-1">{setting.description}</p>
              {setting.requires_restart && (
                <Badge variant="secondary" className="mt-2">
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Redémarrage requis
                </Badge>
              )}
            </div>
            <div className="ml-4 min-w-[200px]">
              {renderInput()}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Paramètres Admin</h1>
          <p className="text-muted-foreground">
            Configuration générale de l'application Tembea Transport
          </p>
        </div>
        <Button onClick={loadAllSettings} variant="outline" disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Général
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Sécurité
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Paiements
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email
          </TabsTrigger>
          <TabsTrigger value="maps" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Cartes
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Maintenance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Paramètres Généraux
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {getSettingsByType('general').map((setting) => (
                <SettingCard 
                  key={setting.id} 
                  setting={setting} 
                  onUpdate={updateSetting}
                />
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Les paramètres de sécurité affectent la protection des données et l'accès aux fonctionnalités.
            </AlertDescription>
          </Alert>
          
          <Card>
            <CardHeader>
              <CardTitle>Configuration de Sécurité</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {getSettingsByType('security').map((setting) => (
                <SettingCard 
                  key={setting.id} 
                  setting={setting} 
                  onUpdate={updateSetting}
                />
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications Système
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <Card key={notification.id} className="border-l-4 border-l-primary">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">{notification.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant={notification.is_sent ? "default" : "secondary"}>
                              {notification.is_sent ? "Envoyé" : "En attente"}
                            </Badge>
                            <Badge variant="outline">
                              {notification.notification_type}
                            </Badge>
                            <Badge variant="outline">
                              {new Date(notification.created_at).toLocaleDateString()}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Fournisseurs de Paiement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {paymentSettings.map((payment) => (
                  <Card key={payment.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{payment.provider_name}</h4>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant={payment.is_enabled ? "default" : "secondary"}>
                              {payment.is_enabled ? "Activé" : "Désactivé"}
                            </Badge>
                            <Badge variant={payment.is_test_mode ? "destructive" : "default"}>
                              {payment.is_test_mode ? "Test" : "Production"}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              Commission: {payment.commission_rate}%
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm">
                            Min: {payment.minimum_amount} {payment.supported_currencies[0]}
                          </p>
                          {payment.maximum_amount && (
                            <p className="text-sm">
                              Max: {payment.maximum_amount} {payment.supported_currencies[0]}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Configuration Email
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {getSettingsByType('contact').map((setting) => (
                <SettingCard 
                  key={setting.id} 
                  setting={setting} 
                  onUpdate={updateSetting}
                />
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maps" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Configuration des Cartes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {getSettingsByType('maps').map((setting) => (
                <SettingCard 
                  key={setting.id} 
                  setting={setting} 
                  onUpdate={updateSetting}
                />
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Le mode maintenance désactive temporairement l'application pour tous les utilisateurs.
            </AlertDescription>
          </Alert>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Maintenance et Système
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {getSettingsByType('system').map((setting) => (
                <SettingCard 
                  key={setting.id} 
                  setting={setting} 
                  onUpdate={updateSetting}
                />
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSettings;