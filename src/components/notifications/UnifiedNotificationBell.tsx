import React, { useState, useMemo } from 'react';
import { Bell, Check, CheckCheck, AlertCircle, Info, AlertTriangle, Inbox, Sparkles, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserType, useUnifiedNotifications } from '@/hooks/useUnifiedNotifications';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow, isToday, isYesterday, isThisWeek, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export type { UserType };

interface UnifiedNotificationBellProps {
  userType: UserType;
  className?: string;
}

const PRIORITY_COLORS = {
  high: 'text-destructive',
  medium: 'text-orange-500',
  normal: 'text-primary',
  low: 'text-muted-foreground'
};

const SEVERITY_ICONS = {
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
  success: Check
};

interface GroupedNotifications {
  today: any[];
  yesterday: any[];
  thisWeek: any[];
  older: any[];
}

export const UnifiedNotificationBell: React.FC<UnifiedNotificationBellProps> = ({ 
  userType, 
  className 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { 
    notifications, 
    unreadCount, 
    isLoading, 
    markAsRead, 
    markAllAsRead,
    isMarkingAsRead 
  } = useUnifiedNotifications(userType);

  // Group notifications by date
  const groupedNotifications = useMemo<GroupedNotifications>(() => {
    const groups: GroupedNotifications = {
      today: [],
      yesterday: [],
      thisWeek: [],
      older: []
    };

    notifications.forEach(notification => {
      const date = new Date(notification.created_at);
      if (isToday(date)) {
        groups.today.push(notification);
      } else if (isYesterday(date)) {
        groups.yesterday.push(notification);
      } else if (isThisWeek(date)) {
        groups.thisWeek.push(notification);
      } else {
        groups.older.push(notification);
      }
    });

    return groups;
  }, [notifications]);

  const handleNotificationClick = (notificationId: string, isRead: boolean) => {
    if (!isRead) {
      markAsRead(notificationId);
    }
  };

  const getNotificationIcon = (notification: any) => {
    const severity = notification.severity || 'info';
    const Icon = SEVERITY_ICONS[severity as keyof typeof SEVERITY_ICONS] || Info;
    return <Icon className="h-4 w-4" />;
  };

  const renderNotificationItem = (notification: any) => (
    <motion.div
      key={notification.id}
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className={cn(
        "flex flex-col items-start gap-2 p-3 cursor-pointer rounded-xl mx-1 transition-all",
        !notification.is_read 
          ? "bg-primary/5 hover:bg-primary/10 border border-primary/10" 
          : "hover:bg-muted/50"
      )}
      onClick={() => handleNotificationClick(notification.id, notification.is_read || false)}
    >
      <div className="flex items-start gap-3 w-full">
        <div className={cn(
          "mt-0.5 p-2 rounded-lg",
          !notification.is_read ? "bg-primary/10" : "bg-muted",
          PRIORITY_COLORS[notification.priority as keyof typeof PRIORITY_COLORS] || PRIORITY_COLORS.normal
        )}>
          {getNotificationIcon(notification)}
        </div>
        
        <div className="flex-1 space-y-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className={cn(
              "text-sm leading-tight truncate",
              !notification.is_read ? "font-semibold text-foreground" : "font-medium text-foreground/80"
            )}>
              {notification.title}
            </p>
            {!notification.is_read && (
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="h-2 w-2 rounded-full bg-primary flex-shrink-0" 
              />
            )}
          </div>
          
          <p className="text-xs text-muted-foreground line-clamp-2">
            {notification.message}
          </p>
          
          <p className="text-[10px] text-muted-foreground/60">
            {formatDistanceToNow(new Date(notification.created_at), {
              addSuffix: true,
              locale: fr
            })}
          </p>
        </div>
      </div>
    </motion.div>
  );

  const renderSection = (title: string, items: any[]) => {
    if (items.length === 0) return null;
    return (
      <div className="space-y-1">
        <div className="px-3 py-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {title}
          </p>
        </div>
        <AnimatePresence mode="popLayout">
          {items.map(renderNotificationItem)}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className={cn("relative group", className)}
          aria-label={`${unreadCount} notifications non lues`}
        >
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Bell className="h-5 w-5 transition-colors group-hover:text-primary" />
          </motion.div>
          
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1"
            >
              <Badge 
                variant="destructive" 
                className={cn(
                  "h-5 min-w-5 flex items-center justify-center p-0 text-xs font-bold",
                  "shadow-lg shadow-destructive/30"
                )}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
              {/* Pulse animation */}
              <span className="absolute inset-0 rounded-full bg-destructive animate-ping opacity-50" />
            </motion.div>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent 
        align="end" 
        className="w-80 sm:w-96 p-0 overflow-hidden rounded-2xl border-border/50 shadow-xl"
        sideOffset={8}
      >
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary/5 to-transparent border-b">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <DropdownMenuLabel className="p-0 font-semibold">
                Notifications
              </DropdownMenuLabel>
              {unreadCount > 0 && (
                <Badge variant="secondary" className="h-5 text-xs">
                  {unreadCount} nouvelles
                </Badge>
              )}
            </div>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAllAsRead()}
                disabled={isMarkingAsRead}
                className="h-7 text-xs hover:bg-primary/10"
              >
                <CheckCheck className="h-3.5 w-3.5 mr-1" />
                Tout lire
              </Button>
            )}
          </div>

          {/* Content */}
          <ScrollArea className="h-[420px]">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full"
                />
              </div>
            ) : notifications.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-12 px-6 text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                  <Inbox className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Tout est à jour !
                </p>
                <p className="text-xs text-muted-foreground/70">
                  Aucune nouvelle notification
                </p>
              </motion.div>
            ) : (
              <div className="py-2 space-y-2">
                {renderSection("Aujourd'hui", groupedNotifications.today)}
                {renderSection("Hier", groupedNotifications.yesterday)}
                {renderSection("Cette semaine", groupedNotifications.thisWeek)}
                {renderSection("Plus ancien", groupedNotifications.older)}
              </div>
            )}
          </ScrollArea>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-2 border-t bg-muted/30">
              <Button 
                variant="ghost" 
                className="w-full text-sm h-9 hover:bg-primary/10 gap-2" 
                size="sm"
                onClick={() => {
                  setIsOpen(false);
                  navigate('/notifications');
                }}
              >
                <ExternalLink className="h-4 w-4" />
                Voir toutes les notifications
              </Button>
            </div>
          )}
        </motion.div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UnifiedNotificationBell;
