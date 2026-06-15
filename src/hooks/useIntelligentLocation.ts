/**
 * 🎯 HOOK DE GÉOLOCALISATION INTELLIGENT - DÉPRÉCIÉ
 * 
 * @deprecated Utiliser useSmartGeolocation pour un système plus robuste et unifié
 * Ce hook est maintenant un alias vers useSmartGeolocation
 */

import { useSmartGeolocation } from './useSmartGeolocation';

// Alias de compatibilité - redirige vers le système unifié professionnel
export const useIntelligentLocation = useSmartGeolocation;

// Types de compatibilité - utiliser ceux de useSmartGeolocation
export type { 
  LocationData, 
  LocationSearchResult,
  GeolocationOptions
} from './useSmartGeolocation';