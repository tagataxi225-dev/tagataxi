import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { secureLog } from '@/utils/secureLogger';

interface RestaurantWallet {
  id: string;
  user_id: string;
  balance: number;
  bonus_balance: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

interface WalletTransaction {
  id: string;
  transaction_type: string;
  amount: number;
  currency: string;
  description: string;
  reference_id?: string;
  reference_type?: string;
  status: string;
  created_at: string;
}

interface TopUpRequest {
  amount: number;
  payment_method: 'orange_money' | 'm_pesa' | 'airtel_money';
  phone_number: string;
}

export const useRestaurantWallet = () => {
  const [wallet, setWallet] = useState<RestaurantWallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [topUpLoading, setTopUpLoading] = useState(false);
  const { toast } = useToast();

  const fetchWallet = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      secureLog.log('💰 [useRestaurantWallet] Fetching wallet for user:', user.id);

      // Créer ou récupérer le wallet depuis user_wallets
      let { data: wallet, error } = await supabase
        .from('user_wallets')
        .select('*')
        .eq('user_id', user.id)
        .eq('currency', 'XOF')
        .single();

      if (error && error.code === 'PGRST116') {
        secureLog.log('💰 [useRestaurantWallet] Creating new wallet');
        // Créer le wallet s'il n'existe pas
        const { data: newWallet, error: createError } = await supabase
          .from('user_wallets')
          .insert({
            user_id: user.id,
            balance: 0,
            bonus_balance: 0,
            currency: 'XOF'
          })
          .select()
          .single();

        if (createError) throw createError;
        wallet = newWallet;
      } else if (error) {
        throw error;
      }

      secureLog.log('💰 [useRestaurantWallet] Wallet loaded:', wallet);
      setWallet(wallet);
    } catch (error) {
      secureLog.error('❌ [useRestaurantWallet] Error fetching wallet:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger votre wallet restaurant",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      secureLog.log('💰 [useRestaurantWallet] Transactions loaded:', data?.length);
      setTransactions(data || []);
    } catch (error) {
      secureLog.error('❌ [useRestaurantWallet] Error fetching transactions:', error);
    }
  };

  const topUpWallet = async (request: TopUpRequest) => {
    try {
      setTopUpLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user || !wallet) {
        throw new Error('Utilisateur non connecté ou wallet non trouvé');
      }

      secureLog.log('💰 [useRestaurantWallet] Initiating top-up:', request);

      // Appeler l'edge function pour recharge
      const { data, error } = await supabase.functions.invoke('wallet-restaurant-topup', {
        body: {
          amount: request.amount,
          payment_method: request.payment_method,
          phone_number: request.phone_number,
          currency: 'XOF'
        }
      });

      if (error) throw error;

      secureLog.log('✅ [useRestaurantWallet] Top-up successful:', data);

      toast({
        title: "Recharge initiée",
        description: `Recharge de ${request.amount.toLocaleString()} CDF en cours de traitement`
      });

      // Rafraîchir les données
      await fetchWallet();
      await fetchTransactions();

      return data;
    } catch (error: any) {
      secureLog.error('❌ [useRestaurantWallet] Top-up error:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de recharger votre wallet",
        variant: "destructive"
      });
      throw error;
    } finally {
      setTopUpLoading(false);
    }
  };

  const getMonthlyStats = () => {
    if (!transactions.length) return { spent: 0, recharged: 0 };

    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthlyTransactions = transactions.filter(
      t => new Date(t.created_at) >= firstDayOfMonth
    );

    const spent = monthlyTransactions
      .filter(t => t.transaction_type === 'debit')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const recharged = monthlyTransactions
      .filter(t => t.transaction_type === 'credit')
      .reduce((sum, t) => sum + t.amount, 0);

    return { spent, recharged };
  };

  const formatAmount = (amount: number) => {
    return `${amount.toLocaleString()} CDF`;
  };

  useEffect(() => {
    fetchWallet();
    fetchTransactions();

    // Subscribe to wallet changes
    const channel = supabase
      .channel('restaurant-wallet-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_wallets'
        },
        (payload) => {
          secureLog.log('💰 [useRestaurantWallet] Wallet updated:', payload);
          setWallet(payload.new as RestaurantWallet);
          toast({
            title: "Wallet mis à jour",
            description: "Votre solde a été actualisé"
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    wallet,
    transactions,
    loading,
    topUpLoading,
    topUpWallet,
    formatAmount,
    getMonthlyStats,
    refetch: () => {
      fetchWallet();
      fetchTransactions();
    }
  };
};
