import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, MapPin, Clock, Star, Zap, Mic, Navigation, Building2, ShoppingBag, Users, Settings, X, ArrowRight, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

// Types unifiés pour tous les types de recherche
export interface SearchResult {
  id: string;
  type: 'location' | 'product' | 'user' | 'action' | 'popular';
  title: string;
  subtitle?: string;
  description?: string;
  icon?: React.ComponentType<any>;
  badge?: {
    text: string;
    variant: 'default' | 'secondary' | 'outline' | 'destructive';
    color?: string;
  };
  coordinates?: { lat: number; lng: number };
  metadata?: any;
  relevanceScore?: number;
  category?: string;
}

export interface SearchConfig {
  type: 'location' | 'product' | 'user' | 'general' | 'action';
  placeholder: string;
  apiEndpoint?: string;
  localData?: SearchResult[];
  minCharacters?: number;
  maxResults?: number;
  enableVoiceSearch?: boolean;
  enableCurrentLocation?: boolean;
  showPopularSuggestions?: boolean;
  showRecentSearches?: boolean;
  debounceMs?: number;
  categories?: {
    id: string;
    name: string;
    icon: React.ComponentType<any>;
    color: string;
  }[];
}

interface UniversalSearchInterfaceProps {
  config: SearchConfig;
  onSearchResult: (result: SearchResult) => void;
  onSearch?: (query: string) => void;
  className?: string;
  autoFocus?: boolean;
  value?: string;
  popularSuggestions?: SearchResult[];
  recentSearches?: SearchResult[];
  customSearchProvider?: (query: string) => Promise<SearchResult[]>;
}

