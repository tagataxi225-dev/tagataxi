import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useVendorFollowers = (vendorId: string) => {
  const { user } = useAuth();
  const [followerCount, setFollowerCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFollowerData();
  }, [vendorId, user]);

  const loadFollowerData = async () => {
    try {
      setLoading(true);

      // Get follower count
      const { count, error: countError } = await supabase
        .from('vendor_followers')
        .select('*', { count: 'exact', head: true })
        .eq('vendor_id', vendorId)
        .eq('is_active', true);

      if (!countError) {
        setFollowerCount(count || 0);
      }

      // Check if current user is following
      if (user) {
        const { data, error: followError } = await supabase
          .from('vendor_followers')
          .select('is_active')
          .eq('vendor_id', vendorId)
          .eq('user_id', user.id)
          .single();

        if (!followError && data) {
          setIsFollowing(data.is_active);
        }
      }
    } catch (error) {
      console.error('Error loading follower data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFollow = async () => {
    if (!user) return;

    const newState = !isFollowing;
    setIsFollowing(newState);
    setFollowerCount(prev => prev + (newState ? 1 : -1));

    try {
      const { error } = await supabase
        .from('vendor_followers')
        .upsert({
          vendor_id: vendorId,
          user_id: user.id,
          is_active: newState
        });

      if (error) throw error;
    } catch (error) {
      // Revert on error
      setIsFollowing(!newState);
      setFollowerCount(prev => prev + (newState ? -1 : 1));
      throw error;
    }
  };

  return {
    followerCount,
    isFollowing,
    loading,
    toggleFollow
  };
};
