import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

type ReactionType = 'like' | 'dislike';

interface ReactionCounts {
  likes: number;
  dislikes: number;
}

interface UseProductReactionsReturn {
  counts: ReactionCounts;
  userReaction: ReactionType | null;
  toggleReaction: (reaction: ReactionType) => void;
  loading: boolean;
}

export const useProductReactions = (
  productId: string | undefined,
  productType: 'marketplace' | 'food'
): UseProductReactionsReturn => {
  const { user } = useAuth();
  const [counts, setCounts] = useState<ReactionCounts>({ likes: 0, dislikes: 0 });
  const [userReaction, setUserReaction] = useState<ReactionType | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch counts + user reaction
  useEffect(() => {
    if (!productId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch all reactions for this product
        const { data, error } = await supabase
          .from('product_reactions')
          .select('reaction, user_id')
          .eq('product_id', productId)
          .eq('product_type', productType);

        if (error) {
          console.error('Error fetching reactions:', error);
          return;
        }

        const likes = (data || []).filter(r => r.reaction === 'like').length;
        const dislikes = (data || []).filter(r => r.reaction === 'dislike').length;
        setCounts({ likes, dislikes });

        // Find user's reaction
        if (user) {
          const userRow = (data || []).find(r => r.user_id === user.id);
          setUserReaction(userRow ? (userRow.reaction as ReactionType) : null);
        } else {
          setUserReaction(null);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [productId, productType, user]);

  const toggleReaction = useCallback(async (reaction: ReactionType) => {
    if (!productId) return;

    if (!user) {
      toast.error('Connectez-vous pour réagir', {
        action: {
          label: 'Connexion',
          onClick: () => { window.location.href = '/app/auth'; }
        }
      });
      return;
    }

    // Optimistic update
    const prevCounts = { ...counts };
    const prevReaction = userReaction;

    if (userReaction === reaction) {
      // Remove reaction
      setUserReaction(null);
      setCounts(c => ({
        likes: reaction === 'like' ? c.likes - 1 : c.likes,
        dislikes: reaction === 'dislike' ? c.dislikes - 1 : c.dislikes,
      }));

      const { error } = await supabase
        .from('product_reactions')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .eq('product_type', productType);

      if (error) {
        setCounts(prevCounts);
        setUserReaction(prevReaction);
        console.error('Error removing reaction:', error);
      }
    } else {
      // Upsert reaction
      setUserReaction(reaction);
      setCounts(c => {
        const newCounts = { ...c };
        // Add new reaction
        if (reaction === 'like') newCounts.likes++;
        else newCounts.dislikes++;
        // Remove old reaction if switching
        if (prevReaction === 'like') newCounts.likes--;
        else if (prevReaction === 'dislike') newCounts.dislikes--;
        return newCounts;
      });

      const { error } = await supabase
        .from('product_reactions')
        .upsert({
          user_id: user.id,
          product_id: productId,
          product_type: productType,
          reaction,
        }, { onConflict: 'user_id,product_id,product_type' });

      if (error) {
        setCounts(prevCounts);
        setUserReaction(prevReaction);
        console.error('Error upserting reaction:', error);
      }
    }
  }, [productId, productType, user, counts, userReaction]);

  return { counts, userReaction, toggleReaction, loading };
};
