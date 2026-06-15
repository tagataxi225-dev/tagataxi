import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

interface PromoCode {
  id: string;
  code: string;
  title: string;
  description: string;
  discount_type: 'percentage' | 'fixed_amount' | 'free_delivery';
  discount_value: number;
  min_order_amount: number;
  max_discount_amount?: number;
  applicable_services: string[];
  valid_until: string;
  usage_limit: number;
  user_limit: number;
}

export const usePromoCode = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [availableCodes, setAvailableCodes] = useState<PromoCode[]>([]);
  const [userUsage, setUserUsage] = useState<any[]>([]);
  const { toast } = useToast();

  const validatePromoCode = async (code: string, orderAmount: number, serviceType: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('calculate-promo-discount', {
        body: {
          promoCode: code,
          orderAmount,
          serviceType
        }
      });

      if (error) throw error;

      if (!data.success) {
        toast({
          title: "Code promo invalide",
          description: data.error || 'Veuillez vérifier le code',
          variant: "destructive"
        });
        return { isValid: false, promoCode: null, discountAmount: 0 };
      }

      // Show success with driver compensation info
      const driverComp = data.data.driverCompensation;
      let description = `Réduction de ${data.data.savings} CDF appliquée`;
      
      if (driverComp?.can_credit && driverComp.rides_to_credit > 0) {
        description += `\n🎁 ${driverComp.message}`;
      } else if (driverComp?.threshold_not_met) {
        description += `\n💡 Promo trop faible pour bonus chauffeur (min: ${driverComp.min_threshold} CDF)`;
      }

      toast({
        title: `Code "${code}" appliqué !`,
        description,
        duration: 5000
      });

      return {
        isValid: true,
        promoCode: data.data.promoCode,
        discountAmount: data.data.discountAmount,
        finalAmount: data.data.finalAmount,
        savings: data.data.savings,
        freeDelivery: data.data.freeDelivery,
        driverCompensation: driverComp
      };
    } catch (error: any) {
      console.error('Error validating promo code:', error);
      toast({
        title: "Erreur",
        description: 'Impossible de valider le code promo',
        variant: "destructive"
      });
      return { isValid: false, promoCode: null, discountAmount: 0 };
    } finally {
      setIsLoading(false);
    }
  };

  const applyPromoCode = async (
    promoCodeId: string,
    orderId: string,
    orderType: string,
    discountAmount: number,
    driverId?: string,
    driverCompensation?: any
  ) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        toast({
          title: "Erreur",
          description: 'Vous devez être connecté',
          variant: "destructive"
        });
        return false;
      }

      // Enregistrer l'utilisation du code promo
      const usageInsertData: any = {
        promo_code_id: promoCodeId,
        user_id: user.user.id,
        discount_amount: discountAmount,
        used_at: new Date().toISOString()
      };

      // Ajouter le bon champ selon le type de commande
      if (orderType === 'transport') {
        usageInsertData.booking_id = orderId;
      } else if (orderType === 'delivery') {
        usageInsertData.delivery_id = orderId;
      } else if (orderType === 'marketplace') {
        usageInsertData.marketplace_order_id = orderId;
      }

      const { data: usageData, error } = await supabase
        .from('promo_code_usage')
        .insert(usageInsertData)
        .select()
        .single();

      if (error) throw error;

      // Enregistrer compensation chauffeur si applicable
      // NOTE: Le trigger auto_credit_promo_compensation() va créer automatiquement
      // la compensation quand la commande sera complétée, mais on peut aussi
      // l'enregistrer immédiatement si on a l'info
      if (driverId && driverCompensation?.can_credit && driverCompensation.rides_to_credit > 0) {
        const compensationData: any = {
          driver_id: driverId,
          promo_code_id: promoCodeId,
          promo_usage_id: usageData.id,
          compensation_amount: discountAmount,
          status: 'pending',
          compensation_metadata: {
            rides_to_credit: driverCompensation.rides_to_credit,
            compensation_config: driverCompensation.config_used,
            created_from: 'apply_promo_code',
            threshold_met: driverCompensation.can_credit
          }
        };

        if (orderType === 'transport') {
          compensationData.booking_id = orderId;
        } else if (orderType === 'delivery') {
          compensationData.delivery_id = orderId;
        }

        const { error: compError } = await supabase
          .from('promo_driver_compensations')
          .insert(compensationData);

        if (compError) {
          console.error('Error recording driver compensation:', compError);
        } else {
          console.log(`✅ Compensation enregistrée: ${driverCompensation.rides_to_credit} courses pour chauffeur ${driverId}`);
          
          // Logger l'activité
          await supabase.from('activity_logs').insert({
            user_id: driverId,
            activity_type: 'promo_compensation_pending',
            description: `Compensation promo de ${driverCompensation.rides_to_credit} courses en attente`,
            metadata: { 
              promo_code_id: promoCodeId, 
              order_id: orderId,
              rides_to_credit: driverCompensation.rides_to_credit
            }
          });
        }
      }

      // Incrémenter le compteur d'utilisation du code promo
      const { data: currentCode } = await supabase
        .from('promo_codes')
        .select('usage_count')
        .eq('id', promoCodeId)
        .maybeSingle();

      await supabase
        .from('promo_codes')
        .update({ usage_count: (currentCode?.usage_count || 0) + 1 })
        .eq('id', promoCodeId);

      toast({
        title: "Code promo appliqué",
        description: `Réduction de ${discountAmount} CDF appliquée avec succès !`,
      });

      return true;
    } catch (error: any) {
      console.error('Erreur lors de l\'application du code promo:', error);
      toast({
        title: "Erreur",
        description: 'Impossible d\'appliquer le code promo',
        variant: "destructive"
      });
      return false;
    }
  };

  const fetchAvailableCodes = async () => {
    try {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('is_active', true)
        .eq('is_published', true)
        .gte('valid_until', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAvailableCodes((data || []).map(code => ({
        ...code,
        discount_type: code.discount_type as 'percentage' | 'fixed_amount' | 'free_delivery'
      })));
    } catch (error) {
      console.error('Erreur lors de la récupération des codes promo:', error);
    }
  };

  const fetchUserUsage = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data, error } = await supabase
        .from('promo_code_usage')
        .select(`
          *,
          promo_codes (
            code,
            title,
            discount_value
          )
        `)
        .eq('user_id', user.user.id)
        .order('used_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setUserUsage(data || []);
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'historique:', error);
    }
  };

  const getPersonalizedCodes = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return [];

      // Chercher d'abord les codes personnalisés existants dans la DB
      const { data: existingCodes } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('created_by', user.user.id)
        .eq('is_active', true)
        .gte('valid_until', new Date().toISOString());

      if (existingCodes && existingCodes.length > 0) {
        return existingCodes.map(code => ({
          id: code.id,
          code: code.code,
          title: code.title,
          description: code.description,
          discount_type: code.discount_type as 'percentage' | 'fixed_amount' | 'free_delivery',
          discount_value: code.discount_value,
          min_order_amount: code.min_order_amount,
          max_discount_amount: code.max_discount_amount,
          applicable_services: code.applicable_services,
          usage_limit: code.usage_limit,
          user_limit: code.user_limit,
          valid_until: code.valid_until
        }));
      }

      // Utiliser la fonction pour calculer les statistiques utilisateur
      const { data: loyaltyData } = await supabase.rpc('calculate_user_loyalty_points', {
        p_user_id: user.user.id
      });

      if (!loyaltyData) return [];

      const data = loyaltyData as any;
      const totalSpent = data.total_spent || 0;
      const totalOrders = data.total_orders || 0;

      // Générer des codes personnalisés basés sur l'activité
      const personalizedCodes: PromoCode[] = [];

      // Bonus première commande
      if (totalOrders === 0) {
        const firstTimeCode = {
          code: 'PREMIERE20',
          title: 'Première course',
          description: '20% de réduction sur votre première course',
          discount_type: 'percentage' as const,
          discount_value: 20,
          min_order_amount: 2000,
          applicable_services: ['transport'],
          usage_limit: 1,
          user_limit: 1,
          valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          is_active: true,
          created_by: user.user.id
        };

        // Créer le code dans la DB
        const { data: newCode, error } = await supabase
          .from('promo_codes')
          .insert(firstTimeCode)
          .select()
          .single();

        if (!error && newCode) {
          personalizedCodes.push({
            id: newCode.id,
            code: firstTimeCode.code,
            title: firstTimeCode.title,
            description: firstTimeCode.description,
            discount_type: firstTimeCode.discount_type,
            discount_value: firstTimeCode.discount_value,
            min_order_amount: firstTimeCode.min_order_amount,
            applicable_services: firstTimeCode.applicable_services,
            usage_limit: firstTimeCode.usage_limit,
            user_limit: firstTimeCode.user_limit,
            valid_until: firstTimeCode.valid_until
          });
        }
      }

      return personalizedCodes;
    } catch (error) {
      console.error('Erreur lors de la génération des codes personnalisés:', error);
      return [];
    }
  };

  useEffect(() => {
    fetchAvailableCodes();
    fetchUserUsage();
  }, []);

  return {
    validatePromoCode,
    applyPromoCode,
    fetchAvailableCodes,
    getPersonalizedCodes,
    availableCodes,
    userUsage,
    isLoading,
  };
};