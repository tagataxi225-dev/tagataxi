import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface PartnerRentalLimits {
  maxVehicles: number;
  currentVehicles: number;
  canAddVehicle: boolean;
  featuredInHomepage: boolean;
  customBannerAllowed: boolean;
  needsUpgrade: boolean;
  tier: string;
  prioritySupport: boolean;
  analyticsAccess: boolean;
}

export const usePartnerRentalLimits = () => {
  const { user } = useAuth();
  const [limits, setLimits] = useState<PartnerRentalLimits>({
    maxVehicles: 5,
    currentVehicles: 0,
    canAddVehicle: true,
    featuredInHomepage: false,
    customBannerAllowed: false,
    needsUpgrade: false,
    tier: 'basic',
    prioritySupport: false,
    analyticsAccess: false
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchLimits();
    }
  }, [user]);

  const fetchLimits = async () => {
    try {
      setLoading(true);

      // Récupérer le partenaire
      const { data: partner, error: partnerError } = await supabase
        .from('partenaires')
        .select('id')
        .eq('user_id', user!.id)
        .single();

      if (partnerError) throw partnerError;

      // Récupérer l'abonnement actif
      const { data: subscription, error: subError } = await supabase
        .from('partner_rental_subscriptions')
        .select(`
          *,
          plan:rental_subscription_plans(*)
        `)
        .eq('partner_id', partner.id)
        .eq('status', 'active')
        .gte('end_date', new Date().toISOString())
        .order('end_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (subError && subError.code !== 'PGRST116') throw subError;

      // Compter les véhicules actuels
      const { count: vehicleCount, error: countError } = await supabase
        .from('rental_vehicles')
        .select('*', { count: 'exact', head: true })
        .eq('partner_id', partner.id);

      if (countError) throw countError;

      const currentVehicles = vehicleCount || 0;

      if (subscription && subscription.plan) {
        const plan = subscription.plan;
        const maxVehicles = plan.max_vehicles || 5;
        
        setLimits({
          maxVehicles,
          currentVehicles,
          canAddVehicle: currentVehicles < maxVehicles,
          featuredInHomepage: plan.featured_in_homepage || false,
          customBannerAllowed: plan.custom_banner || false,
          needsUpgrade: currentVehicles >= maxVehicles,
          tier: plan.tier || 'basic',
          prioritySupport: plan.priority_support || false,
          analyticsAccess: plan.analytics_access || false
        });
      } else {
        // Plan Basic par défaut
        setLimits({
          maxVehicles: 3,
          currentVehicles,
          canAddVehicle: currentVehicles < 3,
          featuredInHomepage: false,
          customBannerAllowed: false,
          needsUpgrade: currentVehicles >= 3,
          tier: 'basic',
          prioritySupport: false,
          analyticsAccess: false
        });
      }
    } catch (error: any) {
      console.error('Error fetching rental limits:', error);
    } finally {
      setLoading(false);
    }
  };

  return { limits, loading, refresh: fetchLimits };
};
