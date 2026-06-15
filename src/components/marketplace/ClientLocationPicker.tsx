import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { MapPin, Navigation, Loader2 } from 'lucide-react';
import { useSmartGeolocation } from '@/hooks/useSmartGeolocation';
import { useOptimizedGeocoding } from '@/hooks/useOptimizedGeocoding';
import { Wrapper } from '@googlemaps/react-wrapper';
import { googleMapsLoader } from '@/services/googleMapsLoader';

interface ClientLocationPickerProps {
  value?: { lat: number; lng: number; address: string } | null;
  onChange: (location: { lat: number; lng: number; address: string }) => void;
  initialCenter?: { lat: number; lng: number };
  label?: string;
  required?: boolean;
}

export const ClientLocationPicker: React.FC<ClientLocationPickerProps> = ({
  value,
  onChange,
  initialCenter, // ✅ FIX: Pas de coordonnées hardcodées — null par défaut
  label = "📍 Où souhaitez-vous être livré ?",
  required = false
}) => {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [marker, setMarker] = useState<google.maps.Marker | null>(null);
  const [center, setCenter] = useState(initialCenter || null);
  const [isGeolocating, setIsGeolocating] = useState(!initialCenter); // Auto-géolocaliser si pas de center
  const [apiKey, setApiKey] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  
  const { getCurrentPosition } = useSmartGeolocation();
  const { reverseGeocode, isLoading: geocodeLoading } = useOptimizedGeocoding();

  // Charger la clé API Google Maps avec fallback
  useEffect(() => {
    const loadApiKey = async () => {
      try {
        const key = await googleMapsLoader.getApiKey();
        setApiKey(key);
      } catch (error) {
        console.error('❌ Clé Google Maps indisponible:', error);
        // Pas de fallback hardcodé - la carte ne s'affichera pas
        setApiKey(null);
      }
    };
    loadApiKey();
  }, []);

  // Auto-géolocalisation au montage si pas de center fourni
  useEffect(() => {
    if (!initialCenter && !center) {
      handleUseMyLocation();
    }
  }, []);

  // Initialiser la carte
  useEffect(() => {
    if (!mapRef.current || !apiKey || map || !center) return;

    const newMap = new google.maps.Map(mapRef.current, {
      center,
      zoom: 15,
      disableDefaultUI: true,
      zoomControl: true,
      gestureHandling: 'greedy',
      styles: [
        {
          featureType: 'poi',
          elementType: 'all',
          stylers: [{ visibility: 'off' }]
        }
      ]
    });

    setMap(newMap);
  }, [mapRef.current, apiKey]);

  // Initialiser le marker et les event listeners
  useEffect(() => {
    if (!map) return;

    // Créer le marker draggable
    const newMarker = new google.maps.Marker({
      map,
      position: value || center,
      draggable: true,
      animation: google.maps.Animation.DROP,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 12,
        fillColor: '#FF6B35',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 3
      }
    });

    setMarker(newMarker);

    // Event listener: clic sur la carte
    const clickListener = map.addListener('click', async (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        await updateMarkerPosition(e.latLng.lat(), e.latLng.lng());
      }
    });

    // Event listener: drag du marker
    const dragEndListener = newMarker.addListener('dragend', async (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        await updateMarkerPosition(e.latLng.lat(), e.latLng.lng());
      }
    });

    return () => {
      google.maps.event.removeListener(clickListener);
      google.maps.event.removeListener(dragEndListener);
      newMarker.setMap(null);
    };
  }, [map]);

  // Fonction de mise à jour de la position avec reverse geocoding
  const updateMarkerPosition = async (lat: number, lng: number) => {
    if (!marker) return;

    marker.setPosition({ lat, lng });
    map?.panTo({ lat, lng });

    try {
      const address = await reverseGeocode(lat, lng, 'cd');
      onChange({ lat, lng, address });
    } catch (error) {
      console.error('Erreur reverse geocoding:', error);
      onChange({ lat, lng, address: `${lat.toFixed(4)}, ${lng.toFixed(4)}` });
    }
  };

  // Géolocalisation automatique
  const handleUseMyLocation = async () => {
    setIsGeolocating(true);
    try {
      const position = await getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000
      });

      setCenter({ lat: position.lat, lng: position.lng });
      map?.panTo({ lat: position.lat, lng: position.lng });
      await updateMarkerPosition(position.lat, position.lng);
    } catch (error) {
      console.error('Erreur géolocalisation:', error);
    } finally {
      setIsGeolocating(false);
    }
  };

  if (!apiKey) {
    return (
      <div className="space-y-3">
        <Label className="text-base font-medium">{label}</Label>
        <div className="w-full h-[400px] bg-muted rounded-xl flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Label className="text-base font-medium">{label}</Label>
      
      {/* Bouton géolocalisation */}
      <Button
        type="button"
        variant="outline"
        onClick={handleUseMyLocation}
        disabled={isGeolocating}
        className="w-full h-12 justify-start gap-3"
      >
        {isGeolocating ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Navigation className="h-5 w-5" />
        )}
        {isGeolocating ? 'Localisation en cours...' : 'Utiliser ma position actuelle'}
      </Button>

      {/* Mini-carte Google Maps */}
      <div className="relative w-full h-[400px] rounded-xl overflow-hidden border-2 border-border shadow-lg">
        <Wrapper apiKey={apiKey} libraries={['places']}>
          <div ref={mapRef} className="w-full h-full" />
        </Wrapper>
        
        {/* Loader overlay pendant le reverse geocoding */}
        {geocodeLoading && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-background rounded-full p-3 shadow-lg">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          </div>
        )}
      </div>

      {/* Adresse sélectionnée */}
      {value && (
        <div className="p-4 bg-primary/5 border-2 border-primary/20 rounded-xl">
          <div className="flex items-center gap-2 text-primary mb-2">
            <MapPin className="h-5 w-5" />
            <span className="text-sm font-semibold">Position sélectionnée</span>
          </div>
          <p className="text-sm text-foreground font-medium">{value.address}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Coordonnées: {value.lat.toFixed(6)}, {value.lng.toFixed(6)}
          </p>
        </div>
      )}
      
      {/* Instructions */}
      <p className="text-xs text-muted-foreground text-center py-2 border-t">
        💡 Cliquez sur la carte ou glissez le marqueur pour ajuster votre position
      </p>
    </div>
  );
};
