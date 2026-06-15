import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export const useRating = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const submitRating = async (params: {
    ratedUserId: string;
    rating: number;
    comment?: string;
    bookingId?: string;
    deliveryId?: string;
  }) => {
    if (!user) { toast.error('Vous devez être connecté'); return false; }
    try {
      setLoading(true);
      const { error } = await supabase.from('user_ratings').insert({
        rater_user_id: user.id,
        rated_user_id: params.ratedUserId,
        rating: params.rating,
        comment: params.comment || null,
        booking_id: params.bookingId || null,
        delivery_id: params.deliveryId || null,
      });
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast.error('Erreur lors de la soumission');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getRatingStats = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_ratings')
        .select('rating')
        .eq('rated_user_id', userId);

      if (error) throw error;

      const total = data?.length || 0;
      const average = total > 0 
        ? data.reduce((sum, r) => sum + r.rating, 0) / total 
        : 0;

      return { total, average };
    } catch (error) {
      console.error('Error getting rating stats:', error);
      return { total: 0, average: 0 };
    }
  };

  return { submitRating, getRatingStats, loading };
};
