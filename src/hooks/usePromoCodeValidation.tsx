import { supabase } from '@/integrations/supabase/client';

export const usePromoCodeValidation = () => {
  
  /**
   * Vérifie si un utilisateur peut utiliser un code promo
   * @param userId - ID de l'utilisateur
   * @param promoCode - Code promo à vérifier (ex: BIENVENUE30)
   * @returns { canUse: boolean, reason: string | null, promoId: string | null }
   */
  const checkPromoUsage = async (userId: string, promoCode: string) => {
    try {
      // 1. Vérifier si le code existe et est actif
      const { data: promo, error: promoError } = await supabase
        .from('promo_codes')
        .select('id, user_limit, is_active, valid_until')
        .eq('code', promoCode)
        .eq('is_active', true)
        .maybeSingle();

      if (promoError) {
        console.error('Error fetching promo code:', promoError);
        return { canUse: false, reason: 'Erreur lors de la vérification du code', promoId: null };
      }

      if (!promo) {
        return { canUse: false, reason: 'Code promo invalide ou inactif', promoId: null };
      }

      // 2. Vérifier la date d'expiration
      if (promo.valid_until && new Date(promo.valid_until) < new Date()) {
        return { canUse: false, reason: 'Code promo expiré', promoId: promo.id };
      }

      // 3. Vérifier si l'utilisateur a déjà utilisé ce code
      const { data: usage, error: usageError } = await supabase
        .from('promo_code_usage')
        .select('id')
        .eq('promo_code_id', promo.id)
        .eq('user_id', userId);

      if (usageError) {
        console.error('Error checking promo usage:', usageError);
        return { canUse: false, reason: 'Erreur lors de la vérification de l\'usage', promoId: promo.id };
      }

      const usageCount = usage?.length || 0;

      // 4. Vérifier la limite par utilisateur
      if (promo.user_limit !== null && usageCount >= promo.user_limit) {
        return { canUse: false, reason: 'Code promo déjà utilisé', promoId: promo.id };
      }

      // ✅ Le code peut être utilisé
      return { canUse: true, reason: null, promoId: promo.id };

    } catch (error) {
      console.error('Unexpected error in checkPromoUsage:', error);
      return { canUse: false, reason: 'Erreur inattendue', promoId: null };
    }
  };

  /**
   * Enregistre l'usage d'un code promo après confirmation de commande
   * @param data - Données d'usage du code promo
   */
  const recordPromoUsage = async (data: {
    userId: string;
    promoId: string;
    orderId: string;
    orderType: string;
    discountAmount: number;
  }) => {
    try {
      const { error } = await supabase
        .from('promo_code_usage')
        .insert({
          promo_code_id: data.promoId,
          user_id: data.userId,
          order_id: data.orderId,
          order_type: data.orderType,
          discount_amount: data.discountAmount,
          currency: 'CDF',
          used_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error recording promo usage:', error);
        throw error;
      }

      // Incrémenter le compteur d'usage du code promo
      const { data: currentCode } = await supabase
        .from('promo_codes')
        .select('usage_count')
        .eq('id', data.promoId)
        .single();

      await supabase
        .from('promo_codes')
        .update({ usage_count: (currentCode?.usage_count || 0) + 1 })
        .eq('id', data.promoId);

      return { success: true };
    } catch (error) {
      console.error('Unexpected error in recordPromoUsage:', error);
      throw error;
    }
  };

  return { checkPromoUsage, recordPromoUsage };
};
