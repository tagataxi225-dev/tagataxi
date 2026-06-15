import React, { useState, useEffect, useCallback } from 'react';
import { Search, MapPin, Clock, Star, Navigation, Zap } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useGeolocation } from '@/hooks/useGeolocation';
import { GoogleMapsService, GeocodeResult } from '@/services/googleMapsService';
import { ZoneService, PopularPlace } from '@/services/zoneService';
import { useToast } from '@/hooks/use-toast';

interface EnhancedLocationSearchProps {
  onLocationSelect: (location: { lat: number; lng: number; address: string; zone?: string }) => void;
  placeholder?: string;
  showPopularPlaces?: boolean;
  showZoneInfo?: boolean;
  enableVoiceSearch?: boolean;
  className?: string;
}

export const EnhancedLocationSearch: React.FC<EnhancedLocationSearchProps> = ({
  onLocationSelect,
  placeholder = "Où allez-vous ?",
  showPopularPlaces = true,
  showZoneInfo = true,
  enableVoiceSearch = false,
  className = ""
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [popularPlaces, setPopularPlaces] = useState<PopularPlace[]>([]);
  const [recentPlaces, setRecentPlaces] = useState<GeocodeResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  const geolocation = useGeolocation();
  const { toast } = useToast();

  // Load recent places and popular places
  useEffect(() => {
    // Load recent places from localStorage
    const stored = localStorage.getItem('recentPlaces');
    if (stored) {
      try {
        setRecentPlaces(JSON.parse(stored).slice(0, 5));
      } catch (error) {
        console.error('Error loading recent places:', error);
      }
    }

    // Show general popular places for Kinshasa
    setPopularPlaces(ZoneService.getAllPopularPlaces().slice(0, 8));
  }, []);

  // Debounced search with zone biasing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.length > 2) {
        searchPlaces(query);
      } else if (query.length === 0) {
        // Search popular places when no query
        const filtered = ZoneService.searchPopularPlaces('');
        setResults(filtered.map(place => ({
          place_name: place.address,
          center: place.coordinates,
          place_type: place.category,
          properties: {
            name: place.name,
            zone: place.zone,
            category: place.category
          }
        })));
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const searchPlaces = async (searchQuery: string) => {
    setIsSearching(true);
    try {
      // First search popular places
      const popularMatches = ZoneService.searchPopularPlaces(searchQuery, 3);
      
      // Get proximity bias from current location
      const proximity = geolocation.latitude && geolocation.longitude 
        ? { lat: geolocation.latitude, lng: geolocation.longitude }
        : undefined;
      
      // Search with Google Maps API
      const googleResults = await GoogleMapsService.searchPlaces(searchQuery, proximity);
      
      // Combine and prioritize results
      const combinedResults: GeocodeResult[] = [
        // Popular places first (converted to GeocodeResult format)
        ...popularMatches.map(place => ({
          place_name: `${place.name} - ${place.address}`,
          center: place.coordinates,
          place_type: place.category,
          properties: {
            name: place.name,
            zone: place.zone,
            category: place.category,
            isPopular: true
          }
        })),
        // Then Google results
        ...googleResults.filter(result => 
          // Filter out duplicates
          !popularMatches.some(popular => 
            Math.abs(popular.coordinates[0] - result.center[0]) < 0.001 &&
            Math.abs(popular.coordinates[1] - result.center[1]) < 0.001
          )
        )
      ];
      
      setResults(combinedResults.slice(0, 8)); // Limit to 8 results
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Erreur de recherche",
        description: "Impossible de rechercher les lieux",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleLocationSelect = (result: GeocodeResult | PopularPlace) => {
    let locationData;
    
    if ('coordinates' in result) {
      // PopularPlace
      locationData = {
        lat: result.coordinates[1],
        lng: result.coordinates[0],
        address: result.address,
        zone: result.zone
      };
      setQuery(result.name);
    } else {
      // GeocodeResult
      locationData = {
        lat: result.center[1],
        lng: result.center[0],
        address: result.place_name,
        zone: result.properties?.zone
      };
      setQuery(result.place_name);
    }

    onLocationSelect(locationData);

    // Save to recent places (for GeocodeResult only)
    if ('center' in result) {
      const updatedRecent = [result, ...recentPlaces.filter(p => p.place_name !== result.place_name)].slice(0, 5);
      setRecentPlaces(updatedRecent);
      localStorage.setItem('recentPlaces', JSON.stringify(updatedRecent));
    }
    
    setShowDropdown(false);
  };

  const handleCurrentLocation = async () => {
    try {
      await geolocation.getCurrentPosition();
      if (geolocation.latitude && geolocation.longitude) {
        const address = await GoogleMapsService.reverseGeocode(geolocation.longitude, geolocation.latitude);
        onLocationSelect({
          lat: geolocation.latitude,
          lng: geolocation.longitude,
          address,
          zone: undefined
        });
        setQuery(address);
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'obtenir votre position",
        variant: "destructive"
      });
    }
  };

  const startVoiceSearch = useCallback(() => {
    if (!enableVoiceSearch || !('webkitSpeechRecognition' in window)) {
      toast({
        title: "Non supporté",
        description: "Recherche vocale non disponible",
        variant: "destructive"
      });
      return;
    }

    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.lang = 'fr-FR';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
      toast({
        title: "Erreur vocale",
        description: "Impossible de comprendre votre demande",
        variant: "destructive"
      });
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  }, [enableVoiceSearch, toast]);

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          placeholder={placeholder}
          className="pl-10 pr-20"
        />
        
        {/* Action buttons */}
        <div className="absolute right-1 top-1 flex gap-1">
          {enableVoiceSearch && (
            <Button
              size="sm"
              variant="ghost"
              onClick={startVoiceSearch}
              className="h-8 w-8 p-0"
              disabled={isListening}
            >
              <div className={`h-4 w-4 rounded-full ${isListening ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`} />
            </Button>
          )}
          
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCurrentLocation}
            className="h-8 w-8 p-0"
          >
            <Navigation className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Current zone info - removed for now */}

      {/* Results dropdown */}
      {showDropdown && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-96 overflow-auto">
          {/* Popular places section */}
          {query.length === 0 && showPopularPlaces && popularPlaces.length > 0 && (
            <div className="p-2">
              <div className="flex items-center gap-2 px-2 py-1 text-sm text-muted-foreground">
                <Star className="h-4 w-4" />
                Lieux populaires
              </div>
              {popularPlaces.slice(0, 4).map((place) => (
                <Button
                  key={place.id}
                  variant="ghost"
                  className="w-full justify-start text-left h-auto p-2"
                  onClick={() => handleLocationSelect(place)}
                >
                  <div className="flex items-center gap-2 w-full">
                    <div className="bg-primary/10 rounded p-1">
                      <MapPin className="h-3 w-3 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{place.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{place.address}</div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {place.category}
                    </Badge>
                  </div>
                </Button>
              ))}
            </div>
          )}

          {/* Recent places section */}
          {query.length === 0 && recentPlaces.length > 0 && (
            <div className="p-2 border-t">
              <div className="flex items-center gap-2 px-2 py-1 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                Récents
              </div>
              {recentPlaces.map((place, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  className="w-full justify-start text-left h-auto p-2"
                  onClick={() => handleLocationSelect(place)}
                >
                  <MapPin className="h-4 w-4 mr-2 text-muted-foreground flex-shrink-0" />
                  <span className="truncate">{place.place_name}</span>
                </Button>
              ))}
            </div>
          )}

          {/* Search results */}
          {results.length > 0 && (
            <div className="p-2 border-t">
              {results.map((result, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  className="w-full justify-start text-left h-auto p-2"
                  onClick={() => handleLocationSelect(result)}
                >
                  <div className="flex items-center gap-2 w-full">
                    <div className={`rounded p-1 ${result.properties?.isPopular ? 'bg-yellow-100 dark:bg-yellow-900' : 'bg-gray-100 dark:bg-gray-800'}`}>
                      <MapPin className={`h-3 w-3 ${result.properties?.isPopular ? 'text-yellow-600' : 'text-gray-600'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm truncate">{result.place_name}</div>
                      {result.properties?.zone && (
                        <div className="text-xs text-muted-foreground">
                          {result.properties.zone}
                        </div>
                      )}
                    </div>
                    {result.properties?.isPopular && (
                      <Badge variant="secondary" className="text-xs">
                        <Star className="h-3 w-3 mr-1" />
                        Populaire
                      </Badge>
                    )}
                  </div>
                </Button>
              ))}
            </div>
          )}

          {/* Loading indicator */}
          {isSearching && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Recherche en cours...
            </div>
          )}

          {/* No results */}
          {query.length > 2 && !isSearching && results.length === 0 && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Aucun résultat trouvé
            </div>
          )}
        </Card>
      )}
    </div>
  );
};