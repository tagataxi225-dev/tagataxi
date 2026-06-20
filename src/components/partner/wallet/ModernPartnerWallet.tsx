import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet, Download, Plus } from 'lucide-react';
import { useUnifiedPartnerFinances } from '@/hooks/useUnifiedPartnerFinances';
import { usePartnerWithdrawals } from '@/hooks/usePartnerWithdrawals';
import { PartnerWithdrawalDialog } from '../PartnerWithdrawalDialog';
import { PartnerTopUpDialog } from '../PartnerTopUpDialog';
import { formatPartnerCurrency } from '@/lib/partnerUtils';

export const ModernPartnerWallet = () => {
  const [activeTab, setActiveTab] = useState('transactions');
  const [withdrawalDialogOpen, setWithdrawalDialogOpen] = useState(false);
  const [topUpDialogOpen, setTopUpDialogOpen] = useState(false);
  
  const finances = useUnifiedPartnerFinances('30d');
  const { requestWithdrawal, withdrawals, loading: withdrawalsLoading } = usePartnerWithdrawals();

  const balance = finances.walletBalance;
  const currency = finances.walletCurrency;
  const totalEarnings = finances.totalCommissions;
  const pendingWithdrawals = finances.pendingWithdrawals;

  const handleWithdrawal = async (amount: number, method: string, accountDetails: any) => {
    await requestWithdrawal(amount, method, accountDetails);
  };

  if (finances.loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-0 bg-gradient-to-br from-slate-800 to-slate-900 text-white shadow-xl rounded-2xl overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-white/10">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <p className="text-white/70 text-xs font-medium">Solde disponible</p>
                <p className="text-[10px] text-white/50">TAGAPay Partner</p>
              </div>
            </div>

            <p className="text-3xl font-bold mb-4">
              {formatPartnerCurrency(balance, currency)}
            </p>

            <div className="flex gap-4 mb-4">
              <div>
                <p className="text-white/50 text-[10px] mb-0.5">Revenus totaux</p>
                <p className="text-sm font-semibold">{formatPartnerCurrency(totalEarnings, currency)}</p>
              </div>
              <div>
                <p className="text-white/50 text-[10px] mb-0.5">En attente</p>
                <p className="text-sm font-semibold">{formatPartnerCurrency(pendingWithdrawals, currency)}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <button 
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white/15 hover:bg-white/20 text-white text-xs font-medium transition-colors"
                onClick={() => setTopUpDialogOpen(true)}
              >
                <Plus className="w-3.5 h-3.5" />
                Recharger
              </button>
              <button 
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium transition-colors"
                onClick={() => setWithdrawalDialogOpen(true)}
              >
                <Download className="w-3.5 h-3.5" />
                Retirer
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <PartnerWithdrawalDialog
        open={withdrawalDialogOpen}
        onOpenChange={setWithdrawalDialogOpen}
        availableBalance={finances.availableForWithdrawal}
        currency={currency}
        onSubmit={handleWithdrawal}
        loading={withdrawalsLoading}
      />

      <PartnerTopUpDialog
        open={topUpDialogOpen}
        onOpenChange={setTopUpDialogOpen}
        currentBalance={balance}
        currency={currency}
        onSuccess={() => {
          setTopUpDialogOpen(false);
          window.location.reload();
        }}
      />
    </div>
  );
};
