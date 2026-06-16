import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWalletPayment } from "./useWalletPayment";
import { toast } from "sonner";

export type PromotionType = 'agency_boost' | 'vehicle_boost';
export type PlanKey = '3d' | '7d' | '14d' | '30d';

export interface PromotionPlan {
  key: PlanKey;
  days: number;
  label: string;
}

export interface PromotionPack {
  type: PromotionType;
  label: string;
  plans: (PromotionPlan & { price: number })[];
}

export interface PartnerPromotion {
  id: string;
  partner_id: string;
  user_id: string;
  promotion_type: PromotionType;
  target_id: string | null;
  plan_key: PlanKey;
  amount_paid: number;
  currency: string;
  starts_at: string;
  expires_at: string;
  is_active: boolean;
  metadata: any;
  created_at: string;
}

const PLANS: PromotionPlan[] = [
  { key: '3d', days: 3, label: '3 jours' },
  { key: '7d', days: 7, label: '7 jours' },
  { key: '14d', days: 14, label: '14 jours' },
  { key: '30d', days: 30, label: '30 jours' },
];

const AGENCY_PRICES: Record<PlanKey, number> = {
  '3d': 5000, '7d': 10000, '14d': 18000, '30d': 30000,
};

const VEHICLE_PRICES: Record<PlanKey, number> = {
  '3d': 3000, '7d': 6000, '14d': 10000, '30d': 18000,
};

export const getPromotionPacks = (): PromotionPack[] => [
  {
    type: 'agency_boost',
    label: 'Boost Agence',
    plans: PLANS.map(p => ({ ...p, price: AGENCY_PRICES[p.key] })),
  },
  {
    type: 'vehicle_boost',
    label: 'Boost Véhicule',
    plans: PLANS.map(p => ({ ...p, price: VEHICLE_PRICES[p.key] })),
  },
];

export function usePartnerPromotions(partnerId?: string, userId?: string) {
  const qc = useQueryClient();
  const { payWithWallet } = useWalletPayment();

  const promotionsQuery = useQuery({
    queryKey: ['partner-promotions', partnerId],
    enabled: !!partnerId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partner_promotions')
        .select('*')
        .eq('partner_id', partnerId!)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as PartnerPromotion[];
    },
  });

  const walletQuery = useQuery({
    queryKey: ['wallet-balance', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_wallets')
        .select('balance, bonus_balance')
        .eq('user_id', userId!)
        .single();
      if (error) throw error;
      return {
        balance: Number(data.balance || 0),
        bonus: Number(data.bonus_balance || 0),
        total: Number(data.balance || 0) + Number(data.bonus_balance || 0),
      };
    },
  });

  const purchasePromotion = useMutation({
    mutationFn: async ({
      type,
      targetId,
      planKey,
    }: {
      type: PromotionType;
      targetId?: string;
      planKey: PlanKey;
    }) => {
      if (!userId || !partnerId) throw new Error('Non authentifié');

      const prices = type === 'agency_boost' ? AGENCY_PRICES : VEHICLE_PRICES;
      const amount = prices[planKey];
      const plan = PLANS.find(p => p.key === planKey)!;

      // Pay with wallet
      const payment = await payWithWallet(
        userId,
        amount,
        `Boost ${type === 'agency_boost' ? 'Agence' : 'Véhicule'} - ${plan.label}`,
        'promotion',
        partnerId
      );

      if (!payment.success) throw new Error('Paiement échoué');

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + plan.days);

      // Insert promotion
      const { error: insertError } = await supabase
        .from('partner_promotions')
        .insert({
          partner_id: partnerId,
          user_id: userId,
          promotion_type: type,
          target_id: targetId || null,
          plan_key: planKey,
          amount_paid: amount,
          currency: 'XOF',
          expires_at: expiresAt.toISOString(),
          metadata: { bonus_used: payment.bonusUsed, balance_used: payment.balanceUsed },
        } as any);

      if (insertError) throw insertError;

      // Update featured flag
      if (type === 'agency_boost') {
        await supabase
          .from('partenaires')
          .update({ is_featured: true, featured_until: expiresAt.toISOString() } as any)
          .eq('id', partnerId);
      } else if (targetId) {
        await supabase
          .from('rental_vehicles')
          .update({ is_featured: true, featured_until: expiresAt.toISOString() } as any)
          .eq('id', targetId);
      }

      return { amount, planKey, type };
    },
    onSuccess: () => {
      toast.success('Promotion activée avec succès ! 🎉');
      qc.invalidateQueries({ queryKey: ['partner-promotions'] });
      qc.invalidateQueries({ queryKey: ['wallet-balance'] });
      qc.invalidateQueries({ queryKey: ['partner-vehicles'] });
    },
    onError: (err: any) => {
      console.error('Erreur promotion:', err);
    },
  });

  const getActivePromotion = (type: PromotionType, targetId?: string) => {
    return promotionsQuery.data?.find(p => {
      if (p.promotion_type !== type) return false;
      if (type === 'vehicle_boost' && p.target_id !== targetId) return false;
      return new Date(p.expires_at) > new Date();
    });
  };

  return {
    promotions: promotionsQuery.data || [],
    wallet: walletQuery.data,
    isLoading: promotionsQuery.isLoading,
    purchasePromotion,
    getActivePromotion,
    packs: getPromotionPacks(),
  };
}
