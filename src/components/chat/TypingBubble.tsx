import React from 'react';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface TypingBubbleProps {
  userName?: string;
  avatarUrl?: string;
}

export const TypingBubble: React.FC<TypingBubbleProps> = ({ 
  userName = 'Utilisateur',
  avatarUrl 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -5, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="flex items-end gap-2 max-w-[80%] mr-auto"
    >
      <Avatar className="h-7 w-7 ring-2 ring-primary/20 flex-shrink-0">
        <AvatarImage src={avatarUrl} />
        <AvatarFallback className="bg-gradient-to-br from-secondary to-secondary/80 text-secondary-foreground text-xs font-semibold">
          {userName.charAt(0)}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground font-medium px-1">
          {userName}
        </span>
        <div className="bg-muted/80 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
          <div className="flex items-center gap-1.5">
            <motion.span
              className="h-2 w-2 bg-primary/60 rounded-full"
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
            />
            <motion.span
              className="h-2 w-2 bg-primary/60 rounded-full"
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }}
            />
            <motion.span
              className="h-2 w-2 bg-primary/60 rounded-full"
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};
