import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/hooks/useWallet';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { useWalletValidation } from '@/hooks/useWalletValidation';
import { useLanguage } from '@/contexts/LanguageContext';
import { normalizeTransactionType } from '@/lib/utils';
import { WalletHero } from '@/components/wallet/WalletHero';
import { WalletQuickActions } from '@/components/wallet/WalletQuickActions';
import { QuickAmountSelector } from '@/components/wallet/QuickAmountSelector';
import { OperatorSelector } from '@/components/wallet/OperatorSelector';
import { AnimatedTopUpButton } from '@/components/wallet/AnimatedTopUpButton';
import { TransactionCard } from '@/components/wallet/TransactionCard';
import { EmptyTransactions } from '@/components/wallet/EmptyTransactions';
import { ModernTransferCard } from '@/components/wallet/ModernTransferCard';
import { SuccessConfetti } from '@/components/wallet/SuccessConfetti';
import { WalletSkeleton } from '@/components/wallet/WalletSkeleton';
import { TransferMoneyDialog } from '@/components/wallet/TransferMoneyDialog';
import { PointsConversionDialog } from '@/components/loyalty/PointsConversionDialog';
import { TopUpModal } from '@/components/wallet/TopUpModal';
import { WithdrawRequestDialog } from '@/components/wallet/WithdrawRequestDialog';
import { SessionStatusIndicator } from '@/components/SessionStatusIndicator';
import { Send, Gift, Zap } from 'lucide-react';

type Operator = 'airtel' | 'orange' | 'mpesa';

const QUICK_AMOUNTS = [1000, 2500, 5000, 10000, 25000];

interface ClientWalletPanelProps {
  initialTopUpOpen?: boolean;
  onTopUpModalChange?: (open: boolean) => void;
}

