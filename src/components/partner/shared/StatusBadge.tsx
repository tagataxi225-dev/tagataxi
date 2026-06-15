import { CheckCircle, Clock, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type StatusType = 
  | 'active' 
  | 'pending' 
  | 'verified' 
  | 'rejected' 
  | 'inactive'
  | 'suspended'
  | 'processing';

interface StatusBadgeProps {
  status: StatusType;
  customLabel?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

const statusConfig = {
  active: {
    label: 'Actif',
    icon: CheckCircle,
    className: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800'
  },
  verified: {
    label: 'Vérifié',
    icon: CheckCircle,
    className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800'
  },
  pending: {
    label: 'En attente',
    icon: Clock,
    className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800'
  },
  processing: {
    label: 'Traitement',
    icon: Loader2,
    className: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800'
  },
  rejected: {
    label: 'Rejeté',
    icon: XCircle,
    className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'
  },
  inactive: {
    label: 'Inactif',
    icon: AlertCircle,
    className: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800'
  },
  suspended: {
    label: 'Suspendu',
    icon: AlertCircle,
    className: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800'
  }
};

const sizeClasses = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
  lg: 'text-base px-3 py-1.5'
};

const iconSizes = {
  sm: 'w-3 h-3',
  md: 'w-3.5 h-3.5',
  lg: 'w-4 h-4'
};

export const StatusBadge = ({ 
  status, 
  customLabel, 
  size = 'md',
  showIcon = true,
  className 
}: StatusBadgeProps) => {
  const config = statusConfig[status];
  const Icon = config.icon;
  const isProcessing = status === 'processing';

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 font-medium rounded-full border",
      config.className,
      sizeClasses[size],
      className
    )}>
      {showIcon && (
        <Icon className={cn(
          iconSizes[size],
          isProcessing && "animate-spin"
        )} />
      )}
      <span>{customLabel || config.label}</span>
    </span>
  );
};
