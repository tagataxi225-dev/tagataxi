import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageCircle } from 'lucide-react';
import { useUniversalChat } from '@/hooks/useUniversalChat';
import { useChat } from '@/components/chat/ChatProvider';
import { cn } from '@/lib/utils';

export const FloatingChatButton: React.FC = () => {
  const { conversations } = useUniversalChat();
  const { openChat } = useChat();

  const totalUnread = conversations
    .filter(c => c.context_type === 'marketplace')
    .reduce((sum, c) => sum + (c.unread_count || 0), 0);

  return (
    <div className="fixed bottom-20 right-4 z-40">
      <button
        onClick={() => openChat({ contextType: 'marketplace' })}
        className={cn(
          "group relative h-12 w-12 rounded-full",
          "bg-card/80 backdrop-blur-xl border border-border/50",
          "shadow-lg hover:shadow-xl",
          "transition-all duration-300 hover:scale-105",
          "flex items-center justify-center"
        )}
        aria-label="Ouvrir la messagerie Shopping"
      >
        <MessageCircle className="h-5 w-5 text-primary group-hover:text-primary/80 transition-colors" />
        {totalUnread > 0 && (
          <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-destructive text-destructive-foreground text-[10px]">
            {totalUnread > 9 ? '9+' : totalUnread}
          </Badge>
        )}
      </button>
    </div>
  );
};
