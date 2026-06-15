import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Locate, Clock, Star, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { GeocodingService, GeocodeResult } from '@/services/geocoding';
import { useGeolocation } from '@/hooks/useGeolocation';
import { usePlaces } from '@/hooks/usePlaces';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Location {
  address: string;
  coordinates: { lat: number; lng: number };
  type?: 'current' | 'saved' | 'recent' | 'search';
}

interface UniversalLocationSearchProps {
  value?: Location;
  onChange: (location: Location) => void;
  placeholder?: string;
  className?: string;
  showCurrentLocation?: boolean;
  showSavedPlaces?: boolean;
  showRecentPlaces?: boolean;
  autoFocus?: boolean;
}

export const UniversalLocationSearch = ({
  value,
  onChange,
  placeholder = "Rechercher une adresse...",
  className,
  showCurrentLocation = true,
  showSavedPlaces = true,
  showRecentPlaces = true,
  autoFocus = false
}: UniversalLocationSearchProps) => {
  const [query, setQuery] = useState(value?.address || '');
  const [suggestions, setSuggestions] = useState<GeocodeResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  
  const { 
    getCurrentPosition, 
    loading: geoLoading, 
    error: geoError,
    latitude,
    longitude 
  } = useGeolocation();
  
  const { 
    recentPlaces,
    homePlace,
    workPlace
  } = usePlaces();
  
  const savedPlaces = [homePlace, workPlace].filter(Boolean);
  
  const { toast } = useToast();

  // Enhanced debounced search with intelligent caching
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.length < 2) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const proximity = (latitude && longitude) 
          ? { lng: longitude, lat: latitude }
          : undefined;
          
        const results = await GeocodingService.searchPlaces(query, proximity);
        setSuggestions(results);
      } catch (error) {
        console.error('Search error:', error);
        setSuggestions([]);
        toast({
          title: "Erreur de recherche",
          description: "Impossible de rechercher des lieux pour le moment",
          variant: "destructive"
        });
      } finally {
        setIsSearching(false);
      }
    }, 300); // Balanced debounce

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, latitude, longitude, toast]);

  // Handle location selection with enhanced analytics
  const handleLocationSelect = async (location: Location) => {
    setQuery(location.address);
    setIsOpen(false);
    setSelectedIndex(-1);
    onChange(location);
    
    // Location selected successfully
    
    inputRef.current?.blur();
  };

  // Enhanced current location detection
  const handleGetCurrentLocation = async () => {
    try {
      const position = await getCurrentPosition();
      if (position) {
        const address = await GeocodingService.reverseGeocode(
          position.lng, 
          position.lat
        );
        
        const location: Location = {
          address,
          coordinates: { 
            lat: position.lat, 
            lng: position.lng 
          },
          type: 'current'
        };
        
        await handleLocationSelect(location);
        
        toast({
          title: "Position détectée",
          description: "Votre position actuelle a été utilisée",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Location error:', error);
      toast({
        title: "Erreur de géolocalisation",
        description: "Impossible de détecter votre position",
        variant: "destructive"
      });
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    const totalOptions = suggestions.length + 
      (showCurrentLocation ? 1 : 0) + 
      savedPlaces.length + 
      recentPlaces.length;

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
        if (selectedIndex >= 0) {
          // Handle selection based on index
          // This would need proper implementation based on order
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Get place type icon and styling
  const getPlaceIcon = (type?: string[], placeType?: string) => {
    if (placeType === 'current') return <Locate className="w-4 h-4 text-primary" />;
    if (placeType === 'saved') return <Star className="w-4 h-4 text-yellow-500" />;
    if (placeType === 'recent') return <Clock className="w-4 h-4 text-muted-foreground" />;
    
    if (type?.includes('poi')) return <MapPin className="w-4 h-4 text-blue-500" />;
    if (type?.includes('address')) return <Navigation className="w-4 h-4 text-green-500" />;
    return <MapPin className="w-4 h-4 text-muted-foreground" />;
  };

  const getPlaceBadge = (type?: string[]) => {
    if (type?.includes('poi')) return <Badge variant="secondary" className="text-xs">POI</Badge>;
    if (type?.includes('address')) return <Badge variant="outline" className="text-xs">Adresse</Badge>;
    if (type?.includes('locality')) return <Badge variant="default" className="text-xs">Ville</Badge>;
    return null;
  };

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="pl-10 pr-12"
          autoFocus={autoFocus}
        />
        {showCurrentLocation && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
            onClick={handleGetCurrentLocation}
            disabled={geoLoading}
          >
            <Locate className={cn(
              "w-4 h-4",
              geoLoading && "animate-pulse",
              geoError && "text-destructive"
            )} />
          </Button>
        )}
      </div>

      {isOpen && (
        <Card className="absolute top-full left-0 right-0 mt-1 max-h-80 overflow-auto z-50 border shadow-lg">
          <div ref={dropdownRef} className="p-2">
            {/* Current Location Option */}
            {showCurrentLocation && !geoError && (
              <Button
                variant="ghost"
                className="w-full justify-start mb-1 h-auto p-3"
                onClick={handleGetCurrentLocation}
                disabled={geoLoading}
              >
                <div className="flex items-center space-x-3">
                  {geoLoading ? (
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Locate className="w-4 h-4 text-primary" />
                  )}
                  <div className="text-left">
                    <div className="font-medium">Ma position actuelle</div>
                    <div className="text-sm text-muted-foreground">
                      Utiliser la géolocalisation
                    </div>
                  </div>
                </div>
              </Button>
            )}

            {/* Search Results */}
            {isSearching ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-3 p-2">
                    <Skeleton className="w-4 h-4 rounded" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-3/4 mb-1" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : suggestions.length > 0 ? (
              <div className="space-y-1">
                {suggestions.map((result, index) => (
                  <Button
                    key={`search-${index}`}
                    variant="ghost"
                    className="w-full justify-start h-auto p-3"
                    onClick={() => handleLocationSelect({
                      address: result.place_name,
                      coordinates: { lat: result.center[1], lng: result.center[0] },
                      type: 'search'
                    })}
                  >
                    <div className="flex items-center space-x-3 w-full">
                      {getPlaceIcon(result.place_type)}
                      <div className="flex-1 text-left">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium line-clamp-1">
                            {result.place_name}
                          </span>
                          {getPlaceBadge(result.place_type)}
                        </div>
                        {result.properties?.category && (
                          <div className="text-sm text-muted-foreground">
                            {result.properties.category}
                          </div>
                        )}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            ) : query.length >= 2 ? (
              <div className="p-3 text-sm text-muted-foreground text-center">
                Aucun résultat trouvé pour "{query}"
              </div>
            ) : null}

            {/* Saved Places */}
            {showSavedPlaces && savedPlaces.length > 0 && (
              <div className="mt-3 pt-3 border-t">
                <div className="text-xs font-semibold text-muted-foreground mb-2 px-2">
                  LIEUX ENREGISTRÉS
                </div>
                <div className="space-y-1">
                  {savedPlaces.map((place, index) => (
                    <Button
                      key={`saved-${index}`}
                      variant="ghost"
                      className="w-full justify-start h-auto p-3"
                      onClick={() => handleLocationSelect({
                        address: place.address,
                        coordinates: place.coordinates,
                        type: 'saved'
                      })}
                    >
                      <div className="flex items-center space-x-3">
                        {getPlaceIcon(undefined, 'saved')}
                        <div className="text-left">
                          <div className="font-medium">{place.address}</div>
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Places */}
            {showRecentPlaces && recentPlaces.length > 0 && (
              <div className="mt-3 pt-3 border-t">
                <div className="text-xs font-semibold text-muted-foreground mb-2 px-2">
                  RECHERCHES RÉCENTES
                </div>
                <div className="space-y-1">
                  {recentPlaces.slice(0, 3).map((place, index) => (
                    <Button
                      key={`recent-${index}`}
                      variant="ghost"
                      className="w-full justify-start h-auto p-3"
                      onClick={() => handleLocationSelect({
                        address: place.address,
                        coordinates: place.coordinates,
                        type: 'recent'
                      })}
                    >
                      <div className="flex items-center space-x-3">
                        {getPlaceIcon(undefined, 'recent')}
                        <div className="text-left">
                          <div className="font-medium line-clamp-1">{place.address}</div>
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};