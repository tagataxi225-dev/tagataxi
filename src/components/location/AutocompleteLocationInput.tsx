import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Clock, Building2, Car, Utensils, ShoppingBag, X, Star } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useGooglePlacesAutocomplete } from '@/hooks/useGooglePlacesAutocomplete';
import type { UnifiedLocation } from '@/types/unifiedLocation';
import { CurrentLocationButton } from '@/components/ui/CurrentLocationButton';
import { type LocationData, useSmartGeolocation } from '@/hooks/useSmartGeolocation';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';

interface AutocompleteLocationInputProps {
  value?: UnifiedLocation | null;
  onChange: (location: UnifiedLocation | null) => void;
  placeholder?: string;
  className?: string;
  onLocationBias?: { lat: number; lng: number };
  types?: string[];
  showRecentSearches?: boolean;
  locationContext?: 'pickup' | 'delivery' | 'taxi-start' | 'taxi-destination' | 'general';
  showCurrentLocationButton?: boolean;
}

const getPlaceIcon = (types: string[]) => {
  if (types.includes('restaurant') || types.includes('food') || types.includes('meal_takeaway')) {
    return <Utensils className="h-4 w-4 text-orange-500" />;
  }
  if (types.includes('lodging') || types.includes('hotel')) {
    return <Building2 className="h-4 w-4 text-blue-500" />;
  }
  if (types.includes('store') || types.includes('shopping_mall') || types.includes('establishment')) {
    return <ShoppingBag className="h-4 w-4 text-green-500" />;
  }
  if (types.includes('gas_station') || types.includes('car_repair')) {
    return <Car className="h-4 w-4 text-purple-500" />;
  }
  return <MapPin className="h-4 w-4 text-muted-foreground" />;
};

const highlightMatch = (text: string, matchedSubstrings: Array<{ offset: number; length: number }>) => {
  if (!matchedSubstrings || matchedSubstrings.length === 0) {
    return <span>{text}</span>;
  }

  const parts = [];
  let lastIndex = 0;

  matchedSubstrings.forEach(({ offset, length }) => {
    if (offset > lastIndex) {
      parts.push(
        <span key={`text-${lastIndex}`}>
          {text.substring(lastIndex, offset)}
        </span>
      );
    }
    parts.push(
      <span key={`match-${offset}`} className="font-medium text-foreground">
        {text.substring(offset, offset + length)}
      </span>
    );
    lastIndex = offset + length;
  });

  if (lastIndex < text.length) {
    parts.push(
      <span key={`text-${lastIndex}`}>
        {text.substring(lastIndex)}
      </span>
    );
  }

  return <>{parts}</>;
};

