/**
 * Composant unifié de sélection de localisation
 * Remplace UltimateLocationPicker et unifie avec la livraison
 * Interface épurée avec géolocalisation précise
 */

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSimpleLocation, type SimpleLocationSearchResult } from '@/hooks/useUnifiedLocation';
import { LocationData } from '@/types/location';
import { MapPin, Navigation, Search, Loader2, Clock, Star } from 'lucide-react';

interface ModernLocationInputProps {
  value?: LocationData | null;
  onChange: (location: LocationData | null) => void;
  placeholder?: string;
  label?: string;
  context?: 'pickup' | 'destination' | 'delivery' | 'general';
  autoDetect?: boolean;
  className?: string;
}

export const ModernLocationInput: React.FC<ModernLocationInputProps> = ({
  value,
  onChange,
  placeholder = "Rechercher une adresse...",
  label,
  context = 'general',
  autoDetect = false,
  className = ""
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SimpleLocationSearchResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  
  const {
    getCurrentPosition,
    searchLocations,
    getPopularPlaces,
    loading: locationLoading,
    error,
    clearError
  } = useSimpleLocation();

  // Ne jamais synchroniser automatiquement - chaque champ reste indépendant
  // Empêcher complètement la propagation d'état entre pickup et destination

  // Réinitialiser query pour destination pour éviter la pollution entre champs
  useEffect(() => {
    if (context === 'destination') {
      setQuery('');
    }
  }, [context]);

  // Auto-détection de position seulement si explicitement demandée via navigation
  useEffect(() => {
    if (autoDetect && !value && context === 'pickup') {
      // Ne déclencher que pour pickup et si aucune valeur n'est déjà définie
      handleGetCurrentLocation();
    }
  }, [autoDetect, value, context]);

  // Search avec debounce
  useEffect(() => {
    if (query.length < 2) {
      setSuggestions(getPopularPlaces());
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchLocations(query);
        setSuggestions(results);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, searchLocations, getPopularPlaces]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    setShowSuggestions(true);
    
    // Toujours nettoyer la sélection quand l'utilisateur tape
    onChange(null);
  };

  const handleLocationSelect = (location: LocationData | SimpleLocationSearchResult) => {
    const locationData: LocationData = {
      address: location.address,
      lat: location.lat,
      lng: location.lng,
      type: 'title' in location ? 'geocoded' : (location.type as any),
      placeId: 'id' in location ? location.id : undefined,
      name: ('title' in location ? location.title : location.name) || location.address
    };
    
    // Pour destination, ne jamais garder l'affichage si c'est la même adresse que pickup
    if (context === 'destination') {
      setQuery(location.address);
    } else {
      setQuery(location.address);
    }
    
    setShowSuggestions(false);
    onChange(locationData);
    inputRef.current?.blur();
  };

  const handleGetCurrentLocation = async () => {
    try {
      clearError();
      // Force une nouvelle position GPS précise (pas de cache)
      const position = await getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0  // Pas de cache, position fraîche
      });
      
      if (position) {
        const enhancedPosition: SimpleLocationSearchResult = {
          ...position,
          id: `current-${Date.now()}`,
          title: position.address
        };
        handleLocationSelect(enhancedPosition);
      }
    } catch (err) {
      console.error('Erreur géolocalisation précise:', err);
    }
  };

  const getContextIcon = () => {
    switch (context) {
      case 'pickup':
        return <Navigation className="h-4 w-4 text-primary" />;
      case 'destination':
        return <MapPin className="h-4 w-4 text-secondary" />;
      case 'delivery':
        return <MapPin className="h-4 w-4 text-accent" />;
      default:
        return <Search className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getPlaceIcon = (type?: string) => {
    if (type === 'popular') return <Star className="h-4 w-4 text-yellow-500" />;
    if (type === 'recent') return <Clock className="h-4 w-4 text-blue-500" />;
    return <MapPin className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <div className={`relative space-y-2 overflow-hidden ${className}`}>
      {label && (
        <label className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      
      <div className="relative overflow-hidden">
        <div className="relative overflow-hidden">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
            {getContextIcon()}
          </div>
          
          <Input
            ref={inputRef}
            value={query}
            onChange={handleInputChange}
            onFocus={() => setShowSuggestions(true)}
            placeholder={placeholder}
            className="pl-10 pr-16 bg-background/80 backdrop-blur-sm border-border/50 focus:border-primary focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleGetCurrentLocation}
            disabled={locationLoading}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
          >
            {locationLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Navigation className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Status géolocalisation */}
        {locationLoading && (
          <div className="mt-2 text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 className="h-3 w-3 animate-spin" />
            Localisation en cours...
          </div>
        )}

        {error && (
          <div className="mt-2 text-sm text-destructive">
            {error}
          </div>
        )}
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowSuggestions(false)}
          />
          
          <Card className="absolute top-full left-0 right-0 z-20 mt-1 bg-background border border-border shadow-lg max-h-80 overflow-hidden">
            <CardContent className="p-0">
              {isSearching ? (
                <div className="p-4 text-center">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mt-2">Recherche...</p>
                </div>
              ) : suggestions.length > 0 ? (
                <div className="max-h-80 overflow-y-auto">
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={suggestion.id || index}
                      onClick={() => handleLocationSelect(suggestion)}
                      className="p-3 hover:bg-muted/50 cursor-pointer border-b border-border/20 last:border-0 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          {getPlaceIcon(suggestion.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {suggestion.title || suggestion.address}
                          </p>
                          {suggestion.subtitle && (
                            <p className="text-xs text-muted-foreground truncate">
                              {suggestion.subtitle}
                            </p>
                          )}
                        </div>
                        {suggestion.type === 'default' && (
                          <Badge variant="secondary" className="text-xs">
                            Populaire
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : query.length >= 2 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Aucun résultat trouvé
                </div>
              ) : (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Lieux populaires
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default ModernLocationInput;