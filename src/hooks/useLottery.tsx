import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface LotteryTicket {
  id: string;
  ticket_number: string;
  source_type: string;
  source_id?: string;
  earned_date: string;
  status: string;
  multiplier: number;
  expires_at?: string;
}

interface LotteryDraw {
  id: string;
  name: string;
  draw_type: string;
  scheduled_date: string;
  status: string;
  min_tickets_required: number;
  max_winners: number;
  total_participants: number;
  prize_pool: any;
}

interface LotteryEntry {
  id: string;
  draw_id: string;
  tickets_used: number;
  entry_time: string;
  is_winner: boolean;
  prize_won?: any;
  claimed_at?: string;
}

interface LotteryWin {
  id: string;
  draw_id: string;
  prize_details: any;
  prize_value: number;
  currency: string;
  status: string;
  claimed_at?: string;
  expires_at?: string;
}

export const useLottery = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [myWins, setMyWins] = useState<LotteryWin[]>([]);

  // ✅ PHASE 2: Optimisé avec limite 10 au lieu de 50
  const loadLotteryData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Charger uniquement les 10 derniers gains
      const { data: winsData, error: winsError } = await supabase
        .from('lottery_wins')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10); // ✅ Réduit de 50 à 10

      if (winsError) throw winsError;
      setMyWins(winsData || []);

    } catch (error) {
      console.error('Erreur lors du chargement des gains:', error);
    } finally {
      setLoading(false);
    }
  };


  // Réclamer un gain
  const claimWin = async (winId: string) => {
    try {
      const { error } = await supabase
        .from('lottery_wins')
        .update({ 
          status: 'claimed',
          claimed_at: new Date().toISOString()
        })
        .eq('id', winId)
        .eq('user_id', user?.id);

      if (error) throw error;

      // Recharger les données
      await loadLotteryData();
    } catch (error) {
      console.error('Erreur lors de la réclamation du gain:', error);
      throw error;
    }
  };

  // Effet pour charger les données au montage et écouter les changements en temps réel
  useEffect(() => {
    if (user) {
      loadLotteryData();

      // Écouter les nouveaux gains
      const winsChannel = supabase
        .channel('user-lottery-wins')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'lottery_wins',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            loadLotteryData();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(winsChannel);
      };
    }
  }, [user]);

  return {
    loading,
    myWins,
    claimWin,
    refreshData: loadLotteryData
  };
};