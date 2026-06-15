/**
 * Hook pour optimiser les performances réseau
 * Gère la queue, la déduplication et le retry intelligent
 */

import { useState, useEffect, useRef, useCallback } from 'react';

interface NetworkRequest {
  id: string;
  data: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  priority: 'low' | 'normal' | 'high';
}

interface NetworkOptimizationOptions {
  maxQueueSize?: number;
  retryDelay?: number;
  batchSize?: number;
  enableDeduplication?: boolean;
}

export function useNetworkOptimization(options: NetworkOptimizationOptions = {}) {
  const {
    maxQueueSize = 50,
    retryDelay = 5000,
    batchSize = 10,
    enableDeduplication = true
  } = options;

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queueSize, setQueueSize] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const queueRef = useRef<NetworkRequest[]>([]);
  const processingRef = useRef(false);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Surveiller l'état réseau
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      processQueue();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  const generateRequestId = (data: any): string => {
    // Créer un ID basé sur le contenu pour la déduplication
    return btoa(JSON.stringify(data)).slice(0, 16);
  };

  const addToQueue = (data: any, priority: 'low' | 'normal' | 'high' = 'normal') => {
    const id = generateRequestId(data);
    
    // Déduplication
    if (enableDeduplication) {
      const existingIndex = queueRef.current.findIndex(req => req.id === id);
      if (existingIndex !== -1) {
        // Mettre à jour la priorité si elle est plus élevée
        const existing = queueRef.current[existingIndex];
        if (getPriorityValue(priority) > getPriorityValue(existing.priority)) {
          queueRef.current[existingIndex].priority = priority;
        }
        return;
      }
    }

    // Vérifier la taille de la queue
    if (queueRef.current.length >= maxQueueSize) {
      // Supprimer les requêtes de plus faible priorité
      queueRef.current.sort((a, b) => getPriorityValue(b.priority) - getPriorityValue(a.priority));
      queueRef.current = queueRef.current.slice(0, maxQueueSize - 1);
    }

    const request: NetworkRequest = {
      id,
      data,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: priority === 'high' ? 5 : 3,
      priority
    };

    queueRef.current.push(request);
    setQueueSize(queueRef.current.length);

    // Traiter immédiatement si en ligne
    if (isOnline && !processingRef.current) {
      processQueue();
    }
  };

  const getPriorityValue = (priority: string): number => {
    switch (priority) {
      case 'high': return 3;
      case 'normal': return 2;
      case 'low': return 1;
      default: return 2;
    }
  };

  const processQueue = useCallback(async () => {
    if (!isOnline || processingRef.current || queueRef.current.length === 0) {
      return;
    }

    processingRef.current = true;
    setIsProcessing(true);

    try {
      // Trier par priorité et timestamp
      queueRef.current.sort((a, b) => {
        const priorityDiff = getPriorityValue(b.priority) - getPriorityValue(a.priority);
        return priorityDiff !== 0 ? priorityDiff : a.timestamp - b.timestamp;
      });

      // Traiter par batch
      const batch = queueRef.current.splice(0, batchSize);
      const results = [];

      for (const request of batch) {
        try {
          const result = await executeRequest(request);
          results.push({ success: true, request, result });
        } catch (error) {
          console.error('Erreur requête réseau:', error);
          
          // Retry logic
          if (request.retryCount < request.maxRetries) {
            request.retryCount++;
            request.timestamp = Date.now();
            queueRef.current.unshift(request); // Remettre en début de queue
          } else {
            console.error('Requête abandonnée après maximum de tentatives:', request.id);
            results.push({ success: false, request, error });
          }
        }
      }

      setQueueSize(queueRef.current.length);

      // Programmer le prochain traitement s'il reste des éléments
      if (queueRef.current.length > 0) {
        retryTimeoutRef.current = setTimeout(() => {
          processQueue();
        }, retryDelay);
      }

    } finally {
      processingRef.current = false;
      setIsProcessing(false);
    }
  }, [isOnline, retryDelay, batchSize]);

  const executeRequest = async (request: NetworkRequest): Promise<any> => {
    // Cette fonction devrait être personnalisée selon le type de requête
    // Pour l'instant, on simule une requête générique
    
    const response = await fetch('/api/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request.data)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  };

  const clearQueue = () => {
    queueRef.current = [];
    setQueueSize(0);
  };

  const getQueueStats = () => {
    const priorityCounts = queueRef.current.reduce((acc, req) => {
      acc[req.priority] = (acc[req.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: queueRef.current.length,
      priorities: priorityCounts,
      oldestTimestamp: queueRef.current.length > 0 
        ? Math.min(...queueRef.current.map(r => r.timestamp))
        : null
    };
  };

  return {
    isOnline,
    queueSize,
    isProcessing,
    addToQueue,
    processQueue,
    clearQueue,
    getQueueStats
  };
}