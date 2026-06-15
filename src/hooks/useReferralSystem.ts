/**
 * 🎁 Hook système de parrainage chauffeur
 * - Code unique auto-généré
 * - Tracking filleuls avec limite de 20 max
 * - Calcul bonus et stats
 */

import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface ReferralCode {
  id: string;
  code: string;
  service_type: 'taxi' | 'delivery' | 'both';
  usage_count: number;
  successful_referrals: number;
  total_earnings: number;
  bonus_per_referral: number;
  is_active: boolean;
  max_referrals: number;
}

export interface ReferralTracking {
  id: string;
  referred_id: string;
  status: 'pending' | 'completed' | 'expired' | 'cancelled';
  referrer_bonus_paid: boolean;
  referred_bonus_paid: boolean;
  referrer_bonus_amount: number;
  referred_bonus_amount: number;
  referred_completed_rides: number;
  validation_threshold: number;
  created_at: string;
  completed_at?: string;
  referred_user?: {
    full_name?: string;
    email?: string;
  };
}

export interface ReferralStats {
  hasCode: boolean;
  code?: string;
  totalReferrals: number;
  completedReferrals: number;
  pendingReferrals: number;
  totalEarned: number;
  maxReferrals: number;
  remainingSlots: number;
  limitReached: boolean;
  progressPercent: number;
}

export const useReferralSystem = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Charger les stats via la nouvelle fonction RPC
  const { data: statsData, isLoading: loadingStats } = useQuery({
    queryKey: ['driver-referral-stats', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase.rpc('get_driver_referral_stats', {
        p_user_id: user.id
      });

      if (error) {
        console.error('Error fetching referral stats:', error);
        // Fallback to manual calculation if RPC doesn't exist
        return null;
      }

      return data as {
        hasCode: boolean;
        code?: string;
        totalReferrals: number;
        completedReferrals: number;
        pendingReferrals: number;
        totalEarned: number;
        maxReferrals: number;
        remainingSlots: number;
        limitReached: boolean;
      };
    },
    enabled: !!user
  });

  // Charger le code de parrainage du chauffeur (fallback)
  const { data: referralCode, isLoading: loadingCode } = useQuery({
    queryKey: ['referral-code', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('referral_codes')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as ReferralCode | null;
    },
    enabled: !!user && !statsData?.hasCode
  });

  // Charger les filleuls
  const { data: referrals, isLoading: loadingReferrals } = useQuery({
    queryKey: ['referral-tracking', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('referral_tracking')
        .select('*')
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Enrichir avec les noms des filleuls
      const enriched = await Promise.all(
        (data || []).map(async (ref: any) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('user_id', ref.referred_id)
            .maybeSingle();

          return {
            ...ref,
            referred_user: {
              full_name: profile?.display_name || 'Chauffeur',
              email: ''
            }
          };
        })
      );

      return enriched as ReferralTracking[];
    },
    enabled: !!user
  });

  // Générer un nouveau code si absent
  const generateCode = useMutation({
    mutationFn: async (serviceType: 'taxi' | 'delivery' | 'both') => {
      if (!user) throw new Error('Non authentifié');

      const { data, error } = await supabase.rpc('generate_driver_referral_code', {
        p_user_id: user.id,
        p_service_type: serviceType
      });

      if (error) throw error;

      // Insérer le code avec max_referrals
      const { error: insertError } = await supabase
        .from('referral_codes')
        .insert({
          user_id: user.id,
          code: data,
          service_type: serviceType,
          max_referrals: 20
        });

      if (insertError) throw insertError;

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referral-code'] });
      queryClient.invalidateQueries({ queryKey: ['driver-referral-stats'] });
      toast.success('Code de parrainage créé !');
    },
    onError: (error) => {
      console.error('Error generating code:', error);
      toast.error('Erreur lors de la génération du code');
    }
  });

  // Utiliser un code de parrainage (pour les nouveaux chauffeurs)
  const useCode = useMutation({
    mutationFn: async (code: string) => {
      if (!user) throw new Error('Non authentifié');

      const { data, error } = await supabase.rpc('apply_driver_referral_code', {
        p_code: code.toUpperCase(),
        p_referred_id: user.id
      });

      if (error) throw error;

      const result = data as { 
        success: boolean; 
        error?: string; 
        bonus_amount?: number;
        remaining_slots?: number;
      };
      
      if (!result.success) {
        throw new Error(result.error || 'Erreur inconnue');
      }

      return result;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['referral-tracking'] });
      queryClient.invalidateQueries({ queryKey: ['driver-referral-stats'] });
      toast.success(`Code validé ! Vous recevrez ${result.bonus_amount} CDF après 10 courses`);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  // Stats calculées avec limite de 20
  const maxReferrals = statsData?.maxReferrals || referralCode?.max_referrals || 20;
  const totalReferrals = statsData?.totalReferrals ?? (referrals?.length || 0);
  const completedReferrals = statsData?.completedReferrals ?? (referrals?.filter(r => r.status === 'completed').length || 0);
  const pendingReferrals = statsData?.pendingReferrals ?? (referrals?.filter(r => r.status === 'pending').length || 0);
  const remainingSlots = statsData?.remainingSlots ?? Math.max(0, maxReferrals - totalReferrals);

  const stats: ReferralStats = {
    hasCode: statsData?.hasCode ?? !!referralCode,
    code: statsData?.code || referralCode?.code,
    totalReferrals,
    completedReferrals,
    pendingReferrals,
    totalEarned: statsData?.totalEarned || referralCode?.total_earnings || 0,
    maxReferrals,
    remainingSlots,
    limitReached: statsData?.limitReached ?? (remainingSlots <= 0),
    progressPercent: Math.min(100, (totalReferrals / maxReferrals) * 100)
  };

  return {
    referralCode,
    referrals,
    stats,
    loading: loadingStats || loadingCode || loadingReferrals,
    generateCode,
    useCode
  };
};
