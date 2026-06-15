import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export const useRestaurantRating = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const submitRestaurantRating = async (
    restaurantOwnerId: string,
    rating: number,
    comment?: string
  ): Promise<boolean> => {
    if (!user) {
      toast.error('Vous devez être connecté pour noter');
      return false;
    }

    if (rating < 1 || rating > 5) {
      toast.error('Note invalide (1-5)');
      return false;
    }

    if (user.id === restaurantOwnerId) {
      toast.error('Vous ne pouvez pas noter votre propre restaurant 😅');
      return false;
    }

    try {
      setLoading(true);

      // Check for existing rating (one per user per restaurant)
      const { data: existing, error: checkError } = await supabase
        .from('user_ratings')
        .select('id')
        .eq('rater_user_id', user.id)
        .eq('rated_user_id', restaurantOwnerId)
        .eq('rating_context', 'restaurant')
        .maybeSingle();

      if (checkError) throw checkError;

      if (existing) {
        // Update existing rating
        const { error: updateError } = await supabase
          .from('user_ratings')
          .update({
            rating,
            comment: comment?.trim() || null,
          })
          .eq('id', existing.id);

        if (updateError) throw updateError;
        toast.success('Votre avis a été mis à jour ! 🌟');
      } else {
        // Insert new rating
        const { error: insertError } = await supabase
          .from('user_ratings')
          .insert({
            rated_user_id: restaurantOwnerId,
            rater_user_id: user.id,
            rating,
            comment: comment?.trim() || null,
            rating_context: 'restaurant',
          });

        if (insertError) throw insertError;
        toast.success('Merci pour votre avis ! 🌟');
      }

      return true;
    } catch (error: any) {
      console.error('[useRestaurantRating] Error:', error);
      toast.error("Erreur lors de l'envoi de votre avis");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getRestaurantRatingStats = async (restaurantOwnerId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_ratings')
        .select('rating')
        .eq('rated_user_id', restaurantOwnerId)
        .eq('rating_context', 'restaurant');

      if (error) throw error;

      const total = data?.length || 0;
      const average = total > 0
        ? data.reduce((sum, r) => sum + r.rating, 0) / total
        : 0;

      return { total, average: Number(average.toFixed(1)) };
    } catch (error) {
      console.error('[useRestaurantRating] Stats error:', error);
      return { total: 0, average: 0 };
    }
  };

  return { submitRestaurantRating, getRestaurantRatingStats, loading };
};
