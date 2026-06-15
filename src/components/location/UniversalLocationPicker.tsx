/**
 * 🌍 COMPOSANT DE SÉLECTION DE LOCALISATION UNIVERSELLE
 * Détection automatique de ville et recherche contextuelle
 */

import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2, Navigation, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LocationData, LocationSearchResult, useSmartGeolocation } from '@/hooks/useSmartGeolocation';
import { universalGeolocation } from '@/services/universalGeolocation';

interface UniversalLocationPickerProps {
  value?: LocationData | null;
  onChange?: (location: LocationData) => void;
  placeholder?: string;
  label?: string;
  showAccuracy?: boolean;
  disabled?: boolean;
  className?: string;
}

export function UniversalLocationPicker({
  value,
  onChange,
  placeholder = "Rechercher une adresse...",
  label,
  showAccuracy = false,
  disabled = false,
  className = ""
}: UniversalLocationPickerProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<LocationSearchResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [currentCity, setCurrentCity] = useState<string>('');

  const { 
    currentLocation, 
    loading, 
    error, 
    searchLoading,
    getCurrentPosition, 
    searchLocations,
    getPopularPlaces 
  } = useSmartGeolocation();

  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Détecter la ville actuelle au montage de manière ASYNCHRONE (non-bloquante)
  useEffect(() => {
    // Ville par défaut immédiate
    setCurrentCity('Kinshasa');
    
    // Détection en arrière-plan sans bloquer l'UI
    const detectCity = async () => {
      try {
        const city = await universalGeolocation.detectUserCity();
        setCurrentCity(city.name);
      } catch (error) {
        console.log('Détection ville échouée:', error);
        // Garde le fallback déjà défini
      }
    };
    detectCity(); // Lancer sans attendre
  }, []);

  // Synchroniser avec la valeur externe
  useEffect(() => {
    if (value && !isInputFocused) {
      setQuery(value.address || value.name || '');
    }
  }, [value, isInputFocused]);

  // Gestion de la recherche avec debounce
  const handleSearch = async (searchQuery: string) => {
    setQuery(searchQuery);
    
    if (searchQuery.trim().length === 0) {
      // Afficher les lieux populaires de la ville actuelle
      try {
        const popular = await getPopularPlaces();
        setSuggestions(popular);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Erreur lieux populaires:', error);
        setSuggestions([]);
      }
      return;
    }

    if (searchQuery.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const results = await searchLocations(searchQuery);
      setSuggestions(results);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Erreur recherche:', error);
      setSuggestions([]);
    }
  };

  // Sélection d'une localisation
  const handleLocationSelect = (location: LocationData | LocationSearchResult) => {
    const selectedLocation: LocationData = {
      address: location.address,
      lat: location.lat,
      lng: location.lng,
      type: location.type || 'geocoded',
      placeId: location.placeId,
      accuracy: location.accuracy,
      name: location.name || location.address,
      subtitle: location.subtitle
    };

    setQuery(selectedLocation.address);
    setSuggestions([]);
    setShowSuggestions(false);
    onChange?.(selectedLocation);
  };

  // Obtenir la position actuelle
  const handleGetCurrentLocation = async () => {
    try {
      const position = await getCurrentPosition();
      handleLocationSelect(position);
    } catch (error) {
      console.error('Erreur géolocalisation:', error);
    }
  };

  // Gestion du focus
  const handleFocus = async () => {
    setIsInputFocused(true);
    if (!query.trim()) {
      try {
        const popular = await getPopularPlaces();
        setSuggestions(popular);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Erreur lieux populaires:', error);
      }
    } else {
      setShowSuggestions(suggestions.length > 0);
    }
  };

  // Icône selon le type de suggestion
  const getLocationIcon = (suggestion: LocationSearchResult) => {
    switch (suggestion.type) {
      case 'popular':
        return <Zap className="w-4 h-4 text-primary" />;
      case 'recent':
        return <MapPin className="w-4 h-4 text-muted-foreground" />;
      case 'gps':
        return <Navigation className="w-4 h-4 text-blue-500" />;
      default:
        return <MapPin className="w-4 h-4 text-muted-foreground" />;
    }
  };

  // Gérer les clics en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setIsInputFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className={`relative w-full ${className}`}>
      {label && (
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-foreground">
            {label}
          </label>
          {currentCity && (
            <span className="text-xs text-muted-foreground bg-secondary/50 px-2 py-1 rounded-md">
              📍 {currentCity}
            </span>
          )}
        </div>
      )}

      <div className="relative flex items-center space-x-2">
        {/* Champ de recherche principal */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </div>
          
          <Input
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={handleFocus}
            placeholder={placeholder}
            disabled={disabled}
            className="pl-10 pr-4 py-2 w-full bg-background/50 backdrop-blur-sm border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
          />
          
          {(searchLoading) && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            </div>
          )}
        </div>

        {/* Bouton géolocalisation */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleGetCurrentLocation}
          disabled={disabled || loading}
          className="px-3 py-2 bg-background/50 backdrop-blur-sm border-border/50 hover:bg-primary/10 transition-all duration-200"
          title="Utiliser ma position actuelle"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Navigation className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Indicateur d'erreur */}
      {error && (
        <div className="mt-2 text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
          {error}
        </div>
      )}

      {/* Indicateur de précision */}
      {showAccuracy && value?.accuracy && (
        <div className="mt-2 text-xs text-muted-foreground">
          Précision: ±{Math.round(value.accuracy)}m
        </div>
      )}

      {/* Liste des suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-background/95 backdrop-blur-md border border-border/50 rounded-lg shadow-xl max-h-64 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={`${suggestion.id || suggestion.name}-${index}`}
              onClick={() => handleLocationSelect(suggestion)}
              className="w-full px-4 py-3 text-left hover:bg-secondary/50 focus:bg-secondary/50 focus:outline-none transition-colors duration-150 first:rounded-t-lg last:rounded-b-lg"
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getLocationIcon(suggestion)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-foreground text-sm">
                    {suggestion.title || suggestion.name}
                  </div>
                  <div className="text-muted-foreground text-xs mt-0.5">
                    {suggestion.subtitle}
                  </div>
                  {suggestion.distance !== undefined && (
                    <div className="text-primary text-xs mt-1">
                      📍 ~{suggestion.distance}km
                    </div>
                  )}
                </div>
                {suggestion.isPopular && (
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      Populaire
                    </span>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Overlay pour fermer les suggestions */}
      {showSuggestions && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowSuggestions(false);
            setIsInputFocused(false);
          }}
        />
      )}
    </div>
  );
}