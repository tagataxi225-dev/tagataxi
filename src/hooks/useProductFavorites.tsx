import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useProductFavorites = (userId: string | undefined) => {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (userId) {
      loadFavorites();
    } else {
      setFavorites(new Set());
    }
  }, [userId]);

  const loadFavorites = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('vendor_product_favorites')
        .select('product_id')
        .eq('user_id', userId);
      
      if (error) throw error;
      
      setFavorites(new Set(data?.map(f => f.product_id) || []));
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (productId: string) => {
    if (!userId) {
      toast({
        variant: 'destructive',
        title: 'Connexion requise',
        description: 'Connectez-vous pour ajouter des favoris.'
      });
      return;
    }
    
    try {
      const wasFavorite = favorites.has(productId);
      
      if (wasFavorite) {
        // Retirer des favoris
        const { error } = await supabase
          .from('vendor_product_favorites')
          .delete()
          .eq('user_id', userId)
          .eq('product_id', productId);
        
        if (error) throw error;
        
        setFavorites(prev => {
          const next = new Set(prev);
          next.delete(productId);
          return next;
        });
        
        toast({
          title: '💔 Retiré des favoris',
          description: 'Produit retiré de vos favoris.'
        });
      } else {
        // Ajouter aux favoris
        const { error } = await supabase
          .from('vendor_product_favorites')
          .insert({ 
            user_id: userId, 
            product_id: productId 
          });
        
        if (error) throw error;
        
        setFavorites(prev => new Set(prev).add(productId));
        
        toast({
          title: '❤️ Ajouté aux favoris',
          description: 'Produit ajouté à vos favoris.'
        });
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de modifier les favoris.'
      });
    }
  };

  const isFavorite = (productId: string) => favorites.has(productId);

  return { 
    favorites, 
    toggleFavorite, 
    isFavorite, 
    loading 
  };
};
