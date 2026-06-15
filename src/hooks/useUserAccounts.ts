import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface UserAccount {
  id: string;
  linked_email: string;
  display_name: string | null;
  avatar_url: string | null;
  is_active: boolean;
  last_accessed_at: string | null;
}

export const useUserAccounts = () => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeAccount, setActiveAccount] = useState<UserAccount | null>(null);

  useEffect(() => {
    if (user) {
      loadAccounts();
    }
  }, [user]);

  const loadAccounts = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('user_accounts')
        .select('*')
        .eq('primary_user_id', user.id)
        .order('last_accessed_at', { ascending: false });

      if (error) throw error;

      setAccounts(data || []);
      
      const active = data?.find(acc => acc.is_active);
      setActiveAccount(active || null);
    } catch (error) {
      console.error('Error loading accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const switchAccount = async (accountId: string) => {
    if (!user?.id) return { success: false };

    try {
      await supabase
        .from('user_accounts')
        .update({ is_active: false })
        .eq('primary_user_id', user.id);

      await supabase
        .from('user_accounts')
        .update({ 
          is_active: true,
          last_accessed_at: new Date().toISOString()
        })
        .eq('id', accountId);

      await loadAccounts();
      return { success: true };
    } catch (error) {
      console.error('Error switching account:', error);
      return { success: false, error };
    }
  };

  const addAccount = async (email: string, displayName?: string) => {
    if (!user?.id) return { success: false };

    try {
      const { data, error } = await supabase
        .from('user_accounts')
        .insert({
          primary_user_id: user.id,
          linked_email: email,
          display_name: displayName || email,
          is_active: false
        })
        .select()
        .single();

      if (error) throw error;

      await loadAccounts();
      return { success: true, data };
    } catch (error) {
      console.error('Error adding account:', error);
      return { success: false, error };
    }
  };

  const removeAccount = async (accountId: string) => {
    try {
      const { error } = await supabase
        .from('user_accounts')
        .delete()
        .eq('id', accountId);

      if (error) throw error;

      await loadAccounts();
      return { success: true };
    } catch (error) {
      console.error('Error removing account:', error);
      return { success: false, error };
    }
  };

  return {
    accounts,
    activeAccount,
    loading,
    switchAccount,
    addAccount,
    removeAccount,
    refreshAccounts: loadAccounts
  };
};
