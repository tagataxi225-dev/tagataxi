import React, { useState, useCallback, useMemo, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MapPin, Search, Loader2, Navigation, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { UnifiedLocation } from '@/types/locationAdapter';

interface StableLocationPickerProps {
  type: 'pickup' | 'destination';
  onLocationSelect: (location: UnifiedLocation) => void;
  selectedLocation: UnifiedLocation | null;
  showCurrentLocation?: boolean;
  autoFocus?: boolean;
}

// Cache pour éviter les recherches répétées
const searchCache = new Map<string, UnifiedLocation[]>();

const StableLocationPicker: React.FC<StableLocationPickerProps> = React.memo(({
  type,
  onLocationSelect,
  selectedLocation,
  showCurrentLocation = false,
  autoFocus = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UnifiedLocation[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>();

  const placeholder = useMemo(() => {
    return type === 'pickup' 
      ? 'Adresse de collecte...' 
      : 'Adresse de livraison...';
  }, [type]);

  const icon = useMemo(() => {
    return type === 'pickup' ? MapPin : MapPin;
  }, [type]);

  const IconComponent = icon;

  // Fonction de recherche avec cache et debounce
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 3) {
      setSearchResults([]);
      return;
    }

    // Vérifier le cache
    const cached = searchCache.get(query.toLowerCase());
    if (cached) {
      setSearchResults(cached);
      return;
    }

    setIsSearching(true);

    try {
      // Simulation d'une recherche - remplacer par votre API
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const mockResults: UnifiedLocation[] = [
        {
          address: `${query} - Avenue Kauka, Kinshasa`,
          lat: -4.3217 + (Math.random() - 0.5) * 0.1,
          lng: 15.3069 + (Math.random() - 0.5) * 0.1,
          type: 'geocoded',
          name: `${query} - Avenue Kauka`,
          subtitle: 'Kinshasa, République Démocratique du Congo'
        },
        {
          address: `${query} - Boulevard du 30 Juin, Kinshasa`,
          lat: -4.3317 + (Math.random() - 0.5) * 0.1,
          lng: 15.2969 + (Math.random() - 0.5) * 0.1,
          type: 'geocoded',
          name: `${query} - Boulevard du 30 Juin`,
          subtitle: 'Kinshasa, République Démocratique du Congo'
        }
      ];

      // Mettre en cache
      searchCache.set(query.toLowerCase(), mockResults);
      setSearchResults(mockResults);

    } catch (error) {
      console.error('Erreur recherche:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Handler de recherche avec debounce
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      performSearch(query);
    }, 500);
  }, [performSearch]);

  // Sélection d'une location
  const handleLocationSelect = useCallback((location: UnifiedLocation) => {
    setSearchQuery(location.address);
    setSearchResults([]);
    onLocationSelect(location);
  }, [onLocationSelect]);

  // Géolocalisation - Utilise GPS natif Capacitor
  const getCurrentLocation = useCallback(async () => {
    setIsGettingLocation(true);
    
    try {
      const { nativeGeolocationService } = await import('@/services/nativeGeolocationService');
      
      const position = await nativeGeolocationService.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      });

      const currentLocation: UnifiedLocation = {
        address: 'Ma position actuelle',
        lat: position.lat,
        lng: position.lng,
        type: 'current',
        name: 'Position actuelle',
        subtitle: `Détectée par ${position.source === 'capacitor' ? 'GPS natif' : 'GPS'}`
      };

      handleLocationSelect(currentLocation);

    } catch (error: any) {
      console.error('Erreur géolocalisation:', error);
    } finally {
      setIsGettingLocation(false);
    }
  }, [handleLocationSelect]);

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <IconComponent className="h-5 w-5 text-primary" />
          <h4 className="font-semibold">
            {type === 'pickup' ? 'Point de collecte' : 'Destination'}
          </h4>
          {selectedLocation && (
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          )}
        </div>

        <div className="space-y-3">
          {/* Barre de recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder={placeholder}
              className="pl-10 h-12"
              autoFocus={autoFocus}
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin" />
            )}
          </div>

          {/* Bouton position actuelle */}
          {showCurrentLocation && (
            <Button
              variant="outline"
              onClick={getCurrentLocation}
              disabled={isGettingLocation}
              className="w-full h-12 flex items-center gap-2"
            >
              {isGettingLocation ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Navigation className="h-4 w-4" />
              )}
              Utiliser ma position actuelle
            </Button>
          )}

          {/* Résultats de recherche */}
          <AnimatePresence>
            {searchResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2 max-h-60 overflow-y-auto"
              >
                {searchResults.map((location, index) => (
                  <motion.div
                    key={`${location.lat}-${location.lng}-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card 
                      className="cursor-pointer hover:bg-accent/50 transition-colors"
                      onClick={() => handleLocationSelect(location)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start gap-3">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {location.name || location.address}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {location.subtitle || location.address}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Location sélectionnée */}
          {selectedLocation && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-3 bg-green-50 border border-green-200 rounded-lg"
            >
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-sm text-green-800">
                    {selectedLocation.name || selectedLocation.address}
                  </p>
                  <p className="text-xs text-green-600">
                    Adresse sélectionnée
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

StableLocationPicker.displayName = 'StableLocationPicker';

export default StableLocationPicker;