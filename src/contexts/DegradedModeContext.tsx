/**
 * 🎚️ DEGRADED MODE CONTEXT - LAYER 2: PROTECTION AUTOMATIQUE
 * Dégrade gracieusement les fonctionnalités selon l'état de l'app
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { healthMonitor, type HealthMetrics } from '@/services/HealthMonitor';
import { apiHealthChecker } from '@/services/APIHealthChecker';

export enum DegradedLevel {
  NORMAL = 0,       // Tout fonctionne
  LIGHT = 1,        // Désactive animations complexes
  MODERATE = 2,     // + Désactive tracking, analytics
  SEVERE = 3,       // + Images compressées, lazy load agressif
  CRITICAL = 4      // + Maps désactivées, mode texte seulement
}

interface DegradedModeContextType {
  level: DegradedLevel;
  setLevel: (level: DegradedLevel) => void;
  isFeatureEnabled: (feature: string) => boolean;
  shouldUseCompressedImages: boolean;
  shouldDisableAnimations: boolean;
  shouldDisableMaps: boolean;
  shouldDisableTracking: boolean;
  reason: string;
}

const DegradedModeContext = createContext<DegradedModeContextType | undefined>(undefined);

export const useDegradedMode = () => {
  const context = useContext(DegradedModeContext);
  if (!context) {
    throw new Error('useDegradedMode must be used within DegradedModeProvider');
  }
  return context;
};

interface DegradedModeProviderProps {
  children: React.ReactNode;
}

export const DegradedModeProvider: React.FC<DegradedModeProviderProps> = ({ children }) => {
  const [level, setLevel] = useState<DegradedLevel>(DegradedLevel.NORMAL);
  const [reason, setReason] = useState<string>('');

  const evaluateHealthAndAdjust = useCallback((metrics: HealthMetrics) => {
    let newLevel = DegradedLevel.NORMAL;
    let newReason = '';

    // CRITICAL: Multiples crashes récents OU mémoire saturée
    const recentCrashes = metrics.crashes.lastCrashTime > Date.now() - 60000;
    if ((metrics.crashes.total >= 3 && recentCrashes) || metrics.memory.trend === 'critical') {
      newLevel = DegradedLevel.CRITICAL;
      newReason = metrics.crashes.total >= 3 ? 'Crashes multiples détectés' : 'Mémoire saturée';
    }
    // SEVERE: Réseau offline OU batterie critique
    else if (metrics.network.status === 'offline' || (metrics.battery.critical && !metrics.battery.charging)) {
      newLevel = DegradedLevel.SEVERE;
      newReason = metrics.network.status === 'offline' ? 'Mode hors-ligne' : 'Batterie critique';
    }
    // MODERATE: Mémoire élevée OU APIs en échec
    else if (metrics.memory.percentage > 80 || Object.values(metrics.apis).some(api => api.successRate < 0.5)) {
      newLevel = DegradedLevel.MODERATE;
      newReason = metrics.memory.percentage > 80 ? 'Mémoire élevée' : 'Services instables';
    }
    // LIGHT: Batterie faible OU réseau instable
    else if (metrics.battery.level < 20 || metrics.network.status === 'unstable') {
      newLevel = DegradedLevel.LIGHT;
      newReason = metrics.battery.level < 20 ? 'Économie de batterie' : 'Connexion instable';
    }

    if (newLevel !== level) {
      console.log(`🎚️ [DegradedMode] ${DegradedLevel[level]} → ${DegradedLevel[newLevel]} (${newReason})`);
      setLevel(newLevel);
      setReason(newReason);
      
      // Appliquer les classes CSS au body
      applyDegradedClasses(newLevel);
    }
  }, [level]);

  useEffect(() => {
    // S'abonner aux changements de santé
    const unsubscribe = healthMonitor.subscribe(evaluateHealthAndAdjust);
    
    // Évaluation initiale
    evaluateHealthAndAdjust(healthMonitor.getMetrics());

    return () => {
      unsubscribe();
      // Nettoyer les classes CSS
      document.body.classList.remove(
        'degraded-light',
        'degraded-moderate',
        'degraded-severe',
        'degraded-critical'
      );
    };
  }, [evaluateHealthAndAdjust]);

  const applyDegradedClasses = (newLevel: DegradedLevel) => {
    const body = document.body;
    
    // Supprimer toutes les classes de dégradation
    body.classList.remove(
      'degraded-light',
      'degraded-moderate',
      'degraded-severe',
      'degraded-critical'
    );

    // Appliquer la nouvelle classe
    switch (newLevel) {
      case DegradedLevel.LIGHT:
        body.classList.add('degraded-light');
        break;
      case DegradedLevel.MODERATE:
        body.classList.add('degraded-moderate');
        break;
      case DegradedLevel.SEVERE:
        body.classList.add('degraded-severe');
        break;
      case DegradedLevel.CRITICAL:
        body.classList.add('degraded-critical');
        break;
    }
  };

  const isFeatureEnabled = useCallback((feature: string): boolean => {
    const disabledFeatures: Record<DegradedLevel, string[]> = {
      [DegradedLevel.NORMAL]: [],
      [DegradedLevel.LIGHT]: ['complex-animations', 'particle-effects'],
      [DegradedLevel.MODERATE]: ['complex-animations', 'particle-effects', 'tracking', 'analytics', 'heatmaps'],
      [DegradedLevel.SEVERE]: ['complex-animations', 'particle-effects', 'tracking', 'analytics', 'heatmaps', 'high-res-images', 'background-geolocation'],
      [DegradedLevel.CRITICAL]: ['complex-animations', 'particle-effects', 'tracking', 'analytics', 'heatmaps', 'high-res-images', 'background-geolocation', 'interactive-maps', 'realtime-updates']
    };

    return !disabledFeatures[level].includes(feature);
  }, [level]);

  const value: DegradedModeContextType = {
    level,
    setLevel,
    isFeatureEnabled,
    shouldUseCompressedImages: level >= DegradedLevel.SEVERE,
    shouldDisableAnimations: level >= DegradedLevel.LIGHT,
    shouldDisableMaps: level >= DegradedLevel.CRITICAL,
    shouldDisableTracking: level >= DegradedLevel.MODERATE,
    reason
  };

  return (
    <DegradedModeContext.Provider value={value}>
      {children}
    </DegradedModeContext.Provider>
  );
};
