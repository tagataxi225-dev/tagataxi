/**
 * 🎯 HOOK DE GÉOLOCALISATION UNIFIÉ - DÉPRÉCIÉ
 * 
 * @deprecated Utiliser useSmartGeolocation pour un système plus robuste et performant
 * Ce hook est maintenant un alias vers useSmartGeolocation
 */

import { useSmartGeolocation } from './useSmartGeolocation';

// Alias de compatibilité - redirige vers le système unifié professionnel
export const useUnifiedLocation = useSmartGeolocation;

// Types de compatibilité - utiliser ceux de useSmartGeolocation
export type { 
  LocationData, 
  LocationSearchResult as SimpleLocationSearchResult 
} from './useSmartGeolocation';

// Alias simple vers le système unifié professionnel
export const useSimpleLocation = useSmartGeolocation;