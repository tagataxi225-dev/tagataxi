import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Lock, Clock, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export type EscrowStatus = 'pending' | 'held' | 'released' | 'disputed' | 'refunded';

interface FoodEscrowIndicatorProps {
  status: EscrowStatus;
  amount: number;
  currency?: string;
  autoReleaseAt?: string;
  className?: string;
  compact?: boolean;
}

const ESCROW_STATUS_CONFIG: Record<EscrowStatus, {
  label: string;
  icon: typeof Lock;
  colorClass: string;
  bgClass: string;
  description: string;
}> = {
  pending: {
    label: 'En attente',
    icon: Loader2,
    colorClass: 'text-amber-600 dark:text-amber-400',
    bgClass: 'bg-amber-100 dark:bg-amber-900/30',
    description: 'Paiement en cours de traitement'
  },
  held: {
    label: 'Sécurisé',
    icon: Lock,
    colorClass: 'text-blue-600 dark:text-blue-400',
    bgClass: 'bg-blue-100 dark:bg-blue-900/30',
    description: 'Fonds bloqués en attente de confirmation'
  },
  released: {
    label: 'Libéré',
    icon: CheckCircle,
    colorClass: 'text-green-600 dark:text-green-400',
    bgClass: 'bg-green-100 dark:bg-green-900/30',
    description: 'Fonds transférés au restaurant'
  },
  disputed: {
    label: 'Litige',
    icon: AlertTriangle,
    colorClass: 'text-destructive',
    bgClass: 'bg-destructive/10',
    description: 'Un litige est en cours de résolution'
  },
  refunded: {
    label: 'Remboursé',
    icon: CheckCircle,
    colorClass: 'text-muted-foreground',
    bgClass: 'bg-muted',
    description: 'Fonds remboursés au client'
  }
};

export function FoodEscrowIndicator({
  status,
  amount,
  currency = 'CDF',
  autoReleaseAt,
  className,
  compact = false
}: FoodEscrowIndicatorProps) {
  const config = ESCROW_STATUS_CONFIG[status];
  const Icon = config.icon;
  
  const timeUntilRelease = autoReleaseAt 
    ? formatDistanceToNow(new Date(autoReleaseAt), { locale: fr, addSuffix: false })
    : null;

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant="outline" 
              className={cn(
                "gap-1 cursor-help",
                config.bgClass,
                config.colorClass,
                className
              )}
            >
              <Icon className={cn("h-3 w-3", status === 'pending' && "animate-spin")} />
              <span className="text-xs font-medium">
                {amount.toLocaleString()} {currency}
              </span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[200px]">
            <div className="space-y-1">
              <p className="font-medium">{config.label}</p>
              <p className="text-xs text-muted-foreground">{config.description}</p>
              {timeUntilRelease && status === 'held' && (
                <p className="text-xs text-muted-foreground">
                  Auto-libération dans {timeUntilRelease}
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className={cn(
      "flex items-center gap-3 p-3 rounded-lg border",
      config.bgClass,
      "border-current/20",
      className
    )}>
      <div className={cn(
        "p-2 rounded-full",
        config.bgClass
      )}>
        <Icon className={cn(
          "h-4 w-4",
          config.colorClass,
          status === 'pending' && "animate-spin"
        )} />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={cn("font-medium text-sm", config.colorClass)}>
            {config.label}
          </span>
          <span className={cn("font-bold", config.colorClass)}>
            {amount.toLocaleString()} {currency}
          </span>
        </div>
        
        <p className="text-xs text-muted-foreground truncate">
          {config.description}
        </p>
        
        {timeUntilRelease && status === 'held' && (
          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>Auto-libération dans {timeUntilRelease}</span>
          </div>
        )}
      </div>
    </div>
  );
}
