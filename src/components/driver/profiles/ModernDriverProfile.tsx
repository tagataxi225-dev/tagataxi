/**
 * 🎨 Profil Chauffeur Moderne - Design Épuré & Compact
 * Un seul composant réutilisable pour taxi et livraison
 */

import { useState } from 'react';
import { AppFeedbackSection } from '@/components/shared/AppFeedbackSection';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';

import { CompactProfileHeader } from './shared/CompactProfileHeader';
import { QuickStatsGrid } from './shared/QuickStatsGrid';
import { ProfileTabs } from './shared/ProfileTabs';
import { FloatingActions } from './shared/FloatingActions';
import { CityManagementPanel } from '../CityManagementPanel';
import { ReferralDashboard } from '../referral/ReferralDashboard';
import { SupportModal } from '../support/SupportModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useDriverPerformanceStats } from '@/hooks/useDriverPerformanceStats';
import { DeliveryServiceToggle } from '../delivery/DeliveryServiceToggle';
import { DriverSettingsPanel } from '../settings/DriverSettingsPanel';

interface ModernDriverProfileProps {
  serviceType: 'taxi' | 'delivery';
}

export const ModernDriverProfile = ({ serviceType }: ModernDriverProfileProps) => {
  const { user } = useAuth();
  const [showReferralDialog, setShowReferralDialog] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);

  // Charger le profil chauffeur depuis la table chauffeurs
  const { data: chauffeurProfile, isLoading: loadingChauffeur } = useQuery({
    queryKey: ['chauffeur-profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('chauffeurs')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error loading chauffeur profile:', error);
        return null;
      }
      return data;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000
  });

  // Véhicule assigné par le partenaire (prioritaire sur chauffeurs)
  const { data: partnerVehicle } = useQuery({
    queryKey: ['partner-assigned-vehicle', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('partner_taxi_vehicles')
        .select('name, brand, model, license_plate, color, vehicle_class, images')
        .eq('assigned_driver_id', user.id)
        .eq('moderation_status', 'approved')
        .maybeSingle();
      return data ?? null;
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000
  });

  // Pour delivery, charger aussi driver_profiles
  const { data: driverProfile, isLoading: loadingDriver } = useQuery({
    queryKey: ['driver-profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('driver_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error loading driver profile:', error);
        return null;
      }
      return data;
    },
    enabled: !!user && serviceType === 'delivery',
    staleTime: 5 * 60 * 1000
  });

  const isLoading = loadingChauffeur || (serviceType === 'delivery' && loadingDriver);

  // Stats de performance
  const { stats, loading: statsLoading, rawStats } = useDriverPerformanceStats(serviceType);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Extraire les infos selon le type de service
  const getName = () => {
    if (serviceType === 'taxi') {
      return chauffeurProfile?.display_name || user?.email?.split('@')[0] || 'Chauffeur';
    }
    return chauffeurProfile?.display_name || user?.email?.split('@')[0] || 'Livreur';
  };

  const getPhoto = () => {
    return chauffeurProfile?.profile_photo_url;
  };

  const getRating = () => {
    return chauffeurProfile?.rating_average || 0;
  };

  const getCity = () => {
    return chauffeurProfile?.city || 'Kinshasa';
  };

  const getVehicleInfo = () => {
    if (partnerVehicle) {
      return {
        make: partnerVehicle.brand,
        model: partnerVehicle.model,
        plate: partnerVehicle.license_plate,
        color: partnerVehicle.color,
        photo: Array.isArray(partnerVehicle.images) ? partnerVehicle.images[0] : undefined,
        capacity: chauffeurProfile?.delivery_capacity
      };
    }
    return {
      make: chauffeurProfile?.vehicle_make,
      model: chauffeurProfile?.vehicle_model,
      plate: chauffeurProfile?.vehicle_plate,
      color: chauffeurProfile?.vehicle_color,
      photo: chauffeurProfile?.vehicle_photo_url,
      capacity: chauffeurProfile?.delivery_capacity
    };
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <motion.div 
        className="p-4 space-y-4 max-w-lg mx-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {/* Header Compact */}
        <CompactProfileHeader
          name={getName()}
          photo={getPhoto()}
          rating={getRating()}
          city={getCity()}
          badge={serviceType === 'taxi' ? 'Chauffeur Taxi Vérifié' : 'Livreur Express Vérifié'}
          badgeIcon={serviceType === 'taxi' ? '🚗' : '📦'}
          serviceType={serviceType}
          onSettingsClick={() => setShowSettingsDialog(true)}
        />

        {/* Sélection Ville - Compact */}
        <CityManagementPanel />

        {/* Stats Grille 2x2 */}
        <QuickStatsGrid
          completedRides={rawStats?.completedRides || 0}
          rating={rawStats?.rating || '4.5'}
          acceptanceRate={`${rawStats?.acceptanceRate || 95}%`}
          vehicleInfo={getVehicleInfo()}
          serviceType={serviceType}
          loading={statsLoading}
        />

        {/* Toggle services livraison (seulement pour delivery) */}
        {serviceType === 'delivery' && (
          <DeliveryServiceToggle />
        )}

        {/* Onglets : Véhicule, Documents, Zones, Codes */}
        <ProfileTabs 
          serviceType={serviceType}
          vehicleInfo={getVehicleInfo()}
        />

        {/* Feedback & Notation */}
        <AppFeedbackSection userType="driver" />

        {/* Barre d'Actions intégrée */}
        <FloatingActions
          onReferralClick={() => setShowReferralDialog(true)}
          onSupportClick={() => setShowSupportModal(true)}
          serviceType={serviceType}
        />
      </motion.div>

      {/* Dialogs */}
      <Dialog open={showReferralDialog} onOpenChange={setShowReferralDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <ReferralDashboard />
        </DialogContent>
      </Dialog>

      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Réglages</DialogTitle>
          </DialogHeader>
          <DriverSettingsPanel onClose={() => setShowSettingsDialog(false)} />
        </DialogContent>
      </Dialog>

      <SupportModal
        open={showSupportModal}
        onOpenChange={setShowSupportModal}
      />
    </div>
  );
};
