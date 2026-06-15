import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

/**
 * Hook spécialisé pour les notations de vendeurs
 * Contrairement à useRating qui nécessite un orderId, 
 * ce hook permet de noter directement un vendeur
 */
export const useVendorRating = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const submitVendorRating = async (
    vendorId: string,
    rating: number,
    comment?: string
  ): Promise<boolean> => {
    if (!user) {
      toast.error('Vous devez être connecté pour noter un vendeur');
      return false;
    }

    if (rating < 1 || rating > 5) {
      toast.error('La note doit être entre 1 et 5');
      return false;
    }

    // ✅ PROTECTION: Empêcher un vendeur de se noter lui-même
    if (user.id === vendorId) {
      toast.error('Vous ne pouvez pas noter votre propre boutique 😅');
      return false;
    }

    try {
      setLoading(true);

      // ✅ PHASE 1: Vérifier si l'utilisateur a déjà noté ce vendeur récemment (30 jours)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: existingRating, error: checkError } = await supabase
        .from('marketplace_ratings')
        .select('id, created_at')
        .eq('buyer_id', user.id)
        .eq('seller_id', vendorId)
        .is('order_id', null) // Notation directe sans commande
        .gte('created_at', thirtyDaysAgo.toISOString())
        .maybeSingle();

      if (checkError) {
        console.error('[useVendorRating] Check error:', checkError);
        throw checkError;
      }

      if (existingRating) {
        toast.error('Vous avez déjà noté ce vendeur récemment. Réessayez dans 30 jours.');
        return false;
      }

      // ✅ PHASE 2: Insérer la notation dans marketplace_ratings
      const { error: insertError } = await supabase
        .from('marketplace_ratings')
        .insert({
          buyer_id: user.id,
          seller_id: vendorId,
          rating: rating,
          comment: comment || null,
          order_id: null // Notation directe sans commande
        });

      if (insertError) {
        console.error('[useVendorRating] Insert error:', insertError);
        throw insertError;
      }

      console.log('[useVendorRating] ✅ Rating submitted successfully:', {
        vendorId,
        rating,
        hasComment: !!comment,
        userId: user.id
      });

      toast.success('Merci pour votre avis ! 🌟');
      return true;

    } catch (error: any) {
      console.error('[useVendorRating] Error:', error);
      
      if (error.code === '23505') {
        toast.error('Vous avez déjà noté ce vendeur');
      } else {
        toast.error('Erreur lors de l\'envoi de votre avis');
      }
      
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Récupère les statistiques de notation d'un vendeur
   */
  const getVendorRatingStats = async (vendorId: string) => {
    try {
      const { data, error } = await supabase
        .from('marketplace_ratings')
        .select('rating')
        .eq('seller_id', vendorId);

      if (error) throw error;

      const total = data?.length || 0;
      const average = total > 0 
        ? data.reduce((sum, r) => sum + r.rating, 0) / total 
        : 0;

      return { total, average: Number(average.toFixed(1)) };
    } catch (error) {
      console.error('[useVendorRating] Stats error:', error);
      return { total: 0, average: 0 };
    }
  };

  return { 
    submitVendorRating, 
    getVendorRatingStats, 
    loading 
  };
};
