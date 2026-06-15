import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownLeft, Clock, Send, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TransactionCardProps {
  id: string;
  type: 'credit' | 'debit' | 'transfer_in' | 'transfer_out' | 'top_up' | 'withdrawal' | string;
  amount: number;
  currency: string;
  description: string;
  date: string;
  status?: 'completed' | 'pending' | 'failed';
  index: number;
  compact?: boolean;
}

export const TransactionCard: React.FC<TransactionCardProps> = ({
  type,
  amount,
  currency,
  description,
  date,
  status = 'completed',
  index,
  compact = false
}) => {
  const isCredit = ['credit', 'transfer_in', 'top_up', 'refund', 'bonus'].includes(type);
  const isTransferSent = description.toLowerCase().includes('transfert envoyé');
  const isTransferReceived = description.toLowerCase().includes('transfert reçu');

  const Icon = isTransferSent
    ? Send
    : isTransferReceived
    ? Download
    : isCredit
    ? ArrowDownLeft
    : ArrowUpRight;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.03 }}
    >
      <div className={cn(
        "flex items-center gap-3 transition-colors",
        compact
          ? "p-3 hover:bg-muted/30"
          : "p-3.5 rounded-xl bg-card hover:bg-muted/30 border border-border/40"
      )}>
        {/* Icon */}
        <div className={cn(
          "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0",
          isCredit
            ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
            : "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400"
        )}>
          <Icon className="w-4 h-4" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-foreground truncate">
            {description}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <p className="text-[11px] text-muted-foreground">
              {new Date(date).toLocaleString('fr-FR', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
            {status === 'pending' && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 text-[10px] font-medium dark:bg-amber-500/10 dark:text-amber-400">
                En attente
              </span>
            )}
          </div>
        </div>

        {/* Amount */}
        <p className={cn(
          "font-semibold text-sm tabular-nums",
          isCredit
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-foreground"
        )}>
          {isCredit ? '+' : '-'}
          {amount.toLocaleString('fr-CD')} {currency}
        </p>
      </div>
    </motion.div>
  );
};
