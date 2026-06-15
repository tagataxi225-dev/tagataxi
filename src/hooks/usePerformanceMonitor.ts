/**
 * HOOK DE MONITORING DES PERFORMANCES
 * Surveille connexion, batterie, mémoire pour optimisations dynamiques
 */

import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/utils/logger';

interface PerformanceMetrics {
  connectionSpeed: 'fast' | 'moderate' | 'slow' | 'offline';
  batteryLevel: number;
  isLowBattery: boolean;
  memoryUsage: number;
  isLowMemory: boolean;
}

interface PerformanceOptimizations {
  reducedAnimations: boolean;
  compressedImages: boolean;
  lazyLoading: boolean;
  prefetchDisabled: boolean;
}

export const usePerformanceMonitor = () => {
  // ✅ Désactiver complètement en production — zéro overhead
  if (import.meta.env.PROD) {
    return {
      metrics: {
        connectionSpeed: 'fast' as const,
        batteryLevel: 100,
        isLowBattery: false,
        memoryUsage: 0,
        isLowMemory: false,
      },
      optimizations: {
        reducedAnimations: false,
        compressedImages: false,
        lazyLoading: true,
        prefetchDisabled: false,
      },
      isSlowConnection: false,
      isOffline: false,
      isLowMemory: false,
      isLowBattery: false,
      performanceScore: 100,
      autoOptimize: () => {},
      measureLoadTime: () => () => 0,
    };
  }

  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    connectionSpeed: 'fast',
    batteryLevel: 100,
    isLowBattery: false,
    memoryUsage: 0,
    isLowMemory: false,
  });

  const [isSlowConnection, setIsSlowConnection] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isLowMemory, setIsLowMemory] = useState(false);
  const [isLowBattery, setIsLowBattery] = useState(false);

  const [optimizations, setOptimizations] = useState<PerformanceOptimizations>({
    reducedAnimations: false,
    compressedImages: false,
    lazyLoading: true,
    prefetchDisabled: false,
  });

  useEffect(() => {
    // Monitor connection
    const updateConnectionStatus = () => {
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      
      if (!navigator.onLine) {
        setMetrics(prev => ({ ...prev, connectionSpeed: 'offline' }));
        setIsOffline(true);
        setIsSlowConnection(true);
      } else {
        setIsOffline(false);
        if (connection) {
          const effectiveType = connection.effectiveType;
          const speed = effectiveType === '4g' ? 'fast' : 
                       effectiveType === '3g' ? 'moderate' : 'slow';
          setMetrics(prev => ({ ...prev, connectionSpeed: speed }));
          setIsSlowConnection(speed === 'slow');
        }
      }
    };

    // Monitor battery
    const updateBatteryStatus = async () => {
      if ('getBattery' in navigator) {
        try {
          const battery = await (navigator as any).getBattery();
          const level = battery.level * 100;
          const isLow = level < 20;
          
          setMetrics(prev => ({ ...prev, batteryLevel: level, isLowBattery: isLow }));
          setIsLowBattery(isLow);
        } catch (error) {
          // Fallback silencieux si API non supportée
        }
      }
    };

    // Monitor memory (if available)
    const updateMemoryStatus = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const usagePercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
        const isLow = usagePercent > 90;
        
        setMetrics(prev => ({ ...prev, memoryUsage: usagePercent, isLowMemory: isLow }));
        setIsLowMemory(isLow);
      }
    };

    updateConnectionStatus();
    updateBatteryStatus();
    updateMemoryStatus();

    window.addEventListener('online', updateConnectionStatus);
    window.addEventListener('offline', updateConnectionStatus);

    const intervalId = setInterval(() => {
      updateConnectionStatus();
      updateMemoryStatus();
    }, 120000); // Toutes les 2min

    return () => {
      window.removeEventListener('online', updateConnectionStatus);
      window.removeEventListener('offline', updateConnectionStatus);
      clearInterval(intervalId);
    };
  }, []);

  // Auto-optimize based on conditions
  useEffect(() => {
    setOptimizations({
      reducedAnimations: isLowBattery || isLowMemory,
      compressedImages: isSlowConnection || isOffline,
      lazyLoading: true, // Always enabled
      prefetchDisabled: isSlowConnection || isLowBattery,
    });
  }, [isSlowConnection, isLowBattery, isLowMemory, isOffline]);

  // Calculate performance score (0-100)
  const calculatePerformanceScore = useCallback((): number => {
    let score = 100;
    
    // Pénalités basées sur les conditions
    if (metrics.connectionSpeed === 'offline') score -= 50;
    else if (metrics.connectionSpeed === 'slow') score -= 30;
    else if (metrics.connectionSpeed === 'moderate') score -= 15;
    
    if (metrics.isLowBattery) score -= 20;
    if (metrics.isLowMemory) score -= 15;
    
    return Math.max(0, Math.min(100, score));
  }, [metrics]);

  const performanceScore = calculatePerformanceScore();

  // Auto optimize function
  const autoOptimize = useCallback(() => {
    logger.info('🚀 Auto-optimisation activée');
    
    // Force optimizations
    setOptimizations({
      reducedAnimations: true,
      compressedImages: true,
      lazyLoading: true,
      prefetchDisabled: true,
    });
    
    // Clear caches if memory is low
    if (isLowMemory && 'caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          if (!name.includes('critical')) {
            caches.delete(name);
          }
        });
      });
    }
  }, [isLowMemory]);

  // Measure load time
  const measureLoadTime = useCallback((label: string) => {
    const start = performance.now();
    
    return () => {
      const duration = performance.now() - start;
      logger.debug(`⏱️ ${label} load time: ${duration.toFixed(0)}ms`);
      
      if (duration > 3000) {
        logger.warn(`⚠️ ${label} is slow (${duration.toFixed(0)}ms)`);
      }
      
      return duration;
    };
  }, []);

  return {
    metrics,
    optimizations,
    isSlowConnection,
    isOffline,
    isLowMemory,
    isLowBattery,
    performanceScore,
    autoOptimize,
    measureLoadTime,
  };
};
