import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageCircle } from 'lucide-react';
import { useUniversalChat } from '@/hooks/useUniversalChat';
import { UniversalChatInterface } from '@/components/chat/UniversalChatInterface';

export const FloatingChatButton = ({ offsetBottomClass = '', position = 'right' }: { offsetBottomClass?: string; position?: 'left' | 'right' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { conversations } = useUniversalChat();

  const totalUnreadCount = conversations.reduce((total, conv) => total + (conv.unread_count || 0), 0);

  if (isOpen) {
    return (
      <UniversalChatInterface
        isFloating={true}
        onClose={() => setIsOpen(false)}
      />
    );
  }

  return (
    <div className={`fixed bottom-4 ${position === 'left' ? 'left-4' : 'right-4'} z-50 ${offsetBottomClass}`}>
      <Button
        onClick={() => setIsOpen(true)}
        aria-label="Ouvrir la messagerie"
        className="h-14 w-14 rounded-full bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl ring-1 ring-border/50 backdrop-blur transition-all hover:scale-105"
      >
        <MessageCircle className="h-6 w-6" />
        {totalUnreadCount > 0 && (
          <Badge className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center bg-destructive text-destructive-foreground">
            {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
          </Badge>
        )}
      </Button>
    </div>
  );
};