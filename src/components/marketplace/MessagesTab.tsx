import React from 'react';
import { UniversalChatInterface } from '@/components/chat/UniversalChatInterface';
import { Badge } from '@/components/ui/badge';
import { ShoppingBag } from 'lucide-react';
import { useVendorChat } from '@/hooks/useVendorChat';

export const MessagesTab: React.FC = () => {
  const { totalUnread, activeConversations } = useVendorChat();

  return (
    <div className="h-[calc(100dvh-180px)] min-h-[450px] flex flex-col bg-background rounded-2xl overflow-hidden border border-border/20 shadow-sm">
      {/* Mini header contextuel */}
      <div className="px-4 py-3 border-b border-border/10 flex items-center gap-2">
        <ShoppingBag className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold">Conversations</span>
        {activeConversations.length > 0 && (
          <span className="text-xs text-muted-foreground">
            · {activeConversations.length} active{activeConversations.length > 1 ? 's' : ''}
          </span>
        )}
        {totalUnread > 0 && (
          <Badge className="h-5 px-1.5 text-xs bg-primary text-primary-foreground ml-auto">
            {totalUnread}
          </Badge>
        )}
      </div>

      {/* Chat interface */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <UniversalChatInterface
          contextType="marketplace"
          isFloating={false}
          hideHeader={false}
        />
      </div>
    </div>
  );
};
