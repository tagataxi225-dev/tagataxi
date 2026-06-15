import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface UserPlace {
  id: string;
  user_id: string;
  name: string;
  address: string;
  coordinates?: {
    lat: number;
    lng: number;
  } | null;
  place_type: 'home' | 'work' | 'recent' | 'favorite';
  usage_count: number;
  created_at: string;
  last_used: string;
}

interface UsePlacesReturn {
  places: UserPlace[];
  recentPlaces: UserPlace[];
  favoritePlaces: UserPlace[];
  homePlace?: UserPlace;
  workPlace?: UserPlace;
  loading: boolean;
  error: string | null;
  addPlace: (place: Omit<UserPlace, 'id' | 'user_id' | 'usage_count' | 'created_at' | 'last_used'>) => Promise<void>;
  updatePlace: (id: string, updates: Partial<UserPlace>) => Promise<void>;
  deletePlace: (id: string) => Promise<void>;
  markAsUsed: (placeId: string) => Promise<void>;
  searchAndSave: (address: string, coordinates?: { lat: number; lng: number }) => Promise<UserPlace>;
}

export const usePlaces = (): UsePlacesReturn => {
  const { user } = useAuth();
  const [places, setPlaces] = useState<UserPlace[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPlaces = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_places')
        .select('*')
        .eq('user_id', user.id)
        .order('last_used', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match our UserPlace interface
      const transformedData = (data || []).map(item => ({
        ...item,
        coordinates: item.coordinates ? 
          (typeof item.coordinates === 'object' && item.coordinates !== null ? 
            item.coordinates as { lat: number; lng: number } : null) : null,
        place_type: item.place_type as 'home' | 'work' | 'recent' | 'favorite'
      }));
      
      setPlaces(transformedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des lieux');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPlaces();

    // Realtime synchronization for places changes
    if (!user) return;

    const channel = supabase
      .channel('user_places_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_places',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          console.log('🔄 Places updated, refreshing...');
          fetchPlaces();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPlaces, user]);

  const addPlace = useCallback(async (place: Omit<UserPlace, 'id' | 'user_id' | 'usage_count' | 'created_at' | 'last_used'>) => {
    if (!user) throw new Error('Utilisateur non connecté');

    try {
      const { data, error } = await supabase
        .from('user_places')
        .insert({
          user_id: user.id,
          name: place.name,
          address: place.address,
          coordinates: place.coordinates,
          place_type: place.place_type,
        })
        .select()
        .single();

      if (error) throw error;
      await fetchPlaces();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'ajout du lieu');
      throw err;
    }
  }, [user, fetchPlaces]);

  const updatePlace = useCallback(async (id: string, updates: Partial<UserPlace>) => {
    try {
      const { error } = await supabase
        .from('user_places')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      await fetchPlaces();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour du lieu');
      throw err;
    }
  }, [fetchPlaces]);

  const deletePlace = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('user_places')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchPlaces();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression du lieu');
      throw err;
    }
  }, [fetchPlaces]);

  const markAsUsed = useCallback(async (placeId: string) => {
    try {
      const place = places.find(p => p.id === placeId);
      if (!place) return;

      const { error } = await supabase
        .from('user_places')
        .update({
          usage_count: place.usage_count + 1,
          last_used: new Date().toISOString(),
        })
        .eq('id', placeId);

      if (error) throw error;
      await fetchPlaces();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour du lieu');
    }
  }, [places, fetchPlaces]);

  const searchAndSave = useCallback(async (address: string, coordinates?: { lat: number; lng: number }): Promise<UserPlace> => {
    if (!user) throw new Error('Utilisateur non connecté');

    // Vérifier si le lieu existe déjà
    const existingPlace = places.find(p => 
      p.address.toLowerCase() === address.toLowerCase() ||
      p.name.toLowerCase() === address.toLowerCase()
    );

    if (existingPlace) {
      await markAsUsed(existingPlace.id);
      return existingPlace;
    }

    // Créer un nouveau lieu récent
    const newPlace = {
      name: address,
      address: address,
      coordinates: coordinates,
      place_type: 'recent' as const,
    };

    await addPlace(newPlace);
    
    // Retourner le lieu créé
    const { data, error } = await supabase
      .from('user_places')
      .select('*')
      .eq('user_id', user.id)
      .eq('address', address)
      .single();

    if (error) throw error;
    
    // Transform the returned data
    const transformedData = {
      ...data,
      coordinates: data.coordinates ? 
        (typeof data.coordinates === 'object' && data.coordinates !== null ? 
          data.coordinates as { lat: number; lng: number } : null) : null,
      place_type: data.place_type as 'home' | 'work' | 'recent' | 'favorite'
    };
    
    return transformedData;
  }, [user, places, markAsUsed, addPlace]);

  // Filtrer les lieux par type
  const recentPlaces = places.filter(p => p.place_type === 'recent').slice(0, 5);
  const favoritePlaces = places.filter(p => p.place_type === 'favorite');
  const homePlace = places.find(p => p.place_type === 'home');
  const workPlace = places.find(p => p.place_type === 'work');

  return {
    places,
    recentPlaces,
    favoritePlaces,
    homePlace,
    workPlace,
    loading,
    error,
    addPlace,
    updatePlace,
    deletePlace,
    markAsUsed,
    searchAndSave,
  };
};