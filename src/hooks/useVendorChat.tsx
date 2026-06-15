import { useMemo } from 'react';
import { useUniversalChat } from './useUniversalChat';

export const useVendorChat = () => {
  const { conversations, loading } = useUniversalChat();

  const marketplaceConversations = useMemo(() => {
    return conversations.filter(conv => conv.context_type === 'marketplace');
  }, [conversations]);

  const totalUnread = useMemo(() => {
    return marketplaceConversations.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);
  }, [marketplaceConversations]);

  const activeConversations = useMemo(() => {
    return marketplaceConversations.filter(conv => conv.status === 'active');
  }, [marketplaceConversations]);

  return {
    conversations: marketplaceConversations,
    loading,
    totalUnread,
    activeConversations,
  };
};
