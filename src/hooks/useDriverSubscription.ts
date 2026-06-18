/**
 * 💳 Hook gestion abonnement chauffeur réel
 * - Récupère l'abonnement actif depuis driver_subscriptions
 * - Joint avec subscription_plans pour les détails
 * - Calcule les courses restantes
 */

import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export interface DriverSubscription {
  id: string;
  plan: 'free' | 'starter' | 'pro' | 'premium';
  planName: string;
  planLabel: string;
  expiresAt: string | null;
  ridesRemaining: number | null;
  ridesLimit: number | null;
  commissionRate: number;
  normalRate: number; // Taux standard (12%) pour afficher les économies
  isActive: boolean;
  features: string[];
  billingMode: 'subscription' | 'commission';
}

export const useDriverSubscription = (serviceType: 'taxi' | 'delivery' = 'taxi') => {
  const { user } = useAuth();

  const { data: subscription, isLoading, refetch } = useQuery({
    queryKey: ['driver-subscription', user?.id, serviceType],
    queryFn: async (): Promise<DriverSubscription> => {
      if (!user) {
        return getDefaultSubscription(serviceType);
      }

      // Récupérer l'abonnement actif du chauffeur
      const { data: driverSub, error } = await supabase
        .from('driver_subscriptions')
        .select(`
          *,
          subscription_plans(*)
        `)
        .eq('driver_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching subscription:', error);
        return getDefaultSubscription(serviceType);
      }

      if (!driverSub) {
        // Pas d'abonnement actif → mode commission par défaut
        return getDefaultSubscription(serviceType);
      }

      const plan = driverSub.subscription_plans as any;
      const tier = mapTierToCategory(plan?.tier || driverSub.plan_id || 'starter');
      const hasActiveRides = driverSub.rides_remaining && driverSub.rides_remaining > 0;
      const planCommissionRate = plan?.commission_rate || 8;
      const normalRate = 12;
      const effectiveRate = hasActiveRides ? planCommissionRate : normalRate;

      return {
        id: driverSub.id,
        plan: tier,
        planName: plan?.name || 'Starter',
        planLabel: getPlanLabel(tier, serviceType),
        expiresAt: driverSub.end_date,
        ridesRemaining: driverSub.rides_remaining,
        ridesLimit: plan?.rides_limit || null,
        commissionRate: effectiveRate,
        normalRate,
        isActive: driverSub.status === 'active',
        features: getFeatures(tier, serviceType, effectiveRate, normalRate),
        billingMode: hasActiveRides ? 'subscription' : 'commission'
      };
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000
  });

  return {
    subscription: subscription || getDefaultSubscription(serviceType),
    loading: isLoading,
    refetch
  };
};

function mapTierToCategory(tier: string): 'free' | 'starter' | 'pro' | 'premium' {
  const lowerTier = tier.toLowerCase();
  if (lowerTier.includes('premium') || lowerTier.includes('business') || lowerTier.includes('maxicharge')) {
    return 'premium';
  }
  if (lowerTier.includes('pro') || lowerTier.includes('flex')) {
    return 'pro';
  }
  if (lowerTier.includes('starter') || lowerTier.includes('flash') || lowerTier.includes('solo')) {
    return 'starter';
  }
  return 'free';
}

function getPlanLabel(tier: 'free' | 'starter' | 'pro' | 'premium', serviceType: 'taxi' | 'delivery'): string {
  const labels = {
    taxi: {
      free: 'Gratuit',
      starter: 'Starter',
      pro: 'Pro',
      premium: 'Premium'
    },
    delivery: {
      free: 'Flash Solo',
      starter: 'Flash Solo',
      pro: 'Flex Pro',
      premium: 'Maxicharge Business'
    }
  };
  return labels[serviceType][tier];
}

function getFeatures(tier: 'free' | 'starter' | 'pro' | 'premium', serviceType: 'taxi' | 'delivery', commissionRate: number, normalRate: number = 12): string[] {
  const savings = normalRate - commissionRate;
  const base = commissionRate < normalRate 
    ? [`${commissionRate}% au lieu de ${normalRate}%`, `Économie de ${savings}% par course`]
    : [`${commissionRate}% commission`];
  
  switch (tier) {
    case 'free':
    case 'starter':
      return [...base, serviceType === 'taxi' ? '20 courses/jour' : '30 livraisons/jour'];
    case 'pro':
      return [...base, 'Courses illimitées', 'Support prioritaire'];
    case 'premium':
      return [...base, 'Priorité dispatch', 'Support 24/7', 'Badge Premium'];
    default:
      return base;
  }
}

function getDefaultSubscription(serviceType: 'taxi' | 'delivery'): DriverSubscription {
  return {
    id: '',
    plan: 'free',
    planName: 'Mode Commission',
    planLabel: 'Commission par course',
    expiresAt: null,
    ridesRemaining: null,
    ridesLimit: null,
    commissionRate: 12,
    normalRate: 12,
    isActive: true,
    features: ['12% TAGA + max 3% partenaire', 'Courses illimitées', 'Pas de frais fixes'],
    billingMode: 'commission'
  };
}
