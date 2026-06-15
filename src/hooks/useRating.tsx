import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface RatingParams {
  ratedUserId: string;
  rating: number;
  comment?: string;
  bookingId?: string;
  deliveryId?: string;
  marketplaceOrderId?: string;
}

interface RatingStats {
  total_ratings: number;
  avg_rating: number;
  positive_ratings: number;
  negative_ratings: number;
  user_id?: string;
}

export const useRating = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const submitRating = async (params: RatingParams): Promise<void> => {
    if (!user) {
      toast.error('Vous devez être connecté pour noter');
      throw new Error('Utilisateur non connecté');
    }

    if (params.rating < 1 || params.rating > 5) {
      toast.error('Note invalide (1-5)');
      throw new Error('Note invalide (1-5)');
    }

    setLoading(true);
    try {
      // Vérifier les doublons
      const checkCol = params.bookingId ? 'booking_id' : params.deliveryId ? 'delivery_id' : null;
      const checkId = params.bookingId || params.deliveryId || null;
      if (checkCol && checkId) {
        const { data: existing } = await supabase
          .from('user_ratings').select('id')
          .eq('rater_user_id', user.id).eq(checkCol, checkId).maybeSingle();
        if (existing) { toast.info('Déjà noté'); return; }
      }

      // Insérer la notation
      const { error } = await supabase
        .from('user_ratings')
        .insert({
          rated_user_id: params.ratedUserId,
          rater_user_id: user.id,
          rating: params.rating,
          comment: params.comment?.trim() || null,
          booking_id: params.bookingId || null,
          delivery_id: params.deliveryId || null,
          // marketplace_order_id column does not exist in user_ratings
        });

      if (error) throw error;

      toast.success('Merci pour votre évaluation !');
    } catch (error: any) {
      console.error('Error submitting rating:', error);
      const msg = error?.message || error?.details || JSON.stringify(error);
      if (!msg?.includes('Déjà noté')) {
        toast.error(\`Erreur: \${msg || 'notation impossible'}\`);
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getRatingStats = async (userId: string): Promise<RatingStats> => {
    try {
      const { data, error } = await supabase
        .from('v_user_rating_stats')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;

      return data || {
        total_ratings: 0,
        avg_rating: 0,
        positive_ratings: 0,
        negative_ratings: 0
      };
    } catch (error) {
      console.error('Error fetching rating stats:', error);
      return {
        total_ratings: 0,
        avg_rating: 0,
        positive_ratings: 0,
        negative_ratings: 0
      };
    }
  };

  const canRate = async (
    orderId: string, 
    orderType: 'transport' | 'delivery' | 'marketplace'
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data } = await supabase.rpc('can_rate_order', {
        p_user_id: user.id,
        p_order_id: orderId,
        p_order_type: orderType
      });

      return data || false;
    } catch (error) {
      console.error('Error checking if can rate:', error);
      return false;
    }
  };

  return {
    submitRating,
    getRatingStats,
    canRate,
    loading
  };
};
