import { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, MapPin, Clock, Star, Loader2, ChevronRight, Navigation, Building2, Plane, ShoppingBag, Home, Building, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useGooglePlacesAutocomplete } from '@/hooks/useGooglePlacesAutocomplete';
import { useUserTripHistory } from '@/hooks/useUserTripHistory';
import { useSavedAddresses } from '@/hooks/useSavedAddresses';
import { useSmartGeolocation } from '@/hooks/useSmartGeolocation';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { getCityConfigFromName } from '@/types/unifiedLocation';

const CITY_DEFAULTS: Record<string, { lat: number; lng: number }> = {
  Abidjan: { lat: 5.3497, lng: -3.9923 }
};

const POPULAR_PLACES_BY_CITY = {
  Abidjan: [
    { name: 'Aéroport FHB', district: 'Port-Bouët', lat: 5.2539, lng: -3.9263, category: 'transport' },
    { name: 'Plateau', district: 'Centre d\'affaires', lat: 5.3200, lng: -4.0100, category: 'business' },
    { name: 'Cocody', district: 'Cocody', lat: 5.3599, lng: -3.9810, category: 'residential' },
    { name: 'Marché Treichville', district: 'Treichville', lat: 5.2900, lng: -4.0050, category: 'shopping' },
    { name: 'Yopougon', district: 'Yopougon', lat: 5.3400, lng: -4.0850, category: 'residential' },
    { name: 'Hotel Ivoire', district: 'Cocody', lat: 5.3450, lng: -3.9900, category: 'hotel' }
  ]
};

const getCategoryStyle = (category: string): string => {
  const styles: Record<string, string> = {
    transport: 'bg-blue-500/10 text-blue-500',
    business: 'bg-violet-500/10 text-violet-500',
    hotel: 'bg-amber-500/10 text-amber-500',
    shopping: 'bg-orange-500/10 text-orange-500',
    culture: 'bg-pink-500/10 text-pink-500',
    sport: 'bg-green-500/10 text-green-500',
    residential: 'bg-slate-500/10 text-slate-500'
  };
  return styles[category] || 'bg-primary/10 text-primary';
};

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'transport': return Plane;
    case 'business': return Building2;
    case 'shopping': return ShoppingBag;
    default: return MapPin;
  }
};

const KNOWN_CITIES = Object.keys(POPULAR_PLACES_BY_CITY);

const getPopularPlacesForCity = (cityName?: string): typeof POPULAR_PLACES_BY_CITY['Abidjan'] => {
  // ✅ PHASE 4: No default city (TAGA mono-ville Abidjan) — return empty if no city detected
  if (!cityName) return [];
  const city = cityName as keyof typeof POPULAR_PLACES_BY_CITY;
  // If city is not in our known list (e.g. "Position actuelle"), return empty array
  if (!KNOWN_CITIES.includes(cityName)) return [];
  return POPULAR_PLACES_BY_CITY[city] || [];
};

interface DestinationSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectDestination: (destination: {
    address: string;
    lat: number;
    lng: number;
    name?: string;
  }) => void;
  currentLocation?: { lat: number; lng: number } | null;
  currentCity?: string;
}