export const UniversalSearchInterface = ({
  config,
  onSearchResult,
  onSearch,
  className,
  autoFocus = false,
  value = '',
  popularSuggestions = [],
  recentSearches = [],
  customSearchProvider
}: UniversalSearchInterfaceProps) => {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isListening, setIsListening] = useState(false);
  const [focused, setFocused] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const recognitionRef = useRef<any>(null);

  const { toast } = useToast();

  // Configuration intelligente basée sur le type
  const {
    minCharacters = 1,
    maxResults = 8,
    debounceMs = 100,
    enableVoiceSearch = true,
    showPopularSuggestions = true,
    showRecentSearches = true
  } = config;

  // Initialisation de la reconnaissance vocale
  useEffect(() => {
    if (enableVoiceSearch && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'fr-FR';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setQuery(transcript);
        setIsListening(false);
        // Auto-recherche après saisie vocale
        setTimeout(() => {
          handleSearch(transcript);
        }, 300);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
        toast({
          title: "Erreur de reconnaissance vocale",
          description: "Impossible de capturer votre voix",
          variant: "destructive"
        });
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, [enableVoiceSearch, toast]);

  // Recherche intelligente multicouche
  const performSearch = useCallback(async (searchQuery: string): Promise<SearchResult[]> => {
    if (searchQuery.length < minCharacters) {
      return [];
    }

    const allResults: SearchResult[] = [];

    // Couche 1 - Instantané : Suggestions populaires locales
    if (showPopularSuggestions) {
      const popularMatches = popularSuggestions.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.subtitle?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      allResults.push(...popularMatches.map(item => ({ ...item, relevanceScore: 10 })));
    }

    // Couche 2 - Local : Données locales
    if (config.localData) {
      const localMatches = config.localData.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.subtitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      allResults.push(...localMatches.map(item => ({ ...item, relevanceScore: 8 })));
    }

    // Couche 3 - Recherches récentes
    if (showRecentSearches) {
      const recentMatches = recentSearches.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
      allResults.push(...recentMatches.map(item => ({ ...item, relevanceScore: 6 })));
    }

    // Couche 4 - API personnalisée
    if (customSearchProvider) {
      try {
        const apiResults = await customSearchProvider(searchQuery);
        allResults.push(...apiResults.map(item => ({ ...item, relevanceScore: item.relevanceScore || 5 })));
      } catch (error) {
        console.error('Erreur API de recherche:', error);
      }
    }

    // Score de pertinence intelligent
    const scoredResults = allResults.map(result => ({
      ...result,
      relevanceScore: calculateRelevanceScore(result, searchQuery)
    }));

    // Tri par pertinence et dédoublonnage
    const uniqueResults = scoredResults
      .filter((result, index, self) => 
        index === self.findIndex(r => r.id === result.id)
      )
      .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
      .slice(0, maxResults);

    return uniqueResults;
  }, [config, popularSuggestions, recentSearches, customSearchProvider, minCharacters, maxResults, showPopularSuggestions, showRecentSearches]);

  // Calcul du score de pertinence
  const calculateRelevanceScore = (result: SearchResult, query: string): number => {
    let score = result.relevanceScore || 0;
    
    const queryLower = query.toLowerCase();
    const titleLower = result.title.toLowerCase();
    const subtitleLower = result.subtitle?.toLowerCase() || '';
    
    // Correspondance exacte du titre
    if (titleLower === queryLower) score += 20;
    // Titre commence par la requête
    else if (titleLower.startsWith(queryLower)) score += 15;
    // Titre contient la requête
    else if (titleLower.includes(queryLower)) score += 10;
    
    // Correspondance dans le sous-titre
    if (subtitleLower.includes(queryLower)) score += 5;
    
    // Boost par type (priorité aux lieux populaires)
    if (result.type === 'popular') score += 8;
    if (result.type === 'location') score += 6;
    if (result.type === 'action') score += 4;
    
    return score;
  };

  // Recherche avec debouncing intelligent
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.length >= minCharacters && isOpen) {
      setIsLoading(true);
      
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const searchResults = await performSearch(query);
          setResults(searchResults);
        } catch (error) {
          console.error('Erreur de recherche:', error);
          setResults([]);
        } finally {
          setIsLoading(false);
        }
      }, debounceMs);
    } else {
      setResults([]);
      setIsLoading(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, isOpen, performSearch, minCharacters, debounceMs]);

  // Gestion des événements
  const handleSearch = (searchQuery: string = query) => {
    onSearch?.(searchQuery);
    setIsOpen(false);
  };

  const handleResultSelect = (result: SearchResult) => {
    setQuery(result.title);
    setIsOpen(false);
    setSelectedIndex(-1);
    onSearchResult(result);
    inputRef.current?.blur();
  };

  const startVoiceSearch = () => {
    if (recognitionRef.current && !isListening) {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const handleFocus = () => {
    setIsOpen(true);
    setFocused(true);
  };

  const handleBlur = () => {
    setFocused(false);
    // Délai pour permettre les clics sur les suggestions
    setTimeout(() => setIsOpen(false), 150);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    const totalOptions = results.length + 
      (query.length === 0 ? popularSuggestions.length + recentSearches.length : 0);

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % totalOptions);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev <= 0 ? totalOptions - 1 : prev - 1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && results[selectedIndex]) {
          handleResultSelect(results[selectedIndex]);
        } else {
          handleSearch();
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Icône par type de résultat
  const getResultIcon = (result: SearchResult) => {
    if (result.icon) {
      const IconComponent = result.icon;
      return <IconComponent className="w-4 h-4" />;
    }

    switch (result.type) {
      case 'location':
        return <MapPin className="w-4 h-4 text-emerald-500" />;
      case 'product':
        return <ShoppingBag className="w-4 h-4 text-blue-500" />;
      case 'user':
        return <Users className="w-4 h-4 text-purple-500" />;
      case 'action':
        return <Settings className="w-4 h-4 text-orange-500" />;
      case 'popular':
        return <Star className="w-4 h-4 text-amber-500" />;
      default:
        return <Search className="w-4 h-4 text-muted-foreground" />;
    }
  };

  // Mise en évidence des correspondances
  const highlightMatch = (text: string, query: string) => {
    if (!query || query.length < 2) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-primary/20 text-primary font-medium rounded-sm px-0.5">
          {part}
        </mark>
      ) : part
    );
  };

  return (
    <div className={cn("relative", className)}>
      {/* Barre de recherche moderne */}
      <div className="relative group">
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
          <Search className={cn(
            "h-5 w-5 transition-all duration-200",
            focused ? "text-primary scale-110" : "text-muted-foreground"
          )} />
        </div>
        
        <Input
          ref={inputRef}
          type="text"
          placeholder={config.placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={cn(
            "pl-12 pr-20 h-14 bg-white border-0 rounded-2xl text-base placeholder:text-muted-foreground",
            "transition-all duration-200",
            focused 
              ? "ring-2 ring-primary/30 shadow-lg" 
              : "ring-1 ring-border shadow-sm"
          )}
          autoFocus={autoFocus}
        />

        {/* Boutons d'action */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
          {/* Effacer */}
          {query && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setQuery('')}
              className="h-8 w-8 p-0 rounded-full hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </Button>
          )}

          {/* Recherche vocale */}
          {enableVoiceSearch && recognitionRef.current && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={startVoiceSearch}
              disabled={isListening}
              className={cn(
                "h-8 w-8 p-0 rounded-full hover:bg-primary/10",
                isListening && "bg-primary text-primary-foreground animate-pulse"
              )}
            >
              <Mic className="h-4 w-4" />
            </Button>
          )}

          {/* Indicateur de chargement */}
          {isLoading && (
            <Loader2 className="h-4 w-4 text-primary animate-spin" />
          )}
        </div>

        {/* Effet de brillance */}
        <div className={cn(
          "absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/20 to-transparent",
          "transition-opacity duration-300 pointer-events-none",
          focused ? "opacity-100" : "opacity-0 group-hover:opacity-50"
        )} />
      </div>

      {/* Dropdown de suggestions moderne */}
      {isOpen && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 max-h-96 overflow-hidden bg-white shadow-xl border-0">
          <div ref={dropdownRef} className="max-h-96 overflow-y-auto scrollbar-hide">
            {/* État d'écoute vocale */}
            {isListening && (
              <div className="p-4 bg-primary/5 border-b">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-primary rounded-full animate-pulse" />
                  <span className="text-sm font-medium text-primary">
                    Parlez maintenant...
                  </span>
                </div>
              </div>
            )}

            {/* Suggestions instantanées (sans query) */}
            {query.length === 0 && (
              <div className="p-4">
                {/* Suggestions populaires */}
                {showPopularSuggestions && popularSuggestions.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                      <Star className="h-4 w-4" />
                      Suggestions populaires
                    </h3>
                    <div className="space-y-1">
                      {popularSuggestions.slice(0, 4).map((suggestion) => (
                        <button
                          key={suggestion.id}
                          onClick={() => handleResultSelect(suggestion)}
                          className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-primary/5 transition-colors text-left group"
                        >
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                            {getResultIcon(suggestion)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground truncate">{suggestion.title}</p>
                            {suggestion.subtitle && (
                              <p className="text-sm text-muted-foreground truncate">{suggestion.subtitle}</p>
                            )}
                          </div>
                          {suggestion.badge && (
                            <Badge variant={suggestion.badge.variant} className="text-xs">
                              {suggestion.badge.text}
                            </Badge>
                          )}
                          <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recherches récentes */}
                {showRecentSearches && recentSearches.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Recherches récentes
                    </h3>
                    <div className="space-y-1">
                      {recentSearches.slice(0, 3).map((recent) => (
                        <button
                          key={recent.id}
                          onClick={() => handleResultSelect(recent)}
                          className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors text-left group"
                        >
                          <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground truncate">{recent.title}</p>
                            {recent.subtitle && (
                              <p className="text-sm text-muted-foreground truncate">{recent.subtitle}</p>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Résultats de recherche */}
            {query.length >= minCharacters && (
              <div className="p-4">
                {isLoading ? (
                  <div className="flex items-center justify-center p-6">
                    <Loader2 className="w-6 h-6 text-primary animate-spin" />
                  </div>
                ) : results.length > 0 ? (
                  <>
                    <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                      <Search className="h-4 w-4" />
                      Résultats ({results.length})
                    </h3>
                    <div className="space-y-1">
                      {results.map((result, index) => (
                        <button
                          key={result.id}
                          onClick={() => handleResultSelect(result)}
                          className={cn(
                            "w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left group",
                            selectedIndex === index 
                              ? "bg-primary/10 ring-1 ring-primary/20" 
                              : "hover:bg-primary/5"
                          )}
                        >
                          <div className="w-10 h-10 bg-muted/50 rounded-full flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                            {getResultIcon(result)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground truncate">
                              {highlightMatch(result.title, query)}
                            </p>
                            {result.subtitle && (
                              <p className="text-sm text-muted-foreground truncate">
                                {highlightMatch(result.subtitle, query)}
                              </p>
                            )}
                            {result.category && (
                              <p className="text-xs text-muted-foreground/70">
                                {result.category}
                              </p>
                            )}
                          </div>
                          {result.badge && (
                            <Badge 
                              variant={result.badge.variant} 
                              className="text-xs"
                              style={result.badge.color ? { backgroundColor: result.badge.color } : {}}
                            >
                              {result.badge.text}
                            </Badge>
                          )}
                          <Zap className="h-4 w-4 text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center p-6">
                    <Search className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                    <p className="text-muted-foreground">Aucun résultat trouvé</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Essayez avec d'autres mots-clés
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};