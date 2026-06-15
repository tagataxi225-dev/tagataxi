import React from 'react';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

interface ChatNotificationBadgeProps {
  unreadCount: number;
  onClick?: () => void;
}

export const ChatNotificationBadge: React.FC<ChatNotificationBadgeProps> = ({
  unreadCount,
  onClick
}) => {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="relative p-2"
      onClick={onClick}
    >
      <MessageCircle className={`h-5 w-5 ${unreadCount > 0 ? 'text-primary' : ''}`} />
      {unreadCount > 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1"
        >
          <Badge 
            variant="destructive" 
            className="h-5 min-w-5 px-1 text-xs flex items-center justify-center animate-pulse"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        </motion.div>
      )}
    </Button>
  );
};
