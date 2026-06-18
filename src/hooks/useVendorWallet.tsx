import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface VendorWallet {
  id: string;
  vendor_id: string;
  balance: number;
  currency: string;
  total_earned: number;
  total_withdrawn: number;
  last_withdrawal_date?: string;
  is_active: boolean;
}

interface VendorTransaction {
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

interface WithdrawalRequest {
  amount: number;
  withdrawal_method: 'orange_money' | 'm_pesa' | 'airtel_money';
  phone_number: string;
}

export const useVendorWallet = () => {
  const [wallet, setWallet] = useState<VendorWallet | null>(null);
  const [transactions, setTransactions] = useState<VendorTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);
  const { toast } = useToast();

  const fetchWallet = async () => {
    try {
      setLoading(true);
      
      // Utiliser l'edge function pour bypass RLS
      const { data, error } = await supabase.functions.invoke('vendor-wallet-manager', {
        body: { action: 'get_or_create', currency: 'XOF' }
      });

      if (error) throw error;

      if (data?.success) {
        setWallet(data.wallet);
        setTransactions(data.transactions || []);
      } else {
        throw new Error(data?.error || 'Erreur inconnue');
      }
    } catch (error) {
      console.error('Erreur lors du chargement du wallet:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger votre wallet TAGA Marchand",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    // Les transactions sont déjà chargées via get_or_create
    // Cette fonction peut être appelée pour rafraîchir uniquement
    try {
      const { data, error } = await supabase.functions.invoke('vendor-wallet-manager', {
        body: { action: 'get_or_create', currency: 'XOF' }
      });

      if (error) throw error;
      if (data?.success && data.transactions) {
        setTransactions(data.transactions);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des transactions:', error);
    }
  };

  const requestWithdrawal = async (withdrawal: WithdrawalRequest) => {
    try {
      setWithdrawing(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user || !wallet) {
        throw new Error('Utilisateur non connecté ou wallet non trouvé');
      }

      if (withdrawal.amount > wallet.balance) {
        throw new Error('Solde insuffisant');
      }

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

      if (data?.success) {
        toast({
          title: "Retrait effectué",
          description: `${data.netAmount.toLocaleString()} CDF envoyés avec succès`
        });
      } else {
        throw new Error(data?.message || 'Échec du retrait');
      }

      // Rafraîchir les données
      await fetchWallet();
      await fetchTransactions();

      return data;
    } catch (error: any) {
      console.error('Erreur lors de la demande de retrait:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de traiter votre demande de retrait",
        variant: "destructive"
      });
      throw error;
    } finally {
      setWithdrawing(false);
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-CD', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount).replace('XOF', 'XOF');
  };

  useEffect(() => {
    fetchWallet();
    fetchTransactions();
  }, []);

  return {
    wallet,
    transactions,
    loading,
    withdrawing,
    requestWithdrawal,
    formatAmount,
    refetch: () => {
      fetchWallet();
      fetchTransactions();
    }
  };
};