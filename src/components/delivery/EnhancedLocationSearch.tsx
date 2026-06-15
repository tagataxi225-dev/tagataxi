/**
 * Composant de recherche d'adresse enrichi avec données locales massives
 * Utilise la base de données intelligent_places pour des suggestions précises
 */

import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { LocationData } from '@/types/location';
import {
  Search,
  MapPin,
  Clock,
  Star,
  Navigation,
  Building,
  ShoppingBag,
  Hospital,
  School,
  Car,
  Loader2
} from 'lucide-react';

interface EnhancedLocationSearchProps {
  placeholder?: string;
  onChange: (location: LocationData) => void;
  value?: LocationData | null;
  city?: string;
  label?: string;
  icon?: React.ReactNode;
}

interface IntelligentPlace {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  city: string;
  commune?: string;
  quartier?: string;
  avenue?: string;
  latitude: number;
  longitude: number;
  popularity_score: number;
  is_verified: boolean;
  name_alternatives?: string[];
  hierarchy_level: number;
}

const CATEGORY_ICONS: Record<string, any> = {
  shopping_mall: ShoppingBag,
  market: ShoppingBag,
  hospital: Hospital,
  school: School,
  bank: Building,
  restaurant: Building,
  gas_station: Car,
  default: MapPin
};

