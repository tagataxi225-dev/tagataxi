import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Bell, CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react';
import { useNotificationActions, NotificationAction } from '@/hooks/useNotificationActions';
import { NOTIFICATION_CONFIG } from '@/config/notificationConfig';

interface NotificationToastProps {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  priority?: 'low' | 'normal' | 'high';
  duration?: number;
  actions?: NotificationAction[];
  metadata?: any;
  onClose?: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center';
}

const NotificationToast: React.FC<NotificationToastProps> = ({
  id,
  type,
  title,
  message,
  priority = 'normal',
  duration = NOTIFICATION_CONFIG.DEFAULT_DURATION,
  actions,
  metadata,
  onClose,
  position = 'top-right'
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(100);
  const { executeAction, getActionsForNotification } = useNotificationActions();

  useEffect(() => {
    if (duration > 0) {
      const interval = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev - (100 / (duration / 100));
          if (newProgress <= 0) {
            setIsVisible(false);
            return 0;
          }
          return newProgress;
        });
      }, 100);

      return () => clearInterval(interval);
    }
  }, [duration]);

  useEffect(() => {
    if (!isVisible) {
      const timeout = setTimeout(() => {
        onClose?.(id);
      }, NOTIFICATION_CONFIG.ANIMATION.EXIT_DURATION);
      return () => clearTimeout(timeout);
    }
  }, [isVisible, id, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-accent" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-primary" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-destructive" />;
      default:
        return <Info className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'bg-accent/10 border-accent/20';
      case 'warning':
        return 'bg-primary/10 border-primary/20';
      case 'error':
        return 'bg-destructive/10 border-destructive/20';
      default:
        return 'bg-card border-border';
    }
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'top-center':
        return 'top-4 left-1/2 transform -translate-x-1/2';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      default:
        return 'top-4 right-4';
    }
  };

  const handleActionClick = async (action: NotificationAction) => {
    await executeAction(action, id);
    setIsVisible(false);
  };

  const notificationActions = actions || getActionsForNotification(type, metadata);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: position.includes('top') ? -50 : 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: position.includes('top') ? -50 : 50, scale: 0.95 }}
          transition={{ duration: NOTIFICATION_CONFIG.ANIMATION.EXIT_DURATION / 1000, ease: "easeOut" }}
          className={`
            fixed z-50 w-full max-w-sm pointer-events-auto
            ${getPositionClasses()}
          `}
        >
          <div className={`
            bg-card border rounded-lg shadow-lg backdrop-blur-sm
            ${getBackgroundColor()}
          `}>
            {/* Progress Bar */}
            {duration > 0 && (
              <div className="h-1 bg-muted rounded-t-lg overflow-hidden">
                <motion.div
                  className="h-full bg-primary"
                  initial={{ width: '100%' }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>
            )}

            <div className="p-4">
              <div className="flex items-start space-x-3">
                {/* Icon */}
                <div className="flex-shrink-0 mt-0.5">
                  {getIcon()}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-1">
                    <h4 className="font-medium text-sm text-foreground flex items-center space-x-2">
                      <span>{title}</span>
                      {priority === 'high' && (
                        <Badge variant="destructive" className="text-xs px-1 py-0">
                          Urgent
                        </Badge>
                      )}
                    </h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => setIsVisible(false)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>

                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {message}
                  </p>

                  {/* Actions */}
                  {notificationActions.length > 0 && (
                    <div className="flex items-center space-x-2">
                      {notificationActions.slice(0, 2).map((action) => (
                        <Button
                          key={action.id}
                          variant={action.variant || 'outline'}
                          size="sm"
                          className="h-7 px-3 text-xs"
                          onClick={() => handleActionClick(action)}
                        >
                          {action.label}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NotificationToast;