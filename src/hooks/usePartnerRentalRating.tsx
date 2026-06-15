import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export const usePartnerRentalRating = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const submitPartnerRating = async (
    partnerId: string,
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

    setLoading(true);
    try {
      // Vérifier si l'utilisateur a déjà noté ce partenaire
      const { data: existing } = await supabase
        .from('partner_ratings')
        .select('id')
        .eq('partner_id', partnerId)
        .eq('client_id', user.id)
        .maybeSingle();

      if (existing) {
        toast.error('Vous avez déjà noté cette agence');
        return false;
      }

      // Insérer la notation dans la table partner_ratings
      const { error } = await supabase
        .from('partner_ratings')
        .insert({
          partner_id: partnerId,
          client_id: user.id,
          rating: rating,
          comment: comment?.trim() || null
        });

      if (error) throw error;

      return true;
    } catch (error: any) {
      console.error('Error submitting partner rating:', error);
      toast.error('Erreur lors de la notation');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getPartnerRatingStats = async (partnerId: string) => {
    try {
      const { data: ratings, error } = await supabase
        .from('partner_ratings')
        .select('rating')
        .eq('partner_id', partnerId);

      if (error) throw error;

      if (!ratings || ratings.length === 0) {
        return {
          total_ratings: 0,
          avg_rating: 0,
          five_star: 0,
          four_star: 0,
          three_star: 0,
          two_star: 0,
          one_star: 0
        };
      }

      const total = ratings.length;
      const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
      const avg = sum / total;

      const distribution = {
        five_star: ratings.filter(r => r.rating === 5).length,
        four_star: ratings.filter(r => r.rating === 4).length,
        three_star: ratings.filter(r => r.rating === 3).length,
        two_star: ratings.filter(r => r.rating === 2).length,
        one_star: ratings.filter(r => r.rating === 1).length
      };

      return {
        total_ratings: total,
        avg_rating: avg,
        ...distribution
      };
    } catch (error) {
      console.error('Error fetching partner rating stats:', error);
      return {
        total_ratings: 0,
        avg_rating: 0,
        five_star: 0,
        four_star: 0,
        three_star: 0,
        two_star: 0,
        one_star: 0
      };
    }
  };

  const hasUserRated = async (partnerId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data } = await supabase
        .from('partner_ratings')
        .select('id')
        .eq('partner_id', partnerId)
        .eq('client_id', user.id)
        .maybeSingle();

      return !!data;
    } catch (error) {
      console.error('Error checking if user has rated:', error);
      return false;
    }
  };

  const deletePartnerRating = async (partnerId: string): Promise<boolean> => {
    if (!user) {
      toast.error('Vous devez être connecté');
      return false;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('partner_ratings')
        .delete()
        .eq('partner_id', partnerId)
        .eq('client_id', user.id);

      if (error) throw error;

      toast.success('Votre avis a été retiré');
      return true;
    } catch (error: any) {
      console.error('Error deleting partner rating:', error);
      toast.error('Erreur lors de la suppression');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    submitPartnerRating,
    deletePartnerRating,
    getPartnerRatingStats,
    hasUserRated,
    loading
  };
};
