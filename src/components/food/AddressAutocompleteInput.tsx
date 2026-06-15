import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { MapPin, Navigation, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSmartGeolocation } from '@/hooks/useSmartGeolocation';
import { useOptimizedGeocoding } from '@/hooks/useOptimizedGeocoding';
import { useGooglePlacesAutocomplete } from '@/hooks/useGooglePlacesAutocomplete';
import { useToast } from '@/hooks/use-toast';
import { nativeGeolocationService } from '@/services/nativeGeolocationService';
import type { LocationData } from '@/hooks/useSmartGeolocation';

interface AddressAutocompleteInputProps {
  value: string;
  onChange: (address: string, location?: LocationData) => void;
  placeholder?: string;
  required?: boolean;
}

export const AddressAutocompleteInput = ({
  value,
  onChange,
  placeholder = "Entrez votre adresse complète",
  required = false
}: AddressAutocompleteInputProps) => {
  const { toast } = useToast();
  const { getCurrentPosition, loading } = useSmartGeolocation();
  const { reverseGeocode } = useOptimizedGeocoding();
  const { predictions, isLoading: predictionsLoading, search, getPlaceDetails, clearPredictions } =
    useGooglePlacesAutocomplete({ debounceMs: 300 });
  const [showPredictions, setShowPredictions] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);

  const handleUseCurrentLocation = async () => {
    try {
      const position = await getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000
      });

      setSelectedLocation(position);
      
      // Reverse geocode to get a readable address
      setIsGeocoding(true);
      try {
        const address = await reverseGeocode(position.lat, position.lng);
        onChange(address, position);
      } catch {
        // Fallback to coordinates if geocoding fails
        onChange(`${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}`, position);
      } finally {
        setIsGeocoding(false);
      }
    } catch (error: any) {
      console.error('Error getting current location:', error);
      const isPermissionError =
        error?.type === 'permission_denied' || error?.type === 'permission_denied_permanent';
      let description = error?.message || 'Impossible de déterminer votre position.';
      if (isPermissionError) {
        description = `${description} ${nativeGeolocationService.getSettingsGuidance().steps}`;
      }
      toast({
        title: 'Localisation impossible',
        description,
        variant: 'destructive',
      });
    }
  };

  const handleSelectPrediction = async (placeId: string) => {
    const details = await getPlaceDetails(placeId);
    if (details) {
      const mappedLocation: LocationData = {
        address: details.address,
        lat: details.coordinates.lat,
        lng: details.coordinates.lng,
        type: 'google',
        placeId: details.placeId,
        accuracy: 0,
      };
      setSelectedLocation(mappedLocation);
      onChange(details.address, mappedLocation);
    } else {
      toast({
        title: 'Adresse introuvable',
        description: 'Réessayez ou utilisez votre position GPS.',
        variant: 'destructive',
      });
    }
    setShowPredictions(false);
    clearPredictions();
  };

  const isLoading = loading || isGeocoding;

  return (
    <div className="space-y-2">
      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              id="delivery-address"
              value={value}
              onChange={(e) => {
                const text = e.target.value;
                if (selectedLocation && text !== selectedLocation.address) {
                  setSelectedLocation(null);
                }
                onChange(text);
                if (text.length >= 2) {
                  search(text);
                  setShowPredictions(true);
                } else {
                  clearPredictions();
                  setShowPredictions(false);
                }
              }}
              placeholder={placeholder}
              className="w-full"
              required={required}
            />
            {predictionsLoading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-primary" />
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleUseCurrentLocation}
            disabled={isLoading}
            title="Utiliser ma position actuelle"
          >
            {isGeocoding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Navigation className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            )}
          </Button>
        </div>

        {showPredictions && predictions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-background border border-border/20 rounded-xl shadow-xl z-50 max-h-52 overflow-y-auto">
            {predictions.map((prediction) => (
              <button
                key={prediction.placeId}
                type="button"
                style={{ touchAction: 'manipulation' }}
                onClick={() => handleSelectPrediction(prediction.placeId)}
                className="w-full px-4 py-3 text-left hover:bg-muted/50 active:bg-muted/70 transition-colors flex items-center gap-3 first:rounded-t-xl last:rounded-b-xl"
              >
                <div className="w-8 h-8 rounded-lg bg-muted/40 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {prediction.structuredFormatting.mainText}
                  </p>
                  {prediction.structuredFormatting.secondaryText && (
                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                      {prediction.structuredFormatting.secondaryText}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedLocation && (
        <div className="text-xs text-muted-foreground flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          Position GPS: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
          {selectedLocation.accuracy && ` (±${Math.round(selectedLocation.accuracy)}m)`}
        </div>
      )}
    </div>
  );
};
