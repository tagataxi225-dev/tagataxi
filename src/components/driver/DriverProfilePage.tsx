import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Wallet, Gift, Users, Trophy, History, Car,
  MapPin, Bell, Settings, QrCode, Phone,
  Shield, LogOut, FileText, Globe
} from 'lucide-react';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { DriverProfileHeader } from './DriverProfileHeader';
import { DriverStats } from './DriverStats';
import { DriverOrderHistory } from './DriverOrderHistory';
import { DriverDocuments } from './DriverDocuments';
import { DriverSettings } from './DriverSettings';
import { WalletPanel } from './modals/WalletPanel';
import { PromoCodePanel } from './modals/PromoCodePanel';
import { ReferralPanel } from './modals/ReferralPanel';
import { BadgesPanel } from './modals/BadgesPanel';
import { VehiclesModal } from './modals/VehiclesModal';
import { ServiceZonesModal } from './modals/ServiceZonesModal';
import { NotificationsPanel } from './modals/NotificationsPanel';
import { PartnerCodeModal } from './modals/PartnerCodeModal';
import { SupportPanel } from './modals/SupportPanel';
import { SecurityPanel } from './modals/SecurityPanel';

type DialogView = 'wallet' | 'promo' | 'referral' | 'badges' | 'history' | 'vehicles' | 'zones' | 'notifications' | 'settings' | 'partner-code' | 'support' | 'security' | 'documents' | null;

interface PartnerVehicle {
  brand: string;
  model: string;
  license_plate: string;
  vehicle_class: string;
}

