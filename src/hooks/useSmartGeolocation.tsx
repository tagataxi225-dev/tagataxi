/**
 * 🎯 HOOK DE GÉOLOCALISATION INTELLIGENT - UNIFIÉ ET PROFESSIONNEL
 * 
 * ✅ v4: "Fast-first" — retourne les coords immédiatement, géocode en background
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { APP_CONFIG } from '@/config/appConfig';
import { universalGeolocation, CityConfig } from '@/services/universalGeolocation';
import { nativeGeolocationService } from '@/services/nativeGeolocationService';
import { setCurrentCity as setGlobalCurrentCity, getCityConfigFromName, SUPPORTED_CITIES } from '@/types/unifiedLocation';

// Types exportés pour compatibilité
export interface LocationData {
  address: string;
  lat: number;
  lng: number;
  type?: 'current' | 'geocoded' | 'popular' | 'recent' | 'database' | 'google' | 'manual' | 'ip' | 'fallback' | 'default' | 'gps';
  placeId?: string;
  accuracy?: number;
  name?: string;
  subtitle?: string;
  confidence?: number;
  contact?: {
    name?: string;
    phone?: string;
  };
}

export interface LocationSearchResult extends LocationData {
  id: string;
  title?: string;
  subtitle?: string;
  isPopular?: boolean;
  relevanceScore?: number;
  distance?: number;
  confidence?: number;
}

export interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  fallbackToIP?: boolean;
  fallbackToDatabase?: boolean;
  fallbackToDefault?: boolean;
}

// Coordonnées de fallback par timezone — utilisées si l'IP retourne hors Afrique
const TIMEZONE_COORDS: Record<string, { lat: number; lng: number }> = {
  'Africa/Kinshasa':   { lat: -4.32,  lng: 15.31 },
  'Africa/Lubumbashi': { lat: -11.68, lng: 27.47 },
  'Africa/Abidjan':    { lat: 5.35,   lng: -4.00 },
};
const AFRICA_FALLBACK = { lat: -4.32, lng: 15.31 }; // Kinshasa par défaut

function resolveCoordinatesFromTimezone(): { lat: number; lng: number } {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return TIMEZONE_COORDS[tz] ?? AFRICA_FALLBACK;
  } catch {
    return AFRICA_FALLBACK;
  }
}

// Cache en mémoire pour la session
const locationCache = new Map<string, { data: any; timestamp: number; accuracy?: number }>();
const CACHE_TTL = 30 * 1000;

// Clé localStorage pour la dernière position GPS connue
const LAST_POS_KEY = 'kwenda_last_gps_pos';
const LAST_POS_TTL = 5 * 60 * 1000; // 5 minutes — au-delà la position est périmée

/** Distance Haversine en mètres entre deux coordonnées */
function distanceMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6_371_000;
  const φ1 = a.lat * Math.PI / 180, φ2 = b.lat * Math.PI / 180;
  const Δφ = (b.lat - a.lat) * Math.PI / 180;
  const Δλ = (b.lng - a.lng) * Math.PI / 180;
  const s = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

