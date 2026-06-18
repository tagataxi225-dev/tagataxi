import { useEffect, useRef } from 'react';
import { useAnimatedRoute } from '@/hooks/useAnimatedRoute';

interface Location {
  lat: number;
  lng: number;
  address: string;
}

interface AnimatedPolylineProps {
  map: google.maps.Map;
  pickup: Location;
  destination: Location;
}

export default function AnimatedPolyline({ map, pickup, destination }: AnimatedPolylineProps) {
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const segmentsRef = useRef<google.maps.Polyline[]>([]);
  const { route, isLoading } = useAnimatedRoute(pickup, destination);

  useEffect(() => {
    // Nettoyage des segments précédents
    segmentsRef.current.forEach(segment => segment.setMap(null));
    segmentsRef.current = [];

    if (!route || isLoading) {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }
      return;
    }

    const setupRoute = async () => {
      console.log('🛣️ Création tracé de route premium');
      
      // Créer le path de la route
      const path = route.geometry.map(coord => ({ lat: coord[1], lng: coord[0] }));

      // 🎨 Tracé professionnel avec gradient Tembea : Noir (#1A1A1A) → Rouge (#EF4444)
      const numSegments = 20;
      const segmentLength = Math.floor(path.length / numSegments);

      for (let i = 0; i < numSegments; i++) {
        const start = i * segmentLength;
        const end = i === numSegments - 1 ? path.length : (i + 1) * segmentLength;
        const segmentPath = path.slice(start, end + 1);

        // Gradient progressif
        const ratio = i / numSegments;
        const r = Math.floor(26 + ratio * (239 - 26));
        const g = Math.floor(26 + ratio * (68 - 26));
        const b = Math.floor(26 + ratio * (68 - 26));
        const color = `rgb(${r}, ${g}, ${b})`;

        // Créer segment avec style premium
        const segment = new google.maps.Polyline({
          path: segmentPath,
          geodesic: true,
          strokeColor: color,
          strokeOpacity: 0.95,
          strokeWeight: 6, // Plus épais pour visibilité
          map,
          zIndex: 100 + i, // Assurer visibilité au-dessus des routes
        });

        segmentsRef.current.push(segment);

        // ✨ Animation d'apparition progressive fluide
        segment.setOptions({ strokeOpacity: 0 });
        setTimeout(() => {
          let opacity = 0;
          const fadeIn = setInterval(() => {
            opacity += 0.05;
            if (opacity >= 0.95) {
              clearInterval(fadeIn);
              segment.setOptions({ strokeOpacity: 0.95 });
            } else {
              segment.setOptions({ strokeOpacity: opacity });
            }
          }, 20);
        }, i * 40);
      }

      console.log(`✅ ${numSegments} segments de route créés avec gradient TAGA`);
    };

    setupRoute();

    return () => {
      // Nettoyage
      segmentsRef.current.forEach(segment => segment.setMap(null));
      segmentsRef.current = [];
      
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
      }
    };
  }, [route, isLoading, map]);

  return null;
}
