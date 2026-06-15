import { useState, useCallback, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { SearchResult, SearchConfig } from '@/components/search/UniversalSearchInterface';

interface UseUniversalSearchProps {
  config: SearchConfig;
  customSearchProvider?: (query: string) => Promise<SearchResult[]>;
  onSearchHistory?: (result: SearchResult) => void;
}

export const useUniversalSearch = ({
  config,
  customSearchProvider,
  onSearchHistory
}: UseUniversalSearchProps) => {
  const [searchHistory, setSearchHistory] = useState<SearchResult[]>([]);
  const [popularSuggestions, setPopularSuggestions] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchCacheRef = useRef<Map<string, { results: SearchResult[]; timestamp: number }>>(new Map());
  const { toast } = useToast();

  // Cache duration en millisecondes (5 minutes)
  const CACHE_DURATION = 5 * 60 * 1000;

  // Charger l'historique depuis localStorage
  useEffect(() => {
    const stored = localStorage.getItem(`search_history_${config.type}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSearchHistory(parsed.slice(0, 10)); // Garder les 10 dernières recherches
      } catch (error) {
        console.error('Erreur lors du chargement de l\'historique:', error);
      }
    }
  }, [config.type]);

  // Sauvegarder l'historique
  const saveToHistory = useCallback((result: SearchResult) => {
    setSearchHistory(prev => {
      const filtered = prev.filter(item => item.id !== result.id);
      const updated = [result, ...filtered].slice(0, 10);
      
      // Sauvegarder dans localStorage
      localStorage.setItem(`search_history_${config.type}`, JSON.stringify(updated));
      
      // Callback optionnel
      onSearchHistory?.(result);
      
      return updated;
    });
  }, [config.type, onSearchHistory]);

  // Recherche avec cache intelligent
  const performSearch = useCallback(async (query: string): Promise<SearchResult[]> => {
    if (!query.trim() || query.length < (config.minCharacters || 1)) {
      return [];
    }

    setIsSearching(true);

    try {
      // Vérifier le cache
      const cacheKey = `${config.type}_${query.toLowerCase()}`;
      const cached = searchCacheRef.current.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        setIsSearching(false);
        return cached.results;
      }

      // Recherche via provider personnalisé
      let results: SearchResult[] = [];
      
      if (customSearchProvider) {
        results = await customSearchProvider(query);
      } else {
        // Recherche par défaut dans les données locales
        results = (config.localData || []).filter(item =>
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.subtitle?.toLowerCase().includes(query.toLowerCase()) ||
          item.description?.toLowerCase().includes(query.toLowerCase())
        );
      }

      // Calcul du score de pertinence
      const scoredResults = results.map(result => ({
        ...result,
        relevanceScore: calculateRelevanceScore(result, query)
      }));

      // Tri par pertinence
      const sortedResults = scoredResults
        .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
        .slice(0, config.maxResults || 10);

      // Mise en cache
      searchCacheRef.current.set(cacheKey, {
        results: sortedResults,
        timestamp: Date.now()
      });

      // Nettoyage du cache (garder max 50 entrées)
      if (searchCacheRef.current.size > 50) {
        const entries = Array.from(searchCacheRef.current.entries());
        // Supprimer les plus anciennes
        entries
          .sort((a, b) => a[1].timestamp - b[1].timestamp)
          .slice(0, 10)
          .forEach(([key]) => searchCacheRef.current.delete(key));
      }

      return sortedResults;
    } catch (error) {
      console.error('Erreur de recherche:', error);
      toast({
        title: "Erreur de recherche",
        description: "Impossible d'effectuer la recherche",
        variant: "destructive"
      });
      return [];
    } finally {
      setIsSearching(false);
    }
  }, [config, customSearchProvider, toast]);

  // Calcul intelligent du score de pertinence
  const calculateRelevanceScore = (result: SearchResult, query: string): number => {
    let score = result.relevanceScore || 0;
    
    const queryLower = query.toLowerCase();
    const titleLower = result.title.toLowerCase();
    const subtitleLower = result.subtitle?.toLowerCase() || '';
    const descriptionLower = result.description?.toLowerCase() || '';
    
    // Correspondance exacte
    if (titleLower === queryLower) score += 100;
    else if (titleLower.startsWith(queryLower)) score += 50;
    else if (titleLower.includes(queryLower)) score += 25;
    
    // Correspondance dans le sous-titre
    if (subtitleLower.includes(queryLower)) score += 15;
    
    // Correspondance dans la description
    if (descriptionLower.includes(queryLower)) score += 10;
    
    // Boost par type selon le contexte
    switch (config.type) {
      case 'location':
        if (result.type === 'location' || result.type === 'popular') score += 20;
        break;
      case 'product':
        if (result.type === 'product') score += 20;
        break;
      case 'user':
        if (result.type === 'user') score += 20;
        break;
    }
    
    // Boost pour les éléments populaires
    if (result.type === 'popular') score += 15;
    
    // Pénalité pour les résultats très longs (moins spécifiques)
    if (result.title.length > 50) score -= 5;
    
    return Math.max(0, score);
  };

  // Générer des suggestions populaires contextuelles
  const generatePopularSuggestions = useCallback((): SearchResult[] => {
    const suggestions: SearchResult[] = [];
    
    // Suggestions basées sur l'historique fréquent
    const frequentSearches = searchHistory
      .reduce((acc, item) => {
        const existing = acc.find(a => a.title === item.title);
        if (existing) {
          existing.count++;
        } else {
          acc.push({ ...item, count: 1 });
        }
        return acc;
      }, [] as (SearchResult & { count: number })[])
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    suggestions.push(...frequentSearches);

    // Suggestions par défaut selon le type
    if (config.type === 'location') {
      suggestions.push(
        {
          id: 'current-location',
          type: 'location',
          title: 'Ma position actuelle',
          subtitle: 'Utiliser la géolocalisation',
          icon: () => null,
          badge: { text: 'GPS', variant: 'secondary' }
        },
        {
          id: 'kinshasa-center',
          type: 'popular',
          title: 'Centre-ville de Kinshasa',
          subtitle: 'Gombe, Kinshasa',
          coordinates: { lat: -4.3276, lng: 15.3136 },
          badge: { text: 'Populaire', variant: 'default' }
        }
      );
    } else if (config.type === 'product') {
      suggestions.push(
        {
          id: 'trending-products',
          type: 'popular',
          title: 'Produits tendance',
          subtitle: 'Les plus recherchés',
          badge: { text: 'Trending', variant: 'secondary' }
        }
      );
    }

    return suggestions.slice(0, 6);
  }, [searchHistory, config.type]);

  // Mettre à jour les suggestions populaires
  useEffect(() => {
    setPopularSuggestions(generatePopularSuggestions());
  }, [generatePopularSuggestions]);

  // Nettoyer le cache périodiquement
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      for (const [key, value] of searchCacheRef.current.entries()) {
        if (now - value.timestamp > CACHE_DURATION) {
          searchCacheRef.current.delete(key);
        }
      }
    }, 60000); // Vérification chaque minute

    return () => clearInterval(interval);
  }, []);

  // Effacer l'historique
  const clearHistory = useCallback(() => {
    setSearchHistory([]);
    localStorage.removeItem(`search_history_${config.type}`);
  }, [config.type]);

  // Effacer le cache
  const clearCache = useCallback(() => {
    searchCacheRef.current.clear();
  }, []);

  return {
    searchHistory,
    popularSuggestions,
    isSearching,
    performSearch,
    saveToHistory,
    clearHistory,
    clearCache
  };
};