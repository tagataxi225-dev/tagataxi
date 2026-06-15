import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface Conversation {
  id: string;
  product_id: string;
  buyer_id: string;
  seller_id: string;
  status: string;
  created_at: string;
  last_message_at: string;
  product?: {
    title: string;
    price: number;
    images: string[];
  };
  other_participant?: {
    display_name: string;
    avatar_url?: string;
  };
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: string;
  is_read: boolean;
  created_at: string;
  sender?: {
    display_name: string;
    avatar_url?: string;
  };
}

export const useMarketplaceChat = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [loading, setLoading] = useState(true);

  // Fetch conversations
  const fetchConversations = async () => {
    if (!user) return;

    try {
      // ✅ PHASE 4: Corriger le JOIN pour gérer les produits supprimés
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          marketplace_products(title, price, images),
          buyer:profiles!conversations_buyer_id_fkey(display_name, avatar_url),
          seller:profiles!conversations_seller_id_fkey(display_name, avatar_url)
        `)
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false, nullsFirst: false });

      if (error) throw error;

      const formattedConversations = data?.map(conv => ({
        ...conv,
        product: {
          ...conv.marketplace_products,
          images: Array.isArray(conv.marketplace_products.images) 
            ? conv.marketplace_products.images as string[] 
            : []
        },
        other_participant: {
          display_name: user.id === conv.buyer_id ? 'Vendeur' : 'Acheteur',
          avatar_url: undefined
        }
      })) || [];

      setConversations(formattedConversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  // Fetch messages for a conversation
  const fetchMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const formattedMessages = data?.map(msg => ({
        ...msg,
        sender: {
          display_name: 'Utilisateur',
          avatar_url: undefined
        }
      })) || [];

      setMessages(prev => ({
        ...prev,
        [conversationId]: formattedMessages
      }));

      // Mark messages as read
      if (data && data.length > 0) {
        await supabase
          .from('messages')
          .update({ is_read: true })
          .eq('conversation_id', conversationId)
          .neq('sender_id', user?.id);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  // Send a message
  const sendMessage = async (conversationId: string, content: string) => {
    if (!user || !content.trim()) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: content.trim(),
          message_type: 'text'
        });

      if (error) throw error;

      // Update conversation last message time
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);

      // Refresh messages
      fetchMessages(conversationId);
      fetchConversations();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Update conversation status
  const updateConversationStatus = async (
    conversationId: string, 
    status: 'active' | 'waiting' | 'completed'
  ) => {
    const { error } = await supabase
      .from('conversations')
      .update({ 
        status, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', conversationId);

    if (!error) {
      fetchConversations();
    }
  };

  // Reopen conversation
  const reopenConversation = async (conversationId: string) => {
    const { error } = await supabase
      .from('conversations')
      .update({ 
        status: 'active',
        last_message_at: new Date().toISOString() 
      })
      .eq('id', conversationId);
    
    if (!error) {
      fetchConversations();
    }
  };

  // Start a conversation
  const startConversation = async (productId: string, sellerId: string) => {
    if (!user || user.id === sellerId) return null;

    try {
      // Check if conversation already exists
      const { data: existing } = await supabase
        .from('conversations')
        .select('id')
        .eq('product_id', productId)
        .eq('buyer_id', user.id)
        .eq('seller_id', sellerId)
        .maybeSingle();

      if (existing) {
        return existing.id;
      }

      // Create new conversation
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          product_id: productId,
          buyer_id: user.id,
          seller_id: sellerId
        })
        .select()
        .single();

      if (error) throw error;

      fetchConversations();
      return data.id;
    } catch (error) {
      console.error('Error starting conversation:', error);
      return null;
    }
  };

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user) return;

    const conversationsChannel = supabase
      .channel('conversations-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'conversations',
        filter: `buyer_id=eq.${user.id}`
      }, () => {
        fetchConversations();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'conversations',
        filter: `seller_id=eq.${user.id}`
      }, () => {
        fetchConversations();
      })
      .subscribe();

    const messagesChannel = supabase
      .channel('messages-changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages'
      }, (payload) => {
        const newMessage = payload.new as Message;
        if (messages[newMessage.conversation_id]) {
          fetchMessages(newMessage.conversation_id);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(conversationsChannel);
      supabase.removeChannel(messagesChannel);
    };
  }, [user, messages]);

  // Initial fetch
  useEffect(() => {
    if (user) {
      fetchConversations().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user]);

  return {
    conversations,
    messages,
    loading,
    fetchMessages,
    sendMessage,
    startConversation,
    updateConversationStatus,
    reopenConversation,
    refetch: fetchConversations
  };
};