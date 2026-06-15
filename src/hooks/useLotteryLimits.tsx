import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LotteryLimits {
  daily_limit: number;
  cards_earned_today: number;
  vip_bonus: number;
  unlimited_until?: string;
  can_earn_more: boolean;
  remaining_today: number;
}

export const useLotteryLimits = () => {
  const [limits, setLimits] = useState<LotteryLimits | null>(null);
  const [loading, setLoading] = useState(true);

  const loadLimits = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('lottery_user_limits')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (!data) {
        // Créer les limites initiales
        const { data: newLimit, error: insertError } = await supabase
          .from('lottery_user_limits')
          .insert({
            user_id: user.id,
            daily_limit: 5,
            cards_earned_today: 0,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        
        setLimits({
          daily_limit: newLimit.daily_limit,
          cards_earned_today: newLimit.cards_earned_today,
          vip_bonus: newLimit.vip_bonus,
          unlimited_until: newLimit.unlimited_until,
          can_earn_more: true,
          remaining_today: newLimit.daily_limit + newLimit.vip_bonus,
        });
      } else {
        const totalLimit = data.daily_limit + data.vip_bonus;
        const isUnlimited = data.unlimited_until && new Date(data.unlimited_until) > new Date();
        
        setLimits({
          daily_limit: data.daily_limit,
          cards_earned_today: data.cards_earned_today,
          vip_bonus: data.vip_bonus,
          unlimited_until: data.unlimited_until,
          can_earn_more: isUnlimited || data.cards_earned_today < totalLimit,
          remaining_today: isUnlimited ? 999 : Math.max(0, totalLimit - data.cards_earned_today),
        });
      }
    } catch (error) {
      console.error('Error loading limits:', error);
    } finally {
      setLoading(false);
    }
  };

  const incrementEarnedToday = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase
        .from('lottery_user_limits')
        .update({ cards_earned_today: (limits?.cards_earned_today || 0) + 1 })
        .eq('user_id', user.id);

      if (error) throw error;

      await loadLimits();
      return true;
    } catch (error) {
      console.error('Error incrementing:', error);
      return false;
    }
  };

  useEffect(() => {
    loadLimits();
  }, []);

  return {
    limits,
    loading,
    refresh: loadLimits,
    incrementEarnedToday,
  };
};
