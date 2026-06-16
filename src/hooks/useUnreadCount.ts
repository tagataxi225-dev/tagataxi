import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from './useAuth';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://zdoaibbocwqanvmropri.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpkb2FpYmJvY3dxYW52bXJvcHJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1MjY2MjMsImV4cCI6MjA5NzEwMjYyM30.Ai5NTfBhHuQQckMPn5d5mAPzNTo38lJTg-bvs4XgCRk';

export const useUnreadCount = () => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchUnreadCount = useCallback(async () => {
    if (!user?.id || document.hidden) return;

    try {
      const client = createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: false }
      });
      
      const response: any = await client
        .from('system_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (response.count != null) {
        setUnreadCount(response.count as number);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) {
      setUnreadCount(0);
      return;
    }

    fetchUnreadCount();

    // 30s polling with visibility guard
    intervalRef.current = setInterval(fetchUnreadCount, 30000);

    const handleVisibility = () => {
      if (!document.hidden) fetchUnreadCount();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [user?.id, fetchUnreadCount]);

  return { unreadCount };
};

