import React from 'react';
import { motion } from 'framer-motion';
import { X, Reply } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { UniversalMessage } from '@/hooks/useUniversalChat';

interface MessageReplyProps {
  message: UniversalMessage;
  onCancel: () => void;
}

export const MessageReply: React.FC<MessageReplyProps> = ({
  message,
  onCancel
}) => {
  const senderName = (message.sender as any)?.shop_name || 
                     message.sender?.display_name || 
                     'Utilisateur';

  const previewContent = message.message_type === 'location' 
    ? '📍 Position partagée'
    : message.message_type === 'image'
    ? '📷 Photo'
    : message.content.length > 50 
    ? message.content.substring(0, 50) + '...'
    : message.content;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, height: 0 }}
      animate={{ opacity: 1, y: 0, height: 'auto' }}
      exit={{ opacity: 0, y: 10, height: 0 }}
      className="px-3 py-2 border-t bg-muted/30"
    >
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg border-l-4 bg-primary/5 border-l-primary">
        <Reply className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-primary truncate">
            {senderName}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {previewContent}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="h-6 w-6 p-0 hover:bg-destructive/10"
        >
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </div>
    </motion.div>
  );
};

interface MessageReplyPreviewProps {
  replyTo: UniversalMessage;
  isOwnMessage?: boolean;
  className?: string;
}

export const MessageReplyPreview: React.FC<MessageReplyPreviewProps> = ({
  replyTo,
  isOwnMessage = false,
  className
}) => {
  const senderName = (replyTo.sender as any)?.shop_name || 
                     replyTo.sender?.display_name || 
                     'Utilisateur';

  const previewContent = replyTo.message_type === 'location' 
    ? '📍 Position'
    : replyTo.message_type === 'image'
    ? '📷 Photo'
    : replyTo.content.length > 30 
    ? replyTo.content.substring(0, 30) + '...'
    : replyTo.content;

  return (
    <div className={cn(
      "px-2 py-1.5 mb-1 rounded border-l-2 text-xs",
      isOwnMessage 
        ? "border-l-primary-foreground/50 bg-primary-foreground/10" 
        : "border-l-primary/50 bg-primary/5",
      className
    )}>
      <p className={cn(
        "font-medium truncate",
        isOwnMessage ? "text-primary-foreground/80" : "text-primary/80"
      )}>
        {senderName}
      </p>
      <p className={cn(
        "truncate",
        isOwnMessage ? "text-primary-foreground/60" : "text-muted-foreground"
      )}>
        {previewContent}
      </p>
    </div>
  );
};
