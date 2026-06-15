import React, { useState } from 'react';
import { normalizeTransactionType } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/hooks/useWallet';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { DualBalanceCard } from '@/components/wallet/DualBalanceCard';
import { TransactionCard } from '@/components/wallet/TransactionCard';
import { EmptyTransactions } from '@/components/wallet/EmptyTransactions';
import { SuccessConfetti } from '@/components/wallet/SuccessConfetti';
import { WalletSkeleton } from '@/components/wallet/WalletSkeleton';
import { TransferMoneyDialog } from '@/components/wallet/TransferMoneyDialog';
import { PointsConversionDialog } from '@/components/loyalty/PointsConversionDialog';
import { TopUpModal } from '@/components/wallet/TopUpModal';
import { WithdrawModal } from './wallet/WithdrawModal';
import { WithdrawalHistory } from './wallet/WithdrawalHistory';
import { EarningsChart } from './EarningsChart';
import { CommissionBreakdown } from './CommissionBreakdown';
import { Send, Gift, Zap, Download, FileText } from 'lucide-react';

type Operator = 'airtel' | 'orange' | 'mpesa';

const QUICK_AMOUNTS = [1000, 5000, 10000, 25000, 50000];

export const DriverWalletPanel: React.FC = () => {
  const { wallet, transactions, loading } = useWallet();
  const { triggerSuccess } = useHapticFeedback();
  
  const [showConfetti, setShowConfetti] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [showConversionDialog, setShowConversionDialog] = useState(false);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  if (loading) {
    return <WalletSkeleton />;
  }

  return (
    <div className="space-y-6">
      <SuccessConfetti show={showConfetti} onComplete={() => setShowConfetti(false)} />

      {/* Boutons d'action */}
      <div className="space-y-3">
        <DualBalanceCard
          mainBalance={wallet?.balance || 0}
          bonusBalance={wallet?.bonus_balance || 0}
          kwendaPoints={wallet?.kwenda_points || 0}
          currency={wallet?.currency || 'CDF'}
          loading={loading}
        />

        <div className="grid grid-cols-3 gap-3">
          <Button 
            variant="default" 
            className="gap-2"
            onClick={() => setShowConversionDialog(true)}
          >
            <Gift className="w-4 h-4" />
            Convertir
          </Button>
          
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={() => setShowTransferDialog(true)}
          >
            <Send className="w-4 h-4" />
            Transférer
          </Button>

          <Button 
            variant="default" 
            className="gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90"
            onClick={() => setShowTopUpModal(true)}
          >
            <Zap className="w-4 h-4" />
            Recharger
          </Button>
        </div>

        {/* Actions supplémentaires */}
        <div className="grid grid-cols-2 gap-3">
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={() => setShowWithdrawModal(true)}
          >
            <Download className="w-4 h-4" />
            Retirer
          </Button>

          <Button 
            variant="outline" 
            className="gap-2"
          >
            <FileText className="w-4 h-4" />
            Rapport PDF
          </Button>
        </div>
      </div>

      {/* Historique des retraits */}
      <WithdrawalHistory />

      {/* Graphique de gains */}
      <EarningsChart />

      {/* Répartition des commissions */}
      <CommissionBreakdown />

      {/* Transaction History */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-xl">Historique des transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <EmptyTransactions />
          ) : (
            <div className="space-y-3">
              {transactions.slice(0, 10).map((transaction, index) => (
                <TransactionCard
                  key={transaction.id}
                  id={transaction.id}
                  type={normalizeTransactionType(transaction.transaction_type)}
                  amount={Number(transaction.amount)}
                  currency={transaction.currency}
                  description={transaction.description}
                  date={transaction.created_at}
                  index={index}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <TransferMoneyDialog 
        open={showTransferDialog} 
        onClose={() => setShowTransferDialog(false)} 
      />

      <PointsConversionDialog 
        open={showConversionDialog} 
        onClose={() => setShowConversionDialog(false)} 
      />

      <TopUpModal
        open={showTopUpModal}
        onClose={() => setShowTopUpModal(false)}
        onSuccess={() => {
          triggerSuccess();
          setShowConfetti(true);
        }}
        currency={wallet?.currency || 'CDF'}
        quickAmounts={QUICK_AMOUNTS}
      />

      <WithdrawModal
        open={showWithdrawModal}
        onOpenChange={setShowWithdrawModal}
        currentBalance={wallet?.balance || 0}
        onSuccess={() => {}}
      />
    </div>
  );
};

export default DriverWalletPanel;
