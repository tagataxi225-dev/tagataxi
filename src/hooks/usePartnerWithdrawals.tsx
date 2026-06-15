import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface Withdrawal {
  id: string;
  amount: number;
  currency: string;
  status: string;
  payment_method: string;
  account_details: any;
  requested_at: string;
  processed_at?: string;
  notes?: string;
}

interface WithdrawalStats {
  totalRequested: number;
  totalPaid: number;
  totalPending: number;
  availableBalance: number;
}

export const usePartnerWithdrawals = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [stats, setStats] = useState<WithdrawalStats>({
    totalRequested: 0,
    totalPaid: 0,
    totalPending: 0,
    availableBalance: 0
  });

  const fetchWithdrawals = async () => {
    if (!user) return;

    try {
      setLoading(true);

      const { data: withdrawalData, error } = await supabase
        .from('partner_withdrawals')
        .select('*')
        .eq('partner_id', user.id)
        .order('requested_at', { ascending: false });

      if (error) {
        console.error('Error fetching withdrawals:', error);
        return;
      }

      const typedWithdrawals = withdrawalData?.map(w => ({
        ...w,
        status: w.status as 'pending' | 'approved' | 'paid' | 'rejected'
      })) || [];
      setWithdrawals(typedWithdrawals);

      // Calculate stats
      const totalRequested = withdrawalData?.reduce((sum, w) => sum + Number(w.amount), 0) || 0;
      const totalPaid = withdrawalData?.filter(w => w.status === 'paid').reduce((sum, w) => sum + Number(w.amount), 0) || 0;
      const totalPending = withdrawalData?.filter(w => w.status === 'pending').reduce((sum, w) => sum + Number(w.amount), 0) || 0;

      // Utiliser le solde réel du wallet comme base pour le solde disponible
      const { data: walletData } = await supabase
        .from('user_wallets')
        .select('balance')
        .eq('user_id', user.id)
        .maybeSingle();

      const availableBalance = walletData?.balance || 0;

      setStats({
        totalRequested,
        totalPaid,
        totalPending,
        availableBalance: Math.max(0, availableBalance)
      });

    } catch (error) {
      console.error('Error in fetchWithdrawals:', error);
    } finally {
      setLoading(false);
    }
  };

  const requestWithdrawal = async (
    amount: number,
    paymentMethod: string,
    accountDetails: any
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      setLoading(true);

      const { data, error } = await supabase.functions.invoke('partner-withdrawal-request', {
        body: {
          amount,
          paymentMethod,
          accountDetails
        }
      });

      if (error) {
        console.error('Error requesting withdrawal:', error);
        toast({
          title: "Erreur",
          description: "Impossible de créer la demande de retrait",
          variant: "destructive",
        });
        return false;
      }

      if (data.error) {
        toast({
          title: "Erreur",
          description: data.error,
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Succès",
        description: "Demande de retrait créée avec succès",
      });

      // Refresh data
      fetchWithdrawals();
      return true;

    } catch (error) {
      console.error('Error in requestWithdrawal:', error);
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const cancelWithdrawal = async (withdrawalId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('partner_withdrawals')
        .update({ status: 'rejected', notes: 'Annulé par le partenaire' })
        .eq('id', withdrawalId)
        .eq('partner_id', user.id)
        .eq('status', 'pending');

      if (error) {
        console.error('Error canceling withdrawal:', error);
        toast({
          title: "Erreur",
          description: "Impossible d'annuler la demande",
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Succès",
        description: "Demande de retrait annulée",
      });

      fetchWithdrawals();
      return true;

    } catch (error) {
      console.error('Error in cancelWithdrawal:', error);
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    if (user) {
      fetchWithdrawals();
    }
  }, [user]);

  // Real-time subscription for withdrawal updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('partner-withdrawals')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'partner_withdrawals',
          filter: `partner_id=eq.${user.id}`
        },
        () => {
          fetchWithdrawals();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    loading,
    withdrawals,
    stats,
    requestWithdrawal,
    cancelWithdrawal,
    refreshWithdrawals: fetchWithdrawals
  };
};