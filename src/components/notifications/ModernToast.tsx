import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Car, 
  Package, 
  ShoppingBag, 
  CreditCard, 
  Bell, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  Truck,
  MessageSquare,
  Gift,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export type ToastType = 
  | 'transport' 
  | 'delivery' 
  | 'marketplace' 
  | 'payment' 
  | 'system' 
  | 'success' 
  | 'error' 
  | 'warning' 
  | 'info'
  | 'chat'
  | 'lottery'
  | 'challenge';

export type ToastPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface ModernToastProps {
  id: string;
  title: string;
  message?: string;
  type?: ToastType;
  priority?: ToastPriority;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  onDismiss: (id: string) => void;
  duration?: number;
  timestamp?: number;
}

const TOAST_ICONS: Record<ToastType, React.ElementType> = {
  transport: Car,
  delivery: Truck,
  marketplace: ShoppingBag,
  payment: CreditCard,
  system: Bell,
  success: CheckCircle2,
  error: AlertTriangle,
  warning: AlertTriangle,
  info: Info,
  chat: MessageSquare,
  lottery: Gift,
  challenge: Zap
};

const TOAST_STYLES: Record<ToastType, { bg: string; border: string; icon: string }> = {
  transport: {
    bg: 'bg-blue-500/10 dark:bg-blue-500/20',
    border: 'border-blue-500/30',
    icon: 'text-blue-500'
  },
  delivery: {
    bg: 'bg-orange-500/10 dark:bg-orange-500/20',
    border: 'border-orange-500/30',
    icon: 'text-orange-500'
  },
  marketplace: {
    bg: 'bg-purple-500/10 dark:bg-purple-500/20',
    border: 'border-purple-500/30',
    icon: 'text-purple-500'
  },
  payment: {
    bg: 'bg-green-500/10 dark:bg-green-500/20',
    border: 'border-green-500/30',
    icon: 'text-green-500'
  },
  system: {
    bg: 'bg-muted/80',
    border: 'border-border',
    icon: 'text-muted-foreground'
  },
  success: {
    bg: 'bg-success/10 dark:bg-success/20',
    border: 'border-success/30',
    icon: 'text-success'
  },
  error: {
    bg: 'bg-destructive/10 dark:bg-destructive/20',
    border: 'border-destructive/30',
    icon: 'text-destructive'
  },
  warning: {
    bg: 'bg-yellow-500/10 dark:bg-yellow-500/20',
    border: 'border-yellow-500/30',
    icon: 'text-yellow-500'
  },
  info: {
    bg: 'bg-primary/10 dark:bg-primary/20',
    border: 'border-primary/30',
    icon: 'text-primary'
  },
  chat: {
    bg: 'bg-indigo-500/10 dark:bg-indigo-500/20',
    border: 'border-indigo-500/30',
    icon: 'text-indigo-500'
  },
  lottery: {
    bg: 'bg-amber-500/10 dark:bg-amber-500/20',
    border: 'border-amber-500/30',
    icon: 'text-amber-500'
  },
  challenge: {
    bg: 'bg-rose-500/10 dark:bg-rose-500/20',
    border: 'border-rose-500/30',
    icon: 'text-rose-500'
  }
};

const PRIORITY_STYLES: Record<ToastPriority, string> = {
  low: '',
  normal: '',
  high: 'ring-2 ring-primary/50',
  urgent: 'ring-2 ring-destructive/50 animate-pulse'
};

export const ModernToast: React.FC<ModernToastProps> = ({
  id,
  title,
  message,
  type = 'info',
  priority = 'normal',
  icon,
  action,
  onDismiss,
}) => {
  const IconComponent = TOAST_ICONS[type];
  const styles = TOAST_STYLES[type];
  const priorityStyle = PRIORITY_STYLES[priority];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={cn(
        "relative w-full max-w-[380px] mx-auto",
        "backdrop-blur-xl rounded-2xl border shadow-lg",
        "bg-background/95 dark:bg-background/90",
        styles.bg,
        styles.border,
        priorityStyle,
        "overflow-hidden"
      )}
    >
      {/* Progress bar for urgent/high priority */}
      {(priority === 'urgent' || priority === 'high') && (
        <motion.div
          className={cn(
            "absolute top-0 left-0 h-1 bg-gradient-to-r",
            priority === 'urgent' ? 'from-destructive to-destructive/50' : 'from-primary to-primary/50'
          )}
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: priority === 'urgent' ? 5 : 8, ease: 'linear' }}
        />
      )}

      <div className="flex items-start gap-3 p-4">
        {/* Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 500 }}
          className={cn(
            "flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center",
            styles.bg,
            "border",
            styles.border
          )}
        >
          {icon || <IconComponent className={cn("w-5 h-5", styles.icon)} />}
        </motion.div>

        {/* Content */}
        <div className="flex-1 min-w-0 pt-0.5">
          <motion.h4
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="font-semibold text-sm text-foreground leading-tight"
          >
            {title}
          </motion.h4>
          {message && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="text-xs text-muted-foreground mt-1 line-clamp-2"
            >
              {message}
            </motion.p>
          )}
          
          {action && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-2"
            >
              <Button
                size="sm"
                variant="secondary"
                onClick={action.onClick}
                className="h-7 text-xs px-3"
              >
                {action.label}
              </Button>
            </motion.div>
          )}
        </div>

        {/* Dismiss button */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onDismiss(id)}
          className={cn(
            "flex-shrink-0 w-6 h-6 rounded-full",
            "flex items-center justify-center",
            "text-muted-foreground hover:text-foreground",
            "hover:bg-muted/50 transition-colors"
          )}
        >
          <X className="w-3.5 h-3.5" />
        </motion.button>
      </div>
    </motion.div>
  );
};

export default ModernToast;
