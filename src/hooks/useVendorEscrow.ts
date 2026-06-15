import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useVendorEscrow = () => {
  const [escrowTransactions, setEscrowTransactions] = useState<any[]>([]);
  const [merchantAccount, setMerchantAccount] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [escrow, account] = await Promise.all([
      supabase.from('escrow_transactions').select('*').eq('seller_id', user.id).order('created_at', { ascending: false }),
      supabase.from('merchant_accounts').select('*').eq('vendor_id', user.id).maybeSingle()
    ]);

    setEscrowTransactions(escrow.data || []);
    setMerchantAccount(account.data);
    setLoading(false);
  };

  return { escrowTransactions, merchantAccount, loading, refetch: loadData };
};
