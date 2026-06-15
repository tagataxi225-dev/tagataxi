import React from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { UniversalChatInterface } from '@/components/chat/UniversalChatInterface';
import { useVendorChat } from '@/hooks/useVendorChat';

interface ChatVendorModalProps {
  open: boolean;
  onClose: () => void;
}

export const ChatVendorModal: React.FC<ChatVendorModalProps> = ({
  open,
  onClose
}) => {
  const { totalUnread } = useVendorChat();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl h-[80vh] p-0 flex flex-col">
        <DialogHeader className="p-4 pb-2 flex-shrink-0 border-b border-border/30">
          <div className="flex items-center gap-3">
            <DialogTitle className="text-base font-semibold">Messages clients</DialogTitle>
            {totalUnread > 0 && (
              <Badge variant="destructive" className="rounded-full px-2 py-0.5 text-xs">
                {totalUnread} non lu{totalUnread > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0">
          <UniversalChatInterface
            contextType="marketplace"
            isFloating={false}
            hideHeader={true}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
