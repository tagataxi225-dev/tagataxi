import { useEffect, useRef } from 'react';

interface CurrentPositionMarkerProps {
  map: google.maps.Map | null;
  position: { lat: number; lng: number } | null;
  onClickPosition?: () => void;
  onDragEnd?: (newPosition: { lat: number; lng: number }) => void;
  isDraggable?: boolean;
}

export default function CurrentPositionMarker({ 
  map, 
  position, 
  onClickPosition, 
  onDragEnd,
  isDraggable = false 
}: CurrentPositionMarkerProps) {
  const markerRef = useRef<google.maps.Marker | null>(null);
  const manualPositionRef = useRef<{ lat: number; lng: number } | null>(null);
  const lastValidPositionRef = useRef<{ lat: number; lng: number } | null>(null);

  const getModernPositionSVG = (): string => {
    return `
      <svg width="50" height="70" viewBox="0 0 50 70" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <!-- Ombre portée moderne -->
          <filter id="pin-shadow">
            <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
            <feOffset dx="0" dy="4" result="offsetblur"/>
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.3"/>
            </feComponentTransfer>
            <feMerge>
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          
          <!-- Gradient rouge moderne -->
          <linearGradient id="pin-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#EF4444;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#DC2626;stop-opacity:1" />
          </linearGradient>
          
          <!-- Gradient pour le cercle blanc (effet 3D) -->
          <radialGradient id="white-gradient">
            <stop offset="0%" style="stop-color:#FFFFFF;stop-opacity:1" />
            <stop offset="90%" style="stop-color:#F8F8F8;stop-opacity:1" />
          </radialGradient>
        </defs>
        
        <!-- Ombre au sol (ellipse animée) -->
        <ellipse cx="25" cy="66" rx="10" ry="3" fill="#000000" opacity="0.2">
          <animate attributeName="rx" values="8;12;8" dur="2s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.15;0.25;0.15" dur="2s" repeatCount="indefinite"/>
        </ellipse>
        
        <!-- Pulse d'ondes concentriques (effet radar) -->
        <circle cx="25" cy="22" r="20" fill="none" stroke="#EF4444" stroke-width="2" opacity="0">
          <animate attributeName="r" from="15" to="28" dur="2s" repeatCount="indefinite"/>
          <animate attributeName="opacity" from="0.6" to="0" dur="2s" repeatCount="indefinite"/>
          <animate attributeName="stroke-width" from="3" to="0.5" dur="2s" repeatCount="indefinite"/>
        </circle>
        
        <!-- Corps du pin en forme de goutte (path moderne) -->
        <path 
          d="M 25 5 
             C 15 5, 8 12, 8 22 
             C 8 32, 25 55, 25 55 
             C 25 55, 42 32, 42 22 
             C 42 12, 35 5, 25 5 Z"
          fill="url(#pin-gradient)"
          filter="url(#pin-shadow)"
          stroke="#B91C1C"
          stroke-width="0.5"
        >
          <!-- Animation de pulsation subtile -->
          <animateTransform
            attributeName="transform"
            attributeType="XML"
            type="scale"
            values="1 1; 1.05 1.05; 1 1"
            dur="1.5s"
            repeatCount="indefinite"
            additive="sum"
          />
        </path>
        
        <!-- Cercle blanc central (grande zone blanche) -->
        <circle 
          cx="25" 
          cy="22" 
          r="11" 
          fill="url(#white-gradient)"
          stroke="#FFFFFF"
          stroke-width="1"
          filter="url(#pin-shadow)"
        >
          <!-- Pulse doux du cercle -->
          <animate attributeName="r" values="11;11.5;11" dur="2s" repeatCount="indefinite"/>
        </circle>
        
        <!-- Point central rouge (petit point indicateur) -->
        <circle cx="25" cy="22" r="3.5" fill="#DC2626">
          <animate attributeName="r" values="3;4;3" dur="1.5s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="1;0.8;1" dur="1.5s" repeatCount="indefinite"/>
        </circle>
        
        <!-- Point d'ancrage au sol (effet drop) -->
        <circle cx="25" cy="56" r="2.5" fill="#DC2626" opacity="0.7">
          <animate attributeName="r" values="2.5;3;2.5" dur="2s" repeatCount="indefinite"/>
        </circle>
        
        <!-- Highlight blanc pour effet 3D sur le pin -->
        <ellipse 
          cx="20" 
          cy="12" 
          rx="6" 
          ry="8" 
          fill="#FFFFFF" 
          opacity="0.25"
          transform="rotate(-25 20 12)"
        />
      </svg>
    `;
  };

  const animateToPosition = (targetPosition: { lat: number; lng: number }) => {
    if (!markerRef.current) return;
    
    // Animation DROP (tombe du ciel)
    markerRef.current.setAnimation(google.maps.Animation.DROP);
    markerRef.current.setPosition(targetPosition);
    
    // Après la chute, pulse bounce
    setTimeout(() => {
      if (markerRef.current) {
        markerRef.current.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(() => {
          if (markerRef.current) {
            markerRef.current.setAnimation(null);
          }
        }, 700); // Bounce plus court (700ms)
      }
    }, 300);
  };

  useEffect(() => {
    console.log('🎯 [CurrentPositionMarker] Effect triggered:', {
      hasMap: !!map,
      hasPosition: !!position,
      position,
      hasGoogle: !!window.google,
      hasGoogleMaps: !!window.google?.maps,
      hasMarkerClass: !!window.google?.maps?.Marker,
      markerExists: !!markerRef.current
    });

    // ✅ Persister la dernière position valide
    if (position) {
      lastValidPositionRef.current = position;
    }

    // ✅ Utiliser la dernière position si position actuelle est null
    const effectivePosition = position || lastValidPositionRef.current;

    if (!map || !effectivePosition || !window.google) {
      console.warn('⚠️ [CurrentPositionMarker] Marqueur non créé - conditions manquantes:', {
        map: !!map,
        position: !!position,
        lastValidPosition: !!lastValidPositionRef.current,
        google: !!window.google
      });
      return;
    }

    try {
      const svgContent = getModernPositionSVG();
      console.log('🎨 [CurrentPositionMarker] SVG généré, longueur:', svgContent.length);
      const iconUrl = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svgContent)}`;

      if (!markerRef.current) {
        console.log('🎨 [CurrentPositionMarker] Création du marqueur à:', effectivePosition);
        const marker = new google.maps.Marker({
        position: effectivePosition,
        map,
        title: isDraggable ? 'Déplacez-moi ou cliquez pour me recentrer' : 'Votre position actuelle',
        icon: {
          url: iconUrl,
          scaledSize: new google.maps.Size(50, 70),
          anchor: new google.maps.Point(25, 56)
        },
        zIndex: 3000,
        optimized: false,
        clickable: true,
        draggable: isDraggable,
        cursor: isDraggable ? 'move' : 'pointer'
      });

      // Listener de clic
      marker.addListener('click', () => {
        console.log('📍 Position marker clicked:', effectivePosition);
        onClickPosition?.();
      });

      // Listener de drag (si activé)
      if (isDraggable) {
        marker.addListener('dragend', (event: google.maps.MapMouseEvent) => {
          const newPosition = {
            lat: event.latLng!.lat(),
            lng: event.latLng!.lng()
          };
          console.log('📍 Marqueur déplacé à:', newPosition);
          manualPositionRef.current = newPosition;
          onDragEnd?.(newPosition);
        });
      }

        markerRef.current = marker;
        console.log('✅ [CurrentPositionMarker] Marqueur créé avec succès');
      } else {
        // Détecter si c'est un retour à la position GPS
        const isDifferent = manualPositionRef.current && 
          (Math.abs(manualPositionRef.current.lat - effectivePosition.lat) > 0.0001 ||
           Math.abs(manualPositionRef.current.lng - effectivePosition.lng) > 0.0001);
        
        if (isDifferent) {
          // Animation de retour automatique
          console.log('🎯 Retour automatique à la position GPS');
          animateToPosition(effectivePosition);
          manualPositionRef.current = null;
        } else {
          markerRef.current.setPosition(effectivePosition);
        }
      }
    } catch (error) {
      console.error('❌ [CurrentPositionMarker] Erreur création marqueur:', error);
    }
  }, [map, position, onClickPosition, onDragEnd, isDraggable]);

  useEffect(() => {
    return () => {
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
    };
  }, []);

  return null;
}
