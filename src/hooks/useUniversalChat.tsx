import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { pushNotificationService } from '@/services/pushNotificationService';
import { toast } from 'sonner';

export interface UniversalConversation {
  id: string;
  context_type: 'transport' | 'delivery' | 'marketplace' | 'rental' | 'support';
  context_id?: string;
  participant_1: string;
  participant_2: string;
  title?: string;
  status: 'active' | 'archived' | 'closed';
  metadata: any;
  created_at: string;
  updated_at: string;
  last_message_at?: string;
  other_participant?: {
    id: string;
    display_name: string;
    avatar_url?: string;
    shop_name?: string;
    shop_logo_url?: string;
  };
  unread_count?: number;
  last_message?: {
    content: string;
    message_type: 'text' | 'location' | 'image' | 'file' | 'quick_action';
    sender_id: string;
    is_read: boolean;
  };
  product_info?: {
    id: string;
    title: string;
    image: string;
    price: number;
  };
}

export interface UniversalMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'location' | 'image' | 'file' | 'quick_action';
  metadata: any;
  attachments: any[];
  is_read: boolean;
  reply_to_id?: string;
  reply_to?: UniversalMessage;
  created_at: string;
  updated_at: string;
  sender?: {
    id: string;
    display_name: string;
    avatar_url?: string;
    shop_name?: string;
    shop_logo_url?: string;
  };
  // Optimistic UI states
  status?: 'sending' | 'sent' | 'read' | 'error';
  tempId?: string;
}

const MESSAGES_PER_PAGE = 50;

