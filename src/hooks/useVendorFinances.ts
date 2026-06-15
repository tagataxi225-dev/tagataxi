import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface VendorFinanceStats {
  availableBalance: number;
  escrowHeld: number;
  escrowReleased: number;
  totalEarned: number;
  totalWithdrawn: number;
  pendingWithdrawals: number;
  currency: string;
  walletId: string | null;
}

export interface VendorTransaction {
  id: string;
  type: 'credit' | 'debit' | 'commission' | 'withdrawal';
  amount: number;
  currency: string;
  description: string;
  status: string;
  createdAt: string;
  referenceId?: string;
  referenceType?: string;
}

export interface EscrowPayment {
  id: string;
  orderId: string;
  amount: number;
  sellerAmount: number;
  platformFee: number;
  status: 'held' | 'released' | 'refunded';
  currency: string;
  createdAt: string;
  releasedAt?: string;
  orderStatus?: string;
}

export interface WithdrawalRequest {
  id: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
  processedAt?: string;
  paidAt?: string;
  provider?: string;
  phone?: string;
}

const fetchVendorFinances = async (): Promise<VendorFinanceStats> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Récupérer le wallet vendeur
  const { data: wallet, error: walletError } = await supabase
    .from('vendor_wallets')
    .select('id, balance, total_earned, total_withdrawn, currency')
    .eq('vendor_id', user.id)
    .maybeSingle();

  if (walletError) {
    console.error('Error fetching vendor wallet:', walletError);
  }

  // Récupérer les paiements escrow
  const { data: escrowPayments, error: escrowError } = await supabase
    .from('escrow_payments')
    .select('amount, status, currency')
    .eq('seller_id', user.id);

  if (escrowError) {
    console.error('Error fetching escrow payments:', escrowError);
  }

  // ✅ CORRECTION: Récupérer les retraits en cours depuis withdrawal_requests
  // Note: user_type='seller' dans la DB (contrainte), pas 'vendor'
  const { data: pendingWithdrawals, error: withdrawalError } = await supabase
    .from('withdrawal_requests')
    .select('amount')
    .eq('user_id', user.id)
    .eq('user_type', 'seller')
    .eq('status', 'pending');

  if (withdrawalError) {
    console.error('Error fetching pending withdrawals:', withdrawalError);
  }

  // ✅ CORRECTION: Calculer les montants escrow (95% pour le vendeur, 5% commission)
  const escrowHeld = escrowPayments
    ?.filter(p => p.status === 'held')
    .reduce((sum, p) => sum + Math.round((p.amount || 0) * 0.95), 0) || 0;

  const escrowReleased = escrowPayments
    ?.filter(p => p.status === 'released')
    .reduce((sum, p) => sum + Math.round((p.amount || 0) * 0.95), 0) || 0;

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

const fetchVendorTransactions = async (): Promise<VendorTransaction[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data: transactions, error } = await supabase
    .from('vendor_wallet_transactions')
    .select('*')
    .eq('vendor_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }

  return (transactions || []).map(t => ({
    id: t.id,
    type: t.transaction_type as VendorTransaction['type'],
    amount: t.amount,
    currency: t.currency || 'CDF',
    description: t.description || '',
    status: t.status || 'completed',
    createdAt: t.created_at,
    referenceId: t.reference_id,
    referenceType: t.reference_type
  }));
};

const fetchEscrowPayments = async (): Promise<EscrowPayment[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data: payments, error } = await supabase
    .from('escrow_payments')
    .select('id, order_id, amount, status, currency, created_at, released_at')
    .eq('seller_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error fetching escrow payments:', error);
    return [];
  }

  // ✅ CORRECTION: 95% vendeur, 5% commission
  return (payments || []).map(p => ({
    id: p.id,
    orderId: p.order_id,
    amount: p.amount,
    sellerAmount: Math.round((p.amount || 0) * 0.95),
    platformFee: Math.round((p.amount || 0) * 0.05),
    status: p.status as EscrowPayment['status'],
    currency: p.currency || 'CDF',
    createdAt: p.created_at,
    releasedAt: p.released_at
  }));
};

const fetchWithdrawalRequests = async (): Promise<WithdrawalRequest[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data: requests, error } = await supabase
    .from('withdrawal_requests')
    .select('id, amount, currency, status, created_at, processed_at, paid_at, mobile_money_provider, mobile_money_phone')
    .eq('user_id', user.id)
    .eq('user_type', 'seller')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error fetching withdrawal requests:', error);
    return [];
  }

  return (requests || []).map(r => ({
    id: r.id,
    amount: r.amount,
    currency: r.currency || 'CDF',
    status: r.status,
    createdAt: r.created_at,
    processedAt: r.processed_at,
    paidAt: r.paid_at,
    provider: r.mobile_money_provider,
    phone: r.mobile_money_phone
  }));
};

interface WithdrawalRequestInput {
  amount: number;
  provider: string;
  phoneNumber: string;
}

export const useVendorFinances = () => {
  const queryClient = useQueryClient();

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['vendor-finances-stats'],
    queryFn: fetchVendorFinances,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['vendor-transactions'],
    queryFn: fetchVendorTransactions,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const { data: escrowPayments, isLoading: escrowLoading } = useQuery({
    queryKey: ['vendor-escrow-payments'],
    queryFn: fetchEscrowPayments,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const { data: withdrawalRequests, isLoading: withdrawalsLoading } = useQuery({
    queryKey: ['vendor-withdrawal-requests'],
    queryFn: fetchWithdrawalRequests,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const withdrawMutation = useMutation({
    mutationFn: async (request: WithdrawalRequestInput) => {
      const { data, error } = await supabase.functions.invoke('vendor-withdrawal', {
        body: {
          amount: request.amount,
          paymentMethod: 'mobile_money',
          paymentDetails: {
            provider: request.provider,
            phoneNumber: request.phoneNumber
          }
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Withdrawal failed');
      
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message || `Demande de retrait soumise. Traitement sous 1-24h.`);
      queryClient.invalidateQueries({ queryKey: ['vendor-finances-stats'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-withdrawal-requests'] });
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
    transactions: transactions || [],
    escrowPayments: escrowPayments || [],
    withdrawalRequests: withdrawalRequests || [],
    isLoading: statsLoading || transactionsLoading || escrowLoading || withdrawalsLoading,
    statsLoading,
    transactionsLoading,
    escrowLoading,
    withdrawalsLoading,
    refetch: refetchStats,
    withdraw: withdrawMutation.mutate,
    isWithdrawing: withdrawMutation.isPending
  };
};
