/**
 * 🛡️ Hook d'éligibilité chauffeur
 * Vérifie partenaire actif + abonnement/wallet avant mise en ligne
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface DriverEligibility {
  hasPartner: boolean;
  partnerName: string | null;
  hasSubscription: boolean;
  ridesRemaining: number;
  walletBalance: number;
  minWalletRequired: number;
  isEligible: boolean;
  blockedReasons: BlockedReason[];
  loading: boolean;
}

export interface BlockedReason {
  key: 'no_partner' | 'no_funds';
  message: string;
  actionLabel: string;
  actionRoute: string;
}

const MIN_WALLET_BALANCE = 500; // CDF

export const useDriverEligibility = (): DriverEligibility => {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['driver-eligibility', user?.id],
    enabled: !!user?.id,
    staleTime: 30_000,
    queryFn: async () => {
      const userId = user!.id;

      // 3 requêtes parallèles
      const [partnerRes, subscriptionRes, walletRes] = await Promise.all([
        supabase
          .from('partner_drivers')
          .select('id, status, partner_profiles!inner(company_name)')
          .eq('driver_id', userId)
          .eq('status', 'active')
          .limit(1)
          .maybeSingle(),
        supabase
          .from('driver_subscriptions')
          .select('rides_remaining')
          .eq('driver_id', userId)
          .eq('status', 'active')
          .gte('end_date', new Date().toISOString())
          .limit(1)
          .maybeSingle(),
        supabase
          .from('user_wallets')
          .select('balance')
          .eq('user_id', userId)
          .maybeSingle(),
      ]);

      const hasPartner = !!partnerRes.data;
      const partnerName = hasPartner
        ? (partnerRes.data as any)?.partner_profiles?.company_name ?? null
        : null;

      const ridesRemaining = subscriptionRes.data?.rides_remaining ?? 0;
      const hasSubscription = ridesRemaining > 0;
      const walletBalance = walletRes.data?.balance ?? 0;

      return { hasPartner, partnerName, hasSubscription, ridesRemaining, walletBalance };
    },
  });

  const hasPartner = data?.hasPartner ?? false;
  const partnerName = data?.partnerName ?? null;
  const hasSubscription = data?.hasSubscription ?? false;
  const ridesRemaining = data?.ridesRemaining ?? 0;
  const walletBalance = data?.walletBalance ?? 0;

  const blockedReasons: BlockedReason[] = [];

  if (!hasPartner) {
    blockedReasons.push({
      key: 'no_partner',
      message: 'Vous devez être rattaché à un partenaire actif',
      actionLabel: 'Trouver un partenaire',
      actionRoute: '/app/driver/find-partner',
    });
  }

  if (hasPartner && !hasSubscription && walletBalance < MIN_WALLET_BALANCE) {
    blockedReasons.push({
      key: 'no_funds',
      message: `Solde insuffisant (min ${MIN_WALLET_BALANCE} CDF) ou pas d'abonnement actif`,
      actionLabel: 'Recharger wallet',
      actionRoute: '/app/driver/wallet',
    });
  }

  const isEligible = blockedReasons.length === 0;

  return {
    hasPartner,
    partnerName,
    hasSubscription,
    ridesRemaining,
    walletBalance,
    minWalletRequired: MIN_WALLET_BALANCE,
    isEligible,
    blockedReasons,
    loading: isLoading,
  };
};
