/**
 * Hook de géolocalisation simplifié - MIGRÉ VERS useSmartGeolocation
 * @deprecated Utiliser useSmartGeolocation pour un système unifié et professionnel
 */

// Re-export du système de géolocalisation unifié professionnel
export { 
  useSmartGeolocation as useSimpleLocation, 
  type LocationData, 
  type LocationSearchResult 
} from './useSmartGeolocation';