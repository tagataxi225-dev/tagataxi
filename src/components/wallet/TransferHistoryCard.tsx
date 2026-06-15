import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Transfer {
  id: string;
  sender_id: string;
  recipient_id: string;
  amount: number;
  currency: string;
  description: string;
  status: string;
  created_at: string;
  completed_at?: string;
}

interface TransferHistoryCardProps {
  transfer: Transfer;
  currentUserId: string;
  otherPartyName?: string;
}

export const TransferHistoryCard = ({ 
  transfer, 
  currentUserId,
  otherPartyName = 'Utilisateur'
}: TransferHistoryCardProps) => {
  const isSent = transfer.sender_id === currentUserId;
  
  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={cn(
            "p-2 rounded-full shrink-0",
            isSent ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
          )}>
            {isSent ? (
              <ArrowUpRight className="w-4 h-4" />
            ) : (
              <ArrowDownLeft className="w-4 h-4" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">
              {isSent ? 'Envoyé à' : 'Reçu de'} {otherPartyName}
            </p>
            <p className="text-sm text-muted-foreground">
              {format(new Date(transfer.created_at), 'dd MMM yyyy, HH:mm', { locale: fr })}
            </p>
            {transfer.description && (
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {transfer.description}
              </p>
            )}
          </div>
        </div>
        
        <div className="text-right shrink-0">
          <p className={cn(
            "text-lg font-bold whitespace-nowrap",
            isSent ? "text-destructive" : "text-primary"
          )}>
            {isSent ? '-' : '+'}{transfer.amount.toLocaleString()} CDF
          </p>
          <Badge 
            variant={transfer.status === 'completed' ? 'default' : 'secondary'}
            className="mt-1"
          >
            {transfer.status === 'completed' ? 'Effectué' : transfer.status}
          </Badge>
        </div>
      </div>
    </Card>
  );
};
