/**
 * Hook optimisé pour les opérations de géocodage
 * Évite les requêtes multiples et optimise les performances
 */

import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface GeocodeResult {
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  place_id?: string;
  types?: string[];
}

interface GeocodeCache {
  data: GeocodeResult[];
  timestamp: number;
}

export const useOptimizedGeocoding = () => {
  const [isLoading, setIsLoading] = useState(false);
  const cache = useRef(new Map<string, GeocodeCache>());
  const pendingRequests = useRef(new Map<string, Promise<GeocodeResult[]>>());
  const abortControllers = useRef(new Map<string, AbortController>());
  
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  const DEBOUNCE_DELAY = 300; // 300ms

  const geocodeLocation = useCallback(async (
    query: string, 
    options: { region?: string; language?: string } = {}
  ): Promise<GeocodeResult[]> => {
    if (!query.trim()) return [];

    const cacheKey = `${query.trim()}_${options.region || 'cd'}_${options.language || 'fr'}`;
    
    // Vérifier le cache
    const cached = cache.current.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }

    // Éviter les requêtes multiples pour la même recherche
    if (pendingRequests.current.has(cacheKey)) {
      return pendingRequests.current.get(cacheKey)!;
    }

    // Annuler les requêtes précédentes pour la même clé
    const existingController = abortControllers.current.get(cacheKey);
    if (existingController) {
      existingController.abort();
    }

    // Créer un nouveau controller
    const controller = new AbortController();
    abortControllers.current.set(cacheKey, controller);

    const request = performGeocode(query, options, controller.signal);
    pendingRequests.current.set(cacheKey, request);

    try {
      setIsLoading(true);
      const result = await request;
      
      // Mettre en cache
      cache.current.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      return result;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return []; // Requête annulée, retourner un tableau vide
      }
      throw error;
    } finally {
      setIsLoading(false);
      pendingRequests.current.delete(cacheKey);
      abortControllers.current.delete(cacheKey);
    }
  }, []);

  const performGeocode = async (
    query: string,
    options: { region?: string; language?: string },
    signal: AbortSignal
  ): Promise<GeocodeResult[]> => {
    try {
      const { data, error } = await supabase.functions.invoke('geocode-proxy', {
        body: {
          query: query.trim(),
          region: options.region || 'cd',
          language: options.language || 'fr'
        }
      });

      // Vérifier si la requête a été annulée
      if (signal.aborted) {
        throw new Error('Request aborted');
      }

      if (error) throw error;

      if (data?.status === 'OK' && data.results) {
        return data.results;
      }

      return [];
    } catch (error) {
      if (signal.aborted) {
        throw new Error('Request aborted');
      }
      throw error;
    }
  };

  const reverseGeocode = useCallback(async (
    lat: number, 
    lng: number, 
    region: string = 'cd'
  ): Promise<string> => {
    const cacheKey = `reverse_${lat}_${lng}_${region}`;
    
    // Vérifier le cache
    const cached = cache.current.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data[0]?.formatted_address || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }

    try {
      const results = await geocodeLocation(`${lat},${lng}`, { region });
      return results[0]?.formatted_address || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  }, [geocodeLocation]);

  const clearCache = useCallback(() => {
    cache.current.clear();
  }, []);

  const cancelAllRequests = useCallback(() => {
    abortControllers.current.forEach(controller => controller.abort());
    abortControllers.current.clear();
    pendingRequests.current.clear();
  }, []);

  return {
    geocodeLocation,
    reverseGeocode,
    isLoading,
    clearCache,
    cancelAllRequests
  };
};