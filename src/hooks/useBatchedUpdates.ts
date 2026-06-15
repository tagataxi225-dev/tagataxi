/**
 * USE BATCHED UPDATES HOOK
 * Optimise les mises à jour realtime en les regroupant
 * pour réduire les re-renders et améliorer les performances
 */

import { useCallback, useRef, useEffect, useState } from 'react';

interface BatchConfig {
  maxBatchSize?: number;
  maxWaitMs?: number;
  throttleMs?: number;
}

interface BatchedUpdate<T> {
  timestamp: number;
  data: T;
  type: 'INSERT' | 'UPDATE' | 'DELETE';
}

/**
 * Hook pour regrouper les updates en batch
 * Évite les re-renders excessifs lors de nombreuses mises à jour
 */
export function useBatchedUpdates<T>(
  onBatch: (updates: BatchedUpdate<T>[]) => void,
  config: BatchConfig = {}
) {
  const {
    maxBatchSize = 10,
    maxWaitMs = 100,
    throttleMs = 50
  } = config;

  const batchRef = useRef<BatchedUpdate<T>[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastFlushRef = useRef<number>(0);

  // Flush le batch actuel
  const flush = useCallback(() => {
    if (batchRef.current.length === 0) return;

    const batch = [...batchRef.current];
    batchRef.current = [];
    lastFlushRef.current = Date.now();

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    onBatch(batch);
  }, [onBatch]);

  // Ajouter une update au batch
  const addUpdate = useCallback((data: T, type: 'INSERT' | 'UPDATE' | 'DELETE' = 'UPDATE') => {
    const update: BatchedUpdate<T> = {
      timestamp: Date.now(),
      data,
      type
    };

    batchRef.current.push(update);

    // Flush immédiatement si le batch est plein
    if (batchRef.current.length >= maxBatchSize) {
      flush();
      return;
    }

    // Throttle: ne pas flush trop souvent
    const timeSinceLastFlush = Date.now() - lastFlushRef.current;
    if (timeSinceLastFlush < throttleMs) {
      // Programmer un flush différé
      if (!timeoutRef.current) {
        timeoutRef.current = setTimeout(flush, throttleMs - timeSinceLastFlush);
      }
      return;
    }

    // Programmer un flush après maxWaitMs
    if (!timeoutRef.current) {
      timeoutRef.current = setTimeout(flush, maxWaitMs);
    }
  }, [maxBatchSize, maxWaitMs, throttleMs, flush]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      // Flush final
      if (batchRef.current.length > 0) {
        flush();
      }
    };
  }, [flush]);

  return {
    addUpdate,
    flush,
    getPendingCount: () => batchRef.current.length
  };
}

/**
 * Hook pour throttler les updates de position (GPS, véhicules)
 * Limite à N updates par seconde
 */
export function useThrottledPosition<T extends { lat: number; lng: number }>(
  maxUpdatesPerSecond: number = 2
) {
  const [position, setPosition] = useState<T | null>(null);
  const lastUpdateRef = useRef<number>(0);
  const pendingRef = useRef<T | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const minInterval = 1000 / maxUpdatesPerSecond;

  const updatePosition = useCallback((newPosition: T) => {
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateRef.current;

    if (timeSinceLastUpdate >= minInterval) {
      // Mise à jour immédiate
      setPosition(newPosition);
      lastUpdateRef.current = now;
      pendingRef.current = null;

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    } else {
      // Stocker pour mise à jour différée
      pendingRef.current = newPosition;

      if (!timeoutRef.current) {
        const delay = minInterval - timeSinceLastUpdate;
        timeoutRef.current = setTimeout(() => {
          if (pendingRef.current) {
            setPosition(pendingRef.current);
            lastUpdateRef.current = Date.now();
            pendingRef.current = null;
          }
          timeoutRef.current = null;
        }, delay);
      }
    }
  }, [minInterval]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    position,
    updatePosition,
    forceUpdate: (newPosition: T) => {
      setPosition(newPosition);
      lastUpdateRef.current = Date.now();
    }
  };
}

/**
 * Hook pour déduplicquer les updates par ID
 * Garde seulement la dernière update pour chaque ID
 */
export function useDeduplicatedUpdates<T extends { id: string }>(
  onUpdates: (updates: T[]) => void,
  debounceMs: number = 100
) {
  const updatesMapRef = useRef<Map<string, T>>(new Map());
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const flush = useCallback(() => {
    const updates = Array.from(updatesMapRef.current.values());
    updatesMapRef.current.clear();

    if (updates.length > 0) {
      onUpdates(updates);
    }

    timeoutRef.current = null;
  }, [onUpdates]);

  const addUpdate = useCallback((update: T) => {
    // Remplacer l'ancienne update pour cet ID
    updatesMapRef.current.set(update.id, update);

    // Programmer le flush
    if (!timeoutRef.current) {
      timeoutRef.current = setTimeout(flush, debounceMs);
    }
  }, [debounceMs, flush]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { addUpdate, flush };
}

export default useBatchedUpdates;