export const useSmartGeolocation = (options: GeolocationOptions = {}) => {
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [currentCity, setCurrentCity] = useState<CityConfig | null>(null);
  const [popularPlaces, setPopularPlaces] = useState<LocationSearchResult[]>([]);
  
  const abortControllerRef = useRef<AbortController>();
  // GPS a toujours priorité sur IP : une fois que le GPS a fourni une ville,
  // la détection IP (plus lente) ne doit pas l'écraser.
  const gpsHasSetCityRef = useRef(false);
  // Dernières coordonnées définies dans currentLocation — sert au seuil 50m
  const lastCoordsRef = useRef<{ lat: number; lng: number } | null>(null);
  // Throttle geocoding : pas plus d'1 appel à geocode-reverse toutes les 30s.
  // Évite la saturation réseau si GPS drift ou bouton "Me localiser" tapé en boucle.
  const lastGeocodeTimeRef = useRef(0);
  const GEOCODE_THROTTLE_MS = APP_CONFIG.GEOCODE_THROTTLE_MS;

  // Restaurer la dernière position GPS connue pour affichage immédiat au chargement.
  // Permet de montrer la carte centrée sur la bonne position pendant que le GPS se réveille.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LAST_POS_KEY);
      if (!raw) return;
      const saved: { lat: number; lng: number; accuracy: number; address: string; timestamp: number } = JSON.parse(raw);
      if (Date.now() - saved.timestamp > LAST_POS_TTL) return;
      const loc: LocationData = {
        address: saved.address || 'Dernière position connue',
        lat: saved.lat, lng: saved.lng,
        type: 'current', accuracy: saved.accuracy,
      };
      setCurrentLocation(loc);
      lastCoordsRef.current = { lat: saved.lat, lng: saved.lng };
    } catch { /* localStorage peut être indisponible ou le JSON corrompu */ }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Détection de la ville au montage
  useEffect(() => {
    const detectCity = async () => {
      try {
        const city = await universalGeolocation.detectUserCity();
        console.log('🌍 [useSmartGeolocation] Ville détectée (IP):', {
          name: city.name, code: city.code, country: city.countryCode
        });
        // Ne pas écraser si GPS a déjà fourni une ville plus précise
        if (gpsHasSetCityRef.current) {
          console.log('⏭️ [useSmartGeolocation] GPS déjà défini la ville, IP ignorée');
          return;
        }
        setCurrentCity(city);
        
        const globalConfig = getCityConfigFromName(city.name);
        if (globalConfig) {
          setGlobalCurrentCity(globalConfig);
        } else {
          setGlobalCurrentCity({
            name: city.name, code: city.code,
            countryCode: city.countryCode || 'XX',
            defaultCoordinates: { lat: city.coordinates.lat, lng: city.coordinates.lng },
            timezone: city.timezone || 'UTC', currency: city.currency || 'CDF'
          });
        }
        
        const places = await universalGeolocation.getPopularPlacesForCurrentCity();
        // Second guard: GPS may have fired while we awaited popular places
        if (gpsHasSetCityRef.current) {
          console.log('⏭️ [useSmartGeolocation] GPS a pris le relais pendant getPopularPlaces, lieux IP ignorés');
          return;
        }
        const sortedPlaces = places
          .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
          .map((p, idx) => ({
            id: `popular-${idx}`, address: p.name, lat: p.lat, lng: p.lng,
            type: 'popular' as const, name: p.name,
            subtitle: p.commune || city.name, isPopular: true,
            relevanceScore: 90 - idx * 5
          }));
        setPopularPlaces(sortedPlaces);
      } catch (err) {
        console.error('Erreur détection ville:', err);
      }
    };
    detectCity();
  }, []);

  /**
   * 📍 Obtenir la position GPS actuelle
   * ✅ v4: Retourne les coords IMMÉDIATEMENT, enrichit l'adresse en background
   */
  const getCurrentPosition = useCallback(async (opts?: GeolocationOptions): Promise<LocationData> => {
    const isNative = nativeGeolocationService.isNativePlatform();
    console.log(`📍 [useSmartGeolocation] getCurrentPosition - platform: ${isNative ? 'native' : 'web'}`);
    
    const cacheKey = 'current-position';
    const cached = locationCache.get(cacheKey);
    // Cache valide seulement si < 30s ET précision ≤ 150m
    const cacheValid = cached && 
      Date.now() - cached.timestamp < CACHE_TTL &&
      (!cached.accuracy || cached.accuracy <= 150);
    
    if (cacheValid) {
      console.log('📍 Position depuis cache (précise)');
      return cached.data;
    }

    setLoading(true);
    setError(null);

    const isNativePlatform = nativeGeolocationService.isNativePlatform();
    const effectiveTimeout = opts?.timeout ?? 20000;

    try {
      console.log(`📍 GPS request (timeout: ${effectiveTimeout/1000}s, native: ${isNativePlatform})...`);

      const position = await nativeGeolocationService.getCurrentPosition({
        enableHighAccuracy: opts?.enableHighAccuracy ?? true,
        timeout: effectiveTimeout,
        maximumAge: opts?.maximumAge ?? 0
      });

      const coords = { lat: position.lat, lng: position.lng };
      console.log(`✅ GPS réussi:`, coords, `Précision: ±${Math.round(position.accuracy)}m`);

      // ✅ v4: RETOURNER IMMÉDIATEMENT avec coords — pas d'attente géocodage
      const immediateLocationData: LocationData = {
        address: 'Position actuelle',
        lat: coords.lat,
        lng: coords.lng,
        type: 'current',
        accuracy: position.accuracy,
        name: 'Ma position',
        confidence: Math.min(100, Math.max(0, 100 - (position.accuracy || 0) / 10))
      };

      // Seuil 50m : si la position n'a pas changé significativement par rapport à
      // la dernière position connue, on met à jour le cache sans re-render.
      // Élimine les re-renders en cascade causés par les micro-variations GPS (drift).
      const prevCoords = lastCoordsRef.current;
      const hasMoved = !prevCoords || distanceMeters(prevCoords, coords) >= 50;
      locationCache.set(cacheKey, { data: immediateLocationData, timestamp: Date.now(), accuracy: position.accuracy });
      if (hasMoved) {
        lastCoordsRef.current = coords;
        setCurrentLocation(immediateLocationData);
      }
      setLoading(false);

      // ✅ v4: Enrichir l'adresse EN BACKGROUND (ne bloque plus le retour)
      enrichAddressInBackground(coords, position.accuracy, cacheKey);

      // ✅ Fix iOS: re-détecter la ville avec les vraies coordonnées GPS
      // GPS a priorité — marquer avant l'appel async pour bloquer toute détection IP concurrente
      gpsHasSetCityRef.current = true;
      universalGeolocation.detectUserCity(coords).then(city => {
        console.log('🌍 Ville détectée via GPS:', city.name);
        setCurrentCity(city);
        const globalConfig = getCityConfigFromName(city.name);
        if (globalConfig) {
          setGlobalCurrentCity(globalConfig);
        }
      }).catch(() => {});

      return immediateLocationData;

    } catch (gpsError: any) {
      console.warn(`❌ GPS failed:`, gpsError.message);

      // Fallback IP si autorisé
      if (opts?.fallbackToIP === true) {
        try {
          const { IPGeolocationService } = await import('@/services/ipGeolocation');
          const ipLocation = await IPGeolocationService.getInstance().getCurrentLocation();
          const rawLat = ipLocation.latitude;
          const rawLng = ipLocation.longitude;
          const isOutsideAfrica = rawLat > 10 || rawLat < -15;
          if (isOutsideAfrica) {
            console.warn(`⚠️ IP hors Afrique (${rawLat.toFixed(2)}, ${rawLng.toFixed(2)}) — remplacement par timezone`);
          }
          const { lat: resolvedLat, lng: resolvedLng } = isOutsideAfrica
            ? resolveCoordinatesFromTimezone()
            : { lat: rawLat, lng: rawLng };
          const locationData: LocationData = {
            address: 'Position approximative', lat: resolvedLat, lng: resolvedLng,
            type: 'ip', accuracy: 10000, name: 'Ma position'
          };
          const detectedCity = await universalGeolocation.detectUserCity({ lat: resolvedLat, lng: resolvedLng });
          // ✅ FIX: Sync currentLocation + currentCity for IP fallback
          setCurrentLocation(locationData);
          setCurrentCity(detectedCity);
          const globalConfig = getCityConfigFromName(detectedCity.name);
          if (globalConfig) setGlobalCurrentCity(globalConfig);
          locationCache.set(cacheKey, { data: locationData, timestamp: Date.now(), accuracy: 10000 });
          setLoading(false);
          // ✅ FIX: IP fallback succeeded = NOT an error state
          setError(null);
          return locationData;
        } catch (ipError) {
          console.error('IP fallback échoué:', ipError);
          try {
            const city = await universalGeolocation.detectUserCity();
            const locationData: LocationData = {
              address: `Centre de ${city.name}`, lat: city.coordinates.lat, lng: city.coordinates.lng,
              type: 'fallback', accuracy: 50000, name: city.name
            };
            // ✅ FIX: Sync currentLocation + currentCity for city fallback
            setCurrentLocation(locationData);
            setCurrentCity(city);
            const globalConfig = getCityConfigFromName(city.name);
            if (globalConfig) setGlobalCurrentCity(globalConfig);
            locationCache.set(cacheKey, { data: locationData, timestamp: Date.now(), accuracy: 50000 });
            setLoading(false);
            // ✅ FIX: City fallback succeeded = NOT an error state
            setError(null);
            return locationData;
          } catch (e) { /* ignore */ }
        }
      }

      setLoading(false);
      const errorMsg = gpsError?.message || 'Impossible de déterminer votre position';
      setError(errorMsg);
      // ✅ FIX: Preserve original error type for LocationErrorHandler
      const enrichedError: any = new Error(errorMsg);
      enrichedError.type = gpsError?.type || gpsError?.code || 'unknown';
      throw enrichedError;
    }
  }, []);

  // ✅ v4: Enrichissement adresse en arrière-plan (non bloquant)
  const enrichAddressInBackground = async (
    coords: { lat: number; lng: number },
    accuracy: number,
    cacheKey: string
  ) => {
    // Throttle : max 1 appel geocoding toutes les 30s pour ne pas saturer le réseau
    const now = Date.now();
    if (now - lastGeocodeTimeRef.current < GEOCODE_THROTTLE_MS) {
      console.log('⏩ [Geocode] Throttled — dernier appel il y a', Math.round((now - lastGeocodeTimeRef.current) / 1000), 's');
      return;
    }
    lastGeocodeTimeRef.current = now;

    try {
      const detectedCity = await universalGeolocation.detectUserCity(coords);
      let formattedAddress = 'Position actuelle';
      let placeName = 'Ma position';

      // Tentative 1: Edge Function geocode-reverse
      try {
        const { data: geocodeData, error: geocodeError } = await supabase.functions.invoke('geocode-reverse', {
          body: { lat: coords.lat, lng: coords.lng }
        });
        if (!geocodeError && geocodeData?.success && geocodeData?.address) {
          const rawAddress = geocodeData.address;
          const isRawCoords = /^-?\d+\.?\d*\s*,\s*-?\d+\.?\d*/.test(rawAddress.trim());
          if (!isRawCoords && rawAddress !== 'Position actuelle') {
            formattedAddress = rawAddress.length > 80 
              ? rawAddress.split(',').map((p: string) => p.trim()).slice(0, -1).join(', ')
              : rawAddress;
            placeName = rawAddress.split(',').map((p: string) => p.trim())[0] || placeName;
          }
        }
      } catch { /* silent */ }

      // Tentative 2: Google Maps client-side
      if (formattedAddress === 'Position actuelle' && window.google?.maps?.Geocoder) {
        try {
          const geocoder = new google.maps.Geocoder();
          const result = await geocoder.geocode({ location: { lat: coords.lat, lng: coords.lng } });
          if (result.results?.[0]) {
            formattedAddress = result.results[0].formatted_address;
            placeName = result.results[0].address_components?.[0]?.long_name || placeName;
          }
        } catch { /* silent */ }
      }

      // Tentative 3: Nom de ville lisible
      if (formattedAddress === 'Position actuelle') {
        formattedAddress = `${detectedCity.name} - Position GPS`;
        placeName = detectedCity.name;
      }

      // ✅ Mettre à jour le cache et le state avec l'adresse enrichie
      const enrichedLocation: LocationData = {
        address: formattedAddress, lat: coords.lat, lng: coords.lng,
        type: 'current', accuracy, name: placeName,
        confidence: Math.min(100, Math.max(0, 100 - accuracy / 10))
      };

      locationCache.set(cacheKey, { data: enrichedLocation, timestamp: Date.now(), accuracy });
      setCurrentLocation(enrichedLocation);
      // Persister l'adresse enrichie pour affichage immédiat au prochain chargement de la page
      try {
        localStorage.setItem(LAST_POS_KEY, JSON.stringify({
          lat: coords.lat, lng: coords.lng, accuracy,
          address: formattedAddress, timestamp: Date.now(),
        }));
      } catch { /* écriture localStorage best-effort */ }
      console.log('✅ Adresse enrichie en background:', formattedAddress);
    } catch (err) {
      console.warn('⚠️ Background address enrichment failed:', err);
    }
  };

  /**
   * 🔍 Rechercher des lieux via Google Places + DB
   */
  const searchLocations = useCallback(async (query: string): Promise<LocationSearchResult[]> => {
    if (!query || query.trim().length < 2) return popularPlaces.slice(0, 5);

    const cacheKey = `search-${query.toLowerCase()}`;
    const cached = locationCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) return cached.data;

    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    setSearchLoading(true);
    setError(null);

    try {
      const userLat = currentLocation?.lat || currentCity?.coordinates?.lat;
      const userLng = currentLocation?.lng || currentCity?.coordinates?.lng;
      const countryCode = currentCity?.countryCode;
      
      const { data: googleData, error: googleError } = await supabase.functions.invoke(
        'google-places-autocomplete',
        {
          body: {
            input: query, language: 'fr', lat: userLat, lng: userLng,
            countries: countryCode && countryCode !== 'XX' ? [countryCode.toUpperCase()] : undefined
          }
        }
      );

      if (googleError) throw googleError;
      const predictions = googleData?.predictions || [];
      const city = await universalGeolocation.detectUserCity();
      
      const enrichedResults = await Promise.all(
        predictions.slice(0, 3).map(async (pred: any, idx: number) => {
          try {
            const { data: details } = await supabase.functions.invoke('google-place-details', {
              body: { placeId: pred.placeId }
            });
            if (details?.result?.geometry?.location) {
              return {
                id: pred.placeId, address: pred.description,
                lat: details.result.geometry.location.lat,
                lng: details.result.geometry.location.lng,
                type: 'google' as const, placeId: pred.placeId,
                name: pred.structuredFormatting?.mainText || pred.description,
                subtitle: pred.structuredFormatting?.secondaryText,
                title: pred.structuredFormatting?.mainText,
                relevanceScore: 100 - idx * 10
              };
            }
          } catch { /* fallback below */ }
          
          const fallbackCoords = currentLocation 
            ? { lat: currentLocation.lat, lng: currentLocation.lng }
            : { lat: city.coordinates.lat, lng: city.coordinates.lng };
          return {
            id: pred.placeId, address: pred.description,
            lat: fallbackCoords.lat, lng: fallbackCoords.lng,
            type: 'google' as const, placeId: pred.placeId,
            name: pred.structuredFormatting?.mainText || pred.description,
            subtitle: pred.structuredFormatting?.secondaryText,
            title: pred.structuredFormatting?.mainText,
            relevanceScore: 90 - idx * 10
          };
        })
      );

      const userFallbackCoords = currentLocation 
        ? { lat: currentLocation.lat, lng: currentLocation.lng }
        : { lat: city.coordinates.lat, lng: city.coordinates.lng };
      const remainingResults = predictions.slice(3, 5).map((pred: any, idx: number) => ({
        id: pred.placeId, address: pred.description,
        lat: userFallbackCoords.lat, lng: userFallbackCoords.lng,
        type: 'google' as const, placeId: pred.placeId,
        name: pred.structuredFormatting?.mainText || pred.description,
        subtitle: pred.structuredFormatting?.secondaryText,
        title: pred.structuredFormatting?.mainText,
        relevanceScore: 80 - idx * 10
      }));

      const results = [...enrichedResults, ...remainingResults];
      const filteredPopular = popularPlaces
        .filter(p => p.name?.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 3).map((p, idx) => ({ ...p, relevanceScore: 85 - idx * 5 }));
      
      const allResults = [...results, ...filteredPopular];
      locationCache.set(cacheKey, { data: allResults, timestamp: Date.now() });
      return allResults;

    } catch (err: any) {
      console.error('Erreur recherche:', err);
      setError(err.message || 'Erreur de recherche');
      return popularPlaces.filter(p => 
        p.name?.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5);
    } finally {
      setSearchLoading(false);
    }
  }, [popularPlaces]);

  const getPopularPlaces = useCallback((): LocationSearchResult[] => popularPlaces, [popularPlaces]);

  const calculateDistance = useCallback((
    point1: { lat: number; lng: number },
    point2: { lat: number; lng: number }
  ): number => {
    const R = 6371000;
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLng = (point2.lng - point1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }, []);

  const formatDistance = useCallback((meters: number): string => {
    if (meters < 1000) return `${Math.round(meters)}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  }, []);

  const clearError = useCallback(() => { setError(null); }, []);

  /**
   * 🎯 Position PRÉCISE avec watch progressif — pour bouton "Me localiser"
   * Utilise getPreciseInitialPosition: watch GPS jusqu'à ±80m ou timeout 15s
   */
  const forceRefreshPosition = useCallback(async (opts?: { 
    minAccuracy?: number; maxWait?: number;
    onProgress?: (status: string, accuracy?: number) => void;
  }): Promise<LocationData> => {
    // Invalider le cache pour forcer une position fraîche
    locationCache.delete('current-position');
    setLoading(true);
    setError(null);

    try {
      const result = await nativeGeolocationService.getPreciseInitialPosition({
        minAccuracy: opts?.minAccuracy ?? 80,
        maxWait: opts?.maxWait ?? 15000,
        onProgress: opts?.onProgress
      });

      console.log(`🎯 Position précise: ±${Math.round(result.accuracy)}m (${result.reason})`);

      const locationData: LocationData = {
        address: 'Position actuelle',
        lat: result.lat,
        lng: result.lng,
        type: 'current',
        accuracy: result.accuracy,
        name: 'Ma position',
        confidence: Math.min(100, Math.max(0, 100 - result.accuracy / 10))
      };

      const cacheKey = 'current-position';
      locationCache.set(cacheKey, { data: locationData, timestamp: Date.now(), accuracy: result.accuracy });
      setCurrentLocation(locationData);
      setLoading(false);

      // Enrichir l'adresse en background
      enrichAddressInBackground({ lat: result.lat, lng: result.lng }, result.accuracy, cacheKey);

      // Re-détecter la ville avec les vraies coordonnées (GPS prime sur IP)
      gpsHasSetCityRef.current = true;
      universalGeolocation.detectUserCity({ lat: result.lat, lng: result.lng }).then(city => {
        setCurrentCity(city);
        const globalConfig = getCityConfigFromName(city.name);
        if (globalConfig) setGlobalCurrentCity(globalConfig);
      }).catch(() => {});

      return locationData;
    } catch (e: any) {
      setLoading(false);
      setError(e?.message || 'GPS indisponible');
      throw e;
    }
  }, []);

  return {
    loading, searchLoading,
    searchResults: [] as LocationSearchResult[],
    error, currentCity, currentLocation,
    currentPosition: currentLocation,
    source: 'smart_geolocation' as const,
    lastUpdate: Date.now(),
    latitude: currentLocation?.lat ?? null,
    longitude: currentLocation?.lng ?? null,
    accuracy: currentLocation?.accuracy || 0,
    isRealGPS: currentLocation?.type === 'current' || currentLocation?.type === 'gps',
    getCurrentPosition, searchLocations, getPopularPlaces,
    calculateDistance, formatDistance, clearError,
    requestLocation: getCurrentPosition,
    forceRefreshPosition, setCurrentCity
  };
};
