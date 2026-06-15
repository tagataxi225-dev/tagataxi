import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

interface Challenge {
  id: string;
  title: string;
  description: string;
  challenge_type: string;
  target_value: number;
  target_metric: string;
  reward_type: string;
  reward_value: number;
  reward_currency: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

interface DriverChallenge {
  id: string;
  challenge_id: string;
  current_progress: number;
  is_completed: boolean;
  completed_at?: string;
  reward_claimed: boolean;
  reward_claimed_at?: string;
  challenge: Challenge;
}

interface ChallengeReward {
  id: string;
  challenge_id: string;
  reward_type: string;
  reward_value: number;
  reward_currency: string;
  created_at: string;
  challenge: Pick<Challenge, 'title'>;
}

export const useChallenges = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [activeChallenges, setActiveChallenges] = useState<DriverChallenge[]>([]);
  const [completedChallenges, setCompletedChallenges] = useState<DriverChallenge[]>([]);
  const [rewardHistory, setRewardHistory] = useState<ChallengeReward[]>([]);

  const loadChallenges = async () => {
    if (!user) return;
    
    try {
      setLoading(true);

      // Load driver's active challenges
      const { data: driverChallenges, error: challengesError } = await supabase
        .from('driver_challenges')
        .select(`
          *,
          challenge:challenges(*)
        `)
        .eq('driver_id', user.id)
        .order('created_at', { ascending: false });

      if (challengesError) {
        console.error('Error loading challenges:', challengesError);
        throw challengesError;
      }

      // Separate active and completed challenges
      const active = driverChallenges?.filter(dc => !dc.is_completed) || [];
      const completed = driverChallenges?.filter(dc => dc.is_completed) || [];

      setActiveChallenges(active);
      setCompletedChallenges(completed);

      // Load reward history
      const { data: rewards, error: rewardsError } = await supabase
        .from('challenge_rewards')
        .select(`
          *,
          challenge:challenges(title)
        `)
        .eq('driver_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (rewardsError) {
        console.error('Error loading rewards:', rewardsError);
      } else {
        setRewardHistory(rewards || []);
      }

    } catch (error) {
      console.error('Error in loadChallenges:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les challenges",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const claimReward = async (driverChallengeId: string) => {
    if (!user) return;

    try {
      const response = await supabase.functions.invoke('claim-challenge-reward', {
        body: { driver_challenge_id: driverChallengeId }
      });

      if (response.error) {
        throw response.error;
      }

      toast({
        title: "Récompense réclamée !",
        description: "Votre récompense a été créditée dans votre portefeuille",
      });

      // Reload challenges to update status
      await loadChallenges();

    } catch (error) {
      console.error('Error claiming reward:', error);
      toast({
        title: "Erreur",
        description: "Impossible de réclamer la récompense",
        variant: "destructive",
      });
    }
  };

  const enrollInNewChallenges = async () => {
    if (!user) return;

    try {
      const response = await supabase.functions.invoke('enroll-challenges', {
        body: { driver_id: user.id }
      });

      if (response.error) {
        throw response.error;
      }

      await loadChallenges();
      
      toast({
        title: "Nouveaux challenges !",
        description: "Vous avez été inscrit aux nouveaux challenges disponibles",
      });

    } catch (error) {
      console.error('Error enrolling in challenges:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les nouveaux challenges",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (user) {
      loadChallenges();
    }
  }, [user]);

  // Set up real-time listeners for challenge updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('driver-challenges-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'driver_challenges',
          filter: `driver_id=eq.${user.id}`
        },
        () => {
          loadChallenges();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'challenge_rewards',
          filter: `driver_id=eq.${user.id}`
        },
        (payload) => {
          toast({
            title: "Nouvelle récompense !",
            description: "Vous avez gagné une récompense de challenge",
          });
          loadChallenges();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    loading,
    activeChallenges,
    completedChallenges,
    rewardHistory,
    claimReward,
    enrollInNewChallenges,
    refreshChallenges: loadChallenges
  };
};