/**
 * 🎯 SÉLECTEUR DE LOCALISATION INTELLIGENT
 * 
 * Composant moderne pour sélectionner des lieux
 * Utilise le service intelligent unifié
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSmartGeolocation, LocationData, LocationSearchResult } from '@/hooks/useSmartGeolocation';
import { MapPin, Search, Loader2, Navigation, Star, Clock } from 'lucide-react';

interface IntelligentLocationPickerProps {
  value?: LocationData | null;
  onChange: (location: LocationData | null) => void;
  placeholder?: string;
  label?: string;
  context?: 'pickup' | 'delivery' | 'general';
  showAccuracy?: boolean;
}

export const IntelligentLocationPicker: React.FC<IntelligentLocationPickerProps> = ({
  value,
  onChange,
  placeholder = "Rechercher une adresse...",
  label,
  context = 'general',
  showAccuracy = false
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<LocationSearchResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const { 
    getCurrentPosition, 
    searchLocations, 
    loading, 
    searchLoading,
    getPopularPlaces,
    error,
    clearError
  } = useSmartGeolocation();

  // Synchroniser query avec value
  useEffect(() => {
    if (!value) {
      setQuery('');
    }
  }, [value]);

  // Gestion de la recherche avec auto-suggestions
  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery);
    
    if (searchQuery.trim()) {
      searchLocations(searchQuery).then(results => {
        setSuggestions(results);
        setShowSuggestions(true);
      });
    } else {
      // Afficher lieux populaires si recherche vide
      setSuggestions(getPopularPlaces());
      setShowSuggestions(true);
    }
  };

  // Sélection d'un lieu
  const handleLocationSelect = (location: LocationData | LocationSearchResult) => {
    const locationData: LocationData = {
      address: location.address,
      lat: location.lat,
      lng: location.lng,
      type: location.type,
      placeId: location.placeId,
      name: location.name,
      subtitle: (location as LocationSearchResult).subtitle
    };
    
    onChange(locationData);
    setQuery(location.address);
    setShowSuggestions(false);
    clearError();
  };

  // Géolocalisation GPS
  const handleGetCurrentLocation = async () => {
    try {
      setQuery('🎯 Détection de votre position...');
      
      const position = await getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 20000,
        fallbackToIP: true,
        fallbackToDefault: true
      });
      
      if (position) {
        setQuery('');
        setShowSuggestions(false);
        handleLocationSelect(position);
      }
    } catch (error) {
      console.error('❌ Erreur géolocalisation:', error);
      setQuery('');
    }
  };

  // Affichage focus avec suggestions populaires
  const handleFocus = () => {
    if (!showSuggestions) {
      setSuggestions(getPopularPlaces());
      setShowSuggestions(true);
    }
  };

  // Icône selon le type de lieu
  const getLocationIcon = (suggestion: LocationSearchResult) => {
    if (suggestion.isPopular) {
      return <Star className="h-4 w-4 text-yellow-500" />;
    }
    if (suggestion.type === 'recent') {
      return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
    return <MapPin className="h-4 w-4 text-primary" />;
  };

  const displayValue = value?.address || query;

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-foreground/80">
          {label}
        </label>
      )}
      
      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              value={displayValue}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder={placeholder}
              onFocus={handleFocus}
              className="pl-10 pr-4"
              disabled={loading && query.includes('Détection')}
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            
            {/* Indicateur de recherche */}
            {searchLoading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-primary" />
            )}
          </div>
          
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleGetCurrentLocation}
            disabled={loading}
            className="shrink-0"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Navigation className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Affichage de l'erreur */}
        {error && (
          <div className="mt-2 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Affichage de la précision */}
        {showAccuracy && value?.accuracy && (
          <div className="mt-1 text-xs text-muted-foreground">
            Précision: ±{Math.round(value.accuracy)}m
          </div>
        )}

        {/* Suggestions intelligentes */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-lg shadow-lg max-h-72 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion.id || index}
                type="button"
                className="w-full px-4 py-3 text-left hover:bg-accent/50 transition-colors border-b border-border/30 last:border-b-0 flex items-start gap-3"
                onClick={() => handleLocationSelect(suggestion)}
              >
                <div className="mt-0.5 flex-shrink-0">
                  {getLocationIcon(suggestion)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-foreground truncate">
                    {suggestion.title || suggestion.name || suggestion.address}
                  </div>
                  <div className="text-sm text-muted-foreground truncate">
                    {suggestion.subtitle || 'Kinshasa, RDC'}
                  </div>
                  {suggestion.isPopular && (
                    <div className="text-xs text-primary/70 mt-1">
                      Lieu populaire
                    </div>
                  )}
                </div>
              </button>
            ))}
            
            {/* Message informatif en bas */}
            <div className="px-4 py-2 text-xs text-muted-foreground bg-muted/30 border-t">
              💡 Utilisez la géolocalisation pour une précision optimale
            </div>
          </div>
        )}
      </div>

      {/* Overlay pour fermer les suggestions */}
      {showSuggestions && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowSuggestions(false)}
        />
      )}
    </div>
  );
};