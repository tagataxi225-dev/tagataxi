/**
 * 🎯 Marker Animé Moderne pour Google Maps
 * Markers 3D avec animations fluides et effets visuels premium
 */

import { useEffect, useRef, useState } from 'react';
import { MarkerType, AnimatedMarkerConfig } from '@/types/map';

interface CustomAnimatedMarkerProps {
  map: google.maps.Map | null;
  position: { lat: number; lng: number };
  type: MarkerType;
  label?: string;
  onClick?: () => void;
  animation?: 'bounce' | 'drop' | 'pulse';
}

// SVG compacts et contextuels pour la livraison
const getMarkerSVG = (type: MarkerType, isPulsing: boolean = false): string => {
  switch (type) {
    case 'pickup':
      // 📦 Colis / Package — compact emerald
      return `
        <svg width="36" height="44" viewBox="0 0 36 44" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="gp" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#10b981"/>
              <stop offset="100%" stop-color="#059669"/>
            </linearGradient>
          </defs>
          <ellipse cx="18" cy="42" rx="6" ry="1.5" fill="#000" opacity="0.1"/>
          <path d="M18 0C8 0 0 8 0 18C0 32 18 44 18 44S36 32 36 18C36 8 28 0 18 0Z" fill="url(#gp)"/>
          <rect x="10" y="12" width="16" height="13" rx="2" fill="white" opacity="0.95"/>
          <line x1="10" y1="16" x2="26" y2="16" stroke="#059669" stroke-width="1.5" opacity="0.5"/>
          <line x1="18" y1="12" x2="18" y2="25" stroke="#059669" stroke-width="1" opacity="0.3"/>
          ${isPulsing ? `
            <circle cx="18" cy="18" r="16" fill="none" stroke="#10b981" stroke-width="1.5" opacity="0.5">
              <animate attributeName="r" from="16" to="24" dur="1.5s" repeatCount="indefinite"/>
              <animate attributeName="opacity" from="0.5" to="0" dur="1.5s" repeatCount="indefinite"/>
            </circle>
          ` : ''}
        </svg>
      `;
    
    case 'destination':
      // 📍 Pin fin — bleu moderne
      return `
        <svg width="32" height="42" viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="gd" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#3b82f6"/>
              <stop offset="100%" stop-color="#2563eb"/>
            </linearGradient>
          </defs>
          <ellipse cx="16" cy="40.5" rx="5" ry="1.2" fill="#000" opacity="0.1"/>
          <path d="M16 0C7.2 0 0 7.2 0 16C0 28 16 42 16 42S32 28 32 16C32 7.2 24.8 0 16 0Z" fill="url(#gd)"/>
          <circle cx="16" cy="15" r="7" fill="white" opacity="0.95"/>
          <circle cx="16" cy="15" r="3.5" fill="#3b82f6"/>
        </svg>
      `;
    
    case 'user':
      return `
        <svg width="28" height="28" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
          <circle cx="14" cy="14" r="12" fill="#3b82f6" opacity="0.15">
            <animate attributeName="r" from="10" to="14" dur="2s" repeatCount="indefinite"/>
            <animate attributeName="opacity" from="0.2" to="0" dur="2s" repeatCount="indefinite"/>
          </circle>
          <circle cx="14" cy="14" r="6" fill="#3b82f6" stroke="white" stroke-width="2.5"/>
        </svg>
      `;
    
    case 'driver':
      // 🚗 Flèche directionnelle — rouge Tembea
      return `
        <svg width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="gdr" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#ec2027"/>
              <stop offset="100%" stop-color="#c81e24"/>
            </linearGradient>
          </defs>
          <circle cx="18" cy="18" r="16" fill="none" stroke="#ec2027" stroke-width="1.5" opacity="0.3">
            <animate attributeName="r" from="14" to="18" dur="2s" repeatCount="indefinite"/>
            <animate attributeName="opacity" from="0.3" to="0" dur="2s" repeatCount="indefinite"/>
          </circle>
          <circle cx="18" cy="18" r="12" fill="url(#gdr)" stroke="white" stroke-width="2.5"/>
          <path d="M18 10l5 10h-3v6h-4v-6h-3z" fill="white" opacity="0.95"/>
        </svg>
      `;

    default:
      return `
        <svg width="28" height="36" viewBox="0 0 28 36" xmlns="http://www.w3.org/2000/svg">
          <path d="M14 0C6.3 0 0 6.3 0 14C0 24.5 14 36 14 36S28 24.5 28 14C28 6.3 21.7 0 14 0Z" fill="#6b7280"/>
          <circle cx="14" cy="14" r="5" fill="white"/>
        </svg>
      `;
  }
};

export default function CustomAnimatedMarker({ 
  map, 
  position, 
  type, 
  label,
  onClick,
  animation = 'drop'
}: CustomAnimatedMarkerProps) {
  const markerRef = useRef<google.maps.Marker | null>(null);
  const [isPulsing, setIsPulsing] = useState(type === 'user');

  useEffect(() => {
    if (!map || !window.google) return;

    // Créer le marker avec SVG personnalisé
    const svgContent = getMarkerSVG(type, isPulsing);
    const iconUrl = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svgContent)}`;
    
    const markerOptions: google.maps.MarkerOptions = {
      position,
      map,
      title: label,
      icon: {
        url: iconUrl,
        scaledSize: new google.maps.Size(
          type === 'user' ? 28 : type === 'pickup' ? 36 : 32, 
          type === 'user' ? 28 : type === 'pickup' ? 44 : 42
        ),
        anchor: new google.maps.Point(
          type === 'user' ? 14 : type === 'pickup' ? 18 : 16, 
          type === 'user' ? 14 : type === 'pickup' ? 44 : 42
        )
      },
      zIndex: type === 'driver' ? 1000 : type === 'user' ? 999 : 500,
      optimized: false // Nécessaire pour les SVG animés
    };

    // Animation d'apparition
    if (animation === 'drop') {
      markerOptions.animation = google.maps.Animation.DROP;
    } else if (animation === 'bounce') {
      markerOptions.animation = google.maps.Animation.BOUNCE;
      // Arrêter le bounce après 2 secondes
      setTimeout(() => {
        if (markerRef.current) {
          markerRef.current.setAnimation(null);
        }
      }, 2000);
    }

    const marker = new google.maps.Marker(markerOptions);
    markerRef.current = marker;

    // Gestionnaire de clic
    if (onClick) {
      marker.addListener('click', onClick);
    }

    // Label personnalisé si fourni
    if (label && type !== 'user') {
      const infoWindow = new google.maps.InfoWindow({
        content: `<div style="padding: 8px; font-weight: 500; color: #1f2937;">${label}</div>`
      });
      
      marker.addListener('mouseover', () => {
        infoWindow.open({ map, anchor: marker });
      });
      
      marker.addListener('mouseout', () => {
        infoWindow.close();
      });
    }

    return () => {
      marker.setMap(null);
    };
  }, [map, type, label, onClick, animation, isPulsing]);

  // Mise à jour de la position avec animation fluide
  useEffect(() => {
    if (markerRef.current && position) {
      markerRef.current.setPosition(position);
    }
  }, [position]);

  return null;
}
