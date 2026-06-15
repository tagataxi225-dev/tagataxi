/**
 * Hook amélioré pour recherche d'adresses intelligente multi-ville
 * Corrige le problème de ville fixe et optimise l'UX
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { intelligentAddressSearch, type IntelligentSearchResult, type SearchOptions } from '@/services/IntelligentAddressSearch';
import type { LocationData } from '@/types/location';
import { nativeGeolocationService } from '@/services/nativeGeolocationService';

interface UseEnhancedIntelligentAddressSearchProps {
  city: string; // VILLE DYNAMIQUE - corrige le bug principal
  country_code?: string;
  maxResults?: number;
  debounceMs?: number;
  autoDetectCity?: boolean;
  realtimeSearch?: boolean;
}

interface UseEnhancedIntelligentAddressSearchReturn {
  results: IntelligentSearchResult[];
  recentSearches: IntelligentSearchResult[];
  popularPlaces: IntelligentSearchResult[];
  isSearching: boolean;
  currentCity: string;
  location: LocationData | null;
  error: string | null;
  search: (query: string) => Promise<void>;
  getPopularPlaces: () => Promise<void>;
  addToHistory: (result: IntelligentSearchResult) => void;
  setCity: (city: string) => void; // FONCTION POUR CHANGER LA VILLE
  clearResults: () => void;
  clearCache: () => void;
  detectCityFromLocation: () => Promise<void>;
}

export const useEnhancedIntelligentAddressSearch = ({
  city,
  country_code = 'CD',
  maxResults = 10,
  debounceMs = 300,
  autoDetectCity = false,
  realtimeSearch = true
}: UseEnhancedIntelligentAddressSearchProps): UseEnhancedIntelligentAddressSearchReturn => {
  
  // État principal
  const [results, setResults] = useState<IntelligentSearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<IntelligentSearchResult[]>([]);
  const [popularPlaces, setPopularPlaces] = useState<IntelligentSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentCity, setCurrentCity] = useState(city); // VILLE DYNAMIQUE
  const [location, setLocation] = useState<LocationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Contrôle du debounce
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const abortControllerRef = useRef<AbortController>();

  // Helper: Distance entre deux points
  const calculateDistance = useCallback((lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Rayon de la Terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }, []);

  // Détecter la ville basée sur la position utilisateur
  const detectCityFromLocation = useCallback(async () => {
    try {
      const position = await nativeGeolocationService.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      });

      const latitude = position.lat;
      const longitude = position.lng;
      setLocation({
        address: 'Position actuelle',
        lat: latitude,
        lng: longitude,
        type: 'current'
      });

      // Détecter la ville la plus proche
      const cities = [
        { name: 'Kinshasa', lat: -4.3317, lng: 15.3139 },
        { name: 'Lubumbashi', lat: -11.6792, lng: 27.4716 },
        { name: 'Kolwezi', lat: -10.7147, lng: 25.4665 }
      ];

      let closestCity = cities[0];
      let minDistance = calculateDistance(latitude, longitude, closestCity.lat, closestCity.lng);

      for (const city of cities) {
        const distance = calculateDistance(latitude, longitude, city.lat, city.lng);
        if (distance < minDistance) {
          minDistance = distance;
          closestCity = city;
        }
      }

      setCurrentCity(closestCity.name);
      console.log(`🎯 Ville détectée: ${closestCity.name} (${minDistance.toFixed(1)}km)`);
      
    } catch (error) {
      console.warn('Impossible de détecter la ville automatiquement:', error);
      setCurrentCity(city); // Fallback à la ville fournie
    }
  }, [city, calculateDistance]);

  // Fonction de recherche principale avec debounce et annulation
  const search = useCallback(async (query: string) => {
    // Annuler la recherche précédente
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Si la requête est vide, charger les lieux populaires
    if (!query.trim()) {
      await getPopularPlaces();
      return;
    }

    // Debounce pour éviter trop de requêtes
    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      setError(null);
      
      // Nouveau contrôleur d'annulation
      abortControllerRef.current = new AbortController();
      
      try {
        const searchOptions: SearchOptions = {
          city: currentCity, // UTILISE LA VILLE SÉLECTIONNÉE
          country_code,
          max_results: maxResults,
          include_google_fallback: true
        };

        if (location) {
          searchOptions.user_lat = location.lat;
          searchOptions.user_lng = location.lng;
        }

        console.log(`🔍 Recherche "${query}" dans ${currentCity}`);
        
        const searchResults = await intelligentAddressSearch.search(query, searchOptions);
        
        // Vérifier si la recherche n'a pas été annulée
        if (!abortControllerRef.current?.signal.aborted) {
          setResults(searchResults);
          console.log(`✅ ${searchResults.length} résultats trouvés pour "${query}" dans ${currentCity}`);
        }
      } catch (error: any) {
        if (!abortControllerRef.current?.signal.aborted) {
          console.error('Erreur de recherche:', error);
          setError('Erreur lors de la recherche');
          setResults([]);
        }
      } finally {
        if (!abortControllerRef.current?.signal.aborted) {
          setIsSearching(false);
        }
      }
    }, debounceMs);
  }, [currentCity, country_code, maxResults, location, debounceMs]);

  // Charger les lieux populaires pour la ville sélectionnée
  const getPopularPlaces = useCallback(async () => {
    try {
      setIsSearching(true);
      const searchOptions: SearchOptions = {
        city: currentCity, // UTILISE LA VILLE SÉLECTIONNÉE
        country_code,
        max_results: 8
      };

      console.log(`🏆 Chargement lieux populaires pour ${currentCity}`);
      
      const places = await intelligentAddressSearch.getPopularPlaces(searchOptions);
      setPopularPlaces(places);
      setResults(places); // Afficher comme résultats par défaut
      
      console.log(`✅ ${places.length} lieux populaires chargés pour ${currentCity}`);
    } catch (error) {
      console.error('Erreur chargement lieux populaires:', error);
      setPopularPlaces([]);
    } finally {
      setIsSearching(false);
    }
  }, [currentCity, country_code]);

  // Ajouter à l'historique de recherche
  const addToHistory = useCallback((result: IntelligentSearchResult) => {
    setRecentSearches(prev => {
      const filtered = prev.filter(item => item.id !== result.id);
      return [result, ...filtered].slice(0, 5); // Garder max 5 éléments
    });
    
    // Sauvegarder en localStorage
    try {
      const storageKey = `kwenda_search_history_${currentCity}`;
      const updatedHistory = [result, ...recentSearches.filter(item => item.id !== result.id)].slice(0, 5);
      localStorage.setItem(storageKey, JSON.stringify(updatedHistory));
    } catch (error) {
      console.warn('Impossible de sauvegarder l\'historique:', error);
    }
  }, [recentSearches, currentCity]);

  // Changer de ville - NOUVELLE FONCTION
  const setCity = useCallback((newCity: string) => {
    console.log(`🏙️ Changement de ville: ${currentCity} → ${newCity}`);
    setCurrentCity(newCity);
    setResults([]); // Vider les résultats
    setError(null);
    
    // Recharger les lieux populaires pour la nouvelle ville
    setTimeout(() => {
      getPopularPlaces();
    }, 100);
  }, [currentCity, getPopularPlaces]);

  // Vider les résultats
  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  // Vider le cache
  const clearCache = useCallback(() => {
    intelligentAddressSearch.clearCache();
  }, []);

  // Auto-détection de ville au mount
  useEffect(() => {
    if (autoDetectCity) {
      detectCityFromLocation();
    }
  }, [autoDetectCity, detectCityFromLocation]);

  // Charger les lieux populaires au mount et quand la ville change
  useEffect(() => {
    getPopularPlaces();
  }, [getPopularPlaces]);

  // Charger l'historique depuis localStorage
  useEffect(() => {
    try {
      const storageKey = `kwenda_search_history_${currentCity}`;
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const history = JSON.parse(stored);
        setRecentSearches(Array.isArray(history) ? history.slice(0, 5) : []);
      }
    } catch (error) {
      console.warn('Impossible de charger l\'historique:', error);
    }
  }, [currentCity]);

  // Nettoyage au unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    results,
    recentSearches,
    popularPlaces,
    isSearching,
    currentCity,
    location,
    error,
    search,
    getPopularPlaces,
    addToHistory,
    setCity, // NOUVELLE FONCTION POUR CHANGER LA VILLE
    clearResults,
    clearCache,
    detectCityFromLocation
  };
};