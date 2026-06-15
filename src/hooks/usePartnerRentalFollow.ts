import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export const usePartnerRentalFollow = (partnerId: string) => {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && partnerId) {
      checkFollowStatus();
      fetchFollowersCount();
    } else {
      setLoading(false);
    }
  }, [user, partnerId]);

  const checkFollowStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('partner_rental_followers')
        .select('id')
        .eq('partner_id', partnerId)
        .eq('follower_id', user!.id)
        .maybeSingle();

      if (error) throw error;
      setIsFollowing(!!data);
    } catch (error: any) {
      console.error('Error checking follow status:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowersCount = async () => {
    try {
      const { count, error } = await supabase
        .from('partner_rental_followers')
        .select('*', { count: 'exact', head: true })
        .eq('partner_id', partnerId);

      if (error) throw error;
      setFollowersCount(count || 0);
    } catch (error: any) {
      console.error('Error fetching followers count:', error);
    }
  };

  const toggleFollow = async () => {
    if (!user) {
      toast.error('Connectez-vous pour suivre ce partenaire');
      return;
    }

    try {
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('partner_rental_followers')
          .delete()
          .eq('partner_id', partnerId)
          .eq('follower_id', user.id);

        if (error) throw error;

        setIsFollowing(false);
        setFollowersCount(prev => Math.max(0, prev - 1));
        toast.success('Vous ne suivez plus ce partenaire');
      } else {
        // Follow
        const { error } = await supabase
          .from('partner_rental_followers')
          .insert({
            partner_id: partnerId,
            follower_id: user.id
          });

        if (error) throw error;

        setIsFollowing(true);
        setFollowersCount(prev => prev + 1);
        toast.success('Vous suivez maintenant ce partenaire');
      }
    } catch (error: any) {
      console.error('Error toggling follow:', error);
      toast.error('Erreur lors de l\'opération');
    }
  };

  return {
    isFollowing,
    followersCount,
    loading,
    toggleFollow
  };
};
