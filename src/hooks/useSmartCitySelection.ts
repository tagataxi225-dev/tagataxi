/**
 * Hook pour la gestion intelligente de la sélection de ville
 */

import { useState, useEffect, useCallback } from 'react';
import { cityDetectionService, type CityDetectionResult } from '@/services/cityDetectionService';
import { SUPPORTED_CITIES, type CityConfig, type UnifiedCoordinates } from '@/types/unifiedLocation';
import { nativeGeolocationService } from '@/services/nativeGeolocationService';

interface UseSmartCitySelectionOptions {
  autoDetect?: boolean;
  defaultCity?: string;
}

export const useSmartCitySelection = (options: UseSmartCitySelectionOptions = {}) => {
  const [currentCity, setCurrentCity] = useState<CityConfig | null>(null);
  const [detectionResult, setDetectionResult] = useState<CityDetectionResult | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialisation
  useEffect(() => {
    const initializeCity = async () => {
      // 1. Essayer de récupérer la ville stockée
      const storedCity = cityDetectionService.getSelectedCity();
      if (storedCity) {
        setCurrentCity(storedCity);
        setDetectionResult({
          city: storedCity,
          confidence: 1.0,
          source: 'user_selection'
        });
        return;
      }

      // 2. Utiliser la ville par défaut si spécifiée
      if (options.defaultCity) {
        const defaultCity = Object.values(SUPPORTED_CITIES).find(
          city => city.name === options.defaultCity || city.code === options.defaultCity
        );
        if (defaultCity) {
          setCurrentCity(defaultCity);
          setDetectionResult({
            city: defaultCity,
            confidence: 0.8,
            source: 'default'
          });
          return;
        }
      }

      // 3. Auto-détection si activée
      if (options.autoDetect !== false) {
        await detectCityAutomatically();
      } else {
        // Fallback vers Kinshasa
        setCurrentCity(SUPPORTED_CITIES.kinshasa);
        setDetectionResult({
          city: SUPPORTED_CITIES.kinshasa,
          confidence: 0.3,
          source: 'default'
        });
      }
    };

    initializeCity();
  }, [options.autoDetect, options.defaultCity]);

  // Détection automatique de ville via nativeGeolocationService
  const detectCityAutomatically = useCallback(async () => {
    setIsDetecting(true);
    setError(null);

    try {
      const position = await nativeGeolocationService.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      });

      const coordinates: UnifiedCoordinates = {
        lat: position.lat,
        lng: position.lng
      };

      const result = cityDetectionService.detectCity({ coordinates });
      setDetectionResult(result);
      setCurrentCity(result.city);
    } catch (err) {
      console.warn('Géolocalisation échouée:', err);
      setError('Impossible de détecter la ville automatiquement');
      const fallbackResult: CityDetectionResult = {
        city: SUPPORTED_CITIES.kinshasa,
        confidence: 0.3,
        source: 'default'
      };
      setDetectionResult(fallbackResult);
      setCurrentCity(fallbackResult.city);
    } finally {
      setIsDetecting(false);
    }
  }, []);

  // Détecter la ville à partir de coordonnées
  const detectCityFromCoordinates = useCallback((coordinates: UnifiedCoordinates) => {
    const result = cityDetectionService.detectCity({ coordinates });
    setDetectionResult(result);
    setCurrentCity(result.city);
    return result;
  }, []);

  // Détecter la ville à partir d'une adresse
  const detectCityFromAddress = useCallback((address: string) => {
    const result = cityDetectionService.detectCity({ address });
    setDetectionResult(result);
    setCurrentCity(result.city);
    return result;
  }, []);

  // Changer la ville manuellement
  const selectCity = useCallback((city: CityConfig) => {
    cityDetectionService.setSelectedCity(city);
    setCurrentCity(city);
    setDetectionResult({
      city,
      confidence: 1.0,
      source: 'user_selection'
    });
  }, []);

  // Obtenir toutes les villes supportées
  const availableCities = Object.values(SUPPORTED_CITIES);

  // Obtenir la configuration de prix pour la ville actuelle
  const pricingConfig = currentCity ? cityDetectionService.getCityPricingConfig(currentCity) : null;

  return {
    currentCity,
    detectionResult,
    isDetecting,
    error,
    availableCities,
    pricingConfig,
    
    // Actions
    detectCityAutomatically,
    detectCityFromCoordinates,
    detectCityFromAddress,
    selectCity,
    
    // Helpers
    isConfidentDetection: detectionResult ? detectionResult.confidence > 0.7 : false,
    detectionSource: detectionResult?.source || null
  };
};