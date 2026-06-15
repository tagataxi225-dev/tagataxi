/**
 * HOOK AVEC CACHE REDIS INTELLIGENT
 * Combine React Query avec Redis pour performance optimale
 * Supporte invalidation automatique via Supabase Realtime
 */

import { useQuery, useQueryClient, QueryKey, UseQueryOptions } from '@tanstack/react-query';
import { useEffect } from 'react';
import { redis, CacheStrategy } from '@/lib/redis';
import { supabase } from '@/integrations/supabase/client';

interface CachedQueryOptions<T> extends Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'> {
  cacheStrategy: CacheStrategy;
  invalidateOn?: {
    table: string;
    filter?: string;
    event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  }[];
}

/**
 * Hook qui utilise Redis comme cache L1 et React Query comme cache L2
 * Avec invalidation automatique basée sur Realtime events
 */
export function useCachedQuery<T>(
  queryKey: QueryKey,
  fetcher: () => Promise<T>,
  options: CachedQueryOptions<T>
) {
  const queryClient = useQueryClient();
  const cacheKey = `${options.cacheStrategy.prefix}:${JSON.stringify(queryKey)}`;

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      // 1. Essayer cache Redis d'abord (L1)
      const cached = await redis.get<T>(cacheKey);
      if (cached !== null) {
        console.log(`[Cache HIT] ${cacheKey}`);
        return cached;
      }

      console.log(`[Cache MISS] ${cacheKey}`);

      // 2. Sinon, fetch depuis DB
      const data = await fetcher();

      // 3. Stocker dans Redis avec TTL
      await redis.set(cacheKey, data, options.cacheStrategy.ttl);

      return data;
    },
    staleTime: options.cacheStrategy.ttl * 1000, // Sync avec Redis TTL
    ...options
  });

  // Invalidation automatique via Realtime
  useEffect(() => {
    if (!options.invalidateOn) return;

    const channels: ReturnType<typeof supabase.channel>[] = [];

    options.invalidateOn.forEach((config, index) => {
      const channel = supabase
        .channel(`cache-invalidation-${queryKey.toString()}-${index}`)
        .on(
          'postgres_changes' as any,
          {
            event: config.event || '*',
            schema: 'public',
            table: config.table,
            filter: config.filter
          } as any,
          async (payload: any) => {
            console.log(`[Cache INVALIDATE] ${cacheKey} due to ${config.table} change`, payload);
            
            // Invalider Redis
            await redis.del(cacheKey);
            
            // Invalider React Query
            queryClient.invalidateQueries({ queryKey });
          }
        )
        .subscribe();

      channels.push(channel);
    });

    return () => {
      channels.forEach(ch => supabase.removeChannel(ch));
    };
  }, [queryKey, cacheKey, options.invalidateOn, queryClient]);

  return query;
}

/**
 * Hook spécialisé pour les listes avec cache intelligent
 */
export function useCachedListQuery<T>(
  queryKey: QueryKey,
  fetcher: () => Promise<T[]>,
  options: CachedQueryOptions<T[]>
) {
  return useCachedQuery(queryKey, fetcher, {
    ...options,
    // Optimisation: considérer les données comme fresh pendant le TTL
    staleTime: options.cacheStrategy.ttl * 1000,
    // Garder en mémoire plus longtemps
    gcTime: (options.cacheStrategy.ttl * 2) * 1000
  });
}

/**
 * Hook pour données temps réel avec cache court
 */
export function useCachedRealtimeQuery<T>(
  queryKey: QueryKey,
  fetcher: () => Promise<T>,
  options: Omit<CachedQueryOptions<T>, 'cacheStrategy'>
) {
  return useCachedQuery(queryKey, fetcher, {
    ...options,
    cacheStrategy: { ttl: 30, prefix: 'realtime' }, // Cache très court pour données temps réel
    refetchInterval: 30000 // Refetch toutes les 30s
  });
}
