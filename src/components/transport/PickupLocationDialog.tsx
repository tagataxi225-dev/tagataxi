import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MapPin, Loader2, Navigation, Clock, Star } from 'lucide-react';
import { useGooglePlacesAutocomplete } from '@/hooks/useGooglePlacesAutocomplete';
import { LocationData } from '@/types/location';
import { motion, AnimatePresence } from 'framer-motion';

// ✅ PHASE C: Points populaires par ville pour fallback
const POPULAR_POINTS: Record<string, Array<{ name: string; address: string; lat: number; lng: number }>> = {
  kinshasa: [
    { name: 'Gare Centrale', address: 'Gare Centrale de Kinshasa', lat: -4.3176, lng: 15.3136 },
    { name: 'Aéroport N\'Djili', address: 'Aéroport International de N\'Djili', lat: -4.3855, lng: 15.4446 },
    { name: 'Marché Central', address: 'Grand Marché de Kinshasa', lat: -4.3246, lng: 15.3125 },
    { name: 'UPN', address: 'Université Pédagogique Nationale', lat: -4.3833, lng: 15.3167 },
    { name: 'Rond-point Ngaba', address: 'Rond-point Ngaba, Kinshasa', lat: -4.3574, lng: 15.3081 },
  ],
  lubumbashi: [
    { name: 'Aéroport Luano', address: 'Aéroport de Lubumbashi-Luano', lat: -11.5913, lng: 27.5309 },
    { name: 'Gare SNCC', address: 'Gare SNCC Lubumbashi', lat: -11.6683, lng: 27.4789 },
    { name: 'Place de la Poste', address: 'Place de la Poste, Lubumbashi', lat: -11.6639, lng: 27.4794 },
    { name: 'Golf Hôtel', address: 'Grand Karavia Hôtel, Lubumbashi', lat: -11.6517, lng: 27.4831 },
  ],
  kolwezi: [
    { name: 'Aéroport Kolwezi', address: 'Aéroport de Kolwezi', lat: -10.7659, lng: 25.5057 },
    { name: 'Centre-ville', address: 'Centre-ville Kolwezi', lat: -10.7167, lng: 25.4667 },
  ],
  abidjan: [
    { name: 'Aéroport FHB', address: 'Aéroport Félix Houphouët-Boigny', lat: 5.2614, lng: -3.9262 },
    { name: 'Plateau', address: 'Le Plateau, Abidjan', lat: 5.3220, lng: -4.0166 },
    { name: 'Cocody', address: 'Cocody, Abidjan', lat: 5.3490, lng: -3.9860 },
    { name: 'Marcory', address: 'Marcory, Abidjan', lat: 5.3050, lng: -3.9850 },
    { name: 'Yopougon', address: 'Yopougon, Abidjan', lat: 5.3388, lng: -4.0686 },
  ],
};

interface PickupLocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentLocation: LocationData | null;
  onSelectLocation: (location: LocationData) => void;
  onUseCurrentPosition: () => void;
  currentCity?: string;
}

