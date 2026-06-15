import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export type LoyaltyTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface LoyaltyPointsData {
  id: string;
  user_id: string;
  current_points: number;
  total_earned_points: number;
  total_spent_points: number;
  tier: LoyaltyTier;
  loyalty_level: string;
  created_at: string;
  updated_at: string;
}

export interface LoyaltyTransaction {
  id: string;
  user_id: string;
  transaction_type: 'earned' | 'spent' | 'converted_to_wallet' | 'used_marketplace';
  points_amount: number;
  source_type?: string;
  source_id?: string;
  description?: string;
  metadata?: any;
  created_at: string;
}

export const TIER_CONFIG = {
  bronze: {
    name: 'Bronze',
    minPoints: 0,
    color: 'from-amber-700 to-amber-900',
    textColor: 'text-amber-700',
    bgColor: 'bg-amber-100',
    icon: '🥉'
  },
  silver: {
    name: 'Argent',
    minPoints: 5000,
    color: 'from-slate-400 to-slate-600',
    textColor: 'text-slate-600',
    bgColor: 'bg-slate-100',
    icon: '🥈'
  },
  gold: {
    name: 'Or',
    minPoints: 20000,
    color: 'from-yellow-400 to-yellow-600',
    textColor: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    icon: '🥇'
  },
  platinum: {
    name: 'Platine',
    minPoints: 50000,
    color: 'from-purple-400 to-purple-600',
    textColor: 'text-purple-600',
    bgColor: 'bg-purple-100',
    icon: '💎'
  }
};

export const CONVERSION_RATE = {
  points: 100,
  cdf: 1000,
  label: '100 points = 1000 CDF'
};

