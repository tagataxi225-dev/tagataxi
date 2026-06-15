/**
 * 🚗 Icônes SVG personnalisées pour véhicules Tembea
 * Style moderne avec badges distinctifs par type de service
 */

import React from 'react';

export type VehicleType = 'taxi' | 'moto_flash' | 'van_flex' | 'truck_maxicharge';
export type VehicleStatus = 'available' | 'busy' | 'offline';

interface VehicleIconConfig {
  bgColor: string;
  accentColor: string;
  label: string;
  emoji: string;
}

const VEHICLE_CONFIGS: Record<VehicleType, VehicleIconConfig> = {
  taxi: {
    bgColor: '#3B82F6',
    accentColor: '#1D4ED8',
    label: 'TAXI',
    emoji: '🚕'
  },
  moto_flash: {
    bgColor: '#F59E0B',
    accentColor: '#D97706',
    label: 'FLASH',
    emoji: '🏍️'
  },
  van_flex: {
    bgColor: '#F97316',
    accentColor: '#EA580C',
    label: 'FLEX',
    emoji: '🚐'
  },
  truck_maxicharge: {
    bgColor: '#8B5CF6',
    accentColor: '#7C3AED',
    label: 'MAX',
    emoji: '🚚'
  }
};

/**
 * Génère le SVG d'un véhicule orienté avec badge
 */
export const getVehicleSVG = (
  type: VehicleType,
  heading: number = 0,
  status: VehicleStatus = 'available',
  isDelivering: boolean = false
): string => {
  const config = VEHICLE_CONFIGS[type];
  const isAvailable = status === 'available';
  const isBusy = status === 'busy';
  const opacity = status === 'offline' ? '0.5' : '1';

  // Différentes silhouettes selon le type
  const vehiclePath = {
    taxi: 'M -12 -20 L -14 -6 L -14 14 L -12 18 L 12 18 L 14 14 L 14 -6 L 12 -20 Z',
    moto_flash: 'M -6 -18 L -8 0 L -6 16 L 0 18 L 6 16 L 8 0 L 6 -18 L 0 -20 Z',
    van_flex: 'M -14 -16 L -16 -4 L -16 16 L -14 20 L 14 20 L 16 16 L 16 -4 L 14 -16 Z',
    truck_maxicharge: 'M -16 -14 L -18 -2 L -18 18 L -16 22 L 16 22 L 18 18 L 18 -2 L 16 -14 Z'
  };

  return `
    <svg width="56" height="72" viewBox="0 0 56 72" xmlns="http://www.w3.org/2000/svg" opacity="${opacity}">
      <defs>
        <filter id="shadow-${type}" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
          <feOffset dx="0" dy="4" result="offsetblur"/>
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.35"/>
          </feComponentTransfer>
          <feMerge>
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <linearGradient id="grad-${type}" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:${config.bgColor};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${config.accentColor};stop-opacity:1" />
        </linearGradient>
      </defs>
      
      <g transform="translate(28, 48)" filter="url(#shadow-${type})">
        <!-- Ombre ellipse -->
        <ellipse cx="0" cy="14" rx="16" ry="6" fill="black" opacity="0.15"/>
        
        <!-- Pulse disponible -->
        ${isAvailable ? `
          <circle cx="0" cy="0" r="22" fill="none" stroke="#22C55E" stroke-width="2" opacity="0.5">
            <animate attributeName="r" from="22" to="32" dur="1.5s" repeatCount="indefinite"/>
            <animate attributeName="opacity" from="0.5" to="0" dur="1.5s" repeatCount="indefinite"/>
          </circle>
        ` : ''}
        
        <!-- Halo busy animé -->
        ${isBusy ? `
          <circle cx="0" cy="0" r="26" fill="none" stroke="${config.bgColor}" stroke-width="3" opacity="0.4">
            <animate attributeName="stroke-dasharray" from="0,163" to="163,0" dur="2s" repeatCount="indefinite"/>
          </circle>
        ` : ''}
        
        <!-- Groupe rotatif du véhicule -->
        <g transform="rotate(${heading})">
          <!-- Corps du véhicule -->
          <path d="${vehiclePath[type]}" 
                fill="url(#grad-${type})" 
                stroke="white" 
                stroke-width="2"/>
          
          <!-- Fenêtres/détails -->
          ${type === 'taxi' ? `
            <rect x="-8" y="-16" width="16" height="8" rx="2" fill="white" opacity="0.3"/>
            <circle cx="-6" cy="-18" r="2" fill="#FBBF24"/>
            <circle cx="6" cy="-18" r="2" fill="#FBBF24"/>
          ` : ''}
          ${type === 'moto_flash' ? `
            <circle cx="0" cy="-14" r="4" fill="white" opacity="0.4"/>
            <ellipse cx="0" cy="12" rx="4" ry="3" fill="white" opacity="0.3"/>
          ` : ''}
          ${type === 'van_flex' ? `
            <rect x="-10" y="-12" width="20" height="10" rx="2" fill="white" opacity="0.3"/>
            <rect x="-12" y="2" width="24" height="12" rx="1" fill="white" opacity="0.15"/>
          ` : ''}
          ${type === 'truck_maxicharge' ? `
            <rect x="-12" y="-10" width="24" height="8" rx="2" fill="white" opacity="0.3"/>
            <rect x="-14" y="2" width="28" height="14" rx="2" fill="white" opacity="0.2"/>
          ` : ''}
          
          <!-- Indicateur de direction -->
          <polygon points="0,-${type === 'moto_flash' ? '22' : '24'} -4,-${type === 'moto_flash' ? '16' : '18'} 4,-${type === 'moto_flash' ? '16' : '18'}" 
                   fill="white" opacity="0.8"/>
        </g>
        
        <!-- Icône colis si en livraison -->
        ${isDelivering && type !== 'taxi' ? `
          <g transform="translate(14, -14)">
            <rect x="-8" y="-8" width="16" height="16" rx="4" fill="#22C55E"/>
            <text x="0" y="4" text-anchor="middle" font-size="10">📦</text>
          </g>
        ` : ''}
      </g>
      
      <!-- Badge type -->
      <g transform="translate(28, 8)">
        <rect x="-20" y="-8" width="40" height="16" rx="8" 
              fill="${isAvailable ? '#22C55E' : isBusy ? config.bgColor : '#6B7280'}" 
              filter="drop-shadow(0 2px 4px rgba(0,0,0,0.2))"/>
        <text x="0" y="3" 
              text-anchor="middle" 
              font-family="system-ui, -apple-system, sans-serif" 
              font-size="8" 
              font-weight="700"
              fill="white">
          ${config.label}
        </text>
      </g>
    </svg>
  `;
};

