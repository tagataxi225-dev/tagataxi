import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface FavoriteItem {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  seller: string;
  sellerId: string;
  category: string;
  rating: number;
  addedAt: string;
}

interface FavoritesContextType {
  favoriteItems: FavoriteItem[];
  favoriteCount: number;
  favorites: string[];
  addToFavorites: (product: any) => Promise<void>;
  removeFromFavorites: (id: string) => Promise<void>;
  clearFavorites: () => Promise<void>;
  isFavorite: (id: string) => boolean;
  toggleFavorite: (product: any) => Promise<void>;
  loading: boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [favoriteItems, setFavoriteItems] = useState<FavoriteItem[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Charger depuis localStorage
  const loadLocalFavorites = () => {
    try {
      const saved = localStorage.getItem('kwenda_favorites');
      if (saved) {
        const parsed = JSON.parse(saved);
        setFavoriteItems(parsed);
        setFavorites(parsed.map((item: FavoriteItem) => item.id));
      }
    } catch (error) {
      console.error('Error loading local favorites:', error);
    }
  };

  // Sauvegarder vers localStorage
  const saveLocalFavorites = (items: FavoriteItem[]) => {
    try {
      localStorage.setItem('kwenda_favorites', JSON.stringify(items));
    } catch (error) {
      console.error('Error saving local favorites:', error);
    }
  };

  // Charger depuis Supabase avec fallback
  const loadSupabaseFavorites = async () => {
    if (!user) {
      loadLocalFavorites();
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('product_id')
        .eq('user_id', user.id);

      if (error) throw error;

      const favoriteIds = data?.map(fav => fav.product_id) || [];
      setFavorites(favoriteIds);

      // Synchroniser avec le cache local
      const saved = localStorage.getItem('kwenda_favorites');
      if (saved) {
        const localItems = JSON.parse(saved);
        const syncedItems = localItems.filter((item: FavoriteItem) => 
          favoriteIds.includes(item.id)
        );
        setFavoriteItems(syncedItems);
        saveLocalFavorites(syncedItems);
      }
    } catch (error) {
      console.error('Supabase error, using local storage:', error);
      loadLocalFavorites();
    } finally {
      setLoading(false);
    }
  };

  // Charger au montage et quand l'utilisateur change
  useEffect(() => {
    loadSupabaseFavorites();
  }, [user]);

  const addToFavorites = async (product: any) => {
    const favoriteItem: FavoriteItem = {
      id: product.id,
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice,
      image: product.image,
      seller: product.seller,
      sellerId: product.sellerId,
      category: product.category,
      rating: product.rating,
      addedAt: new Date().toISOString(),
    };

    // Mise à jour immédiate de l'UI
    const newItems = [...favoriteItems, favoriteItem];
    const newFavorites = [...favorites, product.id];
    
    setFavoriteItems(newItems);
    setFavorites(newFavorites);
    saveLocalFavorites(newItems);

    // Synchronisation avec Supabase si connecté
    if (user) {
      try {
        await supabase.from('favorites').insert({
          user_id: user.id,
          product_id: product.id,
        });
      } catch (error) {
        console.error('Supabase sync error:', error);
      }
    }

    toast({
      title: "Ajouté aux favoris",
      description: `${product.name} a été ajouté à vos favoris`,
    });
  };

  const removeFromFavorites = async (id: string) => {
    const item = favoriteItems.find(item => item.id === id);
    const newItems = favoriteItems.filter(item => item.id !== id);
    const newFavorites = favorites.filter(favId => favId !== id);
    
    setFavoriteItems(newItems);
    setFavorites(newFavorites);
    saveLocalFavorites(newItems);

    if (user) {
      try {
        await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', id);
      } catch (error) {
        console.error('Supabase sync error:', error);
      }
    }

    if (item) {
      toast({
        title: "Retiré des favoris",
        description: `${item.name} a été retiré de vos favoris`,
      });
    }
  };

  const clearFavorites = async () => {
    setFavoriteItems([]);
    setFavorites([]);
    saveLocalFavorites([]);

    if (user) {
      try {
        await supabase.from('favorites').delete().eq('user_id', user.id);
      } catch (error) {
        console.error('Supabase sync error:', error);
      }
    }

    toast({
      title: "Favoris vidés",
      description: "Tous les favoris ont été supprimés",
    });
  };

  const isFavorite = (id: string) => favorites.includes(id);

  const toggleFavorite = async (product: any) => {
    if (isFavorite(product.id)) {
      await removeFromFavorites(product.id);
    } else {
      await addToFavorites(product);
    }
  };

  const favoriteCount = favoriteItems.length;

  const value: FavoritesContextType = {
    favoriteItems,
    favoriteCount,
    favorites,
    addToFavorites,
    removeFromFavorites,
    clearFavorites,
    isFavorite,
    toggleFavorite,
    loading,
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};