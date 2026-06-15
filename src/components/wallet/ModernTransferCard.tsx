import { ArrowUpRight, ArrowDownLeft, CheckCircle2, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ModernTransferCardProps {
  type: 'transfer_in' | 'transfer_out';
  amount: number;
  currency: string;
  contactName: string;
  description: string;
  status: string;
  timestamp: string;
  index: number;
}

export const ModernTransferCard = ({
  type,
  amount,
  currency,
  contactName,
  status,
  timestamp,
}: ModernTransferCardProps) => {
  const isReceived = type === 'transfer_in';

  return (
    <div className="flex items-center gap-3 px-3.5 py-3">
      {/* Icon */}
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
        isReceived
          ? 'bg-emerald-100 dark:bg-emerald-500/15'
          : 'bg-blue-100 dark:bg-blue-500/15'
      }`}>
        {isReceived ? (
          <ArrowDownLeft className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        ) : (
          <ArrowUpRight className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <h4 className="font-medium text-sm text-foreground truncate">
            {contactName}
          </h4>
          {status === 'completed' && (
            <CheckCircle2 className="h-3 w-3 text-emerald-500 flex-shrink-0" />
          )}
          {status === 'pending' && (
            <Clock className="h-3 w-3 text-amber-500 flex-shrink-0" />
          )}
        </div>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          {isReceived ? 'Reçu' : 'Envoyé'} · {formatDistanceToNow(new Date(timestamp), {
            addSuffix: true,
            locale: fr
          })}
        </p>
      </div>

      {/* Amount */}
      <p className={`font-semibold text-sm tabular-nums ${
        isReceived ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'
      }`}>
        {isReceived ? '+' : '-'}{amount.toLocaleString()} {currency}
      </p>
    </div>
  );
};
