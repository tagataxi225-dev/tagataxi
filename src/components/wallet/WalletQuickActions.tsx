import React from 'react';
import { Plus, Send, Gift, Banknote } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  iconBg: string;
  iconColor: string;
  onClick: () => void;
}

interface WalletQuickActionsProps {
  onRecharge: () => void;
  onTransfer: () => void;
  onConvert: () => void;
  onWithdraw?: () => void;
}

export const WalletQuickActions: React.FC<WalletQuickActionsProps> = ({
  onRecharge,
  onTransfer,
  onConvert,
  onWithdraw
}) => {
  const actions: QuickAction[] = [
    {
      id: 'recharge',
      label: 'Recharger',
      icon: Plus,
      iconBg: 'bg-emerald-100 dark:bg-emerald-500/15',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      onClick: onRecharge
    },
    {
      id: 'transfer',
      label: 'Transférer',
      icon: Send,
      iconBg: 'bg-blue-100 dark:bg-blue-500/15',
      iconColor: 'text-blue-600 dark:text-blue-400',
      onClick: onTransfer
    },
    {
      id: 'convert',
      label: 'Convertir',
      icon: Gift,
      iconBg: 'bg-amber-100 dark:bg-amber-500/15',
      iconColor: 'text-amber-600 dark:text-amber-400',
      onClick: onConvert
    }
  ];

  if (onWithdraw) {
    actions.push({
      id: 'withdraw',
      label: 'Retirer',
      icon: Banknote,
      iconBg: 'bg-rose-100 dark:bg-rose-500/15',
      iconColor: 'text-rose-600 dark:text-rose-400',
      onClick: onWithdraw
    });
  }

  return (
    <div className="px-4 mb-6">
      <div className={cn("grid gap-2", onWithdraw ? "grid-cols-4" : "grid-cols-3")}>
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={action.onClick}
            className="flex flex-col items-center gap-1.5 py-2 group"
          >
            <div className={cn(
              "w-11 h-11 rounded-xl flex items-center justify-center transition-transform active:scale-95",
              action.iconBg
            )}>
              <action.icon className={cn("h-[18px] w-[18px]", action.iconColor)} />
            </div>
            <span className="text-[11px] font-medium text-muted-foreground">
              {action.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
