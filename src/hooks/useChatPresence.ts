import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useChatPresence = (conversationId?: string, otherUserId?: string) => {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map());
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<any>(null);

  // Track presence for the current user
  useEffect(() => {
    if (!user) return;

    const presenceChannel = supabase.channel('global-presence', {
      config: { presence: { key: user.id } }
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const online = new Set<string>();
        
        Object.keys(state).forEach(key => {
          online.add(key);
        });
        
        setOnlineUsers(online);
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        setOnlineUsers(prev => new Set([...prev, key]));
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        setOnlineUsers(prev => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
        // Also clear typing if user leaves
        setTypingUsers(prev => {
          const next = new Map(prev);
          next.delete(key);
          return next;
        });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            user_id: user.id,
            online_at: new Date().toISOString(),
          });
        }
      });

    channelRef.current = presenceChannel;

    return () => {
      presenceChannel.unsubscribe();
    };
  }, [user]);

  // Listen for typing broadcasts
  useEffect(() => {
    if (!conversationId || !user) return;

    const typingChannel = supabase.channel(`typing:${conversationId}`);

    typingChannel
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload.user_id !== user.id) {
          setTypingUsers(prev => {
            const next = new Map(prev);
            next.set(payload.user_id, payload.user_name || 'Utilisateur');
            return next;
          });

          // Clear typing indicator after 3 seconds
          setTimeout(() => {
            setTypingUsers(prev => {
              const next = new Map(prev);
              next.delete(payload.user_id);
              return next;
            });
          }, 3000);
        }
      })
      .on('broadcast', { event: 'stop_typing' }, ({ payload }) => {
        if (payload.user_id !== user.id) {
          setTypingUsers(prev => {
            const next = new Map(prev);
            next.delete(payload.user_id);
            return next;
          });
        }
      })
      .subscribe();

    return () => {
      typingChannel.unsubscribe();
    };
  }, [conversationId, user]);

  // Broadcast typing indicator (debounced)
  const broadcastTyping = useCallback((userName?: string) => {
    if (!conversationId || !user) return;

    // Clear any existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Broadcast typing
    supabase.channel(`typing:${conversationId}`).send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        user_id: user.id,
        user_name: userName,
        timestamp: Date.now(),
      },
    });

    // Set timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      broadcastStopTyping();
    }, 3000);
  }, [conversationId, user]);

  // Broadcast stop typing
  const broadcastStopTyping = useCallback(() => {
    if (!conversationId || !user) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    supabase.channel(`typing:${conversationId}`).send({
      type: 'broadcast',
      event: 'stop_typing',
      payload: {
        user_id: user.id,
      },
    });
  }, [conversationId, user]);

  // Check if a user is online
  const isUserOnline = useCallback((userId: string) => {
    return onlineUsers.has(userId);
  }, [onlineUsers]);

  // Check if the other user is typing
  const isTyping = otherUserId ? typingUsers.has(otherUserId) : typingUsers.size > 0;

  // Check if the other user is online
  const isOnline = otherUserId ? onlineUsers.has(otherUserId) : false;

  // Get typing users for current conversation (excluding self)
  const getTypingUsers = useCallback(() => {
    return Array.from(typingUsers.entries()).map(([userId, userName]) => ({
      userId,
      userName,
    }));
  }, [typingUsers]);

  return {
    onlineUsers,
    typingUsers,
    isUserOnline,
    getTypingUsers,
    broadcastTyping,
    broadcastStopTyping,
    isTyping,
    isOnline,
  };
};
