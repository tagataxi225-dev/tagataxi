import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useDriverAssignment } from '@/hooks/useDriverAssignment';
import { useToast } from '@/hooks/use-toast';
import DriverMarkerSimple from '@/components/maps/DriverMarkerSimple';

interface DeliveryMapModalProps {
  open: boolean;
  onClose: () => void;
  deliveryCoordinates: { lat: number; lng: number };
  deliveryAddress?: string;
  pickupCoordinates?: { lat: number; lng: number };
}

export const DeliveryMapModal = ({ 
  open, 
  onClose, 
  deliveryCoordinates, 
  deliveryAddress,
  pickupCoordinates 
}: DeliveryMapModalProps) => {
  const [mapApiKey, setMapApiKey] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [availableDrivers, setAvailableDrivers] = useState<any[]>([]);
  const [searchingDrivers, setSearchingDrivers] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const { findAvailableDrivers } = useDriverAssignment();
  const { toast } = useToast();

  // Créer marker vendeur (noir Tembea)
  const createVendorMarkerIcon = (): string => {
    const svg = `
      <svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad-black" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#2A2A2A;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#1A1A1A;stop-opacity:1" />
          </linearGradient>
          <filter id="shadow">
            <feDropShadow dx="0" dy="3" stdDeviation="4" flood-opacity="0.4"/>
          </filter>
        </defs>
        <circle cx="24" cy="24" r="18" fill="url(#grad-black)" filter="url(#shadow)"/>
        <circle cx="24" cy="24" r="16" fill="none" stroke="white" stroke-width="2"/>
        <text x="24" y="30" font-size="20" text-anchor="middle" fill="white">🏪</text>
      </svg>
    `;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  };

  // Créer marker livraison (rouge Tembea pulsant)
  const createDeliveryMarkerIcon = (): string => {
    const svg = `
      <svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad-red" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#EF4444;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#DC2626;stop-opacity:1" />
          </linearGradient>
          <filter id="shadow-red">
            <feDropShadow dx="0" dy="3" stdDeviation="4" flood-opacity="0.5"/>
          </filter>
        </defs>
        <circle cx="24" cy="24" r="20" fill="none" stroke="#EF4444" stroke-width="2" opacity="0.3">
          <animate attributeName="r" from="20" to="26" dur="2s" repeatCount="indefinite"/>
          <animate attributeName="opacity" from="0.3" to="0" dur="2s" repeatCount="indefinite"/>
        </circle>
        <circle cx="24" cy="24" r="18" fill="url(#grad-red)" filter="url(#shadow-red)"/>
        <circle cx="24" cy="24" r="16" fill="none" stroke="white" stroke-width="2"/>
        <text x="24" y="30" font-size="20" text-anchor="middle" fill="white">📍</text>
      </svg>
    `;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  };

  // Rechercher les livreurs disponibles
  const searchNearbyDrivers = async () => {
    if (!deliveryCoordinates || !pickupCoordinates) return;
    
    setSearchingDrivers(true);
    try {
      console.log('🔍 Recherche de livreurs disponibles...');
      
      const drivers = await findAvailableDrivers({
        pickup_location: 'Position vendeur',
        pickup_coordinates: pickupCoordinates,
        destination: deliveryAddress || 'Point de livraison',
        destination_coordinates: deliveryCoordinates,
        service_type: 'flex',
        vehicle_class: 'moto',
        priority: 'normal'
      });
      
      console.log(`✅ ${drivers.length} livreur(s) trouvé(s)`);
      setAvailableDrivers(drivers);
      
      if (drivers.length === 0) {
        toast({
          title: "Aucun livreur disponible",
          description: "Le vendeur devra livrer lui-même ou attendre qu'un livreur soit disponible",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('❌ Erreur recherche livreurs:', error);
    } finally {
      setSearchingDrivers(false);
    }
  };

  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-google-maps-key');
        if (error) throw error;
        if (data?.apiKey) {
          setMapApiKey(data.apiKey);
        }
      } catch (error) {
        console.error('Error fetching Maps API key:', error);
        setLoading(false);
      }
    };
    if (open) fetchApiKey();
  }, [open]);

  // Déclencher la recherche à l'ouverture
  useEffect(() => {
    if (open && pickupCoordinates && deliveryCoordinates && mapApiKey) {
      searchNearbyDrivers();
    }
  }, [open, pickupCoordinates, deliveryCoordinates, mapApiKey]);

  useEffect(() => {
    if (!mapApiKey || !mapRef.current || !open) return;

    const loadMap = async () => {
      try {
        // Load Google Maps script if not already loaded
        if (!window.google?.maps) {
          const script = document.createElement('script');
          script.src = `https://maps.googleapis.com/maps/api/js?key=${mapApiKey}&libraries=places`;
          script.async = true;
          script.defer = true;
          await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
        }

        // Initialize map with modern styling
        const map = new google.maps.Map(mapRef.current!, {
          center: deliveryCoordinates,
          zoom: 15,
          disableDefaultUI: false,
          zoomControl: true,
          streetViewControl: true,
          mapTypeControl: true,
          styles: [
            {
              featureType: "poi",
              elementType: "all",
              stylers: [{ visibility: "off" }]
            }
          ],
          gestureHandling: 'greedy'
        });

        mapInstanceRef.current = map;

        // Add delivery marker (Tembea red pulsing)
        new google.maps.Marker({
          position: deliveryCoordinates,
          map,
          title: 'Point de livraison',
          icon: {
            url: createDeliveryMarkerIcon(),
            scaledSize: new google.maps.Size(48, 48),
            anchor: new google.maps.Point(24, 24)
          },
          animation: google.maps.Animation.DROP
        });

        // Add pickup marker if available (Tembea black)
        if (pickupCoordinates) {
          new google.maps.Marker({
            position: pickupCoordinates,
            map,
            title: 'Point de retrait (Vendeur)',
            icon: {
              url: createVendorMarkerIcon(),
              scaledSize: new google.maps.Size(48, 48),
              anchor: new google.maps.Point(24, 24)
            },
            animation: google.maps.Animation.DROP
          });

          // Adjust bounds to show both markers
          const bounds = new google.maps.LatLngBounds();
          bounds.extend(deliveryCoordinates);
          bounds.extend(pickupCoordinates);
          map.fitBounds(bounds);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error loading map:', error);
        setLoading(false);
      }
    };

    loadMap();
  }, [mapApiKey, open, deliveryCoordinates, pickupCoordinates]);

  const openInGoogleMaps = () => {
    const url = pickupCoordinates
      ? `https://www.google.com/maps/dir/?api=1&origin=${pickupCoordinates.lat},${pickupCoordinates.lng}&destination=${deliveryCoordinates.lat},${deliveryCoordinates.lng}`
      : `https://www.google.com/maps/search/?api=1&query=${deliveryCoordinates.lat},${deliveryCoordinates.lng}`;
    window.open(url, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Localisation de livraison
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Statut de recherche livreurs */}
          <div className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {searchingDrivers ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <div>
                      <p className="font-semibold text-sm">Recherche de livreurs...</p>
                      <p className="text-xs text-muted-foreground">Scan de la zone en cours</p>
                    </div>
                  </>
                ) : availableDrivers.length > 0 ? (
                  <>
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                      <span className="text-xl">🚗</span>
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-green-700">
                        {availableDrivers.length} livreur{availableDrivers.length > 1 ? 's' : ''} disponible{availableDrivers.length > 1 ? 's' : ''}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Le plus proche à {availableDrivers[0]?.distance?.toFixed(1)} km
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                      <span className="text-xl">⚠️</span>
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-orange-700">Aucun livreur disponible</p>
                      <p className="text-xs text-muted-foreground">Le vendeur peut livrer lui-même</p>
                    </div>
                  </>
                )}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={searchNearbyDrivers}
                disabled={searchingDrivers}
              >
                <RefreshCw className={`h-4 w-4 ${searchingDrivers ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          {/* Adresse */}
          {deliveryAddress && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">Adresse :</p>
              <p className="text-sm text-muted-foreground">{deliveryAddress}</p>
            </div>
          )}

          {/* Coordonnées */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>📍 Lat: {deliveryCoordinates.lat.toFixed(6)}</span>
            <span>📍 Lng: {deliveryCoordinates.lng.toFixed(6)}</span>
          </div>

          {/* Map Container */}
          <div className="relative w-full h-[500px] rounded-lg overflow-hidden border">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Chargement de la carte...</p>
                </div>
              </div>
            )}
            <div ref={mapRef} className="w-full h-full" />

            {/* Markers des livreurs disponibles (rendered via Google Maps) */}
            {mapInstanceRef.current && availableDrivers.map((driver) => (
              <DriverMarkerSimple
                key={driver.driver_id}
                map={mapInstanceRef.current!}
                position={{
                  lat: driver.current_location?.lat || 0,
                  lng: driver.current_location?.lng || 0
                }}
                heading={driver.heading || 0}
                driverName={driver.driver_profile?.display_name}
                isAvailable={true}
                onClick={() => {
                  toast({
                    title: `🚗 ${driver.driver_profile?.display_name}`,
                    description: `Distance: ${driver.distance?.toFixed(1)} km • ETA: ${driver.estimated_arrival} min`,
                  });
                }}
              />
            ))}
          </div>

          {/* Open in Google Maps button */}
          <Button 
            onClick={openInGoogleMaps}
            className="w-full"
            variant="outline"
          >
            <Navigation className="h-4 w-4 mr-2" />
            Ouvrir dans Google Maps (itinéraire)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
