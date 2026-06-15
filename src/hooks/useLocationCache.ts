/**
 * Hook pour gérer le cache intelligent des positions
 * Optimise les performances et réduit les appels réseau
 */

import { useState, useEffect, useRef } from 'react';
import { LocationData } from '@/types/location';

interface CacheEntry {
  data: LocationData;
  timestamp: number;
  expiryTime: number;
}

interface LocationCacheOptions {
  maxCacheSize?: number;
  defaultTTL?: number; // Time to live en millisecondes
  storageKey?: string;
}

export function useLocationCache(options: LocationCacheOptions = {}) {
  const {
    maxCacheSize = 100,
    defaultTTL = 5 * 60 * 1000, // 5 minutes par défaut
    storageKey = 'kwenda_location_cache'
  } = options;

  const cacheRef = useRef<Map<string, CacheEntry>>(new Map());
  const [cacheStats, setCacheStats] = useState({
    hits: 0,
    misses: 0,
    size: 0
  });

  // Charger le cache depuis localStorage au démarrage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const entries = JSON.parse(stored) as Array<[string, CacheEntry]>;
        const now = Date.now();
        
        // Filtrer les entrées expirées
        const validEntries = entries.filter(([, entry]) => entry.expiryTime > now);
        cacheRef.current = new Map(validEntries);
        
        setCacheStats(prev => ({
          ...prev,
          size: cacheRef.current.size
        }));
      }
    } catch (error) {
      console.warn('Erreur chargement cache location:', error);
    }
  }, [storageKey]);

  // Sauvegarder le cache périodiquement
  useEffect(() => {
    const interval = setInterval(() => {
      persistCache();
    }, 30000); // Sauvegarder toutes les 30 secondes

    return () => clearInterval(interval);
  }, []);

  const persistCache = () => {
    try {
      const entries = Array.from(cacheRef.current.entries());
      localStorage.setItem(storageKey, JSON.stringify(entries));
    } catch (error) {
      console.warn('Erreur sauvegarde cache:', error);
    }
  };

  const generateKey = (lat: number, lng: number, precision = 4): string => {
    // Arrondir les coordonnées pour créer des zones de cache
    const roundedLat = Math.round(lat * Math.pow(10, precision)) / Math.pow(10, precision);
    const roundedLng = Math.round(lng * Math.pow(10, precision)) / Math.pow(10, precision);
    return `${roundedLat},${roundedLng}`;
  };

  const get = (lat: number, lng: number): LocationData | null => {
    const key = generateKey(lat, lng);
    const entry = cacheRef.current.get(key);
    
    if (!entry) {
      setCacheStats(prev => ({ ...prev, misses: prev.misses + 1 }));
      return null;
    }

    // Vérifier l'expiration
    if (Date.now() > entry.expiryTime) {
      cacheRef.current.delete(key);
      setCacheStats(prev => ({ 
        ...prev, 
        misses: prev.misses + 1,
        size: cacheRef.current.size
      }));
      return null;
    }

    setCacheStats(prev => ({ ...prev, hits: prev.hits + 1 }));
    return entry.data;
  };

  const set = (location: LocationData, ttl?: number): void => {
    const key = generateKey(location.lat, location.lng);
    const expiryTime = Date.now() + (ttl || defaultTTL);
    
    const entry: CacheEntry = {
      data: location,
      timestamp: Date.now(),
      expiryTime
    };

    // Vérifier la taille maximale du cache
    if (cacheRef.current.size >= maxCacheSize) {
      // Supprimer les entrées les plus anciennes
      const entries = Array.from(cacheRef.current.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      // Supprimer 20% des entrées les plus anciennes
      const toRemove = Math.floor(maxCacheSize * 0.2);
      for (let i = 0; i < toRemove; i++) {
        cacheRef.current.delete(entries[i][0]);
      }
    }

    cacheRef.current.set(key, entry);
    setCacheStats(prev => ({ ...prev, size: cacheRef.current.size }));
  };

  const clear = (): void => {
    cacheRef.current.clear();
    setCacheStats({ hits: 0, misses: 0, size: 0 });
    localStorage.removeItem(storageKey);
  };

  const cleanup = (): number => {
    const now = Date.now();
    let removed = 0;
    
    for (const [key, entry] of cacheRef.current.entries()) {
      if (entry.expiryTime <= now) {
        cacheRef.current.delete(key);
        removed++;
      }
    }
    
    setCacheStats(prev => ({ ...prev, size: cacheRef.current.size }));
    return removed;
  };

  const getPopularLocations = (limit = 10): LocationData[] => {
    const entries = Array.from(cacheRef.current.values());
    
    // Trier par fréquence d'utilisation (approximée par timestamp récent)
    return entries
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit)
      .map(entry => ({ ...entry.data, isPopular: true }));
  };

  const preload = (locations: Array<{ lat: number; lng: number }>): void => {
    // Précharger des locations communes (arrêts de bus, lieux populaires, etc.)
    locations.forEach(({ lat, lng }) => {
      const key = generateKey(lat, lng);
      if (!cacheRef.current.has(key)) {
        const locationData: LocationData = {
          lat,
          lng,
          address: 'Location mise en cache',
          type: 'database'
        };
        set(locationData, defaultTTL * 2); // TTL plus long pour les locations préchargées
      }
    });
  };

  return {
    get,
    set,
    clear,
    cleanup,
    getPopularLocations,
    preload,
    stats: cacheStats,
    persistCache
  };
}