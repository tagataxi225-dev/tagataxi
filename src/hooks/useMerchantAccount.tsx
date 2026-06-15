import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MerchantAccount {
  id: string;
  vendor_id: string;
  balance: number;
  total_earned: number;
  total_withdrawn: number;
  pending_withdrawals: number;
  currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface MerchantTransaction {
  id: string;
  merchant_account_id: string;
  vendor_id: string;
  transaction_type: string;
  amount: number;
  currency: string;
  description: string;
  reference_id?: string;
  reference_type?: string;
  balance_before: number;
  balance_after: number;
  status: string;
  created_at: string;
}

interface WithdrawalRequest {
  amount: number;
  withdrawal_method: string;
  phone_number?: string;
}

export const useMerchantAccount = () => {
  const [merchantAccount, setMerchantAccount] = useState<MerchantAccount | null>(null);
  const [transactions, setTransactions] = useState<MerchantTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);
  const { toast } = useToast();

  const fetchMerchantAccount = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Obtenir ou créer le compte marchand
      let { data: account, error } = await supabase
        .from('merchant_accounts')
        .select('*')
        .eq('vendor_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (!account) {
        // Créer le compte marchand s'il n'existe pas
        const { data: newAccount, error: createError } = await supabase
          .from('merchant_accounts')
          .insert({
            vendor_id: user.id,
            balance: 0,
            currency: 'CDF'
          })
          .select()
          .single();

        if (createError) throw createError;
        account = newAccount;
      }

      setMerchantAccount(account);
    } catch (error) {
      console.error('Erreur lors de la récupération du compte marchand:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger le compte marchand",
        variant: "destructive",
      });
    }
  };

  const fetchTransactions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data, error } = await supabase
        .from('merchant_transactions')
        .select('*')
        .eq('vendor_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Erreur lors de la récupération des transactions:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger l'historique des transactions",
        variant: "destructive",
      });
    }
  };

  const requestWithdrawal = async (withdrawal: WithdrawalRequest) => {
    try {
      setWithdrawing(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      if (!merchantAccount) {
        throw new Error('Compte marchand non trouvé');
      }

      if (withdrawal.amount > merchantAccount.balance) {
        throw new Error('Solde insuffisant');
      }

      // Calculer les frais (2% min 500 CDF)
      const feeRate = 0.02;
      const minFee = 500;
      const fee = Math.max(withdrawal.amount * feeRate, minFee);
      const netAmount = withdrawal.amount - fee;

      // ✅ STANDARDISATION : Utiliser vendor-withdrawal edge function
      const { data, error } = await supabase.functions.invoke('vendor-withdrawal', {
        body: {
          amount: withdrawal.amount,
          paymentMethod: 'mobile_money',
          paymentDetails: {
            provider: withdrawal.withdrawal_method,
            phoneNumber: withdrawal.phone_number
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Retrait demandé",
        description: `Votre demande de retrait de ${formatAmount(netAmount)} CDF (frais: ${formatAmount(fee)} CDF) a été soumise avec succès.`,
      });

      // Rafraîchir les données
      await Promise.all([fetchMerchantAccount(), fetchTransactions()]);

    } catch (error) {
      console.error('Erreur lors de la demande de retrait:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de traiter la demande de retrait",
        variant: "destructive",
      });
    } finally {
      setWithdrawing(false);
    }
  };

  const formatAmount = (amount: number): string => {
    return new Intl.NumberFormat('fr-CD').format(amount);
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchMerchantAccount(), fetchTransactions()]);
      setLoading(false);
    };

    loadData();
  }, []);

  return {
    merchantAccount,
    transactions,
    loading,
    withdrawing,
    requestWithdrawal,
    formatAmount,
    refetch: () => Promise.all([fetchMerchantAccount(), fetchTransactions()])
  };
};