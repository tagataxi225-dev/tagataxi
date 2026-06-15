import React, { useEffect, useRef, useState } from 'react';
import { Loader2, MapPin, Plus, Minus, Navigation as NavigationIcon, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import KwendaMapControls from '@/components/maps/KwendaMapControls';
import { Button } from '@/components/ui/button';
import CustomMarkers from './CustomMarkers';
import ProfessionalRoutePolyline from './ProfessionalRoutePolyline';
import LiveDriversLayer from '../LiveDriversLayer';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';
import { useMapTheme } from '@/hooks/useMapTheme';
import { useSmartMapCamera } from '@/hooks/useSmartMapCamera';
import { throttle } from '@/utils/performanceUtils';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface Location {
  lat: number;
  lng: number;
  address: string;
  name?: string;
}

interface ModernMapViewProps {
  pickup?: Location | null;
  destination?: Location | null;
  onMapClick?: (location: { lat: number; lng: number }) => void;
  visualizationMode?: 'selection' | 'route' | 'tracking';
  currentDriverLocation?: { lat: number; lng: number };
  userLocation?: { lat: number; lng: number } | null;
  className?: string;
  showLiveDrivers?: boolean;
}

export default function ModernMapView({
  pickup,
  destination,
  onMapClick,
  visualizationMode = 'selection',
  currentDriverLocation,
  userLocation,
  className = '',
  showLiveDrivers = true
}: ModernMapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const mapboxMapRef = useRef<mapboxgl.Map | null>(null);
  const { isLoaded, error, isLoading } = useGoogleMaps();
  const { mapStyles } = useMapTheme();
  const [isMapReady, setIsMapReady] = useState(false);
  const [useMapboxFallback, setUseMapboxFallback] = useState(false);
  const [showDriversLayer, setShowDriversLayer] = useState(showLiveDrivers);
  const { toast } = useToast();

  // 🔍 Phase 5: Logs détaillés
  useEffect(() => {
    console.log('📊 [ModernMapView] État actuel:', {
      isLoaded,
      error,
      isLoading,
      isMapReady,
      useMapboxFallback,
      hasPickup: !!pickup,
      hasDestination: !!destination,
      hasUserLocation: !!userLocation
    });
  }, [isLoaded, error, isLoading, isMapReady, useMapboxFallback, pickup, destination, userLocation]);

  // Fallback Mapbox seulement après plusieurs échecs
  useEffect(() => {
    if (error && !useMapboxFallback) {
      const isApiKeyRejected = error.includes('API_KEY_REJECTED');
      if (isApiKeyRejected) {
        console.log('⚠️ Google Maps failed, switching to Mapbox fallback. Reason:', error);
        setUseMapboxFallback(true);
        toast({
          title: "⚠️ Carte alternative activée",
          description: "Clé Google Maps rejetée sur ce domaine. Mapbox utilisé.",
        });
      }
    }
  }, [error, useMapboxFallback, toast]);

  // 🗺️ Initialisation Mapbox Fallback (simplifié et robuste)
  useEffect(() => {
    if (!useMapboxFallback || !mapRef.current || mapboxMapRef.current) return;

    const initMapbox = () => {
      try {
        // Token public Mapbox (gratuit pour usage modéré)
        mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;
        
        const center: [number, number] = userLocation 
          ? [userLocation.lng, userLocation.lat]
          : pickup 
          ? [pickup.lng, pickup.lat]
          : [15.3069, -4.3217]; // Kinshasa (lng, lat inversé pour Mapbox)

        console.log('🗺️ Initialisation Mapbox avec centre:', center);

        const map = new mapboxgl.Map({
          container: mapRef.current!,
          style: 'mapbox://styles/mapbox/dark-v11',
          center: center,
          zoom: 13,
          pitch: 45,
          bearing: 0,
          antialias: true
        });

        // Contrôles de navigation
        map.addControl(new mapboxgl.NavigationControl({
          visualizePitch: true,
          showZoom: true,
          showCompass: true
        }), 'top-right');

        // Attendre le chargement de la carte
        // Support du clic sur la carte Mapbox
        if (onMapClick) {
          map.on('click', (e) => {
            console.log('📍 [Mapbox] Clic carte:', e.lngLat.lat, e.lngLat.lng);
            onMapClick({ lat: e.lngLat.lat, lng: e.lngLat.lng });
          });
        }

        map.on('load', () => {
          console.log('✅ Mapbox carte chargée');
          // Ajouter marker position utilisateur (bleu pulsant)
          if (userLocation) {
            const el = document.createElement('div');
            el.className = 'user-location-marker';
            el.style.cssText = `
              width: 30px;
              height: 30px;
              background: radial-gradient(circle, #3B82F6, #2563EB);
              border: 3px solid white;
              border-radius: 50%;
              box-shadow: 0 0 20px rgba(59, 130, 246, 0.6);
              animation: pulse-marker 2s ease-in-out infinite;
            `;

            new mapboxgl.Marker({ element: el, anchor: 'center' })
              .setLngLat([userLocation.lng, userLocation.lat])
              .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML('<strong>📍 Ma position</strong>'))
              .addTo(map);
          }

          // Ajouter marker pickup (noir Tembea)
          if (pickup) {
            const el = document.createElement('div');
            el.className = 'pickup-marker';
            el.style.cssText = `
              width: 40px;
              height: 40px;
              background: linear-gradient(145deg, #1A1A1A, #2A2A2A);
              border: 3px solid white;
              border-radius: 50%;
              box-shadow: 0 8px 20px rgba(0, 0, 0, 0.5);
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 20px;
            `;
            el.innerHTML = '📍';

            new mapboxgl.Marker({ element: el, anchor: 'bottom' })
              .setLngLat([pickup.lng, pickup.lat])
              .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(`<strong>📍 Départ</strong><br/>${(pickup.address || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')}`))
              .addTo(map);
          }

          // Ajouter marker destination (rouge Tembea)
          if (destination) {
            const el = document.createElement('div');
            el.className = 'destination-marker';
            el.style.cssText = `
              width: 40px;
              height: 40px;
              background: linear-gradient(145deg, #DC2626, #EF4444);
              border: 3px solid white;
              border-radius: 50%;
              box-shadow: 0 8px 20px rgba(239, 68, 68, 0.6);
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 20px;
              animation: pulse-marker 2s ease-in-out infinite;
            `;
            el.innerHTML = '🎯';

            new mapboxgl.Marker({ element: el, anchor: 'bottom' })
              .setLngLat([destination.lng, destination.lat])
              .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(`<strong>🎯 Destination</strong><br/>${(destination.address || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')}`))
              .addTo(map);
          }

          // Route entre pickup et destination
          if (pickup && destination && visualizationMode === 'route') {
            console.log('🛣️ Ajout route Mapbox');
            
            // Créer ligne de route
            map.addSource('route', {
              type: 'geojson',
              data: {
                type: 'Feature',
                properties: {},
                geometry: {
                  type: 'LineString',
                  coordinates: [
                    [pickup.lng, pickup.lat],
                    [destination.lng, destination.lat]
                  ]
                }
              }
            });

            map.addLayer({
              id: 'route',
              type: 'line',
              source: 'route',
              layout: {
                'line-join': 'round',
                'line-cap': 'round'
              },
              paint: {
                'line-color': '#EF4444',
                'line-width': 5,
                'line-gradient': [
                  'interpolate',
                  ['linear'],
                  ['line-progress'],
                  0, '#1A1A1A',
                  1, '#EF4444'
                ]
              }
            });

            // Ajuster bounds
            const bounds = new mapboxgl.LngLatBounds();
            bounds.extend([pickup.lng, pickup.lat]);
            bounds.extend([destination.lng, destination.lat]);
            map.fitBounds(bounds, { padding: 80, duration: 1000 });
          }
        });

        mapboxMapRef.current = map;
        setIsMapReady(true);

        return () => {
          map.remove();
        };
      } catch (err) {
        console.error('❌ Erreur Mapbox:', err);
      }
    };

    initMapbox();
  }, [useMapboxFallback, pickup, destination, userLocation, visualizationMode]);

  // Initialisation de la carte Google Maps avec Map ID
  useEffect(() => {
    if (!isLoaded || !mapRef.current || mapInstanceRef.current || useMapboxFallback) return;

    const initializeMap = async () => {
      try {
        // ✅ Double vérification avant création
        if (!window.google?.maps?.Map) {
          console.error('❌ google.maps.Map is not available');
          toast({
            title: "Erreur",
            description: "Google Maps n'est pas disponible",
            variant: "destructive"
          });
          return;
        }

        // ✅ S'assurer que la bibliothèque maps est chargée
        console.log('🔄 Importing Google Maps library...');
        await window.google.maps.importLibrary('maps');
        await window.google.maps.importLibrary('marker');
        
        // ✅ Délai de sécurité pour laisser le temps au constructeur de s'initialiser
        await new Promise(resolve => setTimeout(resolve, 100));

        // ✅ Vérification finale du constructeur
        if (typeof window.google.maps.Map !== 'function') {
          console.error('❌ google.maps.Map is not a constructor');
          return;
        }

        // 📍 Centrage automatique sur la position réelle détectée
        const defaultCenter = userLocation 
          ? { lat: userLocation.lat, lng: userLocation.lng }
          : pickup 
          ? { lat: pickup.lat, lng: pickup.lng }
          : { lat: -4.3217, lng: 15.3069 }; // Kinshasa en dernier recours
        
        console.log('📍 Centrage carte sur position réelle:', defaultCenter, 
          userLocation ? '✅ POSITION UTILISATEUR DÉTECTÉE' : pickup ? '(pickup)' : '(Kinshasa default)');

        // Récupérer le Map ID depuis le loader
        const { googleMapsLoader } = await import('@/services/googleMapsLoader');
        const mapId = googleMapsLoader.getMapId();
        
        // ✅ Map ID est OPTIONNEL - valider le format
        const validMapId = (mapId && !mapId.startsWith('AIza')) ? mapId : undefined;
        
        if (!validMapId) {
          console.warn('⚠️ Map ID absent ou invalide - utilisation des marqueurs classiques');
        } else {
          console.log('✅ Using valid Map ID:', validMapId);
        }

        const map = new google.maps.Map(mapRef.current!, {
          // ✅ Map ID conditionnel - fonctionne sans
          ...(validMapId && { mapId: validMapId }),
          center: defaultCenter,
          zoom: 13, // Zoom initial bas - sera ajusté par useSmartMapCamera
          minZoom: 10,
          maxZoom: 18,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: true,
          tilt: 45,
          heading: 0,
          gestureHandling: 'greedy',
          styles: mapStyles // 🎨 Thème dynamique clair/sombre
        });

        console.log('✅ [ModernMapView] Carte Google Maps créée avec succès');

        // 🔍 Détection d'erreur d'authentification Google post-chargement
        // Google injecte un div .gm-err-container quand la clé est rejetée par le domaine
        const errorCheckTimeout = setTimeout(() => {
          if (!mapRef.current) return;
          const errContainer = mapRef.current.querySelector('.gm-err-container');
          const errMessage = mapRef.current.querySelector('.gm-err-message');
          const dismissBtn = mapRef.current.querySelector('.dismissButton');
          
          if (errContainer || errMessage || dismissBtn) {
            console.error('❌ [ModernMapView] Google Maps a rejeté la clé API sur ce domaine');
            // Nettoyer la carte Google défaillante
            mapInstanceRef.current = null;
            setIsMapReady(false);
            setUseMapboxFallback(true);
            toast({
              title: "⚠️ Carte alternative activée",
              description: "Google Maps non disponible sur ce domaine. Mapbox est utilisé.",
            });
          }
        }, 3000);

        // Si les tiles chargent correctement, annuler la vérification d'erreur
        map.addListener('tilesloaded', () => {
          clearTimeout(errorCheckTimeout);
          console.log('✅ [ModernMapView] Tiles Google Maps chargées - clé API OK');
        });

        // Gestion du clic sur la carte avec effet ripple et throttling
        if (onMapClick) {
          console.log('🖱️ [ModernMapView] Gestionnaire de clic activé');
          const throttledClick = throttle((e: google.maps.MapMouseEvent) => {
            if (e.latLng) {
              console.log('📍 [ModernMapView] Clic carte:', e.latLng.lat(), e.latLng.lng());
              createRippleEffect(e.latLng);
              onMapClick({
                lat: e.latLng.lat(),
                lng: e.latLng.lng()
              });
            }
          }, 300);

          map.addListener('click', throttledClick);
        }

        mapInstanceRef.current = map;
        setIsMapReady(true);
        console.log('✅ [ModernMapView] Carte prête et référence stockée');
      } catch (err) {
        console.error('❌ [ModernMapView] Erreur initialisation carte:', err);
        toast({
          title: "Erreur de chargement",
          description: "Impossible de charger la carte. Rechargez la page.",
          variant: "destructive"
        });
      }
    };

    initializeMap();
  }, [isLoaded, onMapClick, pickup, userLocation, useMapboxFallback, toast]);

  // Créer un effet ripple au clic
  const createRippleEffect = (position: google.maps.LatLng) => {
    if (!mapInstanceRef.current) return;

    const ripple = new google.maps.Circle({
      strokeColor: '#3B82F6',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#3B82F6',
      fillOpacity: 0.35,
      map: mapInstanceRef.current,
      center: position,
      radius: 10
    });

    let currentRadius = 10;
    const maxRadius = 100;
    const step = 10;

    const animate = () => {
      currentRadius += step;
      if (currentRadius < maxRadius) {
        ripple.setRadius(currentRadius);
        ripple.setOptions({
          fillOpacity: 0.35 * (1 - currentRadius / maxRadius),
          strokeOpacity: 0.8 * (1 - currentRadius / maxRadius)
        });
        requestAnimationFrame(animate);
      } else {
        ripple.setMap(null);
      }
    };

    animate();
  };

  // 🎯 Hook de caméra intelligente style Uber/Yango
  const smartCamera = useSmartMapCamera(mapInstanceRef.current);

  // 🎯 Ajustement automatique du zoom/bounds premium avec useSmartMapCamera
  useEffect(() => {
    if (!mapInstanceRef.current || !isMapReady) return;

    console.log('📹 [ModernMapView] Smart camera adjustment:', { 
      hasPickup: !!pickup, 
      hasDestination: !!destination,
      hasUserLocation: !!userLocation
    });

    if (pickup && destination) {
      // ✅ Mode Route: fitBounds dynamique avec padding adaptatif
      console.log('🗺️ Smart fitToRoute: Pickup + Destination');
      smartCamera.fitToRoute(
        { lat: pickup.lat, lng: pickup.lng },
        { lat: destination.lat, lng: destination.lng },
        { 
          bottomSheetHeight: 420, 
          maxZoom: 17,
          minZoom: 10
        }
      );
    } else if (userLocation) {
      // ✅ Position utilisateur: zoom contextuel (pas de zoom fixe)
      console.log('📍 Smart zoom sur position utilisateur');
      smartCamera.zoomToSinglePoint(
        { lat: userLocation.lat, lng: userLocation.lng },
        { contextualZoom: true, baseZoom: 16 }
      );
    } else if (pickup) {
      // Pickup uniquement: zoom contextuel
      console.log('📍 Smart zoom sur pickup uniquement');
      smartCamera.zoomToSinglePoint(
        { lat: pickup.lat, lng: pickup.lng },
        { contextualZoom: true, baseZoom: 15 }
      );
    } else if (destination) {
      // Destination uniquement
      smartCamera.zoomToSinglePoint(
        { lat: destination.lat, lng: destination.lng },
        { contextualZoom: true, baseZoom: 15 }
      );
    }
  }, [pickup, destination, userLocation, isMapReady, smartCamera]);

  // Fonction d'animation de caméra fluide
  const animateCameraTransition = (
    targetOptions: {
      center?: google.maps.LatLng | google.maps.LatLngLiteral;
      zoom?: number;
      tilt?: number;
      heading?: number;
    },
    duration: number
  ): Promise<void> => {
    return new Promise((resolve) => {
      if (!mapInstanceRef.current) {
        resolve();
        return;
      }

      const map = mapInstanceRef.current;
      const startTime = Date.now();
      const startCenter = map.getCenter();
      const startZoom = map.getZoom() || 13;
      const startTilt = map.getTilt() || 0;
      const startHeading = map.getHeading() || 0;

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function (ease-in-out)
        const eased = progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;

        // Interpoler les valeurs
        if (targetOptions.center && startCenter) {
          let targetLat: number;
          let targetLng: number;
          
          if (typeof targetOptions.center === 'object' && 'lat' in targetOptions.center) {
            targetLat = typeof targetOptions.center.lat === 'function' 
              ? targetOptions.center.lat() 
              : targetOptions.center.lat;
            targetLng = typeof targetOptions.center.lng === 'function'
              ? targetOptions.center.lng()
              : targetOptions.center.lng;
          } else {
            targetLat = (targetOptions.center as google.maps.LatLng).lat();
            targetLng = (targetOptions.center as google.maps.LatLng).lng();
          }
          
          const lat = startCenter.lat() + (targetLat - startCenter.lat()) * eased;
          const lng = startCenter.lng() + (targetLng - startCenter.lng()) * eased;
          map.setCenter({ lat, lng });
        }

        if (targetOptions.zoom !== undefined) {
          const zoom = startZoom + (targetOptions.zoom - startZoom) * eased;
          map.setZoom(zoom);
        }

        if (targetOptions.tilt !== undefined) {
          const tilt = startTilt + (targetOptions.tilt - startTilt) * eased;
          map.setTilt(tilt);
        }

        if (targetOptions.heading !== undefined) {
          const heading = startHeading + (targetOptions.heading - startHeading) * eased;
          map.setHeading(heading);
        }

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };

      animate();
    });
  };

  // 🎨 Phase 5: Indicateur de chargement amélioré
  if (!isLoaded && isLoading) {
    return (
      <div className={`flex flex-col items-center justify-center bg-gradient-to-br from-muted/20 to-muted/40 rounded-lg ${className}`}>
        <div className="text-center p-8 max-w-md">
          <div className="relative mb-6">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <MapPin className="h-6 w-6 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary/60 animate-pulse" />
          </div>
          
          <p className="text-lg font-medium mb-2">🗺️ Chargement de la carte...</p>
          
          {/* Progress bar */}
          <div className="w-full bg-muted/30 rounded-full h-2 mb-3 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-500 ease-out rounded-full animate-pulse"
              style={{ width: '60%' }}
            />
          </div>
          
          <p className="text-sm text-muted-foreground">
            Connexion au service de cartographie...
          </p>
        </div>
      </div>
    );
  }

  // 🚨 Phase 5: Mode hors-ligne si échec complet
  if (error && !useMapboxFallback) {
    return (
      <div className={`flex flex-col items-center justify-center bg-gradient-to-br from-destructive/5 to-destructive/10 rounded-lg border-2 border-destructive/20 ${className}`}>
        <div className="text-center p-8 max-w-md">
          <div className="mb-4 p-4 rounded-full bg-destructive/10 w-fit mx-auto">
            <MapPin className="h-10 w-10 text-destructive" />
          </div>
          
          <p className="text-lg font-semibold text-destructive mb-2">📵 Mode hors-ligne</p>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          
          <div className="bg-muted/50 rounded-lg p-4 text-left space-y-2">
            <p className="text-xs font-medium">💡 Vérifiez :</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Votre connexion internet</li>
              <li>• La clé API Google Maps</li>
              <li>• Les restrictions de domaine</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-muted/20 rounded-lg ${className}`}>
        <div className="text-center p-6">
          <p className="text-destructive">Erreur de chargement de la carte</p>
          <p className="text-sm text-muted-foreground mt-2">{error}</p>
        </div>
      </div>
    );
  }

  // Contrôles de la carte
  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      const currentZoom = mapInstanceRef.current.getZoom() || 13;
      mapInstanceRef.current.setZoom(currentZoom + 1);
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      const currentZoom = mapInstanceRef.current.getZoom() || 13;
      mapInstanceRef.current.setZoom(currentZoom - 1);
    }
  };

  const handleLocateUser = async () => {
    try {
      const { nativeGeolocationService } = await import('@/services/nativeGeolocationService');
      const freshPos = await nativeGeolocationService.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      });
      console.log('📍 [ModernMapView] Fresh GPS:', freshPos.lat, freshPos.lng, `±${freshPos.accuracy}m`);
      if (mapInstanceRef.current) {
        smartCamera.zoomToSinglePoint(
          { lat: freshPos.lat, lng: freshPos.lng },
          { baseZoom: 16, animationDuration: 600 }
        );
      }
    } catch (err) {
      console.warn('⚠️ [ModernMapView] GPS fresh failed, using cached:', err);
      if (userLocation && mapInstanceRef.current) {
        smartCamera.zoomToSinglePoint(
          { lat: userLocation.lat, lng: userLocation.lng },
          { baseZoom: 16, animationDuration: 600 }
        );
      }
    }
  };

  const toggleLiveDrivers = () => {
    setShowDriversLayer(prev => !prev);
    toast({
      title: showDriversLayer ? "Chauffeurs masqués" : "Chauffeurs affichés",
      description: showDriversLayer ? "Les véhicules ne sont plus visibles" : "Affichage des véhicules en temps réel"
    });
  };

  return (
    <div className={`relative ${className}`}>
      {/* Carte Google Maps */}
      <div ref={mapRef} className="w-full h-full rounded-lg shadow-lg" />

      {/* Contrôles de carte unifiés */}
      {isMapReady && mapInstanceRef.current && !useMapboxFallback && (
        <>
          <KwendaMapControls
            onLocate={handleLocateUser}
            isLocated={!!userLocation}
            mapInstance={mapInstanceRef.current}
          />
          {/* Toggle chauffeurs */}
          <motion.div
            whileTap={{ scale: 0.9 }}
            className="absolute top-4 right-4 z-10"
          >
            <Button
              variant="outline"
              size="icon"
              onClick={toggleLiveDrivers}
              className={cn(
                "bg-background/75 backdrop-blur-xl border-border/40 shadow-xl rounded-2xl w-11 h-11",
                showDriversLayer && "bg-primary/10 border-primary/40"
              )}
              title="Chauffeurs"
            >
              <Layers className="h-[18px] w-[18px]" strokeWidth={2.5} />
            </Button>
          </motion.div>
        </>
      )}

      {/* Markers personnalisés */}
      {isMapReady && mapInstanceRef.current && !useMapboxFallback && (
        <>
          <CustomMarkers
            map={mapInstanceRef.current}
            pickup={pickup}
            destination={destination}
            userLocation={userLocation}
          />

          {/* Couche chauffeurs en temps réel */}
          {showDriversLayer && (
            <LiveDriversLayer
              map={mapInstanceRef.current}
              userLocation={userLocation}
              maxRadius={10}
              showOnlyAvailable={true}
            />
          )}

          {/* Route professionnelle style Yango */}
          {pickup && destination && visualizationMode === 'route' && (
            <ProfessionalRoutePolyline
              map={mapInstanceRef.current}
              pickup={pickup}
              destination={destination}
              showTraffic={false}
              animate={true}
            />
          )}
        </>
      )}

      {/* Badge Mapbox si fallback actif */}
      {useMapboxFallback && (
        <div className="absolute top-4 left-4 bg-gradient-to-r from-primary to-primary/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border border-white/20">
          <span className="text-xs font-bold text-white flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Carte Mapbox Active
          </span>
        </div>
      )}
      
      {/* Styles pour animations Mapbox */}
      {useMapboxFallback && (
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes pulse-marker {
            0%, 100% {
              transform: scale(1);
              box-shadow: 0 0 20px rgba(59, 130, 246, 0.6);
            }
            50% {
              transform: scale(1.1);
              box-shadow: 0 0 40px rgba(59, 130, 246, 0.8);
            }
          }
        `}} />
      )}

      {/* Indicateur de mode */}
      {visualizationMode !== 'selection' && (
        <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-md">
          <span className="text-xs font-medium">
            {visualizationMode === 'route' && '🗺️ Trajet planifié'}
            {visualizationMode === 'tracking' && '📍 Suivi en direct'}
          </span>
        </div>
      )}
      
      {/* 🙈 Phase 3: Masquer les crédits Google Maps */}
      <style dangerouslySetInnerHTML={{__html: `
        /* Masquer les contrôles copyright Google */
        .gm-style-cc,
        .gm-style a[href^="https://maps.google.com/maps"],
        .gmnoprint,
        .gm-style-mtc,
        a[title="Report errors in the road map or imagery to Google"] {
          opacity: 0.1 !important;
          pointer-events: none !important;
        }
        
        /* Positionner discrètement en bas à droite */
        .gm-style-cc {
          bottom: 2px !important;
          right: 2px !important;
        }
      `}} />
    </div>
  );
}
