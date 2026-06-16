import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface WalletData {
  id: string;
  balance: number;
  bonus_balance: number;
  ecosystem_credits: number;
  kwenda_points: number;
  currency: string;
  is_active: boolean;
}

interface TransactionData {
  id: string;
  transaction_type: string;
  amount: number;
  currency: string;
  description: string;
  created_at: string;
  status: string;
  balance_before: number;
  balance_after: number;
  payment_method?: string;
  reference_id?: string;
  reference_type?: string;
  user_id: string;
  wallet_id: string;
}

export const useWallet = () => {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const { user, loading: authLoading } = useAuth();

  const fetchWallet = async () => {
    console.log('🔄 [Wallet] fetchWallet called - User:', user?.id, 'AuthLoading:', authLoading);
    
    if (!user?.id) {
      console.log('⚠️ [Wallet] No user ID, clearing wallet state');
      setWallet(null);
      setTransactions([]);
      setError(null);
      setLoading(false);
      setInitialized(true);
      return;
    }

    if (authLoading) {
      console.log('⏳ [Wallet] Auth still loading, waiting...');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('📞 [Wallet] Fetching wallet for user:', user.id);
      
      const { data, error } = await supabase
        .from('user_wallets')
        .select('id, balance, bonus_balance, ecosystem_credits, kwenda_points, currency, is_active')
        .eq('user_id', user.id)
        .eq('currency', 'XOF')
        .maybeSingle();

      if (error) {
        console.error('❌ [Wallet] Query error:', error);
        throw error;
      }

      if (!data) {
        console.log('💳 [Wallet] No wallet found, creating new one');
        const { data: newWallet, error: createError } = await supabase
          .from('user_wallets')
          .insert({
            user_id: user.id,
            balance: 0,
            bonus_balance: 0,
            ecosystem_credits: 0,
            kwenda_points: 0,
            currency: 'XOF',
            is_active: true
          })
          .select('id, balance, bonus_balance, ecosystem_credits, kwenda_points, currency, is_active')
          .single();

        if (createError) {
          console.error('❌ [Wallet] Create error:', createError);
          throw createError;
        }
        
        setWallet(newWallet);
        console.log('✅ [Wallet] Wallet created:', newWallet);
      } else {
        setWallet(data);
        console.log('✅ [Wallet] Wallet loaded:', data);
      }
    } catch (error: any) {
      console.error('💥 [Wallet] Error in fetchWallet:', error);
      setError(error.message || 'Erreur lors du chargement du portefeuille');
      toast.error('Erreur lors du chargement du portefeuille');
    } finally {
      setLoading(false);
      setInitialized(true);
      console.log('🏁 [Wallet] fetchWallet completed');
    }
  };

  const fetchTransactions = async () => {
    if (!user || !wallet) return;

    try {
      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error: any) {
      console.error('Error fetching transactions:', error);
      toast.error('Erreur lors du chargement des transactions');
    }
  };

  const topUpWallet = async (amount: number, provider: string, phone: string) => {
    if (!user) return false;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('mobile-money-payment', {
        body: {
          amount,
          provider,
          phoneNumber: phone,
          currency: 'XOF',
          orderType: 'wallet_topup',
          userType: 'client'
        }
      });

      if (error) throw error;

      if (data.success) {
        toast.success('Recharge effectuée avec succès');
        await fetchWallet();
        await fetchTransactions();
        return true;
      } else {
        throw new Error(data.error || 'Échec de la recharge');
      }
    } catch (error: any) {
      console.error('Top-up error:', error);
      const errorMessage = error.message?.includes('insufficient')
        ? 'Échec du paiement mobile. Vérifiez votre solde.'
        : error.message?.includes('timeout')
        ? 'La transaction a expiré. Réessayez dans quelques instants.'
        : error.message || 'Erreur lors de la recharge du portefeuille';
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const transferFunds = async (
    recipientPhoneOrId: string, 
    amount: number, 
    description: string
  ) => {
    if (!user) {
      toast.error('Vous devez être connecté');
      return false;
    }

    if (!wallet) {
      toast.error('Portefeuille non initialisé');
      return false;
    }

    // Validations côté client (UX)
    if (amount < 100) {
      toast.error('Montant minimum : 100 CDF');
      return false;
    }

    if (amount > 500000) {
      toast.error('Montant maximum : 500,000 CDF par transfert');
      return false;
    }

    if (wallet.balance < amount) {
      toast.error(`Solde insuffisant (disponible: ${wallet.balance.toLocaleString()} CDF)`);
      return false;
    }

    setLoading(true);
    try {
      // 🔐 PHASE 1: Récupérer la session avec token JWT
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('Session expirée. Veuillez vous reconnecter.');
      }

      console.log('💸 Transfert wallet:', {
        recipientIdentifier: recipientPhoneOrId,
        amount,
        hasSession: !!session,
        userId: user?.id,
        tokenLength: session?.access_token?.length
      });

      const { data, error } = await supabase.functions.invoke('wallet-transfer', {
        body: {
          recipientIdentifier: recipientPhoneOrId,
          amount,
          description
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(
          `Transfert de ${amount.toLocaleString()} CDF effectué avec succès`,
          {
            description: `Envoyé à ${data.recipientName || 'Destinataire'}`
          }
        );
        
        await fetchWallet();
        await fetchTransactions();
        return true;
      } else {
        throw new Error(data?.error || 'Échec du transfert');
      }
    } catch (error: any) {
      console.error('Transfer error:', error);
      const errorMessage = error.message?.includes('not found')
        ? 'Destinataire introuvable. Vérifiez le numéro ou l\'identifiant.'
        : error.message?.includes('rate limit')
        ? 'Trop de transferts. Réessayez dans 1 heure (max 10/heure).'
        : error.message?.includes('insufficient')
        ? `Solde insuffisant (${wallet?.balance.toLocaleString()} CDF disponible)`
        : error.message || 'Erreur lors du transfert';
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('🔄 [Wallet] Effect triggered - User:', user?.id, 'AuthLoading:', authLoading, 'Initialized:', initialized);
    
    if (authLoading) {
      console.log('⏳ [Wallet] Auth loading, skipping wallet fetch');
      return;
    }

    if (!initialized) {
      console.log('🚀 [Wallet] Initializing wallet...');
      fetchWallet();
    }
  }, [user?.id, authLoading, initialized]);

  useEffect(() => {
    if (wallet && !loading) {
      fetchTransactions();
    }
  }, [wallet]);

  return {
    wallet,
    transactions,
    loading: loading || authLoading,
    error,
    initialized,
    fetchWallet,
    fetchTransactions,
    topUpWallet,
    transferFunds
  };
};