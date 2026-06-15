import React, { useEffect, useState } from 'react';
import { motion, useAnimation, PanInfo } from 'framer-motion';
import { 
  X, Car, Package, CreditCard, ShoppingBag, CheckCircle, 
  AlertCircle, AlertTriangle, Info, Bell, Utensils, MapPin
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type PremiumToastType = 
  | 'success' | 'error' | 'warning' | 'info' 
  | 'transport' | 'delivery' | 'payment' | 'marketplace' | 'food' | 'location';

export type PremiumToastPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface PremiumNotificationToastProps {
  id: string;
  title: string;
  message?: string;
  type?: PremiumToastType;
  priority?: PremiumToastPriority;
  duration?: number;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  onDismiss: (id: string) => void;
  showProgress?: boolean;
}

const typeConfig: Record<PremiumToastType, { 
  icon: React.ComponentType<any>; 
  gradient: string; 
  iconBg: string;
  borderColor: string;
}> = {
  success: { 
    icon: CheckCircle, 
    gradient: 'from-emerald-500/20 via-transparent to-transparent',
    iconBg: 'bg-emerald-500/20 text-emerald-500',
    borderColor: 'border-emerald-500/30'
  },
  error: { 
    icon: AlertCircle, 
    gradient: 'from-red-500/20 via-transparent to-transparent',
    iconBg: 'bg-red-500/20 text-red-500',
    borderColor: 'border-red-500/30'
  },
  warning: { 
    icon: AlertTriangle, 
    gradient: 'from-amber-500/20 via-transparent to-transparent',
    iconBg: 'bg-amber-500/20 text-amber-500',
    borderColor: 'border-amber-500/30'
  },
  info: { 
    icon: Info, 
    gradient: 'from-blue-500/20 via-transparent to-transparent',
    iconBg: 'bg-blue-500/20 text-blue-500',
    borderColor: 'border-blue-500/30'
  },
  transport: { 
    icon: Car, 
    gradient: 'from-primary/20 via-transparent to-transparent',
    iconBg: 'bg-primary/20 text-primary',
    borderColor: 'border-primary/30'
  },
  delivery: { 
    icon: Package, 
    gradient: 'from-orange-500/20 via-transparent to-transparent',
    iconBg: 'bg-orange-500/20 text-orange-500',
    borderColor: 'border-orange-500/30'
  },
  payment: { 
    icon: CreditCard, 
    gradient: 'from-green-500/20 via-transparent to-transparent',
    iconBg: 'bg-green-500/20 text-green-500',
    borderColor: 'border-green-500/30'
  },
  marketplace: { 
    icon: ShoppingBag, 
    gradient: 'from-purple-500/20 via-transparent to-transparent',
    iconBg: 'bg-purple-500/20 text-purple-500',
    borderColor: 'border-purple-500/30'
  },
  food: { 
    icon: Utensils, 
    gradient: 'from-rose-500/20 via-transparent to-transparent',
    iconBg: 'bg-rose-500/20 text-rose-500',
    borderColor: 'border-rose-500/30'
  },
  location: { 
    icon: MapPin, 
    gradient: 'from-cyan-500/20 via-transparent to-transparent',
    iconBg: 'bg-cyan-500/20 text-cyan-500',
    borderColor: 'border-cyan-500/30'
  }
};

const priorityConfig: Record<PremiumToastPriority, { ring: string; pulse: boolean }> = {
  low: { ring: '', pulse: false },
  normal: { ring: '', pulse: false },
  high: { ring: 'ring-2 ring-amber-500/50', pulse: true },
  urgent: { ring: 'ring-2 ring-red-500/50 animate-pulse', pulse: true }
};

export const PremiumNotificationToast: React.FC<PremiumNotificationToastProps> = ({
  id,
  title,
  message,
  type = 'info',
  priority = 'normal',
  duration = 4000,
  icon,
  action,
  onDismiss,
  showProgress = true
}) => {
  const [progress, setProgress] = useState(100);
  const controls = useAnimation();
  const config = typeConfig[type];
  const priorityCfg = priorityConfig[priority];
  const IconComponent = config.icon;

  useEffect(() => {
    if (duration <= 0) return;

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      
      if (remaining <= 0) {
        clearInterval(interval);
        onDismiss(id);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [id, duration, onDismiss]);

  const handleDragEnd = async (_: any, info: PanInfo) => {
    if (Math.abs(info.offset.x) > 100 || Math.abs(info.offset.y) > 50) {
      await controls.start({ 
        opacity: 0, 
        x: info.offset.x > 0 ? 300 : -300,
        transition: { duration: 0.2 }
      });
      onDismiss(id);
    } else {
      controls.start({ x: 0, y: 0 });
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ 
        type: 'spring', 
        stiffness: 400, 
        damping: 25,
        mass: 0.8
      }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      className={cn(
        "relative w-full max-w-sm overflow-hidden rounded-2xl",
        "bg-white",
        "border-0 shadow-[0_8px_40px_rgba(0,0,0,0.18)]",
        config.borderColor,
        priorityCfg.ring,
        "cursor-grab active:cursor-grabbing"
      )}
    >
      {/* Gradient overlay */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-r pointer-events-none",
        config.gradient
      )} />

      {/* Content */}
      <div className="relative p-4 flex items-start gap-3">
        {/* Icon */}
        <div className={cn(
          "flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center",
          config.iconBg,
          priorityCfg.pulse && "animate-pulse"
        )}>
          {icon || <IconComponent className="w-5 h-5" />}
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0 pt-0.5">
          <p className="font-semibold text-foreground text-sm leading-tight">
            {title}
          </p>
          {message && (
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
              {message}
            </p>
          )}
          {action && (
            <button
              onClick={action.onClick}
              className="mt-2 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
            >
              {action.label}
            </button>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={() => onDismiss(id)}
          className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress bar */}
      {showProgress && duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-muted/30">
          <motion.div
            className={cn(
              "h-full",
              type === 'success' && "bg-emerald-500",
              type === 'error' && "bg-red-500",
              type === 'warning' && "bg-amber-500",
              type === 'info' && "bg-blue-500",
              type === 'transport' && "bg-primary",
              type === 'delivery' && "bg-orange-500",
              type === 'payment' && "bg-green-500",
              type === 'marketplace' && "bg-purple-500",
              type === 'food' && "bg-rose-500",
              type === 'location' && "bg-cyan-500"
            )}
            style={{ width: `${progress}%` }}
            transition={{ duration: 0.05 }}
          />
        </div>
      )}
    </motion.div>
  );
};

export default PremiumNotificationToast;
