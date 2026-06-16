import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface Transaction {
  id: string;
  amount: number;
  transaction_type: string;
  description: string;
  status: string;
  created_at: string;
}

const EARNING_TYPES = ['ride_earning', 'delivery_earning'];

export const useDriverWallet = () => {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [bonusBalance, setBonusBalance] = useState(0);
  const [ecoCredits, setEcoCredits] = useState(0);
  const [kwendaPoints, setTembeaPoints] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [weeklyEarnings, setWeeklyEarnings] = useState<number[]>(new Array(7).fill(0));
  const [isLoading, setIsLoading] = useState(true);
  const [currency, setCurrency] = useState('XOF');

  const fetchWalletData = useCallback(async () => {
    if (!user) return;
    try {
      setIsLoading(true);

      const { data: walletData } = await supabase
        .from('user_wallets')
        .select('balance, bonus_balance, ecosystem_credits, kwenda_points, currency')
        .eq('user_id', user.id)
        .maybeSingle();

      if (walletData) {
        setBalance(walletData.balance || 0);
        setBonusBalance(walletData.bonus_balance || 0);
        setEcoCredits(walletData.ecosystem_credits || 0);
        setTembeaPoints(walletData.kwenda_points || 0);
        setCurrency(walletData.currency || 'XOF');
      }

      const { data: txData } = await supabase
        .from('wallet_transactions')
        .select('id, amount, transaction_type, description, status, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      setTransactions(txData || []);

      // 7-day earnings: sum of ride_earning / delivery_earning per day
      // (index 0 = oldest, 6 = today)
      const since = new Date();
      since.setDate(since.getDate() - 6);
      since.setHours(0, 0, 0, 0);

      const { data: weekData } = await supabase
        .from('wallet_transactions')
        .select('amount, created_at')
        .eq('user_id', user.id)
        .gte('created_at', since.toISOString())
        .in('transaction_type', EARNING_TYPES);

      const daily = new Array(7).fill(0);
      const todayMidnight = new Date();
      todayMidnight.setHours(0, 0, 0, 0);
      (weekData || []).forEach(tx => {
        const txDay = new Date(tx.created_at);
        txDay.setHours(0, 0, 0, 0);
        const daysAgo = Math.round((todayMidnight.getTime() - txDay.getTime()) / 86_400_000);
        if (daysAgo >= 0 && daysAgo < 7) daily[6 - daysAgo] += tx.amount;
      });
      setWeeklyEarnings(daily);
    } catch (error) {
      console.error('Error fetching wallet data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchWalletData();
  }, [fetchWalletData]);

  // Realtime: wallet balance + new transactions
  useEffect(() => {
    if (!user) return;

    const walletChannel = supabase
      .channel('driver-wallet-balance')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'user_wallets' },
        (payload) => {
          const row = (payload as any).new;
          if (!row || row.user_id !== user.id) return;
          setBalance(row.balance || 0);
          setBonusBalance(row.bonus_balance || 0);
          setEcoCredits(row.ecosystem_credits || 0);
          setTembeaPoints(row.kwenda_points || 0);
          if (row.currency) setCurrency(row.currency);
        }
      )
      .subscribe();

    const txChannel = supabase
      .channel('driver-wallet-transactions')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'wallet_transactions' },
        (payload) => {
          const tx = (payload as any).new as Transaction & { user_id: string };
          if (!tx || tx.user_id !== user.id) return;

          // Prepend to transactions feed (keep latest 20)
          setTransactions(prev => [
            {
              id: tx.id,
              amount: tx.amount,
              transaction_type: tx.transaction_type,
              description: tx.description,
              status: tx.status,
              created_at: tx.created_at,
            },
            ...prev,
          ].slice(0, 20));

          // Bump today's earnings (index 6) when it's a ride/delivery earning
          if (EARNING_TYPES.includes(tx.transaction_type)) {
            setWeeklyEarnings(prev => {
              const next = [...prev];
              next[6] = (next[6] || 0) + (tx.amount || 0);
              return next;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(walletChannel);
      supabase.removeChannel(txChannel);
    };
  }, [user?.id]);

  return { balance, bonusBalance, ecoCredits, kwendaPoints, transactions, weeklyEarnings, isLoading, currency, refetch: fetchWalletData };
};
