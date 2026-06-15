/**
 * 🎯 Markers Personnalisés — Style Uber/Bolt minimaliste
 * ✅ Fallback vers google.maps.Marker classique si AdvancedMarkerElement indisponible (Safari/iOS)
 */

import { useEffect, useRef } from 'react';

interface MarkerProps {
  map: google.maps.Map | null;
  position: { lat: number; lng: number };
  label?: string;
}

// Inject global CSS once for advanced markers
function injectMarkerCSS() {
  if (document.getElementById('kw-marker-reset')) return;
  const style = document.createElement('style');
  style.id = 'kw-marker-reset';
  style.textContent = `
    .gm-advanced-marker,
    .gm-advanced-marker > div,
    .gm-advanced-marker-content {
      background: none !important;
      background-color: transparent !important;
      border: none !important;
      box-shadow: none !important;
      border-radius: 0 !important;
    }
  `;
  document.head.appendChild(style);
}

function clearMarkerBackground(marker: google.maps.marker.AdvancedMarkerElement) {
  const strip = (el: HTMLElement) => {
    el.style.background = 'none';
    el.style.backgroundColor = 'transparent';
    el.style.border = 'none';
    el.style.boxShadow = 'none';
    el.style.borderRadius = '0';
  };

  const applyToAll = () => {
    const el = marker.element;
    if (!el) return;
    strip(el);
    el.querySelectorAll('*').forEach((child) => {
      const c = child as HTMLElement;
      if (c.style && (c.style.background || c.style.backgroundColor)) {
        strip(c);
      }
    });
  };

  applyToAll();
  requestAnimationFrame(applyToAll);

  const el = marker.element;
  if (el) {
    const observer = new MutationObserver(() => applyToAll());
    observer.observe(el, { attributes: true, attributeFilter: ['style'], subtree: true, childList: true });
    setTimeout(() => observer.disconnect(), 3000);
  }
}

function createPickupElement(): HTMLElement {
  const container = document.createElement('div');
  container.style.cssText = 'position:relative;width:24px;height:24px;';

  const pulse = document.createElement('div');
  pulse.style.cssText = `
    position:absolute;top:-4px;left:-4px;width:32px;height:32px;border-radius:50%;
    border:1.5px solid rgba(16,185,129,0.3);
    animation:kw-pulse 2s ease-out infinite;
  `;
  container.appendChild(pulse);

  const dot = document.createElement('div');
  dot.style.cssText = `
    position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:50%;
    background:#10b981;border:2px solid white;
    box-shadow:0 1px 4px rgba(0,0,0,0.15);
  `;
  container.appendChild(dot);

  if (!document.getElementById('kw-pulse-style')) {
    const style = document.createElement('style');
    style.id = 'kw-pulse-style';
    style.textContent = `
      @keyframes kw-pulse {
        0% { transform:scale(0.8); opacity:0.4; }
        100% { transform:scale(1.3); opacity:0; }
      }
    `;
    document.head.appendChild(style);
  }

  return container;
}

function createDestinationElement(): HTMLElement {
  const container = document.createElement('div');
  container.style.cssText = 'position:relative;width:28px;height:36px;';

  container.innerHTML = `
    <svg width="28" height="36" viewBox="0 0 28 36" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="kw-pin" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stop-color="#f43f5e"/>
          <stop offset="100%" stop-color="#e11d48"/>
        </linearGradient>
        <filter id="kw-shadow" x="-20%" y="-10%" width="140%" height="130%">
          <feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-opacity="0.2"/>
        </filter>
      </defs>
      <path d="M14 1C7.4 1 2 6.4 2 13C2 22 14 34 14 34S26 22 26 13C26 6.4 20.6 1 14 1Z" 
            fill="url(#kw-pin)" filter="url(#kw-shadow)"/>
      <circle cx="14" cy="12.5" r="5.5" fill="white"/>
      <circle cx="14" cy="12.5" r="2.5" fill="#f43f5e"/>
    </svg>
  `;

  return container;
}

// ✅ SVG data URIs for classic Marker fallback (Safari/iOS/Android)
const PICKUP_ICON_URL = 'data:image/svg+xml,' + encodeURIComponent(`
<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <circle cx="12" cy="12" r="10" fill="#10b981" stroke="white" stroke-width="2"/>
  <circle cx="12" cy="12" r="4" fill="white"/>
</svg>
`);

const DESTINATION_ICON_URL = 'data:image/svg+xml,' + encodeURIComponent(`
<svg width="28" height="36" viewBox="0 0 28 36" xmlns="http://www.w3.org/2000/svg">
  <path d="M14 1C7.4 1 2 6.4 2 13C2 22 14 34 14 34S26 22 26 13C26 6.4 20.6 1 14 1Z" fill="#f43f5e"/>
  <circle cx="14" cy="12.5" r="5.5" fill="white"/>
  <circle cx="14" cy="12.5" r="2.5" fill="#f43f5e"/>
</svg>
`);

/**
 * Checks if AdvancedMarkerElement is available and functional
 */
function hasAdvancedMarkers(): boolean {
  try {
    return !!(window.google?.maps?.marker?.AdvancedMarkerElement);
  } catch {
    return false;
  }
}

function useMarker(
  map: google.maps.Map | null,
  position: { lat: number; lng: number },
  label: string | undefined,
  createElement: () => HTMLElement,
  zIndex: number,
  fallbackIconUrl: string
) {
  const advancedMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const classicMarkerRef = useRef<google.maps.Marker | null>(null);

  useEffect(() => {
    if (!map) return;

    // Cleanup previous
    if (advancedMarkerRef.current) {
      advancedMarkerRef.current.map = null;
      advancedMarkerRef.current = null;
    }
    if (classicMarkerRef.current) {
      classicMarkerRef.current.setMap(null);
      classicMarkerRef.current = null;
    }

    // ✅ Try AdvancedMarkerElement first, fallback to classic Marker
    if (hasAdvancedMarkers()) {
      try {
        injectMarkerCSS();
        const marker = new google.maps.marker.AdvancedMarkerElement({
          position,
          map,
          title: label || '',
          content: createElement(),
          zIndex,
        });
        clearMarkerBackground(marker);
        advancedMarkerRef.current = marker;
        return () => {
          if (advancedMarkerRef.current) {
            advancedMarkerRef.current.map = null;
            advancedMarkerRef.current = null;
          }
        };
      } catch (e) {
        console.warn('⚠️ AdvancedMarkerElement failed, using classic Marker:', e);
      }
    }

    // 🔄 Classic Marker fallback — works on ALL browsers including Safari
    const marker = new google.maps.Marker({
      position,
      map,
      title: label || '',
      zIndex,
      icon: {
        url: fallbackIconUrl,
        scaledSize: new google.maps.Size(28, 36),
        anchor: new google.maps.Point(14, 36),
      },
    });
    classicMarkerRef.current = marker;

    return () => {
      if (classicMarkerRef.current) {
        classicMarkerRef.current.setMap(null);
        classicMarkerRef.current = null;
      }
    };
  }, [map, position.lat, position.lng, label]);
}

export function PickupMarker({ map, position, label }: MarkerProps) {
  useMarker(map, position, label || 'Départ', createPickupElement, 1000, PICKUP_ICON_URL);
  return null;
}

export function DestinationMarker({ map, position, label }: MarkerProps) {
  useMarker(map, position, label || 'Destination', createDestinationElement, 1001, DESTINATION_ICON_URL);
  return null;
}
