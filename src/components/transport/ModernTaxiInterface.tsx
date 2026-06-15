import { useState, useEffect, useMemo, useCallback, useRef, startTransition } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import PriceConfirmationModal from './PriceConfirmationModal';
import { useSmartGeolocation } from '@/hooks/useSmartGeolocation';
import PickupLocationDialog from './PickupLocationDialog';
import DestinationSearchDialog from './DestinationSearchDialog';
import DriverSearchScreen from './DriverSearchScreen';
import BiddingStatusPanel from './BiddingStatusPanel';
import { useRideDispatch, RideDispatchResult } from '@/hooks/useRideDispatch';
import { useLiveDrivers } from '@/hooks/useLiveDrivers';
import { useAuth } from '@/hooks/useAuth';
import { LocationData } from '@/types/location';
import { toast } from 'sonner';
import { useVehicleTypes } from '@/hooks/useVehicleTypes';
import { getCurrencyByCity } from '@/utils/formatCurrency';
import { SUPPORTED_CITIES } from '@/types/unifiedLocation';
import StaticMapView from './map/StaticMapView';
import TaxiBookingHome from './TaxiBookingHome';
import GpsDebugPanel from '@/components/debug/GpsDebugPanel';
import TaxiDebugPanel from '@/components/debug/TaxiDebugPanel';
import { logger } from '@/utils/logger';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// Hors composant — référence stable, pas recréée à chaque render
const KINSHASA_FALLBACK = { lat: -4.3217, lng: 15.3069, name: 'Kinshasa' };

const detectCityFromTimezone = () => {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return Object.values(SUPPORTED_CITIES).find(c => c.timezone === tz) ?? null;
  } catch {
    return null;
  }
};

interface ModernTaxiInterfaceProps {
  onSubmit?: (data: any) => void;
  onCancel?: () => void;
  onTrackDriver?: (bookingId: string) => void;
  initialDestination?: LocationData | null;
}