export const useLoyaltyPoints = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loyaltyData, setLoyaltyData] = useState<LoyaltyPointsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(false);

  const fetchLoyaltyPoints = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Timeout de 10 secondes pour éviter le blocage
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout loading loyalty points')), 10000)
      );

      const dataPromise = supabase
        .from('user_loyalty_points')
        .select('*')
        .eq('user_id', user.id)
        .single();

      const { data, error } = await Promise.race([dataPromise, timeoutPromise]) as any;

      if (error && error.code === 'PGRST116') {
        console.log('✨ Création du compte loyalty pour:', user.id);
        
        // Créer le compte si n'existe pas
        const { data: newData, error: createError } = await supabase
          .from('user_loyalty_points')
          .insert({ 
            user_id: user.id, 
            current_points: 0,
            total_earned_points: 0,
            total_spent_points: 0,
            loyalty_level: 'Bronze'
          })
          .select()
          .single();

        if (createError) {
          console.error('❌ Erreur création compte loyalty:', {
            code: createError.code,
            message: createError.message,
            details: createError.details
          });
          
          toast({
            title: "Impossible de créer votre compte de fidélité",
            description: "Veuillez réessayer ou contactez le support",
            variant: "destructive"
          });
          throw createError;
        }
        
        console.log('✅ Compte loyalty créé avec succès');
        setLoyaltyData(newData as any);
        return;
      } else if (error) {
        throw error;
      }

      setLoyaltyData(data as any);
    } catch (error) {
      console.error('Erreur chargement points:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger vos points de fidélité",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const redeemPoints = async (pointsToRedeem: number, redeemType: 'wallet' | 'marketplace') => {
    if (!user || !loyaltyData) return null;

    if (loyaltyData.current_points < pointsToRedeem) {
      toast({
        title: "Solde insuffisant",
        description: `Vous avez seulement ${loyaltyData.current_points} points`,
        variant: "destructive"
      });
      return null;
    }

    try {
      setRedeeming(true);

      const { data, error } = await supabase.functions.invoke('redeem-loyalty-points', {
        body: {
          points_to_redeem: pointsToRedeem,
          redeem_type: redeemType
        }
      });

      if (error) throw error;

      const cdfValue = (pointsToRedeem / CONVERSION_RATE.points) * CONVERSION_RATE.cdf;

      toast({
        title: "✅ Conversion réussie !",
        description: redeemType === 'wallet'
          ? `${pointsToRedeem} points convertis en ${cdfValue.toLocaleString()} CDF`
          : `${pointsToRedeem} points utilisés pour votre achat`,
        duration: 5000
      });

      // Rafraîchir les données
      await fetchLoyaltyPoints();

      return data;
    } catch (error) {
      console.error('Erreur conversion points:', error);
      toast({
        title: "Erreur de conversion",
        description: error.message || "Impossible de convertir vos points",
        variant: "destructive"
      });
      return null;
    } finally {
      setRedeeming(false);
    }
  };

  const awardPoints = async (points: number, sourceType: string, sourceId?: string, description?: string) => {
    if (!user) return;

    try {
      // Récupérer le compte actuel
      const { data: currentData } = await supabase
        .from('user_loyalty_points')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (currentData) {
        // Mettre à jour le solde
        await supabase
          .from('user_loyalty_points')
          .update({
            current_points: (currentData as any).current_points + points,
            total_earned_points: ((currentData as any).total_earned_points || 0) + points
          } as any)
          .eq('user_id', user.id);

        // Enregistrer la transaction
        await (supabase as any).from('loyalty_points_transactions').insert({
          user_id: user.id,
          transaction_type: 'earned',
          points_amount: points,
          source_type: sourceType,
          source_id: sourceId,
          description: description || `Gain de ${points} points`
        });

        // Rafraîchir
        await fetchLoyaltyPoints();
      }
    } catch (error) {
      console.error('Erreur attribution points:', error);
    }
  };

  const getNextTierProgress = () => {
    if (!loyaltyData) return { nextTier: null, progress: 0, pointsNeeded: 0 };

    // Normaliser le tier au cas où il y aurait des problèmes de casse
    const currentTier = (loyaltyData.tier?.toLowerCase() || 'bronze') as LoyaltyTier;
    
    // Vérifier que le tier actuel existe dans la config
    if (!TIER_CONFIG[currentTier]) {
      console.warn('Tier invalide:', loyaltyData.tier, '- Utilisation de bronze par défaut');
      return { nextTier: 'silver' as LoyaltyTier, progress: 0, pointsNeeded: TIER_CONFIG.silver.minPoints };
    }

    const tiers: LoyaltyTier[] = ['bronze', 'silver', 'gold', 'platinum'];
    const currentTierIndex = tiers.indexOf(currentTier);
    
    // Si tier inconnu ou platinum
    if (currentTierIndex === -1 || currentTierIndex === tiers.length - 1) {
      return { nextTier: null, progress: 100, pointsNeeded: 0 };
    }

    const nextTier = tiers[currentTierIndex + 1];
    
    // Vérifier que le nextTier existe dans la config
    if (!TIER_CONFIG[nextTier]) {
      console.error('Next tier invalide:', nextTier);
      return { nextTier: null, progress: 100, pointsNeeded: 0 };
    }

    const currentTierMin = TIER_CONFIG[currentTier].minPoints;
    const nextTierMin = TIER_CONFIG[nextTier].minPoints;
    const earnedTotal = (loyaltyData as any).total_earned_points || 0;
    const progress = ((earnedTotal - currentTierMin) / (nextTierMin - currentTierMin)) * 100;
    const pointsNeeded = nextTierMin - earnedTotal;

    return { nextTier, progress: Math.min(Math.max(progress, 0), 100), pointsNeeded: Math.max(pointsNeeded, 0) };
  };

  useEffect(() => {
    if (user) {
      fetchLoyaltyPoints();

      // S'abonner aux changements
      const channel = supabase
        .channel('loyalty-points-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_loyalty_points',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            fetchLoyaltyPoints();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  return {
    loyaltyData,
    loading,
    redeeming,
    redeemPoints,
    awardPoints,
    getNextTierProgress,
    refresh: fetchLoyaltyPoints
  };
};