export const AutocompleteLocationInput = React.forwardRef<HTMLInputElement, AutocompleteLocationInputProps>(({
  value,
  onChange,
  placeholder = "Rechercher une adresse ou un lieu...",
  className,
  onLocationBias,
  types = [],
  showRecentSearches = true,
  locationContext = 'general',
  showCurrentLocationButton = true
}, forwardedRef) => {
  const [query, setQuery] = useState(value?.name || '');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState<UnifiedLocation[]>([]);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const { predictions, isLoading, error, search, getPlaceDetails, clearPredictions } = useGooglePlacesAutocomplete({
    location: onLocationBias,
    types,
    debounceMs: 500
  });

  const { getPopularPlaces } = useSmartGeolocation();

  // Load recent searches from localStorage
  useEffect(() => {
    if (showRecentSearches) {
      try {
        const stored = localStorage.getItem('kwenda-recent-searches');
        if (stored) {
          setRecentSearches(JSON.parse(stored).slice(0, 5));
        }
      } catch (error) {
        console.error('Error loading recent searches:', error);
      }
    }
  }, [showRecentSearches]);

  // Save to recent searches
  const saveToRecentSearches = (location: UnifiedLocation) => {
    if (!showRecentSearches) return;
    
    try {
      const existing = recentSearches.filter(item => item.id !== location.id);
      const updated = [location, ...existing].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem('kwenda-recent-searches', JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving recent search:', error);
    }
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    
    if (newQuery.trim().length >= 2) {
      search(newQuery);
      setShowSuggestions(true);
    } else {
      clearPredictions();
      setShowSuggestions(newQuery.length === 0 && recentSearches.length > 0);
    }
  };

  // Handle prediction selection
  const handlePredictionSelect = async (prediction: any) => {
    console.log('🔍 [Autocomplete] Prédiction sélectionnée:', prediction);
    
    try {
      setQuery(prediction.description);
      setShowSuggestions(false);
      
      // Get place details
      const placeDetails = await getPlaceDetails(prediction.placeId);
      console.log('📍 [Autocomplete] Détails reçus:', placeDetails);
      
      if (placeDetails) {
        console.log('✅ [Autocomplete] Coordonnées:', placeDetails.coordinates);
        
        // Validation des coordonnées
      if (placeDetails.coordinates.lat === 0 && placeDetails.coordinates.lng === 0) {
        console.error('❌ Coordonnées invalides (0,0)');
        
        toast({
          title: "⚠️ Impossible de localiser cette adresse",
          description: (
            <div className="space-y-2">
              <p>Google Maps n'a pas pu trouver les coordonnées précises.</p>
              <p className="text-xs font-medium mt-2">💡 Solutions :</p>
              <ul className="text-xs list-disc list-inside space-y-1">
                <li>Utilisez le bouton GPS (icône cible)</li>
                <li>Choisissez un lieu populaire ci-dessous</li>
                <li>Tapez un nom de rue ou bâtiment connu</li>
              </ul>
            </div>
          ),
          variant: "destructive",
          duration: 8000
        });
        
        setShowSuggestions(true);
        clearPredictions();
        
        return;
      }
        
        const location: UnifiedLocation = {
          id: placeDetails.id,
          name: placeDetails.name || prediction.structuredFormatting.mainText,
          address: placeDetails.address,
          coordinates: placeDetails.coordinates,
          subtitle: prediction.structuredFormatting.secondaryText,
          type: 'google' as const,
          placeId: placeDetails.placeId
        };

        onChange(location);
        saveToRecentSearches(location);
      }
    } catch (error) {
      console.error('❌ [Autocomplete] Erreur sélection:', error);
    }
  };

  // Handle recent search selection
  const handleRecentSelect = (location: UnifiedLocation) => {
    setQuery(location.name);
    setShowSuggestions(false);
    onChange(location);
  };

  // Handle input focus
  const handleFocus = () => {
    if (query.length === 0 && recentSearches.length > 0) {
      setShowSuggestions(true);
    } else if (predictions.length > 0) {
      setShowSuggestions(true);
    }
  };

  // Handle clear input
  const handleClear = () => {
    setQuery('');
    setShowSuggestions(false);
    clearPredictions();
    onChange(null);
    inputRef.current?.focus();
  };

  // Handle current location selection
  const handleCurrentLocationSelect = (location: LocationData) => {
    // Utiliser le nom court (quartier/ville) au lieu de l'adresse complète
    const shortName = location.name && location.name !== location.address 
      ? location.name 
      : location.address?.split(',').slice(0, 2).join(', ') || location.address;
    
    const unifiedLocation: UnifiedLocation = {
      id: `gps-${Date.now()}`,
      name: shortName,
      address: location.address,
      coordinates: { lat: location.lat, lng: location.lng },
      type: 'current',
      placeId: location.placeId
    };
    
    setQuery(shortName);
    onChange(unifiedLocation);
    setShowSuggestions(false);
    
    // Save to recent searches
    saveToRecentSearches(unifiedLocation);
  };

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={cn("relative", className)}>
      <div className="relative flex items-center gap-2">
        {/* Icône de recherche */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
          <Search className="h-5 w-5 text-muted-foreground/50" />
        </div>
        
        {/* Champ de saisie ultra-moderne */}
        <Input
          ref={inputRef}
          value={query}
          onChange={handleInputChange}
          onFocus={handleFocus}
          placeholder={placeholder}
          className={cn(
            "h-14 pl-12 text-base bg-background border-2 border-border/30",
            "rounded-full shadow-sm hover:shadow-md",
            "hover:border-primary/40 focus:border-primary focus:ring-4 focus:ring-primary/10",
            "transition-all duration-300",
            "placeholder:text-muted-foreground/50",
            showCurrentLocationButton ? (query ? "pr-20" : "pr-16") : (query ? "pr-12" : "pr-4")
          )}
        />
        
        {/* Bouton d'effacement - dans le champ */}
        {query && (
          <button
            onClick={handleClear}
            className={cn(
              "absolute top-1/2 -translate-y-1/2 p-2",
              "hover:bg-accent rounded-full transition-all duration-200",
              "hover:scale-110 active:scale-95 z-10",
              showCurrentLocationButton ? "right-14" : "right-2"
            )}
            aria-label="Effacer"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        )}

        {/* Bouton de géolocalisation - Cercle moderne et dynamique */}
        {showCurrentLocationButton && (
          <div className="absolute right-1 top-1/2 -translate-y-1/2">
            <CurrentLocationButton
              onLocationSelect={handleCurrentLocationSelect}
              context={locationContext}
              variant="icon-only"
              className="h-12 w-12 border-2 border-primary/30 bg-primary/10 hover:bg-primary/20 
                hover:border-primary/50 hover:scale-110 active:scale-95
                text-primary shadow-lg hover:shadow-xl hover:shadow-primary/20 
                transition-all duration-300 rounded-full"
              showAccuracy={false}
            />
          </div>
        )}
      </div>

        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-full backdrop-blur-sm">
              <span className="text-xs font-medium text-primary">Recherche...</span>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
            </div>
          </div>
        )}

      {/* Error message */}
      {error && (
        <div className="absolute top-full left-0 right-0 mt-1 p-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md z-50">
          {error}
        </div>
      )}

      {/* Suggestions dropdown - Design moderne */}
      {showSuggestions && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-2 bg-background/95 backdrop-blur-md 
            border border-border/40 rounded-[24px] shadow-xl z-50 max-h-80 overflow-y-auto
            transition-all duration-300"
        >
          {/* Recent searches */}
          {query.length === 0 && recentSearches.length > 0 && (
            <>
              <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-b bg-muted/30">
                <Clock className="inline h-3 w-3 mr-1" />
                Recherches récentes
              </div>
              {recentSearches.map((location) => (
                <button
                  key={location.id}
                  onClick={() => handleRecentSelect(location)}
                  className="w-full px-3 py-2 text-left hover:bg-muted/50 focus:bg-muted/50 focus:outline-none transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{location.name}</div>
                      {location.subtitle && (
                        <div className="text-xs text-muted-foreground truncate">{location.subtitle}</div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </>
          )}

          {/* Autocomplete predictions */}
          {predictions.length > 0 && (
            <>
              {query.length === 0 && recentSearches.length > 0 && (
                <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-b bg-muted/30">
                  <Search className="inline h-3 w-3 mr-1" />
                  Suggestions
                </div>
              )}
              {predictions.map((prediction) => (
                <button
                  key={prediction.placeId}
                  onClick={() => handlePredictionSelect(prediction)}
                  className="w-full px-3 py-2 text-left hover:bg-muted/50 focus:bg-muted/50 focus:outline-none transition-colors"
                >
                  <div className="flex items-center justify-between space-x-2">
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      {getPlaceIcon(prediction.types)}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">
                          {highlightMatch(prediction.structuredFormatting.mainText, prediction.matchedSubstrings)}
                        </div>
                        {prediction.structuredFormatting.secondaryText && (
                          <div className="text-xs text-muted-foreground">
                            {prediction.structuredFormatting.secondaryText}
                          </div>
                        )}
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs shrink-0">
                      <Search className="h-3 w-3 mr-1" />
                      Google
                    </Badge>
                  </div>
                </button>
              ))}
            </>
          )}
          
          {/* 🆕 PHASE 2.2: Lieux populaires - TOUJOURS AFFICHÉS en bas si suggestions Google */}
          {predictions.length > 0 && getPopularPlaces().length > 0 && (
            <>
              <div className="border-t border-border my-2" />
              <div className="px-3 py-2 text-xs font-medium text-muted-foreground bg-muted/30">
                <Star className="inline h-3 w-3 mr-1" />
                Ou essayez ces lieux populaires
              </div>
              {getPopularPlaces().slice(0, 3).map((place) => (
                <button
                  key={place.id}
                  onClick={() => {
                    const location: UnifiedLocation = {
                      id: place.id,
                      name: place.name || place.address,
                      address: place.address,
                      coordinates: { lat: place.lat, lng: place.lng },
                      type: 'popular',
                      subtitle: place.subtitle
                    };
                    setQuery(place.address);
                    onChange(location);
                    setShowSuggestions(false);
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-accent/50 transition-colors flex items-start gap-3 group"
                >
                  <div className="mt-0.5 text-yellow-500">
                    <Star className="h-4 w-4 fill-current" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate text-foreground group-hover:text-primary transition-colors">
                      {place.name || place.address}
                    </p>
                    {place.subtitle && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {place.subtitle}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </>
          )}

          {/* Lieux populaires si aucun résultat Google */}
          {query.length >= 2 && predictions.length === 0 && !isLoading && !error && (
            <>
              {getPopularPlaces().length > 0 && (
                <>
                  <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-b bg-muted/30">
                    <Star className="inline h-3 w-3 mr-1" />
                    Lieux populaires
                  </div>
                  {getPopularPlaces().slice(0, 3).map((place) => (
                    <button
                      key={place.id}
                      onClick={() => {
                        const location: UnifiedLocation = {
                          id: place.id,
                          name: place.name || place.address,
                          address: place.address,
                          coordinates: { lat: place.lat, lng: place.lng },
                          type: 'popular',
                          subtitle: place.subtitle
                        };
                        setQuery(place.address);
                        onChange(location);
                        setShowSuggestions(false);
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-muted/50 focus:bg-muted/50 focus:outline-none transition-colors"
                    >
                      <div className="flex items-center justify-between space-x-2">
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{place.name || place.address}</div>
                            {place.subtitle && (
                              <div className="text-xs text-muted-foreground truncate">{place.subtitle}</div>
                            )}
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs shrink-0">
                          Populaire
                        </Badge>
                      </div>
                    </button>
                  ))}
                </>
              )}
            </>
          )}

          {/* No results - message simplifié */}
          {query.length >= 2 && predictions.length === 0 && getPopularPlaces().length === 0 && !isLoading && !error && (
            <div className="px-3 py-4 text-center text-sm text-muted-foreground">
              Aucun résultat pour "{query}"
            </div>
          )}
        </div>
      )}
    </div>
  );
});

AutocompleteLocationInput.displayName = 'AutocompleteLocationInput';

// Export par défaut pour compatibilité
export default AutocompleteLocationInput;