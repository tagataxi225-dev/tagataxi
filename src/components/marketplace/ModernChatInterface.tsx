import React from 'react';
import { UniversalChatInterface } from '@/components/chat/UniversalChatInterface';

interface ModernChatInterfaceProps {
  productId?: string;
  sellerId?: string;
  isFloating?: boolean;
  isCompact?: boolean;
  onClose?: () => void;
}

export const ModernChatInterface: React.FC<ModernChatInterfaceProps> = ({
  productId,
  sellerId,
  isFloating = false,
  isCompact = false,
  onClose
}) => {
  return (
    <UniversalChatInterface
      contextType="marketplace"
      contextId={productId}
      participantId={sellerId}
      isFloating={isFloating}
      onClose={onClose}
    />
  );
};
