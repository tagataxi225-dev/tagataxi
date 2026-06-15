import { useEffect, useRef } from 'react';

interface Location {
  lat: number;
  lng: number;
  address: string;
  name?: string;
}

interface CustomMarkersProps {
  map: google.maps.Map | null;
  pickup?: Location | null;
  destination?: Location | null;
  userLocation?: { lat: number; lng: number } | null;
}

export default function CustomMarkers({
  map,
  pickup,
  destination,
  userLocation
}: CustomMarkersProps) {
  // ❌ Markers désactivés - utilisation du marker HTML dans ModernTaxiInterface
  return null;
}
