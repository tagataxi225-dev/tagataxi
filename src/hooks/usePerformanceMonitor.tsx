import { useState, useEffect, useCallback } from 'react';

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  memoryUsage: number;
  connectionSpeed: 'fast' | 'slow' | 'offline';
  batteryLevel?: number;
  isLowPowerMode?: boolean;
}

interface PerformanceOptimizations {
  reducedAnimations: boolean;
  compressedImages: boolean;
  lazyLoading: boolean;
  cacheEnabled: boolean;
  offlineMode: boolean;
}

export const usePerformanceMonitor = () => {
  // ✅ PHASE 3A: Désactiver complètement en production
  const IS_PRODUCTION = import.meta.env.PROD;
  
  if (IS_PRODUCTION) {
    return {
      metrics: {
        loadTime: 0,
        renderTime: 0,
        memoryUsage: 0,
        connectionSpeed: 'fast' as const,
        batteryLevel: 100,
        isLowPowerMode: false
      },
      optimizations: {
        reducedAnimations: false,
        compressedImages: false,
        lazyLoading: true,
        cacheEnabled: true,
        offlineMode: false
      },
      performanceScore: 100,
      enableOptimization: () => {},
      disableOptimization: () => {},
      autoOptimize: () => {},
      measureLoadTime: () => {},
      measureRenderTime: () => () => {},
      isSlowConnection: false,
      isOffline: false,
      isLowMemory: false,
      isLowBattery: false
    };
  }
  
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    renderTime: 0,
    memoryUsage: 0,
    connectionSpeed: 'fast'
  });
  
  const [optimizations, setOptimizations] = useState<PerformanceOptimizations>({
    reducedAnimations: false,
    compressedImages: false,
    lazyLoading: true,
    cacheEnabled: true,
    offlineMode: false
  });

  const [performanceScore, setPerformanceScore] = useState(100);

  // Monitor connection speed
  const checkConnectionSpeed = useCallback(() => {
    const connection = (navigator as any).connection;
    if (!navigator.onLine) {
      return 'offline';
    }
    
    if (connection) {
      const effectiveType = connection.effectiveType;
      if (effectiveType === 'slow-2g' || effectiveType === '2g') {
        return 'slow';
      }
      if (effectiveType === '3g' || connection.downlink < 1.5) {
        return 'slow';
      }
    }
    
    return 'fast';
  }, []);

  // Monitor battery status
  const checkBatteryStatus = useCallback(async () => {
    try {
      if ('getBattery' in navigator) {
        const battery = await (navigator as any).getBattery();
        return {
          level: Math.round(battery.level * 100),
          charging: battery.charging,
          lowPowerMode: battery.level < 0.2 && !battery.charging
        };
      }
    } catch (error) {
      console.warn('Battery API not supported');
    }
    return null;
  }, []);

  // Monitor memory usage
  const checkMemoryUsage = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        used: Math.round(memory.usedJSHeapSize / 1048576), // MB
        total: Math.round(memory.totalJSHeapSize / 1048576), // MB
        limit: Math.round(memory.jsHeapSizeLimit / 1048576) // MB
      };
    }
    return { used: 0, total: 0, limit: 0 };
  }, []);

  // Auto-optimize based on conditions
  const autoOptimize = useCallback(() => {
    const connectionSpeed = checkConnectionSpeed();
    const memoryInfo = checkMemoryUsage();
    
    setOptimizations(prev => ({
      ...prev,
      reducedAnimations: connectionSpeed === 'slow' || memoryInfo.used > memoryInfo.total * 0.8,
      compressedImages: connectionSpeed === 'slow' || connectionSpeed === 'offline',
      offlineMode: connectionSpeed === 'offline',
      lazyLoading: true, // Always enabled
      cacheEnabled: true // Always enabled
    }));
  }, [checkConnectionSpeed, checkMemoryUsage]);

  // Calculate performance score
  const calculatePerformanceScore = useCallback(() => {
    let score = 100;
    
    if (metrics.connectionSpeed === 'slow') score -= 20;
    if (metrics.connectionSpeed === 'offline') score -= 40;
    if (metrics.memoryUsage > 80) score -= 15;
    if (metrics.loadTime > 3000) score -= 10;
    if (metrics.renderTime > 16) score -= 10; // 60fps = 16.67ms per frame
    
    // Bonus for optimizations
    if (optimizations.reducedAnimations) score += 5;
    if (optimizations.compressedImages) score += 5;
    if (optimizations.lazyLoading) score += 5;
    if (optimizations.cacheEnabled) score += 5;
    
    return Math.max(0, Math.min(100, score));
  }, [metrics, optimizations]);

  // Update metrics periodically
  useEffect(() => {
    const updateMetrics = async () => {
      const connectionSpeed = checkConnectionSpeed();
      const memoryInfo = checkMemoryUsage();
      const batteryInfo = await checkBatteryStatus();
      
      setMetrics(prev => ({
        ...prev,
        connectionSpeed,
        memoryUsage: (memoryInfo.used / memoryInfo.total) * 100,
        batteryLevel: batteryInfo?.level,
        isLowPowerMode: batteryInfo?.lowPowerMode
      }));
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 30000); // Every 30 seconds
    
    return () => clearInterval(interval);
  }, [checkConnectionSpeed, checkMemoryUsage, checkBatteryStatus]);

  // Auto-optimize when metrics change
  useEffect(() => {
    autoOptimize();
  }, [metrics.connectionSpeed, metrics.memoryUsage, metrics.batteryLevel]);

  // Calculate performance score when metrics or optimizations change
  useEffect(() => {
    setPerformanceScore(calculatePerformanceScore());
  }, [calculatePerformanceScore]);

  // Listen for connection changes
  useEffect(() => {
    const handleOnline = () => setMetrics(prev => ({ ...prev, connectionSpeed: checkConnectionSpeed() }));
    const handleOffline = () => setMetrics(prev => ({ ...prev, connectionSpeed: 'offline' }));
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    if ((navigator as any).connection) {
      (navigator as any).connection.addEventListener('change', handleOnline);
    }
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if ((navigator as any).connection) {
        (navigator as any).connection.removeEventListener('change', handleOnline);
      }
    };
  }, [checkConnectionSpeed]);

  const enableOptimization = (key: keyof PerformanceOptimizations) => {
    setOptimizations(prev => ({ ...prev, [key]: true }));
  };

  const disableOptimization = (key: keyof PerformanceOptimizations) => {
    setOptimizations(prev => ({ ...prev, [key]: false }));
  };

  const measureLoadTime = (startTime: number) => {
    const loadTime = Date.now() - startTime;
    setMetrics(prev => ({ ...prev, loadTime }));
    return loadTime;
  };

  const measureRenderTime = () => {
    const startTime = performance.now();
    return () => {
      const renderTime = performance.now() - startTime;
      setMetrics(prev => ({ ...prev, renderTime }));
      return renderTime;
    };
  };

  return {
    metrics,
    optimizations,
    performanceScore,
    enableOptimization,
    disableOptimization,
    autoOptimize,
    measureLoadTime,
    measureRenderTime,
    isSlowConnection: metrics.connectionSpeed === 'slow',
    isOffline: metrics.connectionSpeed === 'offline',
    isLowMemory: metrics.memoryUsage > 80,
    isLowBattery: (metrics.batteryLevel || 100) < 20
  };
};