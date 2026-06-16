import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

// Points par action pour débloquer une carte à gratter
export const ACTION_POINTS = {
  vtc_ride: 15,
  delivery_order: 10,
  marketplace_purchase: 12,
  wallet_topup: 5,
  daily_login: 2,
  referral_success: 25,
} as const;

export type ActionType = keyof typeof ACTION_POINTS;

export interface ProgressStep {
  position: number;
  completed: boolean;
  isCurrent: boolean;
  reward?: 'gift' | 'card' | 'bonus';
}

export interface ScratchProgress {
  currentPoints: number;
  requiredPoints: number;
  percentage: number;
  actionsRemaining: number;
  steps: ProgressStep[];
  cardsUnlocked: number;
  totalWinnings: number;
  currency: string;
}

export interface UseScratchProgressReturn {
  progress: ScratchProgress;
  loading: boolean;
  addPoints: (actionType: ActionType, customPoints?: number) => Promise<void>;
  refresh: () => Promise<void>;
}

const POINTS_PER_CARD = 100;
const TOTAL_STEPS = 5;

export const useScratchProgress = (): UseScratchProgressReturn => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<ScratchProgress>({
    currentPoints: 0,
    requiredPoints: POINTS_PER_CARD,
    percentage: 0,
    actionsRemaining: 100,
    steps: [],
    cardsUnlocked: 0,
    totalWinnings: 0,
    currency: 'XOF'
  });

  const calculateSteps = (points: number): ProgressStep[] => {
    const pointsPerStep = POINTS_PER_CARD / TOTAL_STEPS;
    const currentStep = Math.floor(points / pointsPerStep);
    
    return Array.from({ length: TOTAL_STEPS }, (_, i) => ({
      position: i,
      completed: i < currentStep,
      isCurrent: i === currentStep,
      reward: i === TOTAL_STEPS - 1 ? 'card' : undefined
    }));
  };

  const loadProgress = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data: wallet } = await supabase
        .from('user_wallets')
        .select('kwenda_points')
        .eq('user_id', user.id)
        .maybeSingle();

      const currentPoints = (wallet?.kwenda_points || 0) % POINTS_PER_CARD;

      const { data: wins } = await supabase
        .from('lottery_wins')
        .select('prize_value, currency')
        .eq('user_id', user.id)
        .eq('status', 'claimed');

      const totalWinnings = wins?.reduce((sum, w) => sum + (w.prize_value || 0), 0) || 0;
      const currency = wins?.[0]?.currency || 'XOF';

      const { count: cardsCount } = await supabase
        .from('lottery_wins')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      const pointsInCurrentCycle = currentPoints % POINTS_PER_CARD;
      const cardsUnlocked = Math.floor(currentPoints / POINTS_PER_CARD);
      const percentage = (pointsInCurrentCycle / POINTS_PER_CARD) * 100;
      const actionsRemaining = Math.ceil((POINTS_PER_CARD - pointsInCurrentCycle) / 10);

      setProgress({
        currentPoints: pointsInCurrentCycle,
        requiredPoints: POINTS_PER_CARD,
        percentage,
        actionsRemaining,
        steps: calculateSteps(pointsInCurrentCycle),
        cardsUnlocked: cardsCount || cardsUnlocked,
        totalWinnings,
        currency
      });
    } catch (error) {
      console.error('Erreur chargement progression:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Delegate point addition to server-side Edge Function (RLS-safe)
  const addPoints = useCallback(async (actionType: ActionType, customPoints?: number) => {
    if (!user) return;

    try {
      const { error } = await supabase.functions.invoke('lottery-system', {
        body: {
          action: 'add_progress_points',
          userId: user.id,
          actionType,
          customPoints,
        }
      });

      if (error) {
        console.error('Erreur ajout points:', error);
        return;
      }

      await loadProgress();
    } catch (error) {
      console.error('Erreur ajout points:', error);
    }
  }, [user, loadProgress]);

  const refresh = useCallback(async () => {
    setLoading(true);
    await loadProgress();
  }, [loadProgress]);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  return { progress, loading, addPoints, refresh };
};