export const EnhancedLocationSearch = ({
  placeholder = "Rechercher une adresse...",
  onChange,
  value,
  city = 'Kinshasa',
  label,
  icon
}: EnhancedLocationSearchProps) => {
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<IntelligentPlace[]>([]);
  const [popularPlaces, setPopularPlaces] = useState<IntelligentPlace[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout>();
  const inputRef = useRef<HTMLInputElement>(null);

  // Charger les lieux populaires au montage
  useEffect(() => {
    loadPopularPlaces();
  }, [city]);

  // Recherche avec débounce
  useEffect(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    if (query.trim().length >= 2) {
      searchTimeout.current = setTimeout(() => {
        searchPlaces(query.trim());
      }, 300);
    } else {
      setSuggestions([]);
    }

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [query, city]);

  const loadPopularPlaces = async () => {
    try {
      const { data, error } = await supabase
        .from('intelligent_places')
        .select('*')
        .eq('city', city)
        .eq('is_active', true)
        .gte('popularity_score', 70)
        .order('popularity_score', { ascending: false })
        .limit(8);

      if (error) throw error;
      setPopularPlaces(data || []);
    } catch (error) {
      console.error('Erreur chargement lieux populaires:', error);
    }
  };

  const searchPlaces = async (searchQuery: string) => {
    try {
      setIsLoading(true);
      
      // Recherche dans les lieux intelligents
      const { data, error } = await supabase.rpc('intelligent_places_search', {
        search_query: searchQuery,
        search_city: city,
        max_results: 10
      });

      if (error) throw error;

      const places = (data || []).map((place: any) => ({
        id: place.id,
        name: place.name,
        category: place.category,
        subcategory: place.subcategory,
        city: place.city,
        commune: place.commune,
        quartier: place.quartier,
        avenue: place.avenue,
        latitude: place.latitude,
        longitude: place.longitude,
        popularity_score: place.popularity_score,
        is_verified: place.is_verified,
        name_alternatives: place.name_alternatives,
        hierarchy_level: place.hierarchy_level
      }));

      setSuggestions(places);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Erreur recherche lieux:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const selectPlace = (place: IntelligentPlace) => {
    const formattedAddress = formatAddress(place);
    
    const locationData: LocationData = {
      address: formattedAddress,
      lat: place.latitude,
      lng: place.longitude,
      type: 'geocoded',
      name: place.name,
      subtitle: place.commune ? `${place.commune}, ${place.city}` : place.city,
      placeId: place.id
    };

    setQuery(place.name);
    setShowSuggestions(false);
    onChange(locationData);

    toast({
      title: "Adresse sélectionnée ✅",
      description: formattedAddress,
      variant: "default"
    });
  };

  const formatAddress = (place: IntelligentPlace): string => {
    const parts = [];
    if (place.avenue) parts.push(place.avenue);
    if (place.quartier) parts.push(place.quartier);
    if (place.commune) parts.push(place.commune);
    parts.push(place.city);
    
    return parts.join(', ') || place.name;
  };

  const getCategoryIcon = (category: string) => {
    const IconComponent = CATEGORY_ICONS[category] || CATEGORY_ICONS.default;
    return <IconComponent className="h-4 w-4" />;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setQuery(newValue);
    
    if (newValue.length === 0) {
      setShowSuggestions(false);
      setSuggestions([]);
    } else if (newValue.length >= 2) {
      setShowSuggestions(true);
    }
  };

  const handleInputFocus = () => {
    if (query.length >= 2 || popularPlaces.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleInputBlur = () => {
    // Délai pour permettre le clic sur les suggestions
    setTimeout(() => setShowSuggestions(false), 200);
  };

  return (
    <div className="relative w-full">
      {/* Champ de saisie */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
          {icon || <Search className="h-4 w-4" />}
        </div>
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          className="pl-10"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Suggestions */}
      {showSuggestions && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-96 overflow-auto">
          <CardContent className="p-0">
            {/* Résultats de recherche */}
            {suggestions.length > 0 && (
              <div>
                <div className="px-3 py-2 bg-muted/50 text-sm font-medium border-b">
                  Résultats de recherche
                </div>
                {suggestions.map((place) => (
                  <div
                    key={place.id}
                    className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer transition-colors border-b last:border-b-0"
                    onClick={() => selectPlace(place)}
                  >
                    <div className="text-primary">
                      {getCategoryIcon(place.category)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{place.name}</span>
                        {place.is_verified && (
                          <Badge variant="secondary" className="text-xs">
                            <Star className="h-3 w-3 mr-1" />
                            Vérifié
                          </Badge>
                        )}
                        {place.popularity_score > 80 && (
                          <Badge variant="outline" className="text-xs">
                            Populaire
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground truncate">
                        {formatAddress(place)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Lieux populaires (affiché quand pas de recherche ou pas de résultats) */}
            {(query.length < 2 || suggestions.length === 0) && popularPlaces.length > 0 && (
              <div>
                <div className="px-3 py-2 bg-muted/50 text-sm font-medium border-b">
                  Lieux populaires à {city}
                </div>
                {popularPlaces.map((place) => (
                  <div
                    key={place.id}
                    className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer transition-colors border-b last:border-b-0"
                    onClick={() => selectPlace(place)}
                  >
                    <div className="text-primary">
                      {getCategoryIcon(place.category)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{place.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {place.category}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground truncate">
                        {formatAddress(place)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Message si aucun résultat */}
            {query.length >= 2 && suggestions.length === 0 && !isLoading && (
              <div className="p-6 text-center text-muted-foreground">
                <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Aucun lieu trouvé pour "{query}"</p>
                <p className="text-xs mt-1">Essayez avec un nom plus général</p>
              </div>
            )}

            {/* Bouton géolocalisation */}
            <div className="p-3 border-t">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={async () => {
                  try {
                    const { nativeGeolocationService } = await import('@/services/nativeGeolocationService');
                    const position = await nativeGeolocationService.getCurrentPosition({
                      enableHighAccuracy: true,
                      timeout: 10000
                    });
                    const locationData: LocationData = {
                      address: "Ma position actuelle",
                      lat: position.lat,
                      lng: position.lng,
                      type: 'current',
                      name: "Position actuelle"
                    };
                    setQuery("Position actuelle");
                    setShowSuggestions(false);
                    onChange(locationData);
                  } catch (error) {
                    toast({
                      title: "Géolocalisation indisponible",
                      description: "Impossible d'accéder à votre position",
                      variant: "destructive"
                    });
                  }
                }}
              >
                <Navigation className="h-4 w-4 mr-2" />
                Utiliser ma position
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EnhancedLocationSearch;