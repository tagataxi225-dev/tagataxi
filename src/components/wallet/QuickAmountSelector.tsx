import React from 'react';
import { cn } from '@/lib/utils';

interface QuickAmountSelectorProps {
  amounts: number[];
  selectedAmount: number | null;
  onSelect: (amount: number) => void;
  currency?: string;
}

export const QuickAmountSelector: React.FC<QuickAmountSelectorProps> = ({
  amounts,
  selectedAmount,
  onSelect,
  currency = 'XOF'
}) => {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">
        Montant
      </label>
      <div className="grid grid-cols-3 gap-2">
        {amounts.map((amount) => (
          <button
            key={amount}
            type="button"
            onClick={() => onSelect(amount)}
            className={cn(
              "px-3 py-2.5 rounded-xl text-sm font-semibold",
              "transition-all duration-150",
              selectedAmount === amount
                ? "bg-primary text-primary-foreground border border-primary shadow-sm"
                : "bg-muted/50 border border-border/60 text-foreground hover:bg-muted hover:border-border"
            )}
          >
            {amount.toLocaleString('fr-CD')} {currency}
          </button>
        ))}
      </div>
    </div>
  );
};