/**
 * SVG pour le point utilisateur pulsant
 */
export const getUserLocationSVG = (): string => {
  return `
    <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="user-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
          <feOffset dx="0" dy="0" result="offsetblur"/>
          <feFlood flood-color="#3B82F6" flood-opacity="0.5"/>
          <feComposite in2="offsetblur" operator="in"/>
          <feMerge>
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      <!-- Cercles pulsants -->
      <circle cx="20" cy="20" r="16" fill="none" stroke="#3B82F6" stroke-width="2" opacity="0.3">
        <animate attributeName="r" from="12" to="18" dur="1.5s" repeatCount="indefinite"/>
        <animate attributeName="opacity" from="0.4" to="0" dur="1.5s" repeatCount="indefinite"/>
      </circle>
      <circle cx="20" cy="20" r="12" fill="none" stroke="#3B82F6" stroke-width="2" opacity="0.5">
        <animate attributeName="r" from="8" to="14" dur="1.5s" repeatCount="indefinite"/>
        <animate attributeName="opacity" from="0.6" to="0" dur="1.5s" repeatCount="indefinite"/>
      </circle>
      
      <!-- Point central -->
      <circle cx="20" cy="20" r="8" fill="#3B82F6" filter="url(#user-glow)"/>
      <circle cx="20" cy="20" r="6" fill="white"/>
      <circle cx="20" cy="20" r="4" fill="#3B82F6"/>
    </svg>
  `;
};

/**
 * Convertit un SVG string en data URL
 */
export const svgToDataUrl = (svg: string): string => {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

/**
 * Configurations pour le clustering
 */
export const getClusterIcon = (count: number, type: 'all' | 'taxi' | 'delivery'): string => {
  const colors = {
    all: { bg: '#1F2937', border: '#374151' },
    taxi: { bg: '#3B82F6', border: '#2563EB' },
    delivery: { bg: '#F59E0B', border: '#D97706' }
  };
  
  const { bg, border } = colors[type];
  
  return `
    <svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="22" fill="${bg}" stroke="${border}" stroke-width="3"/>
      <text x="24" y="28" 
            text-anchor="middle" 
            font-family="system-ui, -apple-system, sans-serif" 
            font-size="14" 
            font-weight="700"
            fill="white">
        ${count > 99 ? '99+' : count}
      </text>
    </svg>
  `;
};

// Export des configs pour usage externe
export { VEHICLE_CONFIGS };
