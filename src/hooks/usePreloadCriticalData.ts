/**
 * ✅ PHASE 5: PRÉCHARGEMENT INTELLIGENT
 * Charge en parallèle les données critiques pendant le splash screen
 */

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { redis, cacheStrategies } from '@/lib/redis';
import { useAuth } from './useAuth';

interface PreloadStatus {
  isLoading: boolean;
  isReady: boolean;
  loadedResources: string[];
  errors: string[];
}

export const usePreloadCriticalData = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<PreloadStatus>({
    isLoading: true,
    isReady: false,
    loadedResources: [],
    errors: []
  });

  useEffect(() => {
    const preload = async () => {
      const startTime = Date.now();
      const results = await Promise.allSettled([
        // 1. Configurations services
        (async () => {
          const cacheKey = 'service_configs:all';
          let data = await redis.get(cacheKey);
          
          if (!data) {
            const { data: configs } = await supabase
              .from('service_configurations')
              .select('*')
              .eq('is_active', true);
            
            if (configs) {
              await redis.set(cacheKey, configs, cacheStrategies.SERVICE_CONFIG.ttl);
              data = configs;
            }
          }
          
          return { resource: 'service_configs', data };
        })(),
        
        // 2. Produits populaires marketplace (10 premiers)
        (async () => {
          const cacheKey = 'marketplace:popular_products';
          let data = await redis.get(cacheKey);
          
          if (!data) {
            const { data: products } = await supabase
              .from('marketplace_products')
              .select('*')
              .eq('status', 'active')
              .eq('moderation_status', 'approved')
              .order('created_at', { ascending: false })
              .limit(10);
            
            if (products) {
              await redis.set(cacheKey, products, cacheStrategies.POPULAR_PRODUCTS.ttl);
              data = products;
            }
          }
          
          return { resource: 'marketplace_products', data };
        })(),
        
        // 3. Profil utilisateur (si connecté)
        (async () => {
          if (!user) return { resource: 'user_profile', data: null };
          
          const cacheKey = `user_profile:${user.id}`;
          let data = await redis.get(cacheKey);
          
          if (!data) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .single();
            
            if (profile) {
              await redis.set(cacheKey, profile, 300); // 5 min
              data = profile;
            }
          }
          
          return { resource: 'user_profile', data };
        })(),
        
        // 4. Gains loterie récents (5 derniers)
        (async () => {
          if (!user) return { resource: 'lottery_wins', data: null };
          
          const cacheKey = `lottery_wins:${user.id}`;
          let data = await redis.get(cacheKey);
          
          if (!data) {
            const { data: wins } = await supabase
              .from('lottery_wins')
              .select('*')
              .eq('user_id', user.id)
              .order('created_at', { ascending: false })
              .limit(5);
            
            if (wins) {
              await redis.set(cacheKey, wins, 60); // 1 min
              data = wins;
            }
          }
          
          return { resource: 'lottery_wins', data };
        })()
      ]);

      const loadedResources: string[] = [];
      const errors: string[] = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          loadedResources.push(result.value.resource);
        } else if (result.status === 'rejected') {
          errors.push(`Resource ${index} failed: ${result.reason}`);
        }
      });

      const elapsedTime = Date.now() - startTime;
      console.log(`✅ [Preload] Terminé en ${elapsedTime}ms`, {
        loaded: loadedResources,
        errors
      });

      setStatus({
        isLoading: false,
        isReady: true,
        loadedResources,
        errors
      });
    };

    preload();
  }, [user]);

  return status;
};
