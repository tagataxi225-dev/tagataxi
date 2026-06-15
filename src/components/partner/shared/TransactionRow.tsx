import { motion } from 'framer-motion';
import { StatusBadge, StatusType } from './StatusBadge';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Calendar,
  User,
  Car,
  Package
} from 'lucide-react';
import { cn } from '@/lib/utils';

type TransactionType = 'commission' | 'withdrawal' | 'subscription' | 'topup' | 'refund';

interface TransactionRowProps {
  transaction: {
    id: string;
    type: TransactionType;
    amount: number;
    currency: string;
    status: StatusType;
    description: string;
    date: string;
    reference?: string;
    relatedTo?: {
      type: 'driver' | 'ride' | 'delivery';
      name: string;
    };
  };
  onClick?: (id: string) => void;
  index?: number;
}

const transactionConfig = {
  commission: {
    label: 'Commission',
    icon: ArrowUpRight,
    colorClass: 'text-green-600 dark:text-green-400',
    bgClass: 'bg-green-50 dark:bg-green-900/30',
    isIncoming: true
  },
  subscription: {
    label: 'Abonnement',
    icon: ArrowUpRight,
    colorClass: 'text-blue-600 dark:text-blue-400',
    bgClass: 'bg-blue-50 dark:bg-blue-900/30',
    isIncoming: true
  },
  topup: {
    label: 'Rechargement',
    icon: ArrowUpRight,
    colorClass: 'text-purple-600 dark:text-purple-400',
    bgClass: 'bg-purple-50 dark:bg-purple-900/30',
    isIncoming: true
  },
  withdrawal: {
    label: 'Retrait',
    icon: ArrowDownLeft,
    colorClass: 'text-red-600 dark:text-red-400',
    bgClass: 'bg-red-50 dark:bg-red-900/30',
    isIncoming: false
  },
  refund: {
    label: 'Remboursement',
    icon: ArrowDownLeft,
    colorClass: 'text-orange-600 dark:text-orange-400',
    bgClass: 'bg-orange-50 dark:bg-orange-900/30',
    isIncoming: false
  }
};

export const TransactionRow = ({ 
  transaction, 
  onClick,
  index = 0 
}: TransactionRowProps) => {
  const config = transactionConfig[transaction.type];
  const Icon = config.icon;
  const RelatedIcon = transaction.relatedTo?.type === 'driver' ? User : 
                      transaction.relatedTo?.type === 'ride' ? Car : Package;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ scale: 1.01 }}
      onClick={() => onClick?.(transaction.id)}
      className={cn(
        "p-4 rounded-xl backdrop-blur-xl bg-white/50 dark:bg-card/50 border border-gray-200/50 dark:border-border/50",
        "hover:shadow-md transition-all duration-200",
        onClick && "cursor-pointer"
      )}
    >
      <div className="flex items-center justify-between gap-4">
        {/* Icon & Info */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={cn(
            "p-2.5 rounded-xl flex-shrink-0",
            config.bgClass
          )}>
            <Icon className={cn("w-5 h-5", config.colorClass)} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-semibold text-gray-900 dark:text-white truncate">
                {transaction.description}
              </p>
              <span className={cn(
                "text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0",
                config.bgClass,
                config.colorClass
              )}>
                {config.label}
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{transaction.date}</span>
              </div>
              
              {transaction.reference && (
                <>
                  <span className="text-gray-400">•</span>
                  <span className="font-mono">{transaction.reference}</span>
                </>
              )}

              {transaction.relatedTo && (
                <>
                  <span className="text-gray-400">•</span>
                  <div className="flex items-center gap-1">
                    <RelatedIcon className="w-3 h-3" />
                    <span>{transaction.relatedTo.name}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Amount & Status */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-right">
            <p className={cn(
              "font-bold text-lg",
              config.isIncoming 
                ? "text-green-600 dark:text-green-400" 
                : "text-red-600 dark:text-red-400"
            )}>
              {config.isIncoming ? '+' : '-'}{transaction.amount.toLocaleString()} {transaction.currency}
            </p>
          </div>

          <StatusBadge status={transaction.status} size="sm" />
        </div>
      </div>
    </motion.div>
  );
};
