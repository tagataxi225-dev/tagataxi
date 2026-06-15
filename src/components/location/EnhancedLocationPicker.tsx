/**
 * Sélecteur de localisation unifié et amélioré pour Tembea
 * Remplace ModernLocationPicker avec une meilleure intégration
 */

import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Clock, Search, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { enhancedLocationService } from '@/services/enhancedLocationService';
import { 
  UnifiedLocation, 
  LocationSearchResult,
  getCurrentCity,
  SUPPORTED_CITIES 
} from '@/types/unifiedLocation';
import type { LocationSearchResult as SmartLocationResult } from '@/hooks/useSmartGeolocation';

// Conversion function from SmartLocationResult to unified LocationSearchResult
const convertToUnifiedResult = (result: SmartLocationResult): LocationSearchResult => ({
  id: result.id,
  name: result.name || result.address,
  address: result.address,
  coordinates: { lat: result.lat, lng: result.lng },
  subtitle: result.subtitle,
  type: result.type === 'default' || result.type === 'gps' || result.type === 'ip' || result.type === 'fallback' ? 'geocoded' : result.type as any || 'geocoded',
  placeId: result.placeId,
  accuracy: result.accuracy,
  confidence: result.confidence,
  badge: result.isPopular ? 'Populaire' : undefined,
  relevanceScore: result.relevanceScore || 80,
  popularityScore: result.isPopular ? 90 : 50,
  distanceFromUser: result.distance
});

interface EnhancedLocationPickerProps {
  value?: UnifiedLocation | null;
  onChange: (location: UnifiedLocation | null) => void;
  placeholder?: string;
  label?: string;
  context?: 'pickup' | 'delivery' | 'general';
  city?: string;
  showCurrentLocationButton?: boolean;
  showCitySelector?: boolean;
  className?: string;
}