export const ClientWalletPanel: React.FC<ClientWalletPanelProps> = ({ 
  initialTopUpOpen = false,
  onTopUpModalChange 
}) => {
  const { t } = useLanguage();
  const { wallet, transactions, loading, error, topUpWallet } = useWallet();
  const { triggerSuccess, triggerError } = useHapticFeedback();
  const { validateAmount, validatePhone, amountError, phoneError } = useWalletValidation();
  
  const [amount, setAmount] = useState<string>('');
  const [selectedQuickAmount, setSelectedQuickAmount] = useState<number | null>(null);
  const [provider, setProvider] = useState<Operator | ''>('');
  const [phone, setPhone] = useState<string>('');
  const [showConfetti, setShowConfetti] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [showConversionDialog, setShowConversionDialog] = useState(false);
  const [showTopUpModal, setShowTopUpModal] = useState(initialTopUpOpen);
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);

  // Ouvrir le modal si demandé depuis l'extérieur
  React.useEffect(() => {
    if (initialTopUpOpen) {
      setShowTopUpModal(true);
    }
  }, [initialTopUpOpen]);

  // Notifier le parent du changement d'état du modal
  const handleTopUpModalChange = (open: boolean) => {
    setShowTopUpModal(open);
    onTopUpModalChange?.(open);
  };

  const handleQuickAmountSelect = (quickAmount: number) => {
    setAmount(quickAmount.toString());
    setSelectedQuickAmount(quickAmount);
    validateAmount(quickAmount.toString());
  };

  const handleAmountChange = (value: string) => {
    setAmount(value);
    setSelectedQuickAmount(null);
    validateAmount(value);
  };

  const handlePhoneChange = (value: string) => {
    setPhone(value);
    validatePhone(value);
  };

  const handleTopUp = async () => {
    if (!provider) return;

    const amountValidation = validateAmount(amount);
    const phoneValidation = validatePhone(phone);

    if (!amountValidation.isValid || !phoneValidation.isValid) {
      triggerError();
      return;
    }

    const success = await topUpWallet(Number(amount), provider, phone);
    
    if (success) {
      triggerSuccess();
      setShowConfetti(true);
      setAmount('');
      setSelectedQuickAmount(null);
      setProvider('');
      setPhone('');
    } else {
      triggerError();
    }
  };

  if (loading) {
    return <WalletSkeleton />;
  }

  return (
    <div className="bg-background">
      <SuccessConfetti show={showConfetti} onComplete={() => setShowConfetti(false)} />

      {/* Indicateur de session */}
      <div className="fixed top-4 right-4 z-50">
        <SessionStatusIndicator />
      </div>

      {/* Hero moderne et épuré */}
      <WalletHero
        balance={wallet?.balance || 0}
        mainBalance={wallet?.balance || 0}
        bonusBalance={wallet?.bonus_balance || 0}
        currency={wallet?.currency || 'CDF'}
        kwendaPoints={wallet?.kwenda_points || 0}
        status="active"
      />

      {/* Actions rapides circulaires */}
      <WalletQuickActions 
        onRecharge={() => handleTopUpModalChange(true)}
        onTransfer={() => setShowTransferDialog(true)}
        onConvert={() => setShowConversionDialog(true)}
        onWithdraw={() => setShowWithdrawDialog(true)}
      />

      {/* Transaction History - Design moderne et groupé */}
      <div id="transactions-section" className="px-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground">
            Transactions récentes
          </h3>
          {transactions.length > 0 && (
            <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              {transactions.length}
            </span>
          )}
        </div>
        
        {transactions.length === 0 ? (
          <EmptyTransactions />
        ) : (
          <div className="space-y-4">
            {/* Transferts groupés */}
            {transactions.filter(t => ['transfer_in', 'transfer_out'].includes(t.transaction_type)).length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2 px-1">
                  Transferts
                </p>
                <div className="bg-card rounded-2xl border border-border/40 divide-y divide-border/30 overflow-hidden">
                  {transactions
                    .filter(t => ['transfer_in', 'transfer_out'].includes(t.transaction_type))
                    .slice(0, 5)
                    .map((transaction, index) => (
                      <ModernTransferCard
                        key={transaction.id}
                        type={transaction.transaction_type as 'transfer_in' | 'transfer_out'}
                        amount={Math.abs(Number(transaction.amount))}
                        currency={transaction.currency}
                        contactName={
                          transaction.description?.includes('de ') 
                            ? transaction.description.split('de ')[1]?.trim() || 'Contact'
                            : transaction.description?.includes('à ')
                              ? transaction.description.split('à ')[1]?.trim() || 'Contact'
                              : 'Contact'
                        }
                        description={transaction.description}
                        status={transaction.status}
                        timestamp={transaction.created_at}
                        index={index}
                      />
                    ))}
                </div>
              </div>
            )}

            {/* Autres transactions */}
            {transactions.filter(t => !['transfer_in', 'transfer_out'].includes(t.transaction_type)).length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2 px-1">
                  Activités
                </p>
                <div className="bg-card rounded-2xl border border-border/40 divide-y divide-border/30 overflow-hidden">
                  {transactions
                    .filter(t => !['transfer_in', 'transfer_out'].includes(t.transaction_type))
                    .slice(0, 5)
                    .map((transaction, index) => (
                      <TransactionCard
                        key={transaction.id}
                        id={transaction.id}
                        type={normalizeTransactionType(transaction.transaction_type)}
                        amount={Number(transaction.amount)}
                        currency={transaction.currency}
                        description={transaction.description}
                        date={transaction.created_at}
                        index={index}
                        compact={true}
                      />
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

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
        onClose={() => handleTopUpModalChange(false)}
        onSuccess={() => setShowConfetti(true)}
        currency={wallet?.currency || 'CDF'}
        quickAmounts={QUICK_AMOUNTS}
      />

      <WithdrawRequestDialog
        open={showWithdrawDialog}
        onOpenChange={setShowWithdrawDialog}
        currentBalance={wallet?.balance || 0}
        currency={wallet?.currency || 'CDF'}
        userType="client"
        onSuccess={() => {}}
      />
    </div>
  );
};

export default ClientWalletPanel;