export default function PickupLocationDialog({
  open,
  onOpenChange,
  currentLocation,
  onSelectLocation,
  onUseCurrentPosition,
  currentCity
}: PickupLocationDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<LocationData[]>([]);
  
  const { 
    predictions, 
    isLoading, 
    search, 
    getPlaceDetails, 
    clearPredictions 
  } = useGooglePlacesAutocomplete({
    location: currentLocation ? { lat: currentLocation.lat, lng: currentLocation.lng } : undefined,
    radius: 5000,
    debounceMs: 300
  });

  // ✅ PHASE C: Points populaires pour la ville courante
  const popularPoints = useMemo(() => {
    const cityKey = (currentCity || 'kinshasa').toLowerCase().trim();
    return POPULAR_POINTS[cityKey] || POPULAR_POINTS.kinshasa;
  }, [currentCity]);

  // Charger les recherches récentes au montage
  useEffect(() => {
    const stored = localStorage.getItem('kwenda_recent_pickups');
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored).slice(0, 5));
      } catch (e) {
        console.error('Error loading recent pickups:', e);
      }
    }
  }, []);

  // Recherche automatique
  useEffect(() => {
    if (searchQuery.length >= 3) {
      search(searchQuery);
    } else {
      clearPredictions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const handleSelectPrediction = async (prediction: any) => {
    try {
      const details = await getPlaceDetails(prediction.placeId);
      
      if (details) {
        const location: LocationData = {
          address: details.address,
          lat: details.coordinates.lat,
          lng: details.coordinates.lng,
          type: 'manual',
          name: prediction.structuredFormatting.mainText,
          placeId: prediction.placeId
        };

        // Sauvegarder dans les recherches récentes
        const updated = [location, ...recentSearches.filter(r => r.placeId !== prediction.placeId)].slice(0, 5);
        setRecentSearches(updated);
        localStorage.setItem('kwenda_recent_pickups', JSON.stringify(updated));

        onSelectLocation(location);
        onOpenChange(false);
      }
    } catch (err) {
      console.error('Error getting place details:', err);
    }
  };

  // ✅ PHASE C: Sélection d'un point populaire
  const handleSelectPopularPoint = (point: { name: string; address: string; lat: number; lng: number }) => {
    const location: LocationData = {
      address: point.address,
      lat: point.lat,
      lng: point.lng,
      type: 'manual',
      name: point.name
    };
    onSelectLocation(location);
    onOpenChange(false);
  };

  const handleUseCurrentPosition = () => {
    onUseCurrentPosition();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-xl font-bold">Modifier le point de prise en charge</DialogTitle>
        </DialogHeader>

        {/* Barre de recherche */}
        <div className="px-6 pt-4">
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher une adresse..."
              className="pl-10 pr-10 h-12 text-base"
              autoFocus
            />
            {isLoading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary animate-spin" />
            )}
          </div>
        </div>

        {/* Bouton Position Actuelle */}
        <div className="px-6 pt-3">
          <Button
            onClick={handleUseCurrentPosition}
            variant="outline"
            className="w-full h-14 justify-start gap-3 text-left"
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Navigation className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">Ma position actuelle</p>
              <p className="text-xs text-muted-foreground line-clamp-1">
                {currentLocation?.address || 'Utiliser le GPS'}
              </p>
            </div>
          </Button>
        </div>

        {/* Résultats de recherche ou Recherches récentes ou Points populaires */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <AnimatePresence mode="wait">
            {searchQuery.length >= 3 && predictions.length > 0 ? (
              <motion.div
                key="predictions"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-2 mt-4"
              >
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Résultats
                </p>
                {predictions.map((prediction) => (
                  <motion.button
                    key={prediction.placeId}
                    onClick={() => handleSelectPrediction(prediction)}
                    whileTap={{ scale: 0.98 }}
                    className="w-full flex items-start gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                      <MapPin className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm line-clamp-1">
                        {prediction.structuredFormatting.mainText}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                        {prediction.structuredFormatting.secondaryText}
                      </p>
                    </div>
                  </motion.button>
                ))}
              </motion.div>
            ) : recentSearches.length > 0 && searchQuery.length < 3 ? (
              <motion.div
                key="recent"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-2 mt-4"
              >
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5" />
                  Récents
                </p>
                {recentSearches.map((recent, index) => (
                  <motion.button
                    key={`${recent.placeId}-${index}`}
                    onClick={() => {
                      onSelectLocation(recent);
                      onOpenChange(false);
                    }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full flex items-start gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center shrink-0 mt-0.5">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm line-clamp-1">
                        {recent.name || 'Position'}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                        {recent.address}
                      </p>
                    </div>
                  </motion.button>
                ))}

                {/* ✅ PHASE C: Points populaires après les récents */}
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 mt-6 flex items-center gap-2">
                  <Star className="w-3.5 h-3.5" />
                  Lieux populaires
                </p>
                {popularPoints.map((point) => (
                  <motion.button
                    key={`popular-${point.lat}-${point.lng}`}
                    onClick={() => handleSelectPopularPoint(point)}
                    whileTap={{ scale: 0.98 }}
                    className="w-full flex items-start gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center shrink-0 mt-0.5">
                      <Star className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm line-clamp-1">{point.name}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{point.address}</p>
                    </div>
                  </motion.button>
                ))}
              </motion.div>
            ) : searchQuery.length < 3 && recentSearches.length === 0 ? (
              // ✅ PHASE C: Si pas de récents, afficher directement les points populaires
              <motion.div
                key="popular-only"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-2 mt-4"
              >
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Star className="w-3.5 h-3.5" />
                  Lieux populaires
                </p>
                {popularPoints.map((point) => (
                  <motion.button
                    key={`popular-${point.lat}-${point.lng}`}
                    onClick={() => handleSelectPopularPoint(point)}
                    whileTap={{ scale: 0.98 }}
                    className="w-full flex items-start gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center shrink-0 mt-0.5">
                      <Star className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm line-clamp-1">{point.name}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{point.address}</p>
                    </div>
                  </motion.button>
                ))}
              </motion.div>
            ) : searchQuery.length >= 3 && !isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                <MapPin className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Aucun résultat trouvé</p>
                <p className="text-xs mt-2">Essayez un lieu populaire ci-dessous</p>
                
                {/* ✅ PHASE C: Points populaires comme fallback quand recherche vide */}
                <div className="mt-4 space-y-2 text-left">
                  {popularPoints.slice(0, 3).map((point) => (
                    <motion.button
                      key={`fallback-${point.lat}-${point.lng}`}
                      onClick={() => handleSelectPopularPoint(point)}
                      whileTap={{ scale: 0.98 }}
                      className="w-full flex items-start gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center shrink-0 mt-0.5">
                        <Star className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm line-clamp-1">{point.name}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{point.address}</p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            ) : null}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