export default function EnhancedLocationPicker({
  value,
  onChange,
  placeholder = "Rechercher une adresse...",
  label,
  context = 'general',
  city: initialCity,
  showCurrentLocationButton = true,
  showCitySelector = false,
  className = ""
}: EnhancedLocationPickerProps) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<LocationSearchResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCity, setSelectedCity] = useState(initialCity || getCurrentCity().name);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // Synchroniser le query avec la valeur sélectionnée
  useEffect(() => {
    if (value && !isSearching) {
      setQuery(value.name);
    } else if (!value) {
      setQuery('');
    }
  }, [value, isSearching]);

  // Recherche avec debounce
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (query.length >= 2) {
        setIsSearching(true);
        try {
          const results = await enhancedLocationService.searchLocations(query, selectedCity);
          setSuggestions(results.map(convertToUnifiedResult));
          setShowSuggestions(true);
        } catch (error) {
          console.error('Search error:', error);
          setSuggestions([]);
        } finally {
          setIsSearching(false);
        }
      } else if (query.length === 0) {
        // Afficher les lieux populaires si recherche vide
        try {
          const popular = await enhancedLocationService.getPopularLocations(selectedCity, 6);
          setSuggestions(popular.map(convertToUnifiedResult));
          setShowSuggestions(query.length === 0 && suggestions.length === 0);
        } catch (error) {
          console.error('Popular places error:', error);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, selectedCity]);

  // Fermer les suggestions en cliquant à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleQueryChange = (newQuery: string) => {
    setQuery(newQuery);
    if (!newQuery) {
      onChange(null);
    }
  };

  const handleLocationSelect = async (location: LocationSearchResult) => {
    setQuery(location.name);
    setShowSuggestions(false);
    
    // Convertir en UnifiedLocation
    const unifiedLocation: UnifiedLocation = {
      id: location.id,
      name: location.name,
      address: location.address,
      coordinates: location.coordinates,
      subtitle: location.subtitle,
      type: location.type
    };

    onChange(unifiedLocation);
    
    // Sauvegarder dans l'historique (si implémenté)
    try {
      // await enhancedLocationService.saveSearchToHistory(location);
    } catch (error) {
      console.warn('Failed to save to history:', error);
    }
  };

  const handleGetCurrentLocation = async () => {
    setIsGettingLocation(true);
    try {
      const currentLocation = await enhancedLocationService.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000,
        fallbackToDefault: true
      });

      handleLocationSelect(convertToUnifiedResult(currentLocation));

      toast({
        title: "Position trouvée",
        description: "Votre position actuelle a été détectée"
      });
    } catch (error) {
      console.error('Geolocation error:', error);
      toast({
        title: "Erreur de géolocalisation",
        description: "Impossible de détecter votre position. Veuillez saisir une adresse.",
        variant: "destructive"
      });
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleFocus = async () => {
    if (suggestions.length === 0 && query.length < 2) {
      try {
        const popular = await enhancedLocationService.getPopularLocations(selectedCity, 6);
        setSuggestions(popular.map(convertToUnifiedResult));
        setShowSuggestions(true);
      } catch (error) {
        console.error('Popular places error:', error);
      }
    } else {
      setShowSuggestions(true);
    }
  };

  const getLocationIcon = (type: string, category?: string) => {
    switch (type) {
      case 'current': return <Navigation className="w-4 h-4 text-blue-500" />;
      case 'popular': return <Clock className="w-4 h-4 text-green-500" />;
      case 'google': return <MapPin className="w-4 h-4 text-red-500" />;
      default: return <MapPin className="w-4 h-4 text-gray-500" />;
    }
  };

  const getBadgeColor = (badge?: string) => {
    switch (badge?.toLowerCase()) {
      case 'populaire': return 'bg-green-500/20 text-green-700 dark:text-green-400';
      case 'google': return 'bg-red-500/20 text-red-700 dark:text-red-400';
      case 'vérifié': return 'bg-blue-500/20 text-blue-700 dark:text-blue-400';
      default: return 'bg-gray-500/20 text-gray-700 dark:text-gray-400';
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-foreground mb-2">
          {label}
        </label>
      )}

      {/* Sélecteur de ville (optionnel) */}
      {showCitySelector && (
        <div className="mb-3">
          <select
            value={selectedCity}
            onChange={(e) => {
              setSelectedCity(e.target.value);
              enhancedLocationService.setCurrentCity(e.target.value);
              setSuggestions([]);
              setShowSuggestions(false);
            }}
            className="w-full p-2 text-sm border border-border/20 bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            {Object.values(SUPPORTED_CITIES).map(city => (
              <option key={city.code} value={city.name}>
                {city.name} ({city.countryCode})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Input principal */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              onFocus={handleFocus}
              placeholder={placeholder}
              className="pl-10 pr-8"
              disabled={isGettingLocation}
            />
            {query && (
              <button
                onClick={() => {
                  setQuery('');
                  onChange(null);
                  setSuggestions([]);
                  setShowSuggestions(false);
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Loading indicator */}
          {isSearching && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
            </div>
          )}
        </div>

        {/* Bouton position actuelle */}
        {showCurrentLocationButton && (
          <Button
            variant="outline"
            size="icon"
            onClick={handleGetCurrentLocation}
            disabled={isGettingLocation}
            className="flex-shrink-0"
            title="Utiliser ma position actuelle"
          >
            {isGettingLocation ? (
              <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
            ) : (
              <Navigation className="w-4 h-4" />
            )}
          </Button>
        )}
      </div>

      {/* Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <Card 
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-1 border border-border/20 bg-background shadow-lg z-50 max-h-64 overflow-y-auto"
        >
          <div className="p-2">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className="flex items-center gap-3 p-3 hover:bg-accent/50 cursor-pointer rounded-md transition-colors"
                onClick={() => handleLocationSelect(suggestion)}
              >
                <div className="flex-shrink-0">
                  {getLocationIcon(suggestion.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground truncate">
                      {suggestion.name}
                    </span>
                    {suggestion.badge && (
                      <Badge 
                        variant="secondary" 
                        className={`text-xs px-2 py-0.5 ${getBadgeColor(suggestion.badge)}`}
                      >
                        {suggestion.badge}
                      </Badge>
                    )}
                  </div>
                  {suggestion.subtitle && (
                    <div className="text-xs text-muted-foreground truncate">
                      {suggestion.subtitle}
                    </div>
                  )}
                  {suggestion.distanceFromUser && (
                    <div className="text-xs text-blue-600 dark:text-blue-400">
                      {enhancedLocationService.formatDistance(suggestion.distanceFromUser)}
                    </div>
                  )}
                </div>

                <div className="flex-shrink-0 text-xs text-muted-foreground">
                  {suggestion.relevanceScore}%
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Message d'état si pas de suggestions */}
      {showSuggestions && suggestions.length === 0 && query.length >= 2 && !isSearching && (
        <Card className="absolute top-full left-0 right-0 mt-1 border border-border/20 bg-background shadow-lg z-50">
          <div className="p-4 text-center text-muted-foreground">
            Aucun résultat trouvé pour "{query}"
          </div>
        </Card>
      )}

      {/* Affichage de la sélection actuelle avec plus de détails */}
      {value && value.coordinates && (
        <div className="mt-2 p-2 bg-accent/30 rounded-md text-sm">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-medium">{value.name}</span>
              {value.subtitle && (
                <div className="text-xs text-muted-foreground">{value.subtitle}</div>
              )}
            </div>
            {value.confidence && (
              <div className="text-xs text-muted-foreground">
                Confiance: {Math.round(value.confidence * 100)}%
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}