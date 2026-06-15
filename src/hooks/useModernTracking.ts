/**
 * 🎯 HOOK DE TRACKING MODERNE UNIFIÉ
 * 
 * Interface React pour le service de tracking
 * Remplace tous les autres hooks de géolocalisation
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { trackingService, type TrackingOptions, type TrackingUpdate, type TrackingStats } from '@/services/trackingService';
import { toast } from 'sonner';

interface UseModernTrackingState {
  isTracking: boolean;
  currentPosition: TrackingUpdate | null;
  error: string | null;
  stats: TrackingStats;
  status: {
    batteryLevel: number;
    networkStatus: 'online' | 'offline';
    currentInterval: number;
    bufferSize: number;
    cacheSize: number;
  };
}

export const useModernTracking = (options?: TrackingOptions) => {
  const [state, setState] = useState<UseModernTrackingState>({
    isTracking: false,
    currentPosition: null,
    error: null,
    stats: {
      totalUpdates: 0,
      batteryUsage: 0,
      dataCompression: 0,
      accuracy: 0,
      uptime: 0,
      networkErrors: 0
    },
    status: {
      batteryLevel: 100,
      networkStatus: 'online',
      currentInterval: 5000,
      bufferSize: 0,
      cacheSize: 0
    }
  });

  const unsubscribeRefs = useRef<(() => void)[]>([]);

  // ==================== SETUP CALLBACKS ====================

  useEffect(() => {
    // Callback pour les mises à jour de position
    const unsubscribeUpdate = trackingService.onUpdate((update: TrackingUpdate) => {
      setState(prev => ({
        ...prev,
        currentPosition: update,
        error: null,
        status: trackingService.status
      }));
    });

    // Callback pour les erreurs
    const unsubscribeError = trackingService.onError((error: string) => {
      setState(prev => ({
        ...prev,
        error
      }));
      
      toast.error(`Tracking: ${error}`, {
        description: 'Tentative de récupération en cours...'
      });
    });

    // Callback pour les statistiques
    const unsubscribeStats = trackingService.onStats((stats: TrackingStats) => {
      setState(prev => ({
        ...prev,
        stats,
        status: trackingService.status
      }));
    });

    unsubscribeRefs.current = [unsubscribeUpdate, unsubscribeError, unsubscribeStats];

    // Mettre à jour l'état initial
    setState(prev => ({
      ...prev,
      isTracking: trackingService.status.isTracking,
      currentPosition: trackingService.currentPosition,
      stats: trackingService.performance,
      status: trackingService.status
    }));

    return () => {
      unsubscribeRefs.current.forEach(unsub => unsub());
    };
  }, []);

  // ==================== ACTIONS ====================

  const startTracking = useCallback(async (customOptions?: TrackingOptions): Promise<boolean> => {
    const trackingOptions = customOptions || options || {
      userType: 'client',
      enableHighAccuracy: true,
      batteryOptimization: true,
      adaptiveInterval: true,
      cacheEnabled: true,
      compressionEnabled: true,
      realtimeEnabled: true,
      predictionEnabled: false
    };

    setState(prev => ({ ...prev, error: null }));

    try {
      const success = await trackingService.startTracking(trackingOptions);
      
      if (success) {
        setState(prev => ({
          ...prev,
          isTracking: true,
          status: trackingService.status
        }));
        
        toast.success('Tracking activé', {
          description: 'Géolocalisation moderne démarrée'
        });
      } else {
        setState(prev => ({
          ...prev,
          error: 'Impossible de démarrer le tracking'
        }));
      }

      return success;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      setState(prev => ({
        ...prev,
        error: errorMessage
      }));
      return false;
    }
  }, [options]);

  const stopTracking = useCallback(async (): Promise<void> => {
    try {
      await trackingService.stopTracking();
      setState(prev => ({
        ...prev,
        isTracking: false,
        status: trackingService.status
      }));
      
      toast.info('Tracking arrêté', {
        description: 'Géolocalisation désactivée'
      });
    } catch (error) {
      console.error('Erreur arrêt tracking:', error);
    }
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // ==================== UTILITAIRES ====================

  const getCurrentPosition = useCallback((): TrackingUpdate | null => {
    return trackingService.currentPosition;
  }, []);

  const getPerformanceStats = useCallback((): TrackingStats => {
    return trackingService.performance;
  }, []);

  const calculateDistance = useCallback((
    point1: { lat: number; lng: number },
    point2: { lat: number; lng: number }
  ): number => {
    const R = 6371000; // Rayon Terre en mètres
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLng = (point2.lng - point1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }, []);

  const formatDistance = useCallback((meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    } else if (meters < 10000) {
      return `${(meters / 1000).toFixed(1)}km`;
    } else {
      return `${Math.round(meters / 1000)}km`;
    }
  }, []);

  const getLocationAccuracy = useCallback((): string => {
    if (!state.currentPosition) return 'Inconnue';
    
    const accuracy = state.currentPosition.accuracy;
    if (accuracy < 5) return 'Excellente';
    if (accuracy < 10) return 'Très bonne';
    if (accuracy < 25) return 'Bonne';
    if (accuracy < 50) return 'Moyenne';
    return 'Faible';
  }, [state.currentPosition]);

  // ==================== MONITORING ====================

  const isDegraded = useCallback((): boolean => {
    return (
      state.status.batteryLevel < 20 ||
      state.status.networkStatus === 'offline' ||
      state.stats.networkErrors > 5 ||
      (state.currentPosition?.accuracy || 0) > 100
    );
  }, [state]);

  const getHealthStatus = useCallback((): 'excellent' | 'good' | 'degraded' | 'critical' => {
    if (!state.isTracking) return 'critical';
    if (isDegraded()) return 'degraded';
    if (state.stats.accuracy < 25 && state.status.batteryLevel > 50) return 'excellent';
    return 'good';
  }, [state, isDegraded]);

  // ==================== RETOUR ====================

  return {
    // État principal
    isTracking: state.isTracking,
    currentPosition: state.currentPosition,
    error: state.error,
    
    // Statistiques détaillées
    stats: state.stats,
    status: state.status,
    healthStatus: getHealthStatus(),
    isDegraded: isDegraded(),
    
    // Actions
    startTracking,
    stopTracking,
    clearError,
    
    // Utilitaires
    getCurrentPosition,
    getPerformanceStats,
    calculateDistance,
    formatDistance,
    getLocationAccuracy,
    
    // Alias pour compatibilité
    position: state.currentPosition,
    isLoading: false, // Le tracking moderne n'a pas de loading
    loading: false
  };
};

// ==================== HOOK SPÉCIALISÉS ====================

/**
 * Hook optimisé pour les chauffeurs
 */
export const useDriverTracking = () => {
  return useModernTracking({
    userType: 'driver',
    enableHighAccuracy: true,
    batteryOptimization: true,
    adaptiveInterval: true,
    cacheEnabled: true,
    compressionEnabled: true,
    realtimeEnabled: true,
    predictionEnabled: true
  });
};

/**
 * Hook optimisé pour les clients
 */
export const useClientTracking = () => {
  return useModernTracking({
    userType: 'client',
    enableHighAccuracy: false,
    batteryOptimization: true,
    adaptiveInterval: false,
    cacheEnabled: true,
    compressionEnabled: false,
    realtimeEnabled: false,
    predictionEnabled: false
  });
};

/**
 * Hook optimisé pour les livreurs
 */
export const useDeliveryTracking = () => {
  return useModernTracking({
    userType: 'delivery',
    enableHighAccuracy: true,
    batteryOptimization: true,
    adaptiveInterval: true,
    cacheEnabled: true,
    compressionEnabled: true,
    realtimeEnabled: true,
    predictionEnabled: true
  });
};