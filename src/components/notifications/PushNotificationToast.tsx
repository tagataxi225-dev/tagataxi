import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  X, 
  Car, 
  Package, 
  ShoppingBag, 
  Trophy, 
  Wallet,
  MessageSquare,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Info,
  Sparkles
} from 'lucide-react';
import { NOTIFICATION_CONFIG } from '@/config/notificationConfig';

export interface PushNotificationToastData {
  id: string;
  type: 'transport' | 'delivery' | 'marketplace' | 'lottery' | 'wallet' | 'chat' | 'system';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  title: string;
  message: string;
  badge?: string;
  actionLabel?: string;
  actionUrl?: string;
  timestamp: number;
  metadata?: any;
}

interface PushNotificationToastProps extends PushNotificationToastData {
  index: number;
  onClose: (id: string) => void;
  onAction?: (id: string, url?: string) => void;
}

const serviceConfig = {
  transport: {
    gradient: 'from-[hsl(var(--chart-1))] to-[hsl(var(--chart-2))]',
    icon: Car,
    iconAnimation: 'animate-[bounce_2s_ease-in-out_infinite]',
    bgGlow: 'shadow-[0_0_40px_hsl(var(--chart-1)/0.4)]'
  },
  delivery: {
    gradient: 'from-[hsl(var(--chart-3))] to-[hsl(var(--chart-4))]',
    icon: Package,
    iconAnimation: 'animate-[bounce_1.5s_ease-in-out_infinite]',
    bgGlow: 'shadow-[0_0_40px_hsl(var(--chart-3)/0.4)]'
  },
  marketplace: {
    gradient: 'from-[hsl(var(--primary))] to-[hsl(var(--accent))]',
    icon: ShoppingBag,
    iconAnimation: 'animate-[swing_2s_ease-in-out_infinite]',
    bgGlow: 'shadow-[0_0_40px_hsl(var(--primary)/0.4)]'
  },
  lottery: {
    gradient: 'from-yellow-400 via-orange-400 to-red-400',
    icon: Trophy,
    iconAnimation: 'animate-[pulse_1s_ease-in-out_infinite]',
    bgGlow: 'shadow-[0_0_60px_rgba(251,191,36,0.6)]'
  },
  wallet: {
    gradient: 'from-emerald-400 to-cyan-400',
    icon: Wallet,
    iconAnimation: 'animate-pulse',
    bgGlow: 'shadow-[0_0_40px_rgba(16,185,129,0.5)]'
  },
  chat: {
    gradient: 'from-blue-400 to-indigo-400',
    icon: MessageSquare,
    iconAnimation: 'animate-[bounce_1s_ease-in-out_infinite]',
    bgGlow: 'shadow-[0_0_40px_rgba(59,130,246,0.4)]'
  },
  system: {
    gradient: 'from-gray-400 to-gray-600',
    icon: Bell,
    iconAnimation: '',
    bgGlow: 'shadow-[0_0_30px_rgba(107,114,128,0.3)]'
  }
};

const priorityConfig = {
  urgent: { borderColor: 'border-red-500', ringColor: 'ring-red-500/50' },
  high: { borderColor: 'border-orange-500', ringColor: 'ring-orange-500/50' },
  normal: { borderColor: 'border-[hsl(var(--border))]', ringColor: 'ring-primary/20' },
  low: { borderColor: 'border-[hsl(var(--muted))]', ringColor: 'ring-muted/20' }
};

export const PushNotificationToast: React.FC<PushNotificationToastProps> = ({
  id,
  type,
  priority,
  title,
  message,
  badge,
  actionLabel,
  actionUrl,
  timestamp,
  index,
  metadata,
  onClose,
  onAction
}) => {
  const [progress, setProgress] = useState(100);
  const [isExiting, setIsExiting] = useState(false);
  const config = serviceConfig[type];
  const priorityStyle = priorityConfig[priority];
  const Icon = config.icon;

  // Position calculée par le container parent maintenant

  const duration = priority === 'urgent' || priority === 'high' 
    ? NOTIFICATION_CONFIG.CRITICAL_DURATION * 3
    : NOTIFICATION_CONFIG.DEFAULT_DURATION * 3;

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        const decrement = 100 / (duration / 100);
        const newProgress = prev - decrement;
        
        if (newProgress <= 0) {
          handleClose();
          return 0;
        }
        return newProgress;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => onClose(id), NOTIFICATION_CONFIG.ANIMATION.EXIT_DURATION);
  };

  const handleAction = () => {
    if (onAction) {
      onAction(id, actionUrl);
    }
    handleClose();
  };

  return (
    <AnimatePresence mode="wait">
      {!isExiting && (
        <motion.div
          initial={{ opacity: 0, y: -100, scale: 0.8 }}
          animate={{ 
            opacity: 1, 
            y: 0, 
            scale: 1,
            transition: {
              type: "spring",
              stiffness: 400,
              damping: 25
            }
          }}
          exit={{ 
            opacity: 0, 
            y: -50, 
            scale: 0.9,
            transition: { duration: 0.2 }
          }}
          drag="y"
          dragConstraints={{ top: 0, bottom: 50 }}
          dragElastic={0.2}
          onDragEnd={(_, info) => {
            if (info.offset.y < -50) {
              handleClose();
            }
          }}
          className="relative w-[90%] max-w-md touch-none pointer-events-auto"
          style={{ willChange: 'transform' }}
        >
          <motion.div
            className={`
              relative overflow-hidden rounded-2xl
              bg-gradient-to-br ${config.gradient}
              ${config.bgGlow}
              ring-2 ${priorityStyle.ringColor}
              border-2 ${priorityStyle.borderColor}
            `}
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            {/* Glassmorphism overlay */}
            <div className="absolute inset-0 bg-background/80 backdrop-blur-xl" />
            
            {/* Progress bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-muted/30">
              <motion.div
                className="h-full bg-gradient-to-r from-primary via-accent to-primary"
                style={{ width: `${progress}%` }}
                animate={{ 
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity,
                  ease: "linear" 
                }}
              />
            </div>

            <div className="relative p-4">
              <div className="flex items-start gap-4">
                {/* Animated Icon */}
                <div className="relative flex-shrink-0">
                  {/* Pulse ring for urgent */}
                  {priority === 'urgent' && (
                    <motion.div
                      className="absolute inset-0 rounded-full bg-primary/30"
                      animate={{ 
                        scale: [1, 1.5, 1],
                        opacity: [0.6, 0, 0.6]
                      }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                  )}
                  
                  <motion.div
                    className={`
                      relative z-10 p-3 rounded-xl
                      bg-background/40 backdrop-blur-sm
                      border border-background/60
                      ${config.iconAnimation}
                    `}
                    whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                    transition={{ duration: 0.5 }}
                  >
                    <Icon className="h-6 w-6 text-foreground" />
                  </motion.div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-base text-foreground">
                        {title}
                      </h4>
                      {badge && (
                        <Badge 
                          variant="secondary" 
                          className="text-xs px-2 py-0 bg-background/60 backdrop-blur-sm"
                        >
                          {badge}
                        </Badge>
                      )}
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-full bg-background/40 backdrop-blur-sm hover:bg-background/60"
                      onClick={handleClose}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {message}
                  </p>

                  {/* Action Button */}
                  {actionLabel && (
                    <Button
                      size="sm"
                      onClick={handleAction}
                      className="h-8 px-4 bg-background/60 backdrop-blur-sm hover:bg-background/80 text-foreground border border-background/60"
                    >
                      {actionLabel}
                      <motion.span
                        animate={{ x: [0, 4, 0] }}
                        transition={{ 
                          duration: 1,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        →
                      </motion.span>
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Sparkle effect for lottery */}
            {type === 'lottery' && (
              <motion.div
                className="absolute top-2 right-2"
                animate={{ 
                  rotate: [0, 360],
                  scale: [1, 1.2, 1]
                }}
                transition={{ 
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <Sparkles className="h-4 w-4 text-yellow-300" />
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
