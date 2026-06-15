import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface Referral {
  id: string;
  referee_name: string;
  reward_amount: number;
  status: string;
  created_at: string;
}

export const useReferrals = () => {
  const { user } = useAuth();
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchReferralData = async () => {
      try {
        setIsLoading(true);

        // Récupérer le code de parrainage
        const { data: codeData } = await supabase
          .rpc('get_or_create_referral_code', { p_user_id: user.id });

        if (codeData) {
          setReferralCode(codeData);
        }

        // Récupérer les filleuls depuis referral_system
        const { data: referralsData } = await supabase
          .from('referral_system')
          .select('id, created_at, status, referee_id, referrer_reward_amount')
          .eq('referrer_id', user.id)
          .neq('referee_id', user.id) // Exclure l'enregistrement de création de code
          .order('created_at', { ascending: false });

        if (referralsData) {
          const enrichedReferrals = referralsData.map((ref) => ({
            id: ref.id,
            created_at: ref.created_at,
            status: ref.status,
            reward_amount: ref.status === 'completed' ? ref.referrer_reward_amount : 0,
            referee_name: `Filleul ${ref.referee_id.slice(0, 8)}`
          }));

          setReferrals(enrichedReferrals);

          // Calculer les gains totaux
          const total = enrichedReferrals
            .filter(r => r.status === 'completed')
            .reduce((sum, r) => sum + r.reward_amount, 0);
          setTotalEarnings(total);
        }
      } catch (error) {
        console.error('Error fetching referral data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReferralData();
  }, [user]);

  return { referralCode, referrals, totalEarnings, isLoading };
};