export const DriverProfilePage: React.FC = () => {
  const { user, signOut } = useAuth();
  const { t } = useLanguage();
  const [dialogView, setDialogView] = useState<DialogView>(null);
  const [partnerVehicle, setPartnerVehicle] = useState<PartnerVehicle | null>(null);
  const [chauffeurCity, setChauffeurCity] = useState<string>('');
  const [savingCity, setSavingCity] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('partner_taxi_vehicles')
      .select('brand, model, license_plate, vehicle_class')
      .eq('assigned_driver_id', user.id)
      .maybeSingle()
      .then(({ data }) => setPartnerVehicle(data ?? null));

    supabase
      .from('chauffeurs')
      .select('city')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => { if (data?.city) setChauffeurCity(data.city); });
  }, [user?.id]);

  const handleCityChange = async (city: string) => {
    if (!user) return;
    setSavingCity(true);
    const { error } = await supabase
      .from('chauffeurs')
      .update({ city })
      .eq('user_id', user.id);
    setSavingCity(false);
    if (error) {
      toast.error('Impossible de sauvegarder la ville');
    } else {
      setChauffeurCity(city);
      toast.success(`Zone de service : ${city}`);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      toast.error(t('driver.logout_error'));
    }
  };

  const menuItems = [
    {
      section: t('driver_profile.section_activity'),
      items: [
        { icon: History, label: t('driver_profile.ride_history'), action: 'history' as DialogView, color: 'text-blue-600' },
        { icon: Car, label: t('driver_profile.my_vehicles'), action: 'vehicles' as DialogView, color: 'text-orange-600' },
        { icon: MapPin, label: t('driver_profile.service_zones'), action: 'zones' as DialogView, color: 'text-green-600' },
      ]
    },
    {
      section: t('driver_profile.section_management'),
      items: [
        { icon: Bell, label: t('driver_profile.notifications'), action: 'notifications' as DialogView, color: 'text-purple-600' },
        { icon: Settings, label: t('driver_profile.settings'), action: 'settings' as DialogView, color: 'text-gray-600' },
        { icon: QrCode, label: t('driver_profile.partner_code'), action: 'partner-code' as DialogView, color: 'text-indigo-600' },
      ]
    },
    {
      section: t('driver_profile.section_support'),
      items: [
        { icon: Phone, label: t('driver_profile.support'), action: 'support' as DialogView, color: 'text-teal-600' },
        { icon: Shield, label: t('driver_profile.security'), action: 'security' as DialogView, color: 'text-red-600' },
        { icon: FileText, label: t('driver_profile.documents'), action: 'documents' as DialogView, color: 'text-amber-600' },
      ]
    }
  ];

  const quickActions = [
    { icon: Wallet, label: t('driver.wallet'), color: 'bg-green-50 text-green-700', action: 'wallet' as DialogView },
    { icon: Gift, label: t('driver_profile.promo_codes'), color: 'bg-purple-50 text-purple-700', action: 'promo' as DialogView },
    { icon: Users, label: t('driver.referral'), color: 'bg-blue-50 text-blue-700', action: 'referral' as DialogView },
    { icon: Trophy, label: t('driver_profile.my_badges'), color: 'bg-yellow-50 text-yellow-700', action: 'badges' as DialogView },
  ];

  const dialogTitles: Record<Exclude<DialogView, null>, string> = {
    wallet: t('driver_profile.wallet_title'),
    promo: t('driver_profile.promo_codes'),
    referral: t('driver.referral'),
    badges: t('driver_profile.my_badges'),
    history: t('driver_profile.ride_history'),
    vehicles: t('driver_profile.my_vehicles'),
    zones: t('driver_profile.service_zones'),
    notifications: t('driver_profile.notifications'),
    settings: t('driver_profile.settings'),
    'partner-code': t('driver_profile.partner_code'),
    support: t('driver_profile.support'),
    security: t('driver_profile.security'),
    documents: t('driver_profile.my_documents'),
  };

  return (
    <div className="space-y-6 pb-24">
      <DriverProfileHeader />
      <DriverStats />

      {/* Mon véhicule (partenaire) */}
      {partnerVehicle && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Car className="h-5 w-5 text-orange-600" />
              Mon véhicule
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground">Marque</p>
                <p className="font-medium">{partnerVehicle.brand}</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground">Modèle</p>
                <p className="font-medium">{partnerVehicle.model}</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground">Plaque</p>
                <p className="font-medium font-mono">{partnerVehicle.license_plate}</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground">Classe</p>
                <Badge variant="outline" className="capitalize">{partnerVehicle.vehicle_class}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Zone de service */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Globe className="h-5 w-5 text-green-600" />
            Zone de service
          </h3>
          <p className="text-sm text-muted-foreground mb-3">
            Ville dans laquelle vous acceptez les courses
          </p>
          <Select
            value={chauffeurCity}
            onValueChange={handleCityChange}
            disabled={savingCity}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Sélectionner votre ville..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Kinshasa">Kinshasa</SelectItem>
              <SelectItem value="Lubumbashi">Lubumbashi</SelectItem>
              <SelectItem value="Kolwezi">Kolwezi</SelectItem>
              <SelectItem value="Abidjan">Abidjan</SelectItem>
            </SelectContent>
          </Select>
          {savingCity && (
            <p className="text-xs text-muted-foreground mt-2">Sauvegarde en cours...</p>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">{t('driver_profile.quick_actions')}</h3>
          <div className="grid grid-cols-4 gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-muted transition-colors"
                  onClick={() => setDialogView(action.action)}
                >
                  <div className={`p-3 rounded-full ${action.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs text-center">{action.label}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Menu principal */}
      <Card>
        <CardContent className="p-6 space-y-6">
          {menuItems.map((section, idx) => (
            <div key={section.section}>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                {section.section}
              </h3>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.label}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors text-left"
                      onClick={() => setDialogView(item.action)}
                    >
                      <Icon className={`h-5 w-5 ${item.color}`} />
                      <span className="flex-1">{item.label}</span>
                    </button>
                  );
                })}
              </div>
              {idx < menuItems.length - 1 && <Separator className="mt-6" />}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Bouton de déconnexion */}
      <Card>
        <CardContent className="p-6">
          <Button
            variant="destructive"
            className="w-full"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            {t('driver.disconnect')}
          </Button>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <Dialog open={dialogView !== null} onOpenChange={(open) => !open && setDialogView(null)}>
        <DialogContent className="max-w-screen-sm max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dialogView && dialogTitles[dialogView]}
            </DialogTitle>
          </DialogHeader>

          {dialogView === 'wallet' && <WalletPanel />}
          {dialogView === 'promo' && <PromoCodePanel />}
          {dialogView === 'referral' && <ReferralPanel />}
          {dialogView === 'badges' && <BadgesPanel />}
          {dialogView === 'history' && <DriverOrderHistory />}
          {dialogView === 'vehicles' && <VehiclesModal />}
          {dialogView === 'zones' && <ServiceZonesModal />}
          {dialogView === 'notifications' && <NotificationsPanel />}
          {dialogView === 'settings' && <DriverSettings />}
          {dialogView === 'partner-code' && <PartnerCodeModal />}
          {dialogView === 'support' && <SupportPanel />}
          {dialogView === 'security' && <SecurityPanel />}
          {dialogView === 'documents' && <DriverDocuments />}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DriverProfilePage;