export const useUniversalChat = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<UniversalConversation[]>([]);
  const [messages, setMessages] = useState<{ [conversationId: string]: UniversalMessage[] }>({});
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState<{ [conversationId: string]: boolean }>({});
  const [hasMore, setHasMore] = useState<{ [conversationId: string]: boolean }>({});
  const [sendingMessages, setSendingMessages] = useState<Set<string>>(new Set());
  const profilesCacheRef = useRef<{ [userId: string]: any }>({});

  // Fetch profiles with caching - prioritize vendor profiles for marketplace
  const fetchProfiles = useCallback(async (userIds: string[]) => {
    const uncachedIds = userIds.filter(id => id && !profilesCacheRef.current[id]);
    
    if (uncachedIds.length > 0) {
      try {
        const [{ data: profiles, error: profilesError }, { data: vendorProfiles, error: vendorError }] = await Promise.all([
          supabase.from('profiles').select('user_id, display_name, avatar_url').in('user_id', uncachedIds),
          supabase.from('vendor_profiles').select('user_id, shop_name, shop_logo_url').in('user_id', uncachedIds)
        ]);

        if (profilesError) console.warn('Error fetching profiles:', profilesError);
        if (vendorError) console.warn('Error fetching vendor profiles:', vendorError);

        // First load regular profiles
        profiles?.forEach(p => {
          profilesCacheRef.current[p.user_id] = { ...profilesCacheRef.current[p.user_id], ...p };
        });
        // Then overlay vendor profiles (prioritized for marketplace)
        vendorProfiles?.forEach(vp => {
          profilesCacheRef.current[vp.user_id] = { ...profilesCacheRef.current[vp.user_id], ...vp };
        });
      } catch (error) {
        console.error('Error in fetchProfiles:', error);
      }
    }

    return userIds.reduce((acc, id) => {
      acc[id] = profilesCacheRef.current[id] || {};
      return acc;
    }, {} as any);
  }, []);

  const fetchConversations = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Fetch conversations - RLS policy handles soft-delete filtering automatically
      const { data: conversationsData, error } = await supabase
        .from('unified_conversations')
        .select('*')
        .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
        .order('last_message_at', { ascending: false, nullsFirst: false });

      if (error) throw error;
      
      const filteredConversations = conversationsData || [];

      // Fetch unread counts and last messages for each conversation
      const conversationIds = filteredConversations.map(c => c.id);
      
      const [{ data: unreadData }, { data: lastMessagesData }] = await Promise.all([
        supabase
          .from('unified_messages')
          .select('conversation_id, id')
          .in('conversation_id', conversationIds)
          .eq('is_read', false)
          .neq('sender_id', user.id),
        supabase
          .from('unified_messages')
          .select('conversation_id, content, message_type, sender_id, is_read, created_at')
          .in('conversation_id', conversationIds)
          .order('created_at', { ascending: false })
      ]);

      // Count unread per conversation
      const unreadCounts: { [key: string]: number } = {};
      unreadData?.forEach(msg => {
        unreadCounts[msg.conversation_id] = (unreadCounts[msg.conversation_id] || 0) + 1;
      });

      // Get last message per conversation
      const lastMessages: { [key: string]: any } = {};
      lastMessagesData?.forEach(msg => {
        if (!lastMessages[msg.conversation_id]) {
          lastMessages[msg.conversation_id] = msg;
        }
      });

      // Fetch participant profiles
      const participantIds = [...new Set(
        conversationsData?.flatMap(conv => [conv.participant_1, conv.participant_2]) || []
      )].filter(id => id !== user.id);

      const profiles = await fetchProfiles(participantIds);

      // Fetch product info for marketplace conversations with context_id
      const marketplaceContextIds = filteredConversations
        .filter(c => c.context_type === 'marketplace' && c.context_id)
        .map(c => c.context_id as string);

      let productInfoMap: { [id: string]: { id: string; title: string; image: string; price: number } } = {};
      if (marketplaceContextIds.length > 0) {
        const { data: products } = await supabase
          .from('marketplace_products')
          .select('id, title, images, price')
          .in('id', marketplaceContextIds);
        
        products?.forEach(p => {
          const images = Array.isArray(p.images) ? p.images : [];
          productInfoMap[p.id] = {
            id: p.id,
            title: p.title,
            image: (images[0] as string) || '/placeholder.svg',
            price: p.price,
          };
        });
      }

      const enrichedConversations = filteredConversations.map(conv => {
        const otherParticipantId = conv.participant_1 === user.id ? conv.participant_2 : conv.participant_1;
        const profile = profiles[otherParticipantId] || {};
        const lastMsg = lastMessages[conv.id];
        const productInfo = conv.context_id ? productInfoMap[conv.context_id] : undefined;
        
        return {
          id: conv.id,
          context_type: conv.context_type as UniversalConversation['context_type'],
          context_id: conv.context_id,
          participant_1: conv.participant_1,
          participant_2: conv.participant_2,
          title: conv.title,
          status: conv.status as UniversalConversation['status'],
          metadata: conv.metadata,
          created_at: conv.created_at,
          updated_at: conv.updated_at,
          last_message_at: conv.last_message_at,
          other_participant: {
            id: otherParticipantId,
            display_name: profile.shop_name || profile.display_name || 'Utilisateur',
            avatar_url: profile.shop_logo_url || profile.avatar_url,
            shop_name: profile.shop_name,
            shop_logo_url: profile.shop_logo_url,
          },
          unread_count: unreadCounts[conv.id] || 0,
          last_message: lastMsg ? {
            content: lastMsg.content,
            message_type: lastMsg.message_type,
            sender_id: lastMsg.sender_id,
            is_read: lastMsg.is_read,
          } : undefined,
          product_info: productInfo,
        } as UniversalConversation;
      }) || [];

      setConversations(enrichedConversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  }, [user, fetchProfiles]);

  const fetchMessages = useCallback(async (conversationId: string, loadMore = false) => {
    if (!user) return;

    const currentMessages = messages[conversationId] || [];
    const offset = loadMore ? currentMessages.filter(m => !m.tempId).length : 0;

    if (loadMore) {
      setLoadingMore(prev => ({ ...prev, [conversationId]: true }));
    }

    try {
      const { data: messagesData, error } = await supabase
        .from('unified_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .range(offset, offset + MESSAGES_PER_PAGE - 1);

      if (error) throw error;

      // Reverse to get chronological order
      const chronologicalMessages = [...(messagesData || [])].reverse();

      // Check if there are more messages
      setHasMore(prev => ({
        ...prev,
        [conversationId]: (messagesData?.length || 0) === MESSAGES_PER_PAGE
      }));

      // Fetch sender profiles
      const senderIds = [...new Set(chronologicalMessages.map(msg => msg.sender_id))];
      const profiles = await fetchProfiles(senderIds);

      // Fetch reply_to messages if any
      const replyToIds = chronologicalMessages
        .filter(msg => msg.reply_to_id)
        .map(msg => msg.reply_to_id);
      
      let replyToMessages: { [id: string]: any } = {};
      if (replyToIds.length > 0) {
        const { data: replyData } = await supabase
          .from('unified_messages')
          .select('*')
          .in('id', replyToIds);
        
        replyData?.forEach(msg => {
          replyToMessages[msg.id] = msg;
        });
      }

      const enrichedMessages: UniversalMessage[] = chronologicalMessages.map(msg => {
        const profile = profiles[msg.sender_id] || {};
        const replyTo = msg.reply_to_id ? replyToMessages[msg.reply_to_id] : undefined;
        
        return {
          id: msg.id,
          conversation_id: msg.conversation_id,
          sender_id: msg.sender_id,
          content: msg.content,
          message_type: msg.message_type as UniversalMessage['message_type'],
          metadata: msg.metadata,
          attachments: Array.isArray(msg.attachments) ? msg.attachments : [],
          is_read: msg.is_read,
          reply_to_id: msg.reply_to_id,
          reply_to: replyTo ? {
            ...replyTo,
            message_type: replyTo.message_type as UniversalMessage['message_type'],
            attachments: Array.isArray(replyTo.attachments) ? replyTo.attachments : [],
            sender: profiles[replyTo.sender_id] || {}
          } as UniversalMessage : undefined,
          created_at: msg.created_at,
          updated_at: msg.updated_at,
          sender: {
            id: msg.sender_id,
            display_name: profile.display_name || 'Utilisateur',
            avatar_url: profile.avatar_url,
            shop_name: profile.shop_name,
            shop_logo_url: profile.shop_logo_url,
          },
          status: (msg.is_read ? 'read' : 'sent') as UniversalMessage['status'],
        };
      });

      setMessages(prev => {
        if (loadMore) {
          // Prepend older messages
          const existingMessages = prev[conversationId] || [];
          return {
            ...prev,
            [conversationId]: [...enrichedMessages, ...existingMessages.filter(m => !enrichedMessages.find(e => e.id === m.id))],
          };
        }
        return {
          ...prev,
          [conversationId]: enrichedMessages,
        };
      });

      // Mark messages as read
      if (!loadMore) {
        await markMessagesAsRead(conversationId);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      if (loadMore) {
        setLoadingMore(prev => ({ ...prev, [conversationId]: false }));
      }
    }
  }, [user, messages, fetchProfiles]);

  const loadMoreMessages = useCallback((conversationId: string) => {
    if (loadingMore[conversationId] || !hasMore[conversationId]) return;
    fetchMessages(conversationId, true);
  }, [fetchMessages, loadingMore, hasMore]);

  const markMessagesAsRead = useCallback(async (conversationId: string) => {
    if (!user) return;

    try {
      await supabase
        .from('unified_messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', user.id);
      
      // Update local state
      setMessages(prev => ({
        ...prev,
        [conversationId]: (prev[conversationId] || []).map(msg => ({
          ...msg,
          is_read: true,
          status: 'read' as const
        }))
      }));
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }, [user]);

  // Optimistic send message
  const sendMessage = useCallback(async (
    conversationId: string,
    content: string,
    messageType: 'text' | 'location' | 'image' | 'file' | 'quick_action' = 'text',
    metadata: any = {},
    attachments: any[] = [],
    replyToId?: string
  ) => {
    if (!user || !content.trim()) return;

    const tempId = `temp-${Date.now()}-${Math.random()}`;
    
    // Optimistic message
    const optimisticMessage: UniversalMessage = {
      id: tempId,
      tempId,
      conversation_id: conversationId,
      sender_id: user.id,
      content: content.trim(),
      message_type: messageType,
      metadata,
      attachments,
      is_read: false,
      reply_to_id: replyToId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      sender: {
        id: user.id,
        display_name: 'Moi',
      },
      status: 'sending',
    };

    // Add optimistic message immediately
    setMessages(prev => ({
      ...prev,
      [conversationId]: [...(prev[conversationId] || []), optimisticMessage],
    }));

    setSendingMessages(prev => new Set([...prev, tempId]));

    try {
      const { data, error } = await supabase
        .from('unified_messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: content.trim(),
          message_type: messageType,
          metadata,
          attachments,
          reply_to_id: replyToId,
        })
        .select()
        .single();

      if (error) throw error;

      // Replace optimistic message with real one
      setMessages(prev => ({
        ...prev,
        [conversationId]: (prev[conversationId] || []).map(msg =>
          msg.tempId === tempId
            ? { 
                ...msg, 
                id: data.id,
                created_at: data.created_at,
                updated_at: data.updated_at,
                status: 'sent' as const, 
                tempId: undefined 
              }
            : msg
        ),
      }));

      // Update conversation's last_message_at
      await supabase
        .from('unified_conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);

      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Mark message as error
      setMessages(prev => ({
        ...prev,
        [conversationId]: (prev[conversationId] || []).map(msg =>
          msg.tempId === tempId
            ? { ...msg, status: 'error' as const }
            : msg
        ),
      }));
      
      throw error;
    } finally {
      setSendingMessages(prev => {
        const next = new Set(prev);
        next.delete(tempId);
        return next;
      });
    }
  }, [user]);

  // Retry failed message
  const retryMessage = useCallback(async (conversationId: string, tempId: string) => {
    const failedMessage = messages[conversationId]?.find(m => m.tempId === tempId);
    if (!failedMessage) return;

    // Remove failed message
    setMessages(prev => ({
      ...prev,
      [conversationId]: (prev[conversationId] || []).filter(m => m.tempId !== tempId),
    }));

    // Resend
    await sendMessage(
      conversationId,
      failedMessage.content,
      failedMessage.message_type,
      failedMessage.metadata,
      failedMessage.attachments,
      failedMessage.reply_to_id
    );
  }, [messages, sendMessage]);

  const createOrFindConversation = useCallback(async (
    contextType: 'transport' | 'delivery' | 'marketplace' | 'rental' | 'support',
    participantId: string,
    contextId?: string,
    title?: string,
    metadata: any = {}
  ) => {
    if (!user) return null;

    if (participantId === user.id) {
      console.error('Cannot create conversation with yourself');
      throw new Error('Impossible de créer une conversation avec vous-même');
    }

    try {
      let query = supabase
        .from('unified_conversations')
        .select('*')
        .eq('context_type', contextType)
        .or(`and(participant_1.eq.${user.id},participant_2.eq.${participantId}),and(participant_1.eq.${participantId},participant_2.eq.${user.id})`);
      query = contextId ? query.eq('context_id', contextId) : query.is('context_id', null);
      const { data: existing } = await query.maybeSingle();

      if (existing) {
        return existing;
      }

      const { data, error } = await supabase
        .from('unified_conversations')
        .insert({
          context_type: contextType,
          context_id: contextId,
          participant_1: user.id,
          participant_2: participantId,
          title,
          metadata,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating/finding conversation:', error);
      throw error;
    }
  }, [user]);

  const sendLocationMessage = useCallback(async (conversationId: string) => {
    try {
      const { nativeGeolocationService } = await import('@/services/nativeGeolocationService');
      const position = await nativeGeolocationService.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000
      });

      const locationData = {
        latitude: position.lat,
        longitude: position.lng,
        accuracy: position.accuracy,
        timestamp: new Date().toISOString(),
      };

      return await sendMessage(
        conversationId,
        'Position partagée',
        'location',
        locationData
      );
    } catch (error) {
      throw new Error('Impossible d\'obtenir la position');
    }
  }, [sendMessage]);

  const sendImageMessage = useCallback(async (
    conversationId: string,
    imageUrl: string,
    caption?: string
  ) => {
    return sendMessage(
      conversationId,
      caption || '📷 Photo',
      'image',
      { imageUrl },
      [{ type: 'image', url: imageUrl }]
    );
  }, [sendMessage]);

  // Real-time subscriptions
  useEffect(() => {
    if (!user) return;

    const conversationsChannel = supabase
      .channel('unified_conversations_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'unified_conversations' },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    const messagesChannel = supabase
      .channel('unified_messages_changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'unified_messages' },
        async (payload) => {
          const newMessage = payload.new as any;
          
          // Don't add if it's our own optimistic message
          if (newMessage.sender_id === user.id) {
            return;
          }

          // Fetch sender profile
          const profiles = await fetchProfiles([newMessage.sender_id]);
          const profile = profiles[newMessage.sender_id] || {};

          const enrichedMessage: UniversalMessage = {
            id: newMessage.id,
            conversation_id: newMessage.conversation_id,
            sender_id: newMessage.sender_id,
            content: newMessage.content,
            message_type: newMessage.message_type,
            metadata: newMessage.metadata,
            attachments: newMessage.attachments || [],
            is_read: newMessage.is_read,
            reply_to_id: newMessage.reply_to_id,
            created_at: newMessage.created_at,
            updated_at: newMessage.updated_at,
            sender: {
              id: newMessage.sender_id,
              display_name: profile.display_name || 'Utilisateur',
              avatar_url: profile.avatar_url,
              shop_name: profile.shop_name,
              shop_logo_url: profile.shop_logo_url,
            },
            status: 'sent',
          };

          setMessages(prev => ({
            ...prev,
            [newMessage.conversation_id]: [
              ...(prev[newMessage.conversation_id] || []),
              enrichedMessage,
            ],
          }));
          
          // 🔔 Notification push pour nouveau message
          const senderName = profile.shop_name || profile.display_name || 'Nouveau message';
          const messagePreview = newMessage.content?.length > 50 
            ? newMessage.content.substring(0, 50) + '...' 
            : newMessage.content || 'Nouveau message';

          // Notification push navigateur
          pushNotificationService.showNotification(
            `💬 ${senderName}`,
            {
              body: messagePreview,
              tag: `chat-${newMessage.conversation_id}`,
              data: { 
                conversationId: newMessage.conversation_id,
                url: '/marketplace?tab=messages'
              }
            }
          );

          // Toast in-app
          toast.info(`💬 ${senderName}`, {
            description: messagePreview,
            action: {
              label: 'Voir',
              onClick: () => {
                window.location.href = '/client?tab=messages';
              }
            }
          });

          // Mettre à jour le badge de la page
          pushNotificationService.updatePageBadge(1);
          
          fetchConversations();
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'unified_messages' },
        (payload) => {
          const updatedMessage = payload.new as any;
          
          setMessages(prev => ({
            ...prev,
            [updatedMessage.conversation_id]: (prev[updatedMessage.conversation_id] || []).map(msg =>
              msg.id === updatedMessage.id
                ? { ...msg, is_read: updatedMessage.is_read, status: updatedMessage.is_read ? 'read' : 'sent' }
                : msg
            ),
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(conversationsChannel);
      supabase.removeChannel(messagesChannel);
    };
  }, [user, fetchConversations, fetchProfiles]);

  // Initial fetch
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const createConversationFromBooking = useCallback(async (
    bookingId: string,
    bookingType: 'transport' | 'delivery'
  ) => {
    if (!user) {
      console.error('User not authenticated');
      return null;
    }

    try {
      const tableName = bookingType === 'transport' ? 'transport_bookings' : 'delivery_orders';
      const { data: booking, error: bookingError } = await supabase
        .from(tableName)
        .select('id, user_id, driver_id')
        .eq('id', bookingId)
        .single();

      if (bookingError || !booking) {
        console.error('Error fetching booking:', bookingError);
        return null;
      }

      const otherParticipantId = user.id === booking.user_id 
        ? booking.driver_id 
        : booking.user_id;

      if (!otherParticipantId) {
        console.error('No other participant found');
        return null;
      }

      return await createOrFindConversation(
        bookingType,
        otherParticipantId,
        bookingId,
        `${bookingType === 'transport' ? 'Course' : 'Livraison'} #${bookingId.slice(0, 8)}`
      );
    } catch (error) {
      console.error('Error creating conversation from booking:', error);
      return null;
    }
  }, [user, createOrFindConversation]);

  // Supprimer une conversation (soft delete pour l'utilisateur courant)
  const deleteConversation = useCallback(async (conversationId: string) => {
    if (!user) return false;

    const conversation = conversations.find(c => c.id === conversationId);
    if (!conversation) return false;

    try {
      const isParticipant1 = conversation.participant_1 === user.id;
      const updateField = isParticipant1 ? 'deleted_by_participant_1' : 'deleted_by_participant_2';

      const { error } = await supabase
        .from('unified_conversations')
        .update({ [updateField]: true })
        .eq('id', conversationId);

      if (error) throw error;

      // Mettre à jour l'état local
      setConversations(prev => prev.filter(c => c.id !== conversationId));
      toast.success('Conversation supprimée');
      return true;
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast.error('Erreur lors de la suppression');
      return false;
    }
  }, [user, conversations]);

  return {
    conversations,
    messages,
    loading,
    loadingMore,
    hasMore,
    sendingMessages,
    fetchConversations,
    fetchMessages,
    loadMoreMessages,
    sendMessage,
    sendLocationMessage,
    sendImageMessage,
    retryMessage,
    createOrFindConversation,
    createConversationFromBooking,
    markMessagesAsRead,
    deleteConversation,
  };
};
