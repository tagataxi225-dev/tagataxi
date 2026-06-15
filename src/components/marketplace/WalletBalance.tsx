import React from 'react';
import { EnhancedWalletCard } from '../wallet/EnhancedWalletCard';

interface WalletBalanceProps {
  balance: number;
  currency: string;
  onTopUp?: () => void;
  compact?: boolean;
  loading?: boolean;
  error?: string | null;
}

export const WalletBalance: React.FC<WalletBalanceProps> = ({
  balance,
  currency = 'CDF',
  onTopUp,
  compact = false,
  loading = false,
  error = null
}) => {
  if (loading || error) {
    return (
      <div className={compact ? 
        "flex items-center gap-3 px-4 py-3 bg-muted/50 rounded-xl border animate-pulse" :
        "bg-muted/50 rounded-xl p-6 animate-pulse"
      }>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-muted rounded-full" />
          <div className="space-y-2">
            <div className="h-3 w-16 bg-muted rounded" />
            <div className="h-4 w-20 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <EnhancedWalletCard
      balance={balance}
      currency={currency}
      onTopUp={onTopUp}
      loading={loading}
      compact={compact}
    />
  );
};