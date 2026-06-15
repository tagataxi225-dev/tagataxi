import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Shield, Clock, CheckCircle, AlertTriangle, XCircle, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';

type EscrowStatus = 'held' | 'released' | 'disputed' | 'timeout' | 'cancelled' | 'pending';

interface EscrowStatusBadgeProps {
  status: EscrowStatus | string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

const statusConfig: Record<EscrowStatus, {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  className: string;
}> = {
  pending: {
    label: 'En attente',
    icon: Clock,
    variant: 'secondary',
    className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
  },
  held: {
    label: 'Sécurisé',
    icon: Shield,
    variant: 'default',
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 border-blue-200'
  },
  released: {
    label: 'Libéré',
    icon: CheckCircle,
    variant: 'default',
    className: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300 border-green-200'
  },
  disputed: {
    label: 'Litige',
    icon: AlertTriangle,
    variant: 'destructive',
    className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300 border-orange-200'
  },
  timeout: {
    label: 'Auto-libéré',
    icon: Timer,
    variant: 'outline',
    className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 border-purple-200'
  },
  cancelled: {
    label: 'Annulé',
    icon: XCircle,
    variant: 'destructive',
    className: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 border-red-200'
  }
};

export const EscrowStatusBadge: React.FC<EscrowStatusBadgeProps> = ({
  status,
  size = 'md',
  showIcon = true,
  className
}) => {
  const config = statusConfig[status as EscrowStatus] || statusConfig.pending;
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-3.5 w-3.5',
    lg: 'h-4 w-4'
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        'font-medium border gap-1.5 inline-flex items-center',
        config.className,
        sizeClasses[size],
        className
      )}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      {config.label}
    </Badge>
  );
};

// Composant pour afficher le montant en escrow
interface EscrowAmountProps {
  amount: number;
  currency?: string;
  status?: EscrowStatus | string;
}

export const EscrowAmount: React.FC<EscrowAmountProps> = ({
  amount,
  currency = 'CDF',
  status = 'held'
}) => {
  const isActive = status === 'held' || status === 'pending';

  return (
    <div className={cn(
      "flex items-center gap-2 p-3 rounded-lg border",
      isActive 
        ? "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800" 
        : "bg-muted/50 border-border"
    )}>
      <Shield className={cn(
        "h-5 w-5",
        isActive ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground"
      )} />
      <div className="flex-1">
        <p className="text-xs text-muted-foreground">
          {isActive ? 'Fonds sécurisés' : 'Montant traité'}
        </p>
        <p className={cn(
          "font-bold",
          isActive ? "text-blue-700 dark:text-blue-300" : "text-foreground"
        )}>
          {amount.toLocaleString()} {currency}
        </p>
      </div>
      <EscrowStatusBadge status={status} size="sm" />
    </div>
  );
};

export default EscrowStatusBadge;
