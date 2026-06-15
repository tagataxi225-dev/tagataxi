/**
 * 🧭 HOOK NAVIGATION MODERNE AVEC IA
 * 
 * Hook React pour navigation intelligente avec:
 * - État temps réel de navigation
 * - Instructions vocales automatiques
 * - Intégration tracking position
 * - Optimisations IA
 */

import { useState, useEffect, useCallback } from 'react';
import { modernNavigationService, NavigationState, NavigationOptions } from '@/services/modernNavigationService';
import { useVoiceNavigation } from './useVoiceNavigation';
import { useModernTracking } from './useModernTracking';
import { useToast } from './use-toast';

export const useModernNavigation = () => {
  const [navigationState, setNavigationState] = useState<NavigationState>(() => 
    modernNavigationService.getState()
  );
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  
  const { speakInstruction, formatNavigationInstruction } = useVoiceNavigation();
  const { currentPosition, startTracking, stopTracking } = useModernTracking();
  const { toast } = useToast();

  // ==================== EFFET SYNCHRONISATION ====================

  useEffect(() => {
    const unsubscribe = modernNavigationService.subscribe((state) => {
      setNavigationState(state);
      
      // Instructions vocales automatiques
      if (isVoiceEnabled && state.currentInstruction) {
        handleVoiceInstruction(state.currentInstruction);
      }
    });

    return unsubscribe;
  }, [isVoiceEnabled]);

  // ==================== SYNCHRONISATION POSITION ====================

  useEffect(() => {
    if (navigationState.isActive && currentPosition) {
      modernNavigationService.updatePosition({
        lat: currentPosition.latitude,
        lng: currentPosition.longitude,
        speed: currentPosition.speed
      });
    }
  }, [currentPosition, navigationState.isActive]);

  // ==================== INSTRUCTIONS VOCALES ====================

  const handleVoiceInstruction = useCallback(async (instruction: any) => {
    if (!isVoiceEnabled) return;

    const voiceText = formatNavigationInstruction(
      instruction.type,
      instruction.distance,
      instruction.street
    );

    try {
      await speakInstruction(voiceText);
    } catch (error) {
      console.error('❌ Erreur instruction vocale:', error);
    }
  }, [isVoiceEnabled, formatNavigationInstruction, speakInstruction]);

  // ==================== API NAVIGATION ====================

  const startNavigation = useCallback(async (
    destination: { lat: number; lng: number; address: string },
    options: NavigationOptions = {}
  ): Promise<boolean> => {
    if (!currentPosition) {
      toast({
        title: "Position introuvable",
        description: "Impossible de démarrer la navigation sans position GPS",
        variant: "destructive"
      });
      return false;
    }

    try {
      // Démarrer tracking haute précision
      await startTracking({
        userType: 'driver',
        enableHighAccuracy: true,
        adaptiveInterval: true,
        realtimeEnabled: true
      });

      // Démarrer navigation
      const success = await modernNavigationService.startNavigation(
        {
          lat: currentPosition.latitude,
          lng: currentPosition.longitude
        },
        destination,
        {
          ...options,
          enableVoice: isVoiceEnabled
        }
      );

      if (success) {
        toast({
          title: "Navigation démarrée",
          description: `Itinéraire vers ${destination.address}`,
        });
        
        // Instruction de départ
        if (isVoiceEnabled) {
          await speakInstruction("Navigation démarrée. Suivez les instructions.");
        }
      } else {
        toast({
          title: "Erreur navigation",
          description: "Impossible de calculer l'itinéraire",
          variant: "destructive"
        });
      }

      return success;
    } catch (error) {
      console.error('❌ Erreur démarrage navigation:', error);
      toast({
        title: "Erreur navigation",
        description: "Problème technique lors du démarrage",
        variant: "destructive"
      });
      return false;
    }
  }, [currentPosition, startTracking, isVoiceEnabled, speakInstruction, toast]);

  const stopNavigation = useCallback(async (): Promise<void> => {
    try {
      await modernNavigationService.stopNavigation();
      await stopTracking();
      
      toast({
        title: "Navigation arrêtée",
        description: "Vous pouvez fermer l'interface",
      });

      if (isVoiceEnabled) {
        await speakInstruction("Navigation terminée.");
      }
    } catch (error) {
      console.error('❌ Erreur arrêt navigation:', error);
    }
  }, [stopTracking, isVoiceEnabled, speakInstruction, toast]);

  const recalculateRoute = useCallback(async (): Promise<void> => {
    if (!navigationState.isActive || !currentPosition) return;

    toast({
      title: "Recalcul en cours",
      description: "Recherche d'un meilleur itinéraire...",
    });

    // Le service gère automatiquement le recalcul
    modernNavigationService.updatePosition({
      lat: currentPosition.latitude,
      lng: currentPosition.longitude,
      speed: currentPosition.speed
    });
  }, [navigationState.isActive, currentPosition, toast]);

  // ==================== CONTRÔLES AUDIO ====================

  const toggleVoice = useCallback(() => {
    setIsVoiceEnabled(prev => !prev);
    
    toast({
      title: isVoiceEnabled ? "Instructions vocales désactivées" : "Instructions vocales activées",
    });
  }, [isVoiceEnabled, toast]);

  // ==================== UTILITAIRES ====================

  const formatProgress = useCallback((): string => {
    return `${Math.round(navigationState.progress)}%`;
  }, [navigationState.progress]);

  const formatRemainingDistance = useCallback((): string => {
    const distance = navigationState.remainingDistance;
    
    if (distance < 1000) {
      return `${Math.round(distance)} m`;
    }
    
    return `${(distance / 1000).toFixed(1)} km`;
  }, [navigationState.remainingDistance]);

  const formatRemainingTime = useCallback((): string => {
    const seconds = navigationState.remainingDuration;
    const minutes = Math.round(seconds / 60);
    
    if (minutes < 60) {
      return `${minutes} min`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    return `${hours}h ${remainingMinutes}min`;
  }, [navigationState.remainingDuration]);

  const getSpeedStatus = useCallback((): 'slow' | 'normal' | 'fast' => {
    const speed = navigationState.speed * 3.6; // m/s to km/h
    
    if (speed < 10) return 'slow';
    if (speed > 60) return 'fast';
    return 'normal';
  }, [navigationState.speed]);

  // ==================== ÉTAT DE SANTÉ ====================

  const getNavigationHealth = useCallback((): 'excellent' | 'good' | 'warning' | 'error' => {
    if (!navigationState.isActive) return 'good';
    if (navigationState.isRecalculating) return 'warning';
    if (navigationState.isOffRoute) return 'warning';
    if (!currentPosition) return 'error';
    
    return 'excellent';
  }, [navigationState, currentPosition]);

  // ==================== RETOUR ====================

  return {
    // État navigation
    navigationState,
    isActive: navigationState.isActive,
    currentInstruction: navigationState.currentInstruction,
    nextInstruction: navigationState.nextInstruction,
    
    // Progression
    progress: navigationState.progress,
    remainingDistance: navigationState.remainingDistance,
    remainingDuration: navigationState.remainingDuration,
    eta: navigationState.eta,
    
    // État temps réel
    currentSpeed: navigationState.speed,
    isOffRoute: navigationState.isOffRoute,
    isRecalculating: navigationState.isRecalculating,
    
    // Contrôles
    startNavigation,
    stopNavigation,
    recalculateRoute,
    toggleVoice,
    isVoiceEnabled,
    
    // Formatage
    formatProgress,
    formatRemainingDistance,
    formatRemainingTime,
    getSpeedStatus,
    getNavigationHealth,
    
    // Position actuelle
    currentPosition
  };
};