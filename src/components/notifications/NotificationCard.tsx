import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { motion } from 'framer-motion';
import { 
  Bell, Car, Package, DollarSign, Users, MessageCircle, 
  CheckCircle, AlertTriangle, XCircle, Info, Clock, 
  MapPin, Zap, Gift, Settings, Smartphone
} from 'lucide-react';
import { useNotificationActions, NotificationAction } from '@/hooks/useNotificationActions';

interface NotificationCardProps {
  id: string;
  type: string;
  title: string;
  message: string;
  timestamp: string | Date;
  read: boolean;
  priority?: 'low' | 'normal' | 'high';
  metadata?: any;
  actions?: NotificationAction[];
  avatar?: string;
  onMarkAsRead?: (id: string) => void;
  onRemove?: (id: string) => void;
  onClick?: (id: string) => void;
  className?: string;
}

const NotificationCard: React.FC<NotificationCardProps> = ({
  id,
  type,
  title,
  message,
  timestamp,
  read,
  priority = 'normal',
  metadata,
  actions,
  avatar,
  onMarkAsRead,
  onRemove,
  onClick,
  className = ''
}) => {
  const { executeAction, getActionsForNotification } = useNotificationActions();

  const getNotificationIcon = (type: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      ride: <Car className="h-4 w-4" />,
      delivery: <Package className="h-4 w-4" />,
      payment: <DollarSign className="h-4 w-4" />,
      chat: <MessageCircle className="h-4 w-4" />,
      system: <Settings className="h-4 w-4" />,
      marketing: <Users className="h-4 w-4" />,
      success: <CheckCircle className="h-4 w-4" />,
      warning: <AlertTriangle className="h-4 w-4" />,
      error: <XCircle className="h-4 w-4" />,
      info: <Info className="h-4 w-4" />,
      location: <MapPin className="h-4 w-4" />,
      urgent: <Zap className="h-4 w-4" />,
      reward: <Gift className="h-4 w-4" />,
      mobile: <Smartphone className="h-4 w-4" />
    };
    return iconMap[type] || <Bell className="h-4 w-4" />;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-destructive bg-destructive/5';
      case 'normal': return 'border-l-primary bg-primary/5';
      case 'low': return 'border-l-muted-foreground bg-muted/5';
      default: return 'border-l-border';
    }
  };

  const getTypeColor = (type: string) => {
    const colorMap: Record<string, string> = {
      error: 'text-destructive',
      warning: 'text-primary',
      success: 'text-accent',
      info: 'text-muted-foreground',
      ride: 'text-primary',
      delivery: 'text-secondary',
      payment: 'text-accent',
      chat: 'text-primary',
      urgent: 'text-destructive'
    };
    return colorMap[type] || 'text-muted-foreground';
  };

  const formatTime = (dateInput: Date | string) => {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return "À l'instant";
    if (minutes < 60) return `Il y a ${minutes}m`;
    if (hours < 24) return `Il y a ${hours}h`;
    if (days < 7) return `Il y a ${days}j`;
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
  };

  const handleCardClick = () => {
    if (!read && onMarkAsRead) {
      onMarkAsRead(id);
    }
    onClick?.(id);
  };

  const handleActionClick = async (action: NotificationAction, event: React.MouseEvent) => {
    event.stopPropagation();
    await executeAction(action, id);
    
    if (action.action !== 'dismiss' && !read && onMarkAsRead) {
      onMarkAsRead(id);
    }
  };

  const notificationActions = actions || getActionsForNotification(type, metadata);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={className}
    >
      <Card 
        className={`
          cursor-pointer transition-all duration-200 border-l-4 
          ${getPriorityColor(priority)}
          ${!read ? 'shadow-md hover:shadow-lg' : 'opacity-75'}
          hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]
        `}
        onClick={handleCardClick}
      >
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            {/* Avatar or Icon */}
            <div className="flex-shrink-0">
              {avatar ? (
                <Avatar className="h-10 w-10">
                  <AvatarImage src={avatar} alt="Avatar" />
                  <AvatarFallback>
                    {getNotificationIcon(type)}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center
                  ${!read ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}
                `}>
                  {getNotificationIcon(type)}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-1">
                <h4 className={`font-medium text-sm ${!read ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {title}
                </h4>
                <div className="flex items-center space-x-2 ml-2">
                  {priority === 'high' && (
                    <Badge variant="destructive" className="text-xs px-1 py-0">
                      Urgent
                    </Badge>
                  )}
                  {!read && (
                    <div className="w-2 h-2 bg-primary rounded-full" />
                  )}
                </div>
              </div>

              <p className={`text-sm mb-2 line-clamp-2 ${!read ? 'text-muted-foreground' : 'text-muted-foreground/75'}`}>
                {message}
              </p>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{formatTime(timestamp)}</span>
                  <Badge variant="outline" className={`text-xs ${getTypeColor(type)}`}>
                    {type}
                  </Badge>
                </div>

                {/* Quick Actions */}
                {notificationActions.length > 0 && (
                  <div className="flex items-center space-x-1">
                    {notificationActions.slice(0, 2).map((action) => (
                      <Button
                        key={action.id}
                        variant={action.variant || 'outline'}
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={(e) => handleActionClick(action, e)}
                      >
                        {action.label}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default NotificationCard;