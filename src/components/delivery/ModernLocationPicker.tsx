import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSmartGeolocation, LocationData, LocationSearchResult } from '@/hooks/useSmartGeolocation';
import { MapPin, Search, Loader2, Navigation } from 'lucide-react';

interface ModernLocationPickerProps {
  value?: LocationData | null;
  onChange: (location: LocationData | null) => void;
  placeholder?: string;
  label?: string;
  context?: 'pickup' | 'delivery' | 'general';
}

export const ModernLocationPicker: React.FC<ModernLocationPickerProps> = ({
  value,
  onChange,
  placeholder = "Rechercher une adresse...",
  label,
  context = 'general'
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<LocationSearchResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const { getCurrentPosition, searchLocations, loading, getPopularPlaces } = useSmartGeolocation();

  // Synchroniser query avec value pour éviter les conflits d'affichage
  React.useEffect(() => {
    if (!value) {
      setQuery('');
    }
  }, [value]);

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery);
    
    if (searchQuery.trim()) {
      searchLocations(searchQuery).then(results => {
        setSuggestions(results);
        setShowSuggestions(true);
      });
    } else {
      setSuggestions(getPopularPlaces());
      setShowSuggestions(true);
    }
  };

  const handleLocationSelect = (location: LocationData | LocationSearchResult) => {
    const locationData: LocationData = {
      address: location.address,
      lat: location.lat,
      lng: location.lng,
      type: location.type
    };
    
    onChange(locationData);
    setQuery(location.address);
    setShowSuggestions(false);
  };

  const handleGetCurrentLocation = async () => {
    try {
      console.log('🎯 Démarrage géolocalisation...');
      setQuery('Détection de votre position...'); // Feedback visuel
      
      const position = await getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000 // 15 secondes
      });
      
      if (position) {
        console.log('✅ Position obtenue:', position);
        setQuery(''); // Vider la barre de recherche après succès
        setShowSuggestions(false);
        handleLocationSelect(position);
      }
    } catch (error) {
      console.error('❌ Erreur géolocalisation:', error);
      setQuery(''); // Vider même en cas d'erreur
      // Afficher un message d'erreur à l'utilisateur
      alert('Impossible de détecter votre position. Veuillez saisir votre adresse manuellement.');
    }
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
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            {/* Icône de recherche */}
            <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
              <Search className="h-5 w-5 text-muted-foreground/50" />
            </div>
            
            {/* Champ de saisie ultra-moderne */}
            <Input
              value={displayValue}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder={placeholder}
              onFocus={() => {
                if (!showSuggestions) {
                  setSuggestions(getPopularPlaces());
                  setShowSuggestions(true);
                }
              }}
              className="h-14 pl-12 pr-4 text-base bg-background border-2 border-border/30 
                rounded-full shadow-sm hover:shadow-md
                hover:border-primary/40 focus:border-primary focus:ring-4 focus:ring-primary/10
                transition-all duration-300 placeholder:text-muted-foreground/50"
              disabled={loading && query === 'Détection de votre position...'}
            />
          </div>
          
          {/* Bouton de géolocalisation - Cercle moderne et dynamique */}
          <button
            type="button"
            onClick={handleGetCurrentLocation}
            disabled={loading}
            className="flex-shrink-0 w-14 h-14 
              bg-primary/10 backdrop-blur-sm border-2 border-primary/30
              rounded-full hover:bg-primary/20 hover:border-primary/50 hover:scale-110
              active:scale-95 transition-all duration-300 
              disabled:opacity-50 disabled:hover:scale-100
              shadow-lg hover:shadow-xl hover:shadow-primary/20
              flex items-center justify-center group"
            aria-label="Utiliser ma position actuelle"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            ) : (
              <Navigation className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
            )}
          </button>
        </div>

        {/* Suggestions - Design moderne */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-2 bg-background/95 backdrop-blur-md 
            border border-border/40 rounded-[24px] shadow-xl max-h-60 overflow-y-auto
            transition-all duration-300">
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion.id || index}
                type="button"
                className="w-full px-4 py-3 text-left hover:bg-accent/50 transition-colors 
                  border-b border-border/20 last:border-b-0 flex items-start gap-3 group
                  first:rounded-t-[24px] last:rounded-b-[24px]"
                onClick={() => handleLocationSelect(suggestion)}
              >
                <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0 
                  group-hover:scale-110 transition-transform" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-foreground truncate text-sm">
                    {(suggestion as any).title || suggestion.address}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {(suggestion as any).subtitle || 'Kinshasa'}
                  </div>
                </div>
              </button>
            ))}
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