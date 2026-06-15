/**
 * CONFIGURATION REACT QUERY OPTIMISÉE
 * Cache intelligent, retry automatique, monitoring centralisé
 */

import { QueryClient, QueryCache } from '@tanstack/react-query';
import { logger } from '@/utils/logger';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000, // 2 minutes
      gcTime: 5 * 60 * 1000, // 5 minutes — libère mémoire plus vite
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(500 * 2 ** attemptIndex, 10000),
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: true,
      placeholderData: (previousData: unknown) => previousData,
      throwOnError: false,
      networkMode: 'offlineFirst',
      structuralSharing: true, // Évite re-renders si data identique
    },
    mutations: {
      retry: 1,
      retryDelay: 500,
      onError: (error) => {
        logger.error('❌ [React Query] Mutation error:', error);
      },
      networkMode: 'offlineFirst',
    },
  },
  queryCache: new QueryCache({
    onSuccess: (data, query) => {
      const duration = Date.now() - (query.state.dataUpdatedAt || Date.now());
      if (duration > 1000) {
        logger.warn(`⏱️ [React Query] Slow query (${duration}ms):`, query.queryKey);
      }
    },
    onError: (error, query) => {
      logger.error('❌ [React Query] Query error:', { 
        queryKey: query.queryKey, 
        error 
      });
    },
  }),
});
