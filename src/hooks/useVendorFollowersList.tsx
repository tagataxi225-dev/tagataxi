import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface VendorFollower {
  id: string;
  follower_id: string;
  created_at: string;
  follower?: {
    id: string;
    display_name?: string;
    profile_photo_url?: string;
    phone?: string;
  };
}

export const useVendorFollowersList = () => {
  const { user } = useAuth();
  const [followers, setFollowers] = useState<VendorFollower[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalFollowers, setTotalFollowers] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadFollowers();
    }
  }, [user]);

  const loadFollowers = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // TODO: Implémenter la table vendor_followers dans Supabase
      // Pour l'instant, retourner des données vides
      setFollowers([]);
      setTotalFollowers(0);

      // Code à utiliser quand la table sera créée:
      /*
      const { data, error, count } = await supabase
        .from('vendor_followers')
        .select(`
          *,
          follower:profiles!vendor_followers_follower_id_fkey(
            id,
            display_name,
            profile_photo_url,
            phone
          )
        `, { count: 'exact' })
        .eq('vendor_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setFollowers(data || []);
      setTotalFollowers(count || 0);
      */
    } catch (err) {
      console.error('Error loading followers:', err);
      setError('Impossible de charger les followers');
    } finally {
      setLoading(false);
    }
  };

  const refreshFollowers = () => {
    loadFollowers();
  };

  return {
    followers,
    loading,
    totalFollowers,
    error,
    refreshFollowers
  };
};
