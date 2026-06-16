import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { usePartnerEarnings } from './usePartnerEarnings';
import { usePartnerWithdrawals } from './usePartnerWithdrawals';
import { supabase } from '@/integrations/supabase/client';

interface UnifiedFinances {
  // Wallet
  walletBalance: number;
  walletCurrency: string;
  
  // Earnings
  totalCommissions: number;
  rideCommissions: number;
  subscriptionCommissions: number;
  totalTopups: number;
  totalAssignments: number;
  roi: number | null;
  
  // Withdrawals
  totalWithdrawn: number;
  pendingWithdrawals: number;
  availableForWithdrawal: number;
  
  // Computed
  netEarnings: number;
  revenueTrend: number | null;
  loading: boolean;
}

/**
 * Hook unifié pour toutes les finances partenaire
 * Centralise: wallet, earnings (courses + abonnements), withdrawals
 */
export const useUnifiedPartnerFinances = (range: '7d' | '30d' | 'all' = '30d') => {
  const { user } = useAuth();
  const { data: earningsData, loading: earningsLoading } = usePartnerEarnings(range);
  const { stats: withdrawalStats, loading: withdrawalsLoading } = usePartnerWithdrawals();
  
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletCurrency, setWalletCurrency] = useState('XOF');
  const [rideCommissions, setRideCommissions] = useState(0);
  const [subscriptionCommissions, setSubscriptionCommissions] = useState(0);
  const [walletLoading, setWalletLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        // Fetch wallet balance
        const walletPromise = supabase
          .from('user_wallets')
          .select('balance, currency')
          .eq('user_id', user.id)
          .single();

        // Fetch partner table ID
        const partnerPromise = supabase
          .from('partenaires')
          .select('id')
          .eq('user_id', user.id)
          .single();

        const [walletRes, partnerRes] = await Promise.all([walletPromise, partnerPromise]);

        if (walletRes.data) {
          setWalletBalance(walletRes.data.balance || 0);
          setWalletCurrency(walletRes.data.currency || 'XOF');
        }

        if (partnerRes.data) {
          // Fetch ride commissions from partner_commission_tracking
          const { data: rideEarnings } = await supabase
            .from('partner_commission_tracking')
            .select('commission_amount')
            .eq('partner_id', partnerRes.data.id);

          const totalRide = rideEarnings?.reduce((sum, e) => sum + Number(e.commission_amount), 0) || 0;
          setRideCommissions(totalRide);

          // Fetch subscription commissions
          const { data: subEarnings } = await supabase
            .from('partner_subscription_earnings')
            .select('partner_commission_amount')
            .eq('partner_id', partnerRes.data.id)
            .eq('status', 'paid');

          const totalSub = subEarnings?.reduce((sum, e) => sum + Number(e.partner_commission_amount), 0) || 0;
          setSubscriptionCommissions(totalSub);
        }
      } catch (error) {
        console.error('Error fetching partner finances:', error);
      } finally {
        setWalletLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const loading = earningsLoading || withdrawalsLoading || walletLoading;
  const totalCommissions = rideCommissions + subscriptionCommissions;

  const finances: UnifiedFinances = {
    walletBalance,
    walletCurrency,
    totalCommissions,
    rideCommissions,
    subscriptionCommissions,
    totalTopups: earningsData?.totals.totalTopups || 0,
    totalAssignments: earningsData?.totals.totalAssignments || 0,
    roi: earningsData?.totals.roi || null,
    totalWithdrawn: withdrawalStats.totalPaid || 0,
    pendingWithdrawals: withdrawalStats.totalPending || 0,
    availableForWithdrawal: walletBalance, // Based on actual wallet balance
    netEarnings: totalCommissions - (withdrawalStats.totalPaid || 0),
    revenueTrend: null,
    loading
  };

  return finances;
};
