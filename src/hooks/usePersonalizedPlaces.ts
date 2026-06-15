/**
 * 🎯 HOOK POUR LIEUX PERSONNALISÉS INTELLIGENTS
 * 
 * Gestion des favoris, lieux récents et préférences utilisateur
 * Cache intelligent et scoring de pertinence
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { LocationData, LocationSearchResult } from './useSmartGeolocation';

interface SavedPlace {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  place_type: 'home' | 'work' | 'favorite' | 'custom';
  usage_count: number;
  last_used_at: string;
  metadata?: any;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
}

interface RecentSearch {
  id: string;
  search_query: string;
  result_address?: string;
  result_latitude?: number;
  result_longitude?: number;
  selected: boolean;
  search_count: number;
  last_searched_at: string;
}

interface UserPreferences {
  preferred_city: string;
  preferred_language: string;
  auto_save_favorites: boolean;
  location_sharing: boolean;
}

export const usePersonalizedPlaces = () => {
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences>({
    preferred_city: 'Kinshasa',
    preferred_language: 'fr',
    auto_save_favorites: true,
    location_sharing: true
  });
  const [loading, setLoading] = useState(false);

  // 📊 CHARGER LES DONNÉES UTILISATEUR
  const loadUserData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Charger les lieux sauvegardés
      const { data: places } = await supabase
        .from('user_saved_places')
        .select('*')
        .order('usage_count', { ascending: false })
        .order('last_used_at', { ascending: false });

      // Charger les recherches récentes
      const { data: searches } = await supabase
        .from('user_recent_searches')
        .select('*')
        .order('last_searched_at', { ascending: false })
        .limit(10);

      // Charger les préférences
      const { data: userPrefs } = await supabase
        .from('user_location_preferences')
        .select('*')
        .single();

      setSavedPlaces((places || []).map(place => ({
        ...place,
        place_type: place.place_type as 'home' | 'work' | 'favorite' | 'custom'
      })));
      setRecentSearches(searches || []);
      if (userPrefs) {
        setPreferences(userPrefs);
      }
    } catch (error) {
      console.error('Erreur chargement données personnalisées:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 💾 SAUVEGARDER UN LIEU
  const savePlace = useCallback(async (
    place: LocationData,
    type: 'home' | 'work' | 'favorite' | 'custom' = 'favorite',
    customName?: string
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const placeData = {
        user_id: user.id,
        name: customName || place.name || place.address.split(',')[0],
        address: place.address,
        latitude: place.lat,
        longitude: place.lng,
        place_type: type,
        metadata: {
          original_type: place.type,
          place_id: place.placeId,
          confidence: place.confidence
        }
      };

      // Vérifier si le lieu existe déjà
      const { data: existing } = await supabase
        .from('user_saved_places')
        .select('*')
        .eq('user_id', user.id)
        .eq('place_type', type)
        .or(`latitude.eq.${place.lat},longitude.eq.${place.lng}`)
        .single();

      if (existing) {
        // Mettre à jour l'usage
        await supabase
          .from('user_saved_places')
          .update({
            usage_count: existing.usage_count + 1,
            last_used_at: new Date().toISOString()
          })
          .eq('id', existing.id);
      } else {
        // Créer nouveau lieu
        await supabase
          .from('user_saved_places')
          .insert(placeData);
      }

      await loadUserData();
      return true;
    } catch (error) {
      console.error('Erreur sauvegarde lieu:', error);
      return false;
    }
  }, [loadUserData]);

  // 🔍 ENREGISTRER UNE RECHERCHE
  const recordSearch = useCallback(async (
    query: string,
    result?: LocationData,
    selected: boolean = false
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Vérifier si la recherche existe déjà
      const { data: existing } = await supabase
        .from('user_recent_searches')
        .select('*')
        .eq('user_id', user.id)
        .eq('search_query', query)
        .single();

      if (existing) {
        // Mettre à jour le compteur
        await supabase
          .from('user_recent_searches')
          .update({
            search_count: existing.search_count + 1,
            last_searched_at: new Date().toISOString(),
            selected: selected || existing.selected,
            result_address: result?.address || existing.result_address,
            result_latitude: result?.lat || existing.result_latitude,
            result_longitude: result?.lng || existing.result_longitude
          })
          .eq('id', existing.id);
      } else {
        // Nouvelle recherche
        await supabase
          .from('user_recent_searches')
          .insert({
            user_id: user.id,
            search_query: query,
            result_address: result?.address,
            result_latitude: result?.lat,
            result_longitude: result?.lng,
            selected
          });
      }

      // Auto-sauvegarder si sélectionné et option activée
      if (selected && result && preferences.auto_save_favorites) {
        await savePlace(result, 'favorite');
      }

      await loadUserData();
    } catch (error) {
      console.error('Erreur enregistrement recherche:', error);
    }
  }, [preferences.auto_save_favorites, savePlace, loadUserData]);

  // 🏠 OBTENIR LIEUX PAR TYPE
  const getPlacesByType = useCallback((type: string): SavedPlace[] => {
    return savedPlaces.filter(place => place.place_type === type);
  }, [savedPlaces]);

  // ⭐ OBTENIR LIEUX POPULAIRES PERSONNALISÉS
  const getPersonalizedSuggestions = useCallback((): LocationSearchResult[] => {
    const suggestions: LocationSearchResult[] = [];

    // Ajouter les lieux sauvegardés les plus utilisés
    savedPlaces.slice(0, 5).forEach((place, index) => {
      suggestions.push({
        id: `saved-${place.id}`,
        name: place.name,
        address: place.address,
        lat: place.latitude,
        lng: place.longitude,
        type: 'recent',
        title: place.name,
        subtitle: place.address,
        relevanceScore: 100 - index * 5,
        isPopular: true
      });
    });

    // Ajouter les recherches récentes sélectionnées
    recentSearches
      .filter(search => search.selected && search.result_latitude && search.result_longitude)
      .slice(0, 3)
      .forEach((search, index) => {
        suggestions.push({
          id: `recent-${search.id}`,
          name: search.search_query,
          address: search.result_address || search.search_query,
          lat: search.result_latitude!,
          lng: search.result_longitude!,
          type: 'recent',
          title: search.search_query,
          subtitle: 'Recherche récente',
          relevanceScore: 80 - index * 10
        });
      });

    return suggestions.slice(0, 8);
  }, [savedPlaces, recentSearches]);

  // 🗑️ SUPPRIMER UN LIEU
  const removePlace = useCallback(async (placeId: string) => {
    try {
      await supabase
        .from('user_saved_places')
        .delete()
        .eq('id', placeId);
      
      await loadUserData();
      return true;
    } catch (error) {
      console.error('Erreur suppression lieu:', error);
      return false;
    }
  }, [loadUserData]);

  // ⚙️ METTRE À JOUR PRÉFÉRENCES
  const updatePreferences = useCallback(async (newPrefs: Partial<UserPreferences>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const updatedPrefs = { ...preferences, ...newPrefs };

      await supabase
        .from('user_location_preferences')
        .upsert({
          user_id: user.id,
          ...updatedPrefs
        });

      setPreferences(updatedPrefs);
      return true;
    } catch (error) {
      console.error('Erreur mise à jour préférences:', error);
      return false;
    }
  }, [preferences]);

  // 🔄 CHARGER AU MONTAGE
  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  return {
    // État
    savedPlaces,
    recentSearches,
    preferences,
    loading,

    // Actions
    savePlace,
    recordSearch,
    removePlace,
    updatePreferences,
    loadUserData,

    // Getters
    getPlacesByType,
    getPersonalizedSuggestions,

    // Raccourcis utiles
    homePlaces: getPlacesByType('home'),
    workPlaces: getPlacesByType('work'),
    favoritePlaces: getPlacesByType('favorite'),
    hasPersonalizedData: savedPlaces.length > 0 || recentSearches.length > 0
  };
};