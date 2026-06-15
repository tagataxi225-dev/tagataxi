/**
 * 🚗 Marker Chauffeur Minimaliste (Style Yango)
 * Cercle rouge 32x32px avec icône voiture blanche et pulse subtil
 */

import { useEffect, useRef, useState } from 'react';

interface DriverMarkerSimpleProps {
  map: google.maps.Map | null;
  position: { lat: number; lng: number };
  heading?: number;
  driverName?: string;
  isAvailable?: boolean;
  onClick?: () => void;
}

export default function DriverMarkerSimple({
  map,
  position,
  heading = 0,
  driverName = 'Chauffeur',
  isAvailable = true,
  onClick
}: DriverMarkerSimpleProps) {
  const markerRef = useRef<google.maps.Marker | null>(null);
  const [currentHeading, setCurrentHeading] = useState(heading);

  // SVG minimaliste 32x32px
  const getMinimalVehicleSVG = (rotation: number): string => {
    return `
      <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad-red" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:hsl(357 85% 55%);stop-opacity:1" />
            <stop offset="100%" style="stop-color:hsl(357 85% 48%);stop-opacity:1" />
          </linearGradient>
          <filter id="shadow-light">
            <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.3"/>
          </filter>
        </defs>
        
        <!-- Pulse externe (si disponible) -->
        ${isAvailable ? `
          <circle cx="16" cy="16" r="14" fill="none" stroke="hsl(357 85% 50%)" stroke-width="1" opacity="0.4">
            <animate attributeName="r" from="14" to="18" dur="2s" repeatCount="indefinite"/>
            <animate attributeName="opacity" from="0.4" to="0" dur="2s" repeatCount="indefinite"/>
          </circle>
        ` : ''}
        
        <!-- Cercle principal rouge -->
        <circle cx="16" cy="16" r="12" fill="url(#grad-red)" filter="url(#shadow-light)">
          <animate attributeName="opacity" values="0.9;1;0.9" dur="2s" repeatCount="indefinite"/>
        </circle>
        
        <!-- Icône voiture blanche centrée avec rotation -->
        <g transform="translate(16, 16) rotate(${rotation})">
          <!-- Corps voiture simplifié -->
          <path d="M -3 -5 L -3 3 L -1.5 4 L 1.5 4 L 3 3 L 3 -5 Z" 
                fill="white" 
                stroke="white" 
                stroke-width="0.5"/>
          <!-- Pare-brise -->
          <rect x="-2" y="-4" width="4" height="3" rx="0.5" fill="white" opacity="0.7"/>
        </g>
      </svg>
    `;
  };

  useEffect(() => {
    if (!map || !window.google) return;

    const svgContent = getMinimalVehicleSVG(currentHeading);
    const iconUrl = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svgContent)}`;

    if (!markerRef.current) {
      // Créer le marker
      const marker = new google.maps.Marker({
        position,
        map,
        title: driverName,
        icon: {
          url: iconUrl,
          scaledSize: new google.maps.Size(32, 32),
          anchor: new google.maps.Point(16, 16)
        },
        zIndex: 999,
        optimized: false
      });

      markerRef.current = marker;

      // Click handler
      if (onClick) {
        marker.addListener('click', onClick);
      }
    } else {
      // Mettre à jour l'icône
      markerRef.current.setIcon({
        url: iconUrl,
        scaledSize: new google.maps.Size(32, 32),
        anchor: new google.maps.Point(16, 16)
      });
    }
  }, [map, currentHeading, driverName, isAvailable]);

  // Mise à jour de la position
  useEffect(() => {
    if (markerRef.current && position) {
      markerRef.current.setPosition(position);
    }
  }, [position]);

  // Mise à jour du heading
  useEffect(() => {
    setCurrentHeading(heading);
  }, [heading]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
    };
  }, []);

  return null;
}
