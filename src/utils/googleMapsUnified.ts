/**
 * Utilitaires unifiés pour Google Maps
 * Remplace progressivement l'usage des coordonnées brutes
 */

import type { LocationData } from '@/types/location';
import type { RealDriverLocation } from '@/types/realLocation';
import { supabase } from '@/integrations/supabase/client';

/**
 * Convertit des coordonnées brutes vers une adresse Google Maps
 * Utilise le service de géocodage avec cache
 */
export const coordinatesToGoogleAddress = async (
  lat: number, 
  lng: number
): Promise<string> => {
  try {
    const { data, error } = await supabase.functions.invoke('google-maps-proxy', {
      body: {
        service: 'geocode',
        params: { latlng: `${lat},${lng}` }
      }
    });

    if (error) throw error;

    if (data?.results?.[0]?.formatted_address) {
      return data.results[0].formatted_address;
    }

    // Fallback avec coordonnées formatées
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}, Kinshasa, RDC`;

  } catch (error) {
    console.error('Erreur lors du géocodage:', error);
    return `Coordonnées: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }
};

/**
 * Convertit LocationData vers format avec adresse Google
 */
export const upgradeLocationToGoogle = async (location: LocationData): Promise<LocationData> => {
  if (location.type === 'google' && location.address && !location.address.includes('Coordonnées:')) {
    return location; // Déjà au format Google Maps
  }
  
  const googleAddress = await coordinatesToGoogleAddress(location.lat, location.lng);
  
  return {
    ...location,
    address: googleAddress,
    type: 'google'
  };
};

/**
 * Vérifie si une adresse est une vraie adresse Google Maps
 */
export const isRealGoogleAddress = (address: string): boolean => {
  if (!address) return false;
  
  // Exclure les adresses de fallback
  if (address.includes('Coordonnées:') || 
      address.includes('undefined') || 
      address.includes('null') ||
      address.length < 10) {
    return false;
  }
  
  // Vérifier si c'est une adresse formatée Google Maps
  return address.includes(',') && 
         (address.includes('Kinshasa') || 
          address.includes('Lubumbashi') || 
          address.includes('Kolwezi') ||
          address.includes('RDC') ||
          address.includes('Congo'));
};

/**
 * Extrait les coordonnées d'une string d'adresse de fallback
 */
export const extractCoordinatesFromFallback = (address: string): { lat: number; lng: number } | null => {
  // Format: "Coordonnées: -4.123456, 15.123456, Kinshasa, RDC"
  const coordsMatch = address.match(/Coordonnées:\s*(-?\d+\.\d+),\s*(-?\d+\.\d+)/);
  
  if (coordsMatch) {
    return {
      lat: parseFloat(coordsMatch[1]),
      lng: parseFloat(coordsMatch[2])
    };
  }
  
  // Format: "-4.123456, 15.123456, Kinshasa, RDC"
  const directMatch = address.match(/^(-?\d+\.\d+),\s*(-?\d+\.\d+)/);
  
  if (directMatch) {
    return {
      lat: parseFloat(directMatch[1]),
      lng: parseFloat(directMatch[2])
    };
  }
  
  return null;
};

/**
 * Priorise les adresses Google Maps dans une liste
 */
export const sortByGoogleAddressPriority = <T extends { address?: string }>(
  items: T[]
): T[] => {
  return items.sort((a, b) => {
    const aIsGoogle = isRealGoogleAddress(a.address || '');
    const bIsGoogle = isRealGoogleAddress(b.address || '');
    
    if (aIsGoogle && !bIsGoogle) return -1;
    if (!aIsGoogle && bIsGoogle) return 1;
    return 0;
  });
};

/**
 * Format unifié pour affichage des adresses
 */
export const formatAddressForDisplay = (address: string): string => {
  if (!address) return 'Adresse inconnue';
  
  // Si c'est une adresse de fallback avec coordonnées
  if (address.includes('Coordonnées:')) {
    const coords = extractCoordinatesFromFallback(address);
    if (coords) {
      return `Position: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`;
    }
  }
  
  // Raccourcir les adresses très longues
  if (address.length > 60) {
    const parts = address.split(',');
    if (parts.length > 2) {
      return `${parts[0]}, ${parts[parts.length - 1].trim()}`;
    }
  }
  
  return address;
};

/**
 * Convertit RealDriverLocation vers LocationData pour compatibilité
 */
export const realDriverLocationToLocationData = (
  realLocation: RealDriverLocation
): LocationData => {
  return {
    address: realLocation.googleAddress || `${realLocation.coordinates.lat}, ${realLocation.coordinates.lng}`,
    lat: realLocation.coordinates.lat,
    lng: realLocation.coordinates.lng,
    type: 'google',
    placeId: realLocation.googlePlaceId,
    name: realLocation.googlePlaceName
  };
};

/**
 * Détecte si des données ont besoin de migration Google Maps
 */
export const needsGoogleMigration = (data: any): boolean => {
  // Vérifier si on a des coordonnées brutes sans adresse Google
  if (data.latitude && data.longitude && !data.google_address) {
    return true;
  }
  
  // Vérifier les coordonnées dans les objets pickup/delivery
  if (data.pickup_coordinates && !data.pickup_google_address) {
    return true;
  }
  
  if (data.delivery_coordinates && !data.delivery_google_address) {
    return true;
  }
  
  return false;
};