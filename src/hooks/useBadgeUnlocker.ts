/**
 * 🏅 Hook de Détection et Déverrouillage Automatique de Badges
 * Vérifie les critères, attribue les badges et déclenche les animations
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { 
  CONGOLESE_BADGES, 
  CongoleseBadge, 
  checkBadgeRequirement 
} from '@/types/congolese-badges';
import { toast } from 'sonner';

interface UserBadgeStats {
  cardsScratched: number;
  megaCards: number;
  consecutiveDays: number;
  xpEarned: number;
}

interface UseBadgeUnlockerReturn {
  loading: boolean;
  earnedBadges: string[];
  stats: UserBadgeStats;
  newlyUnlockedBadge: CongoleseBadge | null;
  dismissUnlockAnimation: () => void;
  checkAndAwardBadges: () => Promise<string[]>;
  refreshBadges: () => Promise<void>;
}

export const useBadgeUnlocker = (): UseBadgeUnlockerReturn => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [earnedBadges, setEarnedBadges] = useState<string[]>([]);
  const [stats, setStats] = useState<UserBadgeStats>({
    cardsScratched: 0,
    megaCards: 0,
    consecutiveDays: 0,
    xpEarned: 0
  });
  const [newlyUnlockedBadge, setNewlyUnlockedBadge] = useState<CongoleseBadge | null>(null);

  // Charger les badges gagnés
  const loadEarnedBadges = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_badges')
        .select('badge_id')
        .eq('user_id', user.id);

      if (error) throw error;

      setEarnedBadges((data || []).map(b => b.badge_id));
    } catch (error) {
      console.error('Erreur chargement badges:', error);
    }
  }, [user]);

  // Charger les stats utilisateur pour calcul des badges
  const loadStats = useCallback(async () => {
    if (!user) return;

    try {
      // Charger stats depuis user_gratta_stats si existe
      const { data: grattaStats } = await supabase
        .from('user_gratta_stats')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (grattaStats) {
        setStats({
          cardsScratched: grattaStats.cards_scratched || 0,
          megaCards: grattaStats.mega_cards || 0,
          consecutiveDays: grattaStats.consecutive_days || 0,
          xpEarned: grattaStats.total_xp_earned || 0
        });
      } else {
        // Fallback: compter depuis lottery_wins
        const { count: cardsCount } = await supabase
          .from('lottery_wins')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .not('scratch_revealed_at', 'is', null);

        setStats({
          cardsScratched: cardsCount || 0,
          megaCards: 0,
          consecutiveDays: 0,
          xpEarned: 0
        });
      }
    } catch (error) {
      console.error('Erreur chargement stats badges:', error);
    }
  }, [user]);

  // Vérifier et attribuer les badges
  const checkAndAwardBadges = useCallback(async (): Promise<string[]> => {
    if (!user) return [];

    const newBadges: string[] = [];

    try {
      // Vérifier chaque badge non encore gagné
      for (const badge of Object.values(CONGOLESE_BADGES)) {
        if (earnedBadges.includes(badge.id)) continue;

        const isEligible = checkBadgeRequirement(badge, stats);
        
        if (isEligible) {
          // Attribuer le badge
          const { error } = await supabase
            .from('user_badges')
            .insert({
              user_id: user.id,
              badge_id: badge.id,
              source: 'gratta'
            });

          if (!error) {
            newBadges.push(badge.id);
            
            // Afficher le premier nouveau badge avec animation
            if (newBadges.length === 1) {
              setNewlyUnlockedBadge(badge);
            } else {
              // Toast pour les badges suivants
              toast.success(`🏅 Badge débloqué: ${badge.name}`, {
                description: badge.description
              });
            }
          }
        }
      }

      if (newBadges.length > 0) {
        setEarnedBadges(prev => [...prev, ...newBadges]);
      }

      return newBadges;
    } catch (error) {
      console.error('Erreur attribution badges:', error);
      return [];
    }
  }, [user, earnedBadges, stats]);

  // Fermer l'animation de déverrouillage
  const dismissUnlockAnimation = useCallback(() => {
    setNewlyUnlockedBadge(null);
  }, []);

  // Rafraîchir les badges
  const refreshBadges = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadEarnedBadges(), loadStats()]);
    setLoading(false);
  }, [loadEarnedBadges, loadStats]);

  // Chargement initial
  useEffect(() => {
    const init = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      await Promise.all([loadEarnedBadges(), loadStats()]);
      setLoading(false);
    };

    init();
  }, [user, loadEarnedBadges, loadStats]);

  // Vérifier les badges automatiquement quand les stats changent
  useEffect(() => {
    if (!loading && user && stats.cardsScratched > 0) {
      checkAndAwardBadges();
    }
  }, [stats, loading, user, checkAndAwardBadges]);

  return {
    loading,
    earnedBadges,
    stats,
    newlyUnlockedBadge,
    dismissUnlockAnimation,
    checkAndAwardBadges,
    refreshBadges
  };
};
