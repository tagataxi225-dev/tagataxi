import { useEffect, useRef } from 'react';
import L from 'leaflet';
import carHautIcon from '@/assets/vehicle-icons/car-haut.svg';

// ─── Bezier fallback (shown while OSRM loads) ────────────────────────────────
function bezierPoints(
  p1: { lat: number; lng: number },
  p2: { lat: number; lng: number },
  steps = 32,
): L.LatLngExpression[] {
  const midLat = (p1.lat + p2.lat) / 2;
  const midLng = (p1.lng + p2.lng) / 2;
  const dLat = p2.lat - p1.lat;
  const dLng = p2.lng - p1.lng;
  const offset = Math.sqrt(dLat * dLat + dLng * dLng) * 0.18;
  const ctrlLat = midLat - dLng * offset;
  const ctrlLng = midLng + dLat * offset;
  const pts: L.LatLngExpression[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const u = 1 - t;
    pts.push([
      u * u * p1.lat + 2 * u * t * ctrlLat + t * t * p2.lat,
      u * u * p1.lng + 2 * u * t * ctrlLng + t * t * p2.lng,
    ]);
  }
  return pts;
}

// ─── Marker factories ─────────────────────────────────────────────────────────

// Départ : cercle blanc, bordure verte épaisse, point vert au centre
const makePickupIcon = () =>
  L.divIcon({
    className: '',
    html: `<div style="
      width:20px;height:20px;border-radius:50%;
      background:#fff;border:3px solid #16A34A;
      box-shadow:0 1px 6px rgba(0,0,0,.35);
      display:flex;align-items:center;justify-content:center;
    "><div style="width:6px;height:6px;border-radius:50%;background:#16A34A;"></div></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });

// Arrivée : cercle blanc, bordure rouge épaisse, point rouge au centre
const makeDestinationIcon = () =>
  L.divIcon({
    className: '',
    html: `<div style="
      width:20px;height:20px;border-radius:50%;
      background:#fff;border:3px solid #DC2626;
      box-shadow:0 1px 6px rgba(0,0,0,.35);
      display:flex;align-items:center;justify-content:center;
    "><div style="width:6px;height:6px;border-radius:50%;background:#DC2626;"></div></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });

// Position utilisateur : cercle rouge pulsant
const makeUserIcon = () =>
  L.divIcon({
    className: '',
    html: `<div style="width:40px;height:40px;position:relative;display:flex;align-items:center;justify-content:center;">
      <div style="position:absolute;width:40px;height:40px;border-radius:50%;background:rgba(220,38,38,0.22);animation:map-pulse 1.4s ease-out infinite;"></div>
      <div style="width:14px;height:14px;border-radius:50%;background:#DC2626;border:2.5px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4);position:relative;"></div>
    </div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });

const makeDriverIcon = (heading = 0) =>
  L.divIcon({
    className: '',
    html: `<img src="${carHautIcon}" style="width:36px;height:36px;display:block;transform:rotate(${heading}deg);filter:drop-shadow(0 2px 4px rgba(0,0,0,.35));" />`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });

// Voiture utilisateur (quand les deux points sont sélectionnés)
const makeCarIcon = () =>
  L.divIcon({
    className: '',
    html: '<div style="width:28px;height:28px;background:#F59E0B;border-radius:50%;border:2.5px solid white;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.3)"><svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M5 11l1.5-4.5h11L19 11m-14 0h14v6H5m2 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3m10 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3"/></svg></div>',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });

// ─── Route helpers ────────────────────────────────────────────────────────────

const ROUTE_COLOR = '#4285F4';
const ROUTE_OUTLINE = '#ffffff';

function addRoute(map: L.Map, latlngs: L.LatLngExpression[]): L.Layer[] {
  const outline = L.polyline(latlngs, {
    color: ROUTE_OUTLINE, weight: 7, opacity: 0.85,
    lineCap: 'round', lineJoin: 'round',
  }).addTo(map);
  const line = L.polyline(latlngs, {
    color: ROUTE_COLOR, weight: 4, opacity: 1,
    lineCap: 'round', lineJoin: 'round',
  }).addTo(map);
  return [outline, line];
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  pickup?: { lat: number; lng: number } | null;
  destination?: { lat: number; lng: number } | null;
  userLocation?: { lat: number; lng: number } | null;
  driverPosition?: { lat: number; lng: number; heading?: number } | null;
  currentCity?: { name: string; coordinates?: { lat: number; lng: number } } | null;
  nearbyDrivers?: { lat: number; lng: number; heading?: number }[];
  className?: string;
  onMapMoved?: () => void;
  recenterSignal?: number;
  centerTarget?: { lat: number; lng: number } | null;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function StaticMapView({
  pickup,
  destination,
  userLocation,
  driverPosition,
  currentCity,
  nearbyDrivers = [],
  className = '',
  onMapMoved,
  recenterSignal,
  centerTarget,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layersRef = useRef<L.Layer[]>([]);
  const routeLayersRef = useRef<L.Layer[]>([]);
  const onMapMovedRef = useRef(onMapMoved);
  useEffect(() => { onMapMovedRef.current = onMapMoved; }, [onMapMoved]);

  // Inject CSS animation once
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = '@keyframes map-pulse{0%{transform:scale(1);opacity:0.6}100%{transform:scale(1.8);opacity:0}}';
    document.head.appendChild(style);
    return () => style.remove();
  }, []);

  // Init map once
  useEffect(() => {
    if (!containerRef.current) return;

    const map = L.map(containerRef.current, {
      center: [-4.3217, 15.3069],
      zoom: 16,
      zoomControl: false,
      attributionControl: false,
    });
    mapRef.current = map;

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);
    map.on('dragstart', () => onMapMovedRef.current?.());

    return () => {
      map.remove();
      mapRef.current = null;
      layersRef.current = [];
      routeLayersRef.current = [];
    };
  }, []);

  // Recenter on signal
  useEffect(() => {
    if (!recenterSignal || !mapRef.current) return;
    const target = centerTarget || userLocation;
    if (!target) return;
    mapRef.current.flyTo([target.lat, target.lng], 15, { animate: true, duration: 0.8 });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recenterSignal]);

  // Markers — re-draw when locations change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    layersRef.current.forEach(l => l.remove());
    layersRef.current = [];

    const points: L.LatLngExpression[] = [];

    if (pickup) {
      layersRef.current.push(
        L.marker([pickup.lat, pickup.lng], { icon: makePickupIcon() }).addTo(map)
      );
      points.push([pickup.lat, pickup.lng]);
    }

    if (destination) {
      layersRef.current.push(
        L.marker([destination.lat, destination.lng], { icon: makeDestinationIcon() }).addTo(map)
      );
      points.push([destination.lat, destination.lng]);
    }

    if (userLocation) {
      const icon = (pickup && destination) ? makeCarIcon() : makeUserIcon();
      layersRef.current.push(
        L.marker([userLocation.lat, userLocation.lng], { icon }).addTo(map)
      );
    }

    nearbyDrivers.forEach(d => {
      layersRef.current.push(
        L.marker([d.lat, d.lng], { icon: makeDriverIcon(d.heading ?? 0) }).addTo(map)
      );
    });

    if (driverPosition) {
      layersRef.current.push(
        L.marker([driverPosition.lat, driverPosition.lng], { icon: makeDriverIcon(driverPosition.heading ?? 0) }).addTo(map)
      );
      points.push([driverPosition.lat, driverPosition.lng]);
    }

    if (points.length >= 2) {
      map.fitBounds(L.latLngBounds(points), { padding: [40, 40] });
    } else if (pickup) {
      map.setView([pickup.lat, pickup.lng], 15);
    } else if (userLocation) {
      map.setView([userLocation.lat, userLocation.lng], 16, { animate: true });
    }
  }, [pickup?.lat, pickup?.lng, destination?.lat, destination?.lng, userLocation?.lat, userLocation?.lng, driverPosition?.lat, driverPosition?.lng, driverPosition?.heading, nearbyDrivers]);

  // Route — bezier fallback then OSRM real roads
  useEffect(() => {
    const map = mapRef.current;
    routeLayersRef.current.forEach(l => l.remove());
    routeLayersRef.current = [];

    if (!map || !pickup || !destination) return;

    // Immediate bezier fallback while OSRM loads
    routeLayersRef.current = addRoute(map, bezierPoints(pickup, destination));

    const controller = new AbortController();
    const url =
      `https://router.project-osrm.org/route/v1/driving/` +
      `${pickup.lng},${pickup.lat};${destination.lng},${destination.lat}` +
      `?overview=full&geometries=geojson`;

    fetch(url, { signal: controller.signal })
      .then(r => r.json())
      .then(data => {
        if (controller.signal.aborted) return;
        const coords: [number, number][] = data?.routes?.[0]?.geometry?.coordinates;
        if (!coords?.length) return;
        const latlngs: L.LatLngExpression[] = coords.map(([lng, lat]) => [lat, lng]);
        routeLayersRef.current.forEach(l => l.remove());
        routeLayersRef.current = addRoute(map, latlngs);
      })
      .catch(() => { /* bezier stays */ });

    return () => {
      controller.abort();
      routeLayersRef.current.forEach(l => l.remove());
      routeLayersRef.current = [];
    };
  }, [pickup?.lat, pickup?.lng, destination?.lat, destination?.lng]);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 ${className}`}
      style={{ zIndex: 0, background: '#e8e0d8' }}
    />
  );
}