export default function DestinationSearchDialog({
  open,
  onOpenChange,
  onSelectDestination,
  currentLocation,
  currentCity
}: DestinationSearchDialogProps) {
  const navigate = useNavigate();
  const popularPlaces = getPopularPlacesForCity(currentCity);
  const [searchQuery, setSearchQuery] = useState('');
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [geocodingAddress, setGeocodingAddress] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { getCurrentPosition } = useSmartGeolocation();
  const { destinations, isLoading: historyLoading } = useUserTripHistory();
  const { addresses: savedAddresses } = useSavedAddresses();

  // 🆕 Calculer le filtre pays dynamiquement depuis currentCity
  const countryFilter = useMemo(() => {
    if (!currentCity || currentCity === 'Position actuelle') return []; // pas de restriction
    const config = getCityConfigFromName(currentCity);
    if (!config) return []; // ville inconnue → recherche mondiale
    return [config.countryCode.toLowerCase()]; // 'cd' ou 'ci'
  }, [currentCity]);

  const { predictions, isLoading: autocompleteLoading, search, getPlaceDetails, clearPredictions } = 
    useGooglePlacesAutocomplete({
      location: currentLocation || undefined,
      types: ['establishment', 'geocode'],
      debounceMs: 300,
      countryFilter
    });

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300);
    } else {
      setSearchQuery('');
      clearPredictions();
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (searchQuery.trim()) {
      search(searchQuery);
    } else {
      clearPredictions();
    }
  }, [searchQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelectHistory = (destination: any) => {
    onSelectDestination({
      address: destination.destination,
      lat: destination.destination_coordinates.lat,
      lng: destination.destination_coordinates.lng,
      name: destination.destination
    });
    onOpenChange(false);
  };

  const geocodeAddress = async (addressText: string): Promise<{ lat: number; lng: number } | null> => {
    try {
      const regionCode = (() => {
        if (!currentCity || currentCity === 'Position actuelle') return 'CI';
        const config = getCityConfigFromName(currentCity);
        return config?.countryCode || 'CI';
      })();
      const { data, error } = await supabase.functions.invoke('geocode-proxy', {
        body: { query: addressText, region: regionCode }
      });
      if (error || !data?.results?.length) return null;
      const result = data.results[0];
      return { lat: result.geometry.location.lat, lng: result.geometry.location.lng };
    } catch {
      return null;
    }
  };

  const handleSelectSavedAddress = async (address: any) => {
    const hasValidCoords = address.coordinates && 
      typeof address.coordinates.lat === 'number' && 
      typeof address.coordinates.lng === 'number' &&
      !isNaN(address.coordinates.lat) && 
      !isNaN(address.coordinates.lng) &&
      address.coordinates.lat !== 0 &&
      address.coordinates.lng !== 0;
    
    if (hasValidCoords) {
      onSelectDestination({
        address: address.address_line,
        lat: address.coordinates.lat,
        lng: address.coordinates.lng,
        name: address.label
      });
      onOpenChange(false);
      return;
    }
    
    setGeocodingAddress(address.id);
    try {
      const coords = await geocodeAddress(address.address_line);
      if (coords) {
        onSelectDestination({
          address: address.address_line,
          lat: coords.lat,
          lng: coords.lng,
          name: address.label
        });
        onOpenChange(false);
        return;
      }
    } catch (error) {
      console.error('Géocodage échoué:', error);
    } finally {
      setGeocodingAddress(null);
    }
    
    // No valid coordinates found — show explicit error instead of using city center
    const { toast } = await import('sonner');
    toast.error('Impossible de localiser cette adresse', {
      description: 'Coordonnées manquantes. Essayez une autre recherche.'
    });
  };

  const handleSelectPrediction = async (placeId: string, description: string) => {
    const details = await getPlaceDetails(placeId);
    if (details) {
      onSelectDestination({
        address: details.address,
        lat: details.coordinates.lat,
        lng: details.coordinates.lng,
        name: details.name
      });
      onOpenChange(false);
      return;
    }
    
    // Fallback: getPlaceDetails a échoué → tenter geocode-proxy avec la description
    console.warn('⚠️ getPlaceDetails échoué pour', placeId, '→ fallback geocode-proxy');
    const coords = await geocodeAddress(description);
    if (coords) {
      onSelectDestination({
        address: description,
        lat: coords.lat,
        lng: coords.lng,
        name: description.split(',')[0]
      });
      onOpenChange(false);
    } else {
      // Échec final → message explicite
      const { toast } = await import('sonner');
      toast.error('Impossible de localiser cette adresse', {
        description: 'Essayez une autre recherche ou un lieu populaire.'
      });
    }
  };

  const handleSelectPopularPlace = (place: typeof POPULAR_PLACES_BY_CITY['Abidjan'][0]) => {
    onSelectDestination({
      address: place.name,
      lat: place.lat,
      lng: place.lng,
      name: place.name
    });
    onOpenChange(false);
  };

  const handleUseCurrentLocation = async () => {
    setDetectingLocation(true);
    try {
      const position = await getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 8000,
        fallbackToIP: true
      });
      onSelectDestination({
        address: position.address || 'Ma position actuelle',
        lat: position.lat,
        lng: position.lng,
        name: 'Ma position'
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Erreur GPS:', error);
      if (currentLocation) {
        onSelectDestination({
          address: 'Ma position actuelle',
          lat: currentLocation.lat,
          lng: currentLocation.lng,
          name: 'Ma position'
        });
        onOpenChange(false);
      }
    } finally {
      setDetectingLocation(false);
    }
  };

  const showHistory = !searchQuery.trim() && destinations.length > 0;
  const showSavedAddresses = !searchQuery.trim();
  const showPredictions = searchQuery.trim() && predictions.length > 0;

  // Reusable list item component
  const ListItem = ({ icon, iconClass, title, subtitle, onClick, disabled, trailing }: {
    icon: React.ReactNode;
    iconClass: string;
    title: string;
    subtitle?: string;
    onClick: () => void;
    disabled?: boolean;
    trailing?: React.ReactNode;
  }) => (
    <motion.button
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center gap-3.5 px-5 py-3.5 hover:bg-muted/30 active:bg-muted/50 transition-colors disabled:opacity-50 group"
    >
      <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0", iconClass)}>
        {icon}
      </div>
      <div className="flex-1 min-w-0 text-left">
        <p className="text-[15px] font-medium text-foreground truncate group-hover:text-primary transition-colors">
          {title}
        </p>
        {subtitle && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">{subtitle}</p>
        )}
      </div>
      {trailing}
      <ChevronRight className="w-4 h-4 text-muted-foreground/20 group-hover:text-primary/40 transition-colors flex-shrink-0" />
    </motion.button>
  );

  const SectionLabel = ({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) => (
    <div className="flex items-center justify-between px-5 pt-5 pb-2">
      <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
        {children}
      </h4>
      {action}
    </div>
  );

  // Guards: ensure document.body is available and dialog is open
  if (!open) return null;
  if (typeof document === 'undefined' || !document.body) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
      <motion.div
        key="destination-search-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60"
        style={{ zIndex: 9998 }}
        onClick={() => onOpenChange(false)}
      />
      <motion.div
        key="destination-search-dialog"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="fixed inset-x-0 bottom-0 h-[92vh] flex flex-col overflow-hidden rounded-t-[2rem] bg-background shadow-2xl"
        style={{ zIndex: 9999, pointerEvents: 'auto' }}
      >
        {/* Drag handle */}
        <div className="mx-auto mt-3 mb-1 h-1.5 w-12 rounded-full bg-muted" />
        
        {/* Header avec recherche */}
        <div className="px-5 pt-2 pb-4 border-b border-border/10">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground/50 pointer-events-none" />
              <Input
                ref={inputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Rechercher${currentCity ? ` à ${currentCity}` : ''}...`}
                className="pl-11 pr-4 h-12 text-[15px] bg-muted/40 border-0 rounded-xl focus:bg-muted/60 focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/40"
              />
              {autocompleteLoading && (
                <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary animate-spin" />
              )}
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-muted/40 hover:bg-muted/60 transition-colors flex-shrink-0"
            >
              <X className="w-4.5 h-4.5 text-foreground/70" />
            </button>
          </div>
        </div>

        {/* Contenu scrollable */}
        <div className="flex-1 overflow-y-auto overscroll-contain pb-8">
          <AnimatePresence mode="wait">
            {/* Position actuelle */}
            {!searchQuery.trim() && (
              <ListItem
                icon={detectingLocation 
                  ? <Loader2 className="w-[18px] h-[18px] text-blue-500 animate-spin" /> 
                  : <Navigation className="w-[18px] h-[18px] text-blue-500" />
                }
                iconClass="bg-blue-500/10"
                title={detectingLocation ? 'Détection en cours...' : 'Ma position actuelle'}
                subtitle={detectingLocation ? 'Veuillez patienter' : 'Utiliser la position GPS'}
                onClick={handleUseCurrentLocation}
                disabled={detectingLocation}
              />
            )}

            {/* Mes adresses */}
            {showSavedAddresses && (
              <div>
                <SectionLabel action={
                  <button
                    onClick={() => {
                      onOpenChange(false);
                      navigate('/mes-adresses?add=true&from=/transport');
                    }}
                    className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 active:scale-95 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                }>
                  Mes adresses
                </SectionLabel>
                
                {savedAddresses.length > 0 ? (
                  <div>
                    {savedAddresses.slice(0, 3).map((address) => (
                      <ListItem
                        key={address.id}
                        icon={geocodingAddress === address.id 
                          ? <Loader2 className="w-[18px] h-[18px] animate-spin" />
                          : address.address_type === 'business'
                            ? <Building className="w-[18px] h-[18px]" />
                            : <Home className="w-[18px] h-[18px]" />
                        }
                        iconClass={address.address_type === 'business' ? "bg-violet-500/10 text-violet-500" : "bg-blue-500/10 text-blue-500"}
                        title={address.label}
                        subtitle={geocodingAddress === address.id ? 'Localisation...' : address.address_line}
                        onClick={() => handleSelectSavedAddress(address)}
                        disabled={geocodingAddress === address.id}
                        trailing={address.is_default ? <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" /> : undefined}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground/50 px-5 py-2">
                    Ajoutez vos adresses favorites pour y accéder rapidement
                  </p>
                )}
                {savedAddresses.length > 3 && (
                  <button
                    onClick={() => { onOpenChange(false); navigate('/mes-adresses'); }}
                    className="w-full py-2.5 text-xs text-primary/70 hover:text-primary font-medium transition-colors"
                  >
                    Voir toutes mes adresses →
                  </button>
                )}
              </div>
            )}

            {/* Destinations récentes */}
            {showHistory && (
              <div>
                <SectionLabel>Récents</SectionLabel>
                {destinations.slice(0, 4).map((dest) => (
                  <ListItem
                    key={dest.id}
                    icon={dest.frequency >= 3 
                      ? <Star className="w-[18px] h-[18px]" /> 
                      : <Clock className="w-[18px] h-[18px]" />
                    }
                    iconClass={dest.frequency >= 3 ? "bg-amber-500/10 text-amber-500" : "bg-muted text-muted-foreground"}
                    title={dest.destination}
                    subtitle={dest.frequency > 1 ? `${dest.frequency} trajets` : 'Récent'}
                    onClick={() => handleSelectHistory(dest)}
                  />
                ))}
              </div>
            )}

            {/* Section découverte */}
            {!showHistory && !searchQuery.trim() && !historyLoading && (
              <div>
                {/* Header découverte */}
                <div className="flex flex-col items-center gap-2 py-6">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-sm font-semibold text-foreground">
                      Découvrez {currentCity} 🌍
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Recherchez ou choisissez ci-dessous
                    </p>
                  </div>
                </div>

                <SectionLabel>Lieux populaires</SectionLabel>
                {popularPlaces.map((place) => {
                  const Icon = getCategoryIcon(place.category);
                  return (
                    <ListItem
                      key={place.name}
                      icon={<Icon className="w-[18px] h-[18px]" />}
                      iconClass={getCategoryStyle(place.category)}
                      title={place.name}
                      subtitle={place.district}
                      onClick={() => handleSelectPopularPlace(place)}
                    />
                  );
                })}
              </div>
            )}

            {/* Suggestions autocomplete */}
            {showPredictions && (
              <div>
                <SectionLabel>Suggestions</SectionLabel>
                {predictions.map((prediction) => (
                  <ListItem
                    key={prediction.placeId}
                    icon={<Search className="w-[18px] h-[18px]" />}
                    iconClass="bg-primary/10 text-primary"
                    title={prediction.structuredFormatting.mainText}
                    subtitle={prediction.structuredFormatting.secondaryText}
                    onClick={() => handleSelectPrediction(prediction.placeId, prediction.description)}
                  />
                ))}
              </div>
            )}

            {/* Aucun résultat */}
            {searchQuery.trim() && !showPredictions && !autocompleteLoading && (
              <div className="px-5 pt-4">
                {(() => {
                  const query = searchQuery.toLowerCase();
                  const filteredPlaces = popularPlaces.filter(p => 
                    p.name.toLowerCase().includes(query) || 
                    p.district.toLowerCase().includes(query)
                  );
                  
                  if (filteredPlaces.length > 0) {
                    return (
                      <>
                        <p className="text-[11px] text-amber-600 dark:text-amber-400 mb-3 px-0.5">
                          ⚠️ Recherche en ligne indisponible — résultats locaux
                        </p>
                        {filteredPlaces.map((place) => {
                          const Icon = getCategoryIcon(place.category);
                          return (
                            <ListItem
                              key={place.name}
                              icon={<Icon className="w-[18px] h-[18px]" />}
                              iconClass={getCategoryStyle(place.category)}
                              title={place.name}
                              subtitle={place.district}
                              onClick={() => handleSelectPopularPlace(place)}
                            />
                          );
                        })}
                      </>
                    );
                  }
                  
                  return (
                    <div className="flex flex-col items-center justify-center py-14">
                      <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center mb-3">
                        <Search className="w-5 h-5 text-muted-foreground/40" />
                      </div>
                      <p className="text-sm text-muted-foreground/70 text-center">
                        Aucun résultat pour "{searchQuery}"
                      </p>
                      <p className="text-xs text-muted-foreground/50 text-center mt-1">
                        Essayez un autre terme
                      </p>
                    </div>
                  );
                })()}
              </div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