export default function ModernTaxiInterface({ onSubmit, onCancel, onTrackDriver, initialDestination }: ModernTaxiInterfaceProps) {
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [pickupLocation, setPickupLocation] = useState<LocationData | null>(null);
  const [destinationLocation, setDestinationLocation] = useState<LocationData | null>(null);
  const [showDestinationSearch, setShowDestinationSearch] = useState(false);
  const [showPriceConfirm, setShowPriceConfirm] = useState(false);
  const [showPickupDialog, setShowPickupDialog] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [distance, setDistance] = useState<number>(0);
  const [routeData, setRouteData] = useState<any>(null);
  const [calculatingRoute, setCalculatingRoute] = useState(false);
  const [manualPosition, setManualPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [persistedUserLocation, setPersistedUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [recenterSignal, setRecenterSignal] = useState(0);
  const [isMapCentered, setIsMapCentered] = useState(true);
  const { user, sessionReady } = useAuth();

  // Attrape les erreurs async non gérées qui plantent la page sans que l'ErrorBoundary les capte
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('🚨 [TAXI] Global error:', event.error);
      event.preventDefault(); // Empêche le crash complet
    };
    const handleRejection = (event: PromiseRejectionEvent) => {
      console.error('🚨 [TAXI] Unhandled rejection:', event.reason);
      event.preventDefault(); // Empêche le crash complet
    };
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  const {
    currentLocation, getCurrentPosition, getPopularPlaces, currentCity,
    forceRefreshPosition, setCurrentCity
  } = useSmartGeolocation();
  
  useEffect(() => {
    logger.info('🌍 [ModernTaxiInterface] currentCity changed:', {
      cityName: currentCity?.name, timestamp: new Date().toISOString()
    });
  }, [currentCity]);
  
  const popularPlaces = useMemo(() => getPopularPlaces(), [getPopularPlaces]);
  const {
    isSearching, assignedDriver, searchProgress, activeBookingId,
    retryCount, createAndDispatchRide, listenForDriverAssignment,
    resetSearch, retryDispatch, cancelBooking
  } = useRideDispatch();

  const handleSearchModalClose = async () => {
    if (activeBookingId) {
      await cancelBooking(activeBookingId);
    } else {
      resetSearch();
    }
  };
  
  const driversUserLocation = useMemo(() => {
    if (!pickupLocation) return null;
    return { lat: pickupLocation.lat, lng: pickupLocation.lng };
  }, [pickupLocation?.lat, pickupLocation?.lng]);
  
  // Defer live drivers load to reduce network contention on mount
  const [enableDrivers, setEnableDrivers] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setEnableDrivers(true), 6000);
    return () => clearTimeout(t);
  }, []);

  const { driversCount, liveDrivers } = useLiveDrivers({
    userLocation: enableDrivers ? driversUserLocation : null, maxRadius: 10,
    showOnlyAvailable: true, updateInterval: 60000
  });
  
  const [locationReady, setLocationReady] = useState(false);
  const [locationError, setLocationError] = useState<{ message: string; type?: string } | null>(null);
  const [retryingLocation, setRetryingLocation] = useState(false);
  const lastPreloadRef = useRef<{ lat: number; lng: number } | null>(null);

  // PRÉ-REMPLIR DESTINATION depuis Mes Adresses
  useEffect(() => {
    if (initialDestination && !destinationLocation) {
      setDestinationLocation(initialDestination);
      toast.success('Destination pré-remplie', {
        description: initialDestination.name || initialDestination.address
      });
    }
  }, [initialDestination]);

  const hasInitLocationRef = useRef(false);
  
  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      if (!locationReady) {
        logger.warn('⚠️ GPS safety timeout after 6s — forcing locationReady');
        if (!pickupLocation) {
          const tzCity = !currentCity ? detectCityFromTimezone() : null;
          const resolvedCity = currentCity || tzCity;
          const fallbackCoords = resolvedCity?.defaultCoordinates ?? resolvedCity?.coordinates ?? KINSHASA_FALLBACK;
          const fallbackName = resolvedCity?.name ?? KINSHASA_FALLBACK.name;
          setPickupLocation({
            address: `${fallbackName} (position approximative)`,
            lat: fallbackCoords.lat,
            lng: fallbackCoords.lng,
            type: 'fallback' as const,
            accuracy: 5000
          });
          setPersistedUserLocation({ lat: fallbackCoords.lat, lng: fallbackCoords.lng });
        }
        setLocationReady(true);
      }
    }, 6000);
    return () => clearTimeout(safetyTimer);
  }, [locationReady]);
  
  useEffect(() => {
    if (hasInitLocationRef.current) return;
    hasInitLocationRef.current = true;
    
    const initLocation = async () => {
      try {
        try {
          const supportedCities = ['kinshasa', 'lubumbashi', 'kolwezi', 'abidjan'];
          localStorage.removeItem('kwenda_ip_location');
          
          const cachedRaw = localStorage.getItem('kwenda_ip_location_cache');
          if (cachedRaw) {
            const cached = JSON.parse(cachedRaw);
            const cachedCity = (cached.city || '').toLowerCase().trim();
            if (cachedCity && !supportedCities.includes(cachedCity)) {
              logger.info(`🗑️ Cache IP invalide (${cached.city}), nettoyage...`);
              localStorage.removeItem('kwenda_ip_location_cache');
            }
          }
        } catch {}

        const quickPos = await new Promise<GeolocationPosition | null>((resolve) => {
          if (!navigator.geolocation) { resolve(null); return; }
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve(pos),
            () => resolve(null),
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
          );
        });
        if (quickPos) {
          const { latitude: lat, longitude: lng, accuracy } = quickPos.coords;
          if (lat !== 0 && lng !== 0) {
            const location: LocationData = {
              address: 'Position actuelle',
              lat, lng,
              type: 'gps',
              accuracy,
            };

            const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
            const tzCityMap: Record<string, (typeof SUPPORTED_CITIES)[keyof typeof SUPPORTED_CITIES]> = {
              'Africa/Abidjan': SUPPORTED_CITIES.abidjan,
              'Africa/Lubumbashi': SUPPORTED_CITIES.lubumbashi,
              'Africa/Kinshasa': SUPPORTED_CITIES.kinshasa,
              'Africa/Dakar': SUPPORTED_CITIES.abidjan,
              'Africa/Bamako': SUPPORTED_CITIES.abidjan,
              'Africa/Ouagadougou': SUPPORTED_CITIES.abidjan,
              'Africa/Lome': SUPPORTED_CITIES.abidjan,
              'UTC': SUPPORTED_CITIES.kinshasa,
            };
            const cityBase = tzCityMap[tz]
              ?? (lat > 0 ? SUPPORTED_CITIES.abidjan : SUPPORTED_CITIES.kinshasa)
              ?? SUPPORTED_CITIES.kinshasa;

            startTransition(() => {
              setPickupLocation(location);
              setPersistedUserLocation({ lat, lng });
              setCurrentCity({ ...cityBase, coordinates: { lat, lng } });
              setLocationReady(true);
            });
            lastPreloadRef.current = { lat, lng };
            return;
          }
        }

        let position;
        try {
          position = await forceRefreshPosition({ minAccuracy: 100, maxWait: 15000 });
        } catch {
          position = await getCurrentPosition({ fallbackToIP: true, timeout: 5000 });
        }
        
        if (position.lat !== 0 && position.lng !== 0) {
          const location: LocationData = {
            address: position.address || 'Position actuelle',
            lat: position.lat, lng: position.lng,
            type: position.type || 'gps', accuracy: position.accuracy,
            name: position.name,
          };
          startTransition(() => {
            setPickupLocation(location);
            setPersistedUserLocation({ lat: position.lat, lng: position.lng });
            setLocationReady(true);
          });
          
          lastPreloadRef.current = { lat: position.lat, lng: position.lng };
          
          // Defer non-critical operations via requestIdleCallback
          const deferredWork = async () => {
            try {
              const [{ predictiveRouteCache }, { taxiMetrics }] = await Promise.all([
                import('@/services/predictiveRouteCacheService'),
                import('@/services/taxiMetricsService'),
              ]);
              predictiveRouteCache.smartPreload(
                { lat: position.lat, lng: position.lng },
                currentCity?.name || 'Kinshasa'
              );
              taxiMetrics.logBookingStarted({
                pickup: { lat: position.lat, lng: position.lng },
                city: currentCity?.name || 'Kinshasa'
              });
            } catch {}
          };
          if (typeof requestIdleCallback === 'function') {
            requestIdleCallback(deferredWork);
          } else {
            setTimeout(deferredWork, 2000);
          }
          
          // Enrichir l'adresse si générique (background)
          const cityName = currentCity?.name || 'Kinshasa';
          if (!position.address || position.address === 'Position actuelle' || position.address === 'Ma position') {
            import('@/services/geocoding').then(({ GeocodingService }) => {
              GeocodingService.reverseGeocode(position.lng, position.lat).then(address => {
                if (address && !['Position actuelle', 'Ma position', 'Current position', 'My position'].some(g => address.toLowerCase() === g.toLowerCase()) && !/^-?\d+\.?\d*\s*,\s*-?\d+\.?\d*/.test(address.trim())) {
                  setPickupLocation(prev => prev ? { ...prev, address, name: address } : prev);
                }
              }).catch(() => {
                setPickupLocation(prev => prev && prev.address === 'Position actuelle' ? { ...prev, address: `📍 ${cityName}` } : prev);
              });
            });
            
            // Fallback garanti : si après 6s l'adresse est toujours générique
            setTimeout(() => {
              setPickupLocation(prev => {
                if (!prev) return prev;
                const generic = ['Position actuelle', 'Ma position', 'Current position', 'My position'];
                const isStillGeneric = generic.some(g => prev.address.toLowerCase() === g.toLowerCase()) || /^-?\d+\.?\d*\s*,\s*-?\d+\.?\d*/.test(prev.address.trim()) || prev.address === 'Position GPS';
                if (isStillGeneric) {
                  return { ...prev, address: `📍 ${cityName}` };
                }
                return prev;
              });
            }, 6000);
          }
        } else {
          setLocationReady(true);
        }
      } catch (error: any) {
        logger.warn('⚠️ GPS initial échoué:', error.message);
        setLocationError({ 
          message: error.message || 'Impossible d\'obtenir votre position',
          type: (error as any).type || 'unknown'
        });
        
        {
          const tzCity = !currentCity ? detectCityFromTimezone() : null;
          const resolvedCity = currentCity || tzCity;
          const fallbackCoords = resolvedCity?.defaultCoordinates ?? resolvedCity?.coordinates ?? KINSHASA_FALLBACK;
          const fallbackName = resolvedCity?.name ?? KINSHASA_FALLBACK.name;
          setPickupLocation({
            address: `${fallbackName} (position approximative)`,
            lat: fallbackCoords.lat,
            lng: fallbackCoords.lng,
            type: 'fallback' as const,
            accuracy: 5000
          });
          setPersistedUserLocation({ lat: fallbackCoords.lat, lng: fallbackCoords.lng });
          setLocationError(null);
          logger.info('📍 Fallback ville utilisé:', fallbackName);
        }
        
        setLocationReady(true);
      }
    };
    
    initLocation();
  }, [getCurrentPosition]);

  useEffect(() => {
    if (pickupLocation && destinationLocation) {
      setCalculatingRoute(true);
    } else {
      setDistance(0); setRouteData(null); setCalculatingRoute(false);
    }
  }, [pickupLocation?.lat, pickupLocation?.lng, destinationLocation?.lat, destinationLocation?.lng]);

  useEffect(() => {
    if (!pickupLocation || !destinationLocation) return;
    const R = 6371;
    const dLat = (destinationLocation.lat - pickupLocation.lat) * Math.PI / 180;
    const dLng = (destinationLocation.lng - pickupLocation.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(pickupLocation.lat * Math.PI / 180) * Math.cos(destinationLocation.lat * Math.PI / 180) * Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const estimatedDistance = Math.round(R * c * 1.4 * 10) / 10;
    setDistance(estimatedDistance);
    setCalculatingRoute(false);
  }, [pickupLocation?.lat, pickupLocation?.lng, destinationLocation?.lat, destinationLocation?.lng]);

  // Safety timeout: force unlock calculatingRoute after 10s
  useEffect(() => {
    if (!calculatingRoute) return;
    const timer = setTimeout(() => {
      if (calculatingRoute) {
        logger.warn('⚠️ Route calculation timeout (10s) — forcing unlock');
        setCalculatingRoute(false);
      }
    }, 10000);
    return () => clearTimeout(timer);
  }, [calculatingRoute]);

  const currency = getCurrencyByCity(currentCity?.name || 'Kinshasa');

  const { vehicles, isLoading: vehiclesLoading } = useVehicleTypes({ 
    distance, city: currentCity?.name || 'Kinshasa' 
  });

  // vehiclesWithPrices supprimé — useVehicleTypes calcule déjà calculatedPrice
  // via useMemo(stableDistance=Math.round(distance)), évite les re-renders sur
  // chaque micro-variation de distance (float 5.234 → 5.235).

  const calculatedPrice = useMemo(() => {
    if (!selectedVehicle || vehicles.length === 0) return 0;
    const vehicle = vehicles.find(v => v.id === selectedVehicle);
    return vehicle?.calculatedPrice || 0;
  }, [selectedVehicle, vehicles]);

  const vehicleOptions = useMemo(() => vehicles.map(v => ({
    id: v.id,
    label: v.name,
    description: v.description || '',
    basePrice: destinationLocation ? (v.calculatedPrice || v.basePrice || null) : (v.basePrice || null),
    etaMinutes: v.driverEta || (v as any).eta || 5,
    capacity: `${v.capacity || 4} place${(v.capacity || 4) > 1 ? 's' : ''}`,
    popular: v.isPopular,
  })), [vehicles, destinationLocation]);

  // Auto-select first vehicle once only
  const hasAutoSelectedRef = useRef(false);
  useEffect(() => {
    if (vehicles.length === 0) return;
    if (hasAutoSelectedRef.current) return;
    hasAutoSelectedRef.current = true;
    setSelectedVehicle(vehicles[0].id);
  }, [vehicles.length]);

  const handleVehicleSelect = useCallback((vehicleId: string) => {
    setSelectedVehicle(vehicleId);
    import('@/services/taxiMetricsService').then(({ taxiMetrics }) => {
      taxiMetrics.logVehicleSelected({ vehicle_type: vehicleId, estimated_price: calculatedPrice });
    }).catch(() => {});
  }, [calculatedPrice]);

  const handlePlaceSelect = (place: any) => {
    const newDestination = {
      address: place.name || place.destination || place.address,
      lat: place.destination_coordinates?.lat || place.lat,
      lng: place.destination_coordinates?.lng || place.lng,
      type: 'popular' as const,
      name: place.name || place.destination
    };
    setDestinationLocation(newDestination);
    setShowDestinationSearch(false);
  };

  const handleDestinationSelect = (destination: { address: string; lat: number; lng: number; name?: string }) => {
    setDestinationLocation({ ...destination, type: 'geocoded' as const });
    setShowDestinationSearch(false);
  };

  const handlePickupSelect = (location: LocationData) => {
    setPickupLocation(location);
    setManualPosition({ lat: location.lat, lng: location.lng });
    toast.success('Point de prise en charge modifié', { description: location.name || location.address });
      (async () => {
      try {
        const { Capacitor } = await import('@capacitor/core');
        if (Capacitor.isNativePlatform()) {
          const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
          await Haptics.impact({ style: ImpactStyle.Light });
          return;
        }
      } catch {}
      try { navigator.vibrate?.(15); } catch {}
    })();
  };

  const handleUseCurrentPosition = async () => {
    setRetryingLocation(true);
    setLocationError(null);
    try {
      localStorage.removeItem('kwenda_ip_location_cache');
      
      const position = await forceRefreshPosition({
        minAccuracy: 50, // On vise 50m
        maxWait: 15000,
        onProgress: (status, accuracy) => {
          if (accuracy) {
            console.log(`📍 GPS Progress: ${status} (±${Math.round(accuracy)}m)`);
          }
        }
      });
      
      if (position.lat !== 0 && position.lng !== 0) {
        setPickupLocation({
          address: position.address || 'Position actuelle',
          lat: position.lat, lng: position.lng,
          type: position.type || 'gps', accuracy: position.accuracy,
          name: position.name,
        });
        setManualPosition(null);
        setPersistedUserLocation({ lat: position.lat, lng: position.lng });
        setLocationError(null);
        
        const accuracy = position.accuracy || 10000;
        if (accuracy <= 30) {
          toast.success('Position GPS ultra-précise', { description: `Précision: ${Math.round(accuracy)}m` });
        } else if (accuracy <= 100) {
          toast.success('Position GPS activée', { description: `Précision: ${Math.round(accuracy)}m` });
        } else {
          toast.warning('Position GPS approximative', { description: `Précision: ${Math.round(accuracy)}m. Restez à l'extérieur pour un meilleur signal.` });
        }
      }
    } catch (error: any) {
      const raw = error.message || 'Impossible d\'obtenir votre position';
      const msg = /Param.tres.*Applications.*Tembea|Applications.*Tembea|Tembea.*Permissions/i.test(raw)
        ? 'Appuyez sur le cadenas dans la barre d\'adresse puis Autorisations puis Position puis Autoriser'
        : raw;
      toast.error(msg);
      setLocationError({ message: msg, type: error.type || 'unknown' });
    } finally {
      setRetryingLocation(false);
    }
  };

  const [tempBookingId, setTempBookingId] = useState<string | null>(null);
  const [isBiddingMode, setIsBiddingMode] = useState(false);

  const handleSearchDriver = async () => {
    try {
    debugLog('searchDriver tap');
    logger.info('🚕 [TAP] handleSearchDriver called', { hasPickup: !!pickupLocation, hasDest: !!destinationLocation, hasVehicle: !!selectedVehicle, hasUser: !!user });
    // Check pickup
    if (!pickupLocation) {
      setShowPickupDialog(true);
      return;
    }
    // Check destination
    if (!destinationLocation) {
      setShowDestinationSearch(true);
      return;
    }
    // Check vehicle
    if (!selectedVehicle) {
      toast.error('Sélectionnez un véhicule');
      return;
    }
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }

    // Everything OK → open price confirmation (NO dispatch yet)
    setShowPriceConfirm(true);
    } catch (err: any) {
      logger.error('❌ handleSearchDriver error:', err);
      toast.error('Erreur', { description: err?.message || 'Veuillez réessayer.' });
    }
  };

  const handleConfirmBooking = async (proposedPrice?: number) => {
    if (!pickupLocation || !destinationLocation || !selectedVehicle || !user) {
      logger.warn('⚠️ handleConfirmBooking: missing prerequisites');
      return;
    }
    try {
    setShowPriceConfirm(false);

    const bookingData = {
      pickupLocation: pickupLocation.address,
      destination: destinationLocation.address,
      pickupCoordinates: { lat: pickupLocation.lat, lng: pickupLocation.lng },
      destinationCoordinates: { lat: destinationLocation.lat, lng: destinationLocation.lng },
      vehicleType: selectedVehicle,
      estimatedPrice: calculatedPrice,
      city: currentCity?.name || 'Kinshasa'
    };

    const isBidding = proposedPrice !== undefined;
    const result: RideDispatchResult = await createAndDispatchRide(bookingData, {
      biddingMode: isBidding, clientProposedPrice: proposedPrice, biddingDuration: 180
    });

    if (result.reason === 'not_authenticated') {
      setShowLoginPrompt(true);
      return;
    }

    if (result.booking?.id) setTempBookingId(result.booking.id);

    if (result.biddingActive) {
      setIsBiddingMode(true);
      toast.success('🎯 Mode enchères activé !', {
        description: `${result.notifiedDrivers || 0} chauffeurs notifiés.`
      });
    } else if (result.success && result.driver) {
      // searchProgress.status === 'found' — DriverSearchScreen affiche la fiche chauffeur.
      // Ne pas appeler onTrackDriver ici : le client tape "Suivre le chauffeur" lui-même.
    } else if (result.success && !result.driver) {
      if (result.booking?.id) listenForDriverAssignment(result.booking.id);
    } else if (!result.success) {
      if (result.reason !== 'no_drivers') {
        toast.error('Erreur de réservation', {
          description: result.message || 'Veuillez réessayer.',
          duration: 6000
        });
      }
      if (result.booking?.id) {
        listenForDriverAssignment(result.booking.id);
      }
    }
    } catch (err: any) {
      logger.error('❌ handleConfirmBooking error:', err);
      toast.error('Erreur lors de la réservation', { description: err?.message || 'Veuillez réessayer.' });
      setShowPriceConfirm(false);
    }
  };

  const navigate = useNavigate();

  // ── DEBUG : logs console temporaires ──
  const debugLog = (msg: string) => {
    console.log('🔴 DEBUG:', msg);
  };

  const handleGoBack = useCallback(() => {
    navigate('/app/client', { replace: true });
  }, [navigate]);

  // Stabiliser les callbacks passés à TaxiBookingHome pour éviter les re-renders.
  const handleOpenDestinationSearch = useCallback(() => { debugLog('openDestSearch'); setShowDestinationSearch(true); }, []);
  const handleQuickDestinationSelect = useCallback((location: { address: string; lat: number; lng: number; name?: string }) => {
    setDestinationLocation({ ...location, type: 'geocoded' as const });
  }, []);


  return (
    <div className="relative h-screen bg-background" style={{ height: '100dvh' }}>
      {/* Debug panels — dev only with query param */}
      {import.meta.env.DEV && new URLSearchParams(window.location.search).has('debug') && (
        <>
          <GpsDebugPanel />
          <TaxiDebugPanel
            user={user}
            sessionReady={sessionReady}
            pickupLocation={pickupLocation}
            destinationLocation={destinationLocation}
            activeBookingId={activeBookingId}
            isSearching={isSearching}
            searchProgress={searchProgress}
          />
        </>
      )}

      {/* TaxiBookingHome — interface principale plein-écran */}
      <div className="fixed inset-0 z-[220]">
        <TaxiBookingHome
          cityLabel={currentCity?.name || 'Kinshasa'}
          currency={currency as 'CDF' | 'XOF'}
          pickupLabel={pickupLocation?.address || 'Position actuelle'}
          destinationLabel={destinationLocation?.address}
          vehicleOptions={vehicleOptions}
          selectedVehicleId={selectedVehicle || null}
          mapSlot={
            <StaticMapView
              pickup={pickupLocation}
              destination={destinationLocation}
              userLocation={currentLocation || persistedUserLocation}
              currentCity={currentCity}
              nearbyDrivers={liveDrivers}
              onMapMoved={() => setIsMapCentered(false)}
              recenterSignal={recenterSignal}
              centerTarget={currentLocation || persistedUserLocation || currentCity?.coordinates}
            />
          }
          isMapCentered={isMapCentered}
          onRecenterMap={() => {
            setRecenterSignal(s => s + 1);
            setIsMapCentered(true);
          }}
          onBack={handleGoBack}
          onSelectVehicle={handleVehicleSelect}
          onSearchDestination={handleOpenDestinationSearch}
          onUseGPS={handleUseCurrentPosition}
          onBook={handleSearchDriver}
        />
      </div>


      {showPriceConfirm && pickupLocation && destinationLocation && (
        <PriceConfirmationModal
          open={showPriceConfirm} onOpenChange={setShowPriceConfirm}
          vehicleType={selectedVehicle} pickup={pickupLocation}
          destination={destinationLocation} distance={distance}
          duration={routeData?.duration || distance * 120}
          calculatedPrice={calculatedPrice} currency={currency}
          onConfirm={handleConfirmBooking} onBack={() => setShowPriceConfirm(false)}
        />
      )}
      
      {showPickupDialog && (
        <PickupLocationDialog
          open={showPickupDialog} onOpenChange={setShowPickupDialog}
          currentLocation={pickupLocation} onSelectLocation={handlePickupSelect}
          onUseCurrentPosition={handleUseCurrentPosition}
          currentCity={currentCity?.name}
        />
      )}
      
      {/* z-[230] : au-dessus de TaxiBookingHome (z-[220]) */}
      {showDestinationSearch && (
        <div className="relative z-[230]">
          <DestinationSearchDialog
            open={showDestinationSearch} onOpenChange={setShowDestinationSearch}
            onSelectDestination={handleDestinationSelect}
            currentLocation={pickupLocation || persistedUserLocation || (currentCity?.coordinates ? { lat: currentCity.coordinates.lat, lng: currentCity.coordinates.lng } : null)}
            currentCity={currentCity?.name}
          />
        </div>
      )}

      {isBiddingMode && tempBookingId ? (
        <div className="fixed inset-0 z-[300] bg-white overflow-y-auto p-4">
        <BiddingStatusPanel
          bookingId={tempBookingId}
          estimatedPrice={calculatedPrice || 0}
          currency={currency as 'CDF' | 'XOF'}
          onDriverAccepted={(driverId) => {
            setIsBiddingMode(false);
            if (onTrackDriver && tempBookingId) onTrackDriver(tempBookingId);
          }}
          onCancel={() => {
            setIsBiddingMode(false);
            handleSearchModalClose();
          }}
        />
        </div>
      ) : (
        <DriverSearchScreen
          isSearching={isSearching} searchProgress={searchProgress}
          assignedDriver={assignedDriver} bookingId={activeBookingId}
          pickupLabel={pickupLocation?.address}
          destinationLabel={destinationLocation?.address}
          onClose={handleSearchModalClose} onRetry={retryDispatch}
          onModifyPrice={async () => {
            await handleSearchModalClose();
            setShowPriceConfirm(true);
          }}
          onTrackDriver={onTrackDriver}
          retryCount={retryCount} maxRetries={3}
        />
      )}

      <AlertDialog open={showLoginPrompt} onOpenChange={setShowLoginPrompt}>
        <AlertDialogContent className="max-w-sm rounded-2xl">
          <AlertDialogHeader>
            <div className="flex justify-center mb-2">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <LogIn className="h-7 w-7 text-primary" />
              </div>
            </div>
            <AlertDialogTitle className="text-center">Connexion requise</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Connectez-vous pour réserver un taxi et profiter de toutes les fonctionnalités Tembea.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
            <AlertDialogAction
              onClick={() => { setShowLoginPrompt(false); navigate('/auth'); }}
              className="w-full gap-2"
            >
              <LogIn className="h-4 w-4" /> Se connecter
            </AlertDialogAction>
            <AlertDialogCancel className="w-full mt-0">Annuler</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
