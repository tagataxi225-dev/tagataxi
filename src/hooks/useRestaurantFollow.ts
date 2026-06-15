import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export const useRestaurantFollow = (restaurantId: string) => {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && restaurantId) {
      checkFollowStatus();
      loadFollowersCount();
    }
  }, [user, restaurantId]);

  const checkFollowStatus = async () => {
    if (!user) return;
    
    try {
      const { data } = await supabase
        .from('restaurant_followers')
        .select('id')
        .eq('restaurant_id', restaurantId)
        .eq('follower_id', user.id)
        .maybeSingle();
      
      setIsFollowing(!!data);
    } catch (error) {
      console.error('Error checking follow status:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFollowersCount = async () => {
    try {
      const { count } = await supabase
        .from('restaurant_followers')
        .select('*', { count: 'exact', head: true })
        .eq('restaurant_id', restaurantId);
      
      setFollowersCount(count || 0);
    } catch (error) {
      console.error('Error loading followers count:', error);
    }
  };

  const toggleFollow = async () => {
    if (!user) {
      toast.error('Connectez-vous pour suivre ce restaurant');
      return;
    }

    try {
      if (isFollowing) {
        await supabase
          .from('restaurant_followers')
          .delete()
          .eq('restaurant_id', restaurantId)
          .eq('follower_id', user.id);
        
        setIsFollowing(false);
        setFollowersCount(prev => Math.max(0, prev - 1));
        toast.success('Restaurant retiré de vos favoris');
      } else {
        await supabase
          .from('restaurant_followers')
          .insert({
            restaurant_id: restaurantId,
            follower_id: user.id
          });
        
        setIsFollowing(true);
        setFollowersCount(prev => prev + 1);
        toast.success('🎉 Restaurant ajouté à vos favoris !');
      }
    } catch (error) {
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
