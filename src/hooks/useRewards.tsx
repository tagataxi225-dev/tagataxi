import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

interface UserReward {
  id: string;
  title: string;
  description: string;
  reward_type: 'points' | 'discount' | 'free_delivery' | 'gift';
  reward_value: number;
  points_required?: number;
  is_claimed: boolean;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

interface UserStats {
  total_orders: number;
  total_spent: number;
  loyalty_points: number;
  current_level: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  days_since_registration: number;
}

export const useRewards = () => {
  const [rewards, setRewards] = useState<UserReward[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchUserRewards = async () => {
    setIsLoading(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      // Calculer et récupérer les points de fidélité avec la fonction SQL
      const { data: loyaltyData } = await supabase.rpc('calculate_user_loyalty_points', {
        p_user_id: user.user.id
      });

      if (loyaltyData && typeof loyaltyData === 'object') {
        const data = loyaltyData as any;
        setUserStats({
          total_orders: data.total_orders || 0,
          total_spent: data.total_spent || 0,
          loyalty_points: data.current_points || 0,
          current_level: data.loyalty_level || 'Bronze',
          days_since_registration: 0 // Calculé côté client si nécessaire
        });
      }

      // Récupérer les récompenses disponibles depuis la base de données
      const { data: rewardsData, error: rewardsError } = await supabase
        .from('user_rewards')
        .select('*')
        .eq('user_id', user.user.id)
        .order('created_at', { ascending: false });

      if (rewardsError) {
        console.error('Erreur récupération récompenses:', rewardsError);
        return;
      }

      const userRewards: UserReward[] = (rewardsData || []).map(reward => ({
        id: reward.id,
        title: reward.title,
        description: reward.description,
        reward_type: reward.reward_type as 'points' | 'discount' | 'free_delivery' | 'gift',
        reward_value: reward.reward_value,
        points_required: reward.points_required,
        is_claimed: reward.is_claimed,
        expires_at: reward.expires_at,
        created_at: reward.created_at,
        updated_at: reward.updated_at
      }));

      // Générer des récompenses dynamiques basées sur les statistiques utilisateur
      if (loyaltyData) {
        const dynamicRewards: UserReward[] = [];

        // Récompenses basées sur le niveau de fidélité
        const data = loyaltyData as any;
        if (data.loyalty_level === 'Silver' && data.total_orders >= 5) {
          dynamicRewards.push({
            id: 'silver-discount',
            title: 'Réduction Argent',
            description: '10% de réduction sur votre prochaine course',
            reward_type: 'discount',
            reward_value: 10,
            is_claimed: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }

        if (data.loyalty_level === 'Gold' && data.total_orders >= 10) {
          dynamicRewards.push({
            id: 'gold-free-delivery',
            title: 'Livraison Gratuite Or',
            description: 'Livraison gratuite pour vos 3 prochaines commandes',
            reward_type: 'free_delivery',
            reward_value: 3,
            is_claimed: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }

        // Récompenses basées sur les points
        if (data.current_points >= 100) {
          dynamicRewards.push({
            id: 'points-discount-5',
            title: 'Réduction 5%',
            description: 'Échanger 100 points contre 5% de réduction',
            reward_type: 'discount',
            reward_value: 5,
            points_required: 100,
            is_claimed: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }

        if (data.current_points >= 250) {
          dynamicRewards.push({
            id: 'points-discount-15',
            title: 'Réduction 15%',
            description: 'Échanger 250 points contre 15% de réduction',
            reward_type: 'discount',
            reward_value: 15,
            points_required: 250,
            is_claimed: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }

        // Combiner les récompenses de la DB et les récompenses dynamiques
        const allRewards = [...userRewards];
        dynamicRewards.forEach(dynamicReward => {
          // Ajouter seulement si pas déjà présente
          if (!allRewards.find(r => r.id === dynamicReward.id)) {
            allRewards.push(dynamicReward);
          }
        });

        setRewards(allRewards);
      } else {
        setRewards(userRewards);
      }

    } catch (error) {
      console.error('Erreur lors de la récupération des récompenses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const claimReward = async (rewardId: string) => {
    try {
      const reward = rewards.find(r => r.id === rewardId);
      if (!reward) return false;

      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return false;

      // Si c'est une récompense de la DB, la marquer comme réclamée
      if (reward.created_at && !reward.id.startsWith('silver-') && !reward.id.startsWith('gold-') && !reward.id.startsWith('points-')) {
        const { error: updateError } = await supabase
          .from('user_rewards')
          .update({ 
            is_claimed: true,
            claimed_at: new Date().toISOString()
          })
          .eq('id', rewardId);

        if (updateError) throw updateError;
      }

      // Create promo code for the reward
      const promoCode = `REWARD${Date.now().toString().slice(-6)}`;
      
      const { error } = await supabase.from('promo_codes').insert({
        code: promoCode,
        title: reward.title,
        description: reward.description,
        discount_type: reward.reward_type === 'discount' ? 'percentage' : 
                     reward.reward_type === 'gift' ? 'fixed_amount' : 'free_delivery',
        discount_value: reward.reward_value,
        min_order_amount: 0,
        applicable_services: ['transport', 'delivery', 'marketplace'],
        usage_limit: 1,
        user_limit: 1,
        valid_until: reward.expires_at || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        created_by: user.user.id
      });

      if (error) throw error;

      // Deduct points if required
      if (reward.points_required && userStats) {
        // Mettre à jour les points dans la base de données
        const { error: pointsError } = await supabase
          .from('user_loyalty_points')
          .update({ 
            current_points: userStats.loyalty_points - reward.points_required,
            total_spent_points: userStats.loyalty_points - reward.points_required
          })
          .eq('user_id', user.user.id);

        if (!pointsError) {
          // Mettre à jour l'état local
          setUserStats(prev => prev ? {
            ...prev,
            loyalty_points: prev.loyalty_points - (reward.points_required || 0)
          } : null);
        }
      }

      // Mark reward as claimed
      setRewards(prev => prev.map(r => 
        r.id === rewardId ? { ...r, is_claimed: true } : r
      ));

      toast({
        title: "Récompense réclamée !",
        description: `Code promo ${promoCode} ajouté à votre compte`,
      });

      return true;
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    fetchUserRewards();
  }, []);

  return {
    rewards,
    userStats,
    isLoading,
    claimReward,
    refreshRewards: fetchUserRewards
  };
};