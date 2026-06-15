import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useUserRoles } from './useUserRoles';

interface FinancialUpdate {
  type: 'commission' | 'credit_transaction' | 'wallet_update';
  amount: number;
  currency: string;
  timestamp: string;
  metadata: any;
}

interface UseRealtimeFinancialUpdatesReturn {
  updates: FinancialUpdate[];
  totalCommissions: number;
  totalCredits: number;
  isConnected: boolean;
  clearUpdates: () => void;
}

export const useRealtimeFinancialUpdates = (): UseRealtimeFinancialUpdatesReturn => {
  const { user } = useAuth();
  const { hasPermission } = useUserRoles();
  const [updates, setUpdates] = useState<FinancialUpdate[]>([]);
  const [totalCommissions, setTotalCommissions] = useState(0);
  const [totalCredits, setTotalCredits] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [commissionRates, setCommissionRates] = useState<Record<string, { admin_rate: number; driver_rate: number; platform_rate: number }>>({});

  useEffect(() => {
    if (!user?.id || !hasPermission('finance_read')) return;

    const channel = supabase
      .channel('financial-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'wallet_transactions'
        },
        (payload) => {
          handleWalletInsert(payload.new);
        }
      )
      // ✅ Suppression des listeners obsolètes pour driver_credits et credit_transactions
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
      setIsConnected(false);
    };
  }, [user?.id, hasPermission]);

  // Load active commission rates once
  useEffect(() => {
    if (!hasPermission('finance_read')) return;
    (async () => {
      const { data } = await supabase
        .from('commission_settings')
        .select('service_type, admin_rate, driver_rate, platform_rate')
        .eq('is_active', true);
      const map: Record<string, { admin_rate: number; driver_rate: number; platform_rate: number }> = {};
      (data || []).forEach((row: any) => {
        map[row.service_type] = {
          admin_rate: Number(row.admin_rate) || 10,
          driver_rate: Number(row.driver_rate) || 85,
          platform_rate: Number(row.platform_rate) || 5,
        };
      });
      setCommissionRates(map);
    })();
  }, [hasPermission]);

  const handleWalletInsert = (record: any) => {
    // Consider only user payments to derive admin commission in realtime
    const desc: string = record.description || '';
    if (record.transaction_type === 'debit' && /Paiement/i.test(desc)) {
      const service = (record.reference_type || '').toString();
      const rate = commissionRates[service]?.admin_rate ?? 10;
      const adminAmount = (Number(record.amount) || 0) * (rate / 100);

      const update: FinancialUpdate = {
        type: 'commission',
        amount: adminAmount,
        currency: record.currency || 'CDF',
        timestamp: record.created_at,
        metadata: {
          sourceTransactionId: record.id,
          payerUserId: record.user_id,
          description: record.description,
          referenceType: record.reference_type,
          referenceId: record.reference_id,
          baseAmount: Number(record.amount) || 0,
          adminRate: rate,
        }
      };

      setUpdates(prev => [update, ...prev.slice(0, 99)]);
      setTotalCommissions(prev => prev + update.amount);
    }
  };

  // ✅ Fonctions obsolètes supprimées (système de crédits remplacé par abonnements)

  const clearUpdates = () => {
    setUpdates([]);
    setTotalCommissions(0);
    setTotalCredits(0);
  };

  return {
    updates,
    totalCommissions,
    totalCredits,
    isConnected,
    clearUpdates
  };
};