import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface RestaurantFinanceStats {
  availableBalance: number;
  escrowHeld: number;
  escrowReleased: number;
  totalEarned: number;
  totalWithdrawn: number;
  pendingWithdrawals: number;
  currency: string;
  walletId: string | null;
}

export interface WithdrawalRequest {
  id: string;
  amount: number;
  netAmount: number;
  fees: number;
  currency: string;
  status: string;
  provider: string;
  phone: string;
  createdAt: string;
  processedAt?: string;
}

const fetchRestaurantFinances = async (): Promise<RestaurantFinanceStats> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Récupérer le wallet (utilise vendor_wallets comme le fait release-food-escrow)
  const { data: wallet, error: walletError } = await supabase
    .from('vendor_wallets')
    .select('id, balance, total_earned, total_withdrawn, currency')
    .eq('vendor_id', user.id)
    .maybeSingle();

  if (walletError) {
    console.error('Error fetching restaurant wallet:', walletError);
  }

  // Récupérer les paiements escrow food depuis escrow_payments
  const { data: escrowPayments, error: escrowError } = await supabase
    .from('escrow_payments')
    .select('amount, status, currency')
    .eq('seller_id', user.id);

  if (escrowError) {
    console.error('Error fetching food escrow payments:', escrowError);
  }

  // Récupérer les retraits en cours
  const { data: pendingWithdrawals, error: withdrawalError } = await supabase
    .from('withdrawal_requests')
    .select('amount')
    .eq('user_id', user.id)
    .eq('user_type', 'restaurant')
    .eq('status', 'pending');

  if (withdrawalError) {
    console.error('Error fetching pending withdrawals:', withdrawalError);
  }

  // Calculer les montants escrow (95% pour le restaurant, 5% commission)
  const escrowHeld = (escrowPayments || [])
    .filter(p => p.status === 'held')
    .reduce((sum, p) => sum + Math.round((p.amount || 0) * 0.95), 0);

  const escrowReleased = (escrowPayments || [])
    .filter(p => p.status === 'released')
    .reduce((sum, p) => sum + Math.round((p.amount || 0) * 0.95), 0);

  const pendingWithdrawalAmount = pendingWithdrawals
    ?.reduce((sum, w) => sum + (w.amount || 0), 0) || 0;

  return {
    availableBalance: wallet?.balance || 0,
    escrowHeld,
    escrowReleased,
    totalEarned: wallet?.total_earned || escrowReleased,
    totalWithdrawn: wallet?.total_withdrawn || 0,
    pendingWithdrawals: pendingWithdrawalAmount,
    currency: wallet?.currency || 'CDF',
    walletId: wallet?.id || null
  };
};

const fetchWithdrawalRequests = async (): Promise<WithdrawalRequest[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data: requests, error } = await supabase
    .from('withdrawal_requests')
    .select('*')
    .eq('user_id', user.id)
    .eq('user_type', 'restaurant')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error fetching withdrawal requests:', error);
    return [];
  }

  return (requests || []).map(r => ({
    id: r.id,
    amount: r.amount,
    netAmount: r.amount * 0.98, // 2% fees
    fees: r.amount * 0.02,
    currency: r.currency || 'CDF',
    status: r.status,
    provider: r.mobile_money_provider || '',
    phone: r.mobile_money_phone || '',
    createdAt: r.created_at,
    processedAt: r.processed_at
  }));
};

interface WithdrawParams {
  amount: number;
  provider: string;
  phoneNumber: string;
}

export const useRestaurantWithdrawal = () => {
  const queryClient = useQueryClient();

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['restaurant-finances-stats'],
    queryFn: fetchRestaurantFinances,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const { data: withdrawalRequests, isLoading: requestsLoading } = useQuery({
    queryKey: ['restaurant-withdrawal-requests'],
    queryFn: fetchWithdrawalRequests,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const withdrawMutation = useMutation({
    mutationFn: async (params: WithdrawParams) => {
      const { data, error } = await supabase.functions.invoke('restaurant-withdrawal', {
        body: {
          amount: params.amount,
          paymentMethod: 'mobile_money',
          paymentDetails: {
            provider: params.provider,
            phoneNumber: params.phoneNumber
          }
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Withdrawal failed');
      
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message || `Demande de retrait soumise avec succès`);
      queryClient.invalidateQueries({ queryKey: ['restaurant-finances-stats'] });
      queryClient.invalidateQueries({ queryKey: ['restaurant-withdrawal-requests'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors de la demande de retrait');
    }
  });

  return {
    stats: stats || {
      availableBalance: 0,
      escrowHeld: 0,
      escrowReleased: 0,
      totalEarned: 0,
      totalWithdrawn: 0,
      pendingWithdrawals: 0,
      currency: 'CDF',
      walletId: null
    },
    withdrawalRequests: withdrawalRequests || [],
    isLoading: statsLoading || requestsLoading,
    refetch: refetchStats,
    withdraw: withdrawMutation.mutate,
    isWithdrawing: withdrawMutation.isPending
  };
};
