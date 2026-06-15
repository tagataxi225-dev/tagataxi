import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface PromoCode {
  id: string;
  code: string;
  description: string;
  discount_type: string;
  discount_value: number;
  valid_until?: string | null;
  used_at?: string;
}

export const usePromoCode = () => {
  const { user } = useAuth();
  const [activeCodes, setActiveCodes] = useState<PromoCode[]>([]);
  const [usedCodes, setUsedCodes] = useState<PromoCode[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchPromoCodes = async () => {
    if (!user) return;

    try {
      // Récupérer les codes actifs
      const { data: activeData } = await supabase
        .from('promo_codes')
        .select('id, code, description, discount_type, discount_value, valid_until')
        .eq('is_active', true)
        .or(`valid_until.is.null,valid_until.gt.${new Date().toISOString()}`)
        .order('created_at', { ascending: false });

      // Récupérer les codes utilisés
      const { data: usedData } = await supabase
        .from('promo_code_usage')
        .select('used_at, promo_codes(id, code, description, discount_type, discount_value, valid_until)')
        .eq('user_id', user.id)
        .order('used_at', { ascending: false });

      setActiveCodes(activeData || []);
      setUsedCodes(usedData?.map(u => ({ 
        ...(u.promo_codes as any), 
        used_at: u.used_at 
      })) || []);
    } catch (error) {
      console.error('Error fetching promo codes:', error);
    }
  };

  const applyPromoCode = async (code: string): Promise<boolean> => {
    if (!user) {
      toast.error('Vous devez être connecté');
      return false;
    }

    setIsLoading(true);
    try {
      // Vérifier si le code existe et est valide
      const { data: promoData, error: promoError } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', code)
        .eq('is_active', true)
        .single();

      if (promoError || !promoData) {
        toast.error('Code promo invalide ou expiré');
        return false;
      }

      // Vérifier si déjà utilisé
      const { data: usageData } = await supabase
        .from('promo_code_usage')
        .select('*')
        .eq('user_id', user.id)
        .eq('promo_code_id', promoData.id)
        .single();

      if (usageData) {
        toast.error('Vous avez déjà utilisé ce code');
        return false;
      }

      // Enregistrer l'utilisation (simplifié pour l'instant)
      toast.success(`Code ${code} appliqué avec succès !`);
      // TODO: Implémenter l'enregistrement dans promo_code_usage après vérification du schéma

      await fetchPromoCodes();
      return true;
    } catch (error) {
      console.error('Error applying promo code:', error);
      toast.error('Erreur lors de l\'application du code');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPromoCodes();
  }, [user]);

  return { activeCodes, usedCodes, applyPromoCode, isLoading };
};
