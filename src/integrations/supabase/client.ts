// Client Supabase - Configuration Tembea (Safari/iOS optimisÃ©)
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { supabaseCircuitBreaker } from '@/lib/circuitBreaker';
import { logger } from '@/utils/logger';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://zdoaibbocwqanvmropri.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpkb2FpYmJvY3dxYW52bXJvcHJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1MjY2MjMsImV4cCI6MjA5NzEwMjYyM30.Ai5NTfBhHuQQckMPn5d5mAPzNTo38lJTg-bvs4XgCRk";

// DÃ©tection Safari/iOS pour ajustements spÃ©cifiques
const isSafari = typeof navigator !== 'undefined' && (
  /^((?!chrome|android).)*safari/i.test(navigator.userAgent) ||
  /iPad|iPhone|iPod/.test(navigator.userAgent)
);

// Safe localStorage wrapper for Safari private mode
const safeStorage = (() => {
  try {
    localStorage.setItem('__test__', '1');
    localStorage.removeItem('__test__');
    return localStorage;
  } catch {
    logger.warn('âš ï¸ localStorage not available, using in-memory fallback');
    const store: Record<string, string> = {};
    return {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => { store[key] = value; },
      removeItem: (key: string) => { delete store[key]; },
      clear: () => { Object.keys(store).forEach(k => delete store[k]); },
      get length() { return Object.keys(store).length; },
      key: (i: number) => Object.keys(store)[i] ?? null,
    } as Storage;
  }
})();

/** Fetch avec retry 1x pour erreurs rÃ©seau sur les requÃªtes auth */
const fetchWithAuthRetry = async (url: string, options: RequestInit): Promise<Response> => {
  try {
    return await fetch(url, options);
  } catch (error: any) {
    // Retry uniquement sur erreur rÃ©seau (pas HTTP), et seulement pour auth
    const isNetworkError = error?.name === 'TypeError' && error?.message?.includes('Failed to fetch');
    const isAuthUrl = typeof url === 'string' && url.includes('/auth/v1/');
    
    if (isNetworkError && isAuthUrl) {
      logger.warn('ðŸ”„ Auth fetch retry aprÃ¨s erreur rÃ©seau...');
      await new Promise(r => setTimeout(r, 500));
      return await fetch(url, options);
    }
    throw error;
  }
};

const baseClient = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: safeStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'implicit' // Compatible Safari ITP â€” pas d'OAuth utilisÃ©
  },
  global: {
    headers: {
      'X-Client-Info': 'kwenda-vtc/1.0.0'
    },
    fetch: async (url, options = {}) => {
      // BYPASS circuit breaker pour auth ET RPC critiques
      const urlStr = typeof url === 'string' ? url : (url as Request).url;
      const isAuthUrl = urlStr.includes('/auth/v1/');
      const isBypassUrl = isAuthUrl || urlStr.includes('/rest/v1/rpc/');
      
      const executeFetch = async () => {
        const controller = new AbortController();
        // 30s timeout (augmentÃ© de 20s pour rÃ©seaux mobiles lents)
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        
        try {
          const response = await fetchWithAuthRetry(urlStr, {
            ...options,
            signal: controller.signal,
            // Safari/iOS: same-origin pour auth (cookies session), omit pour le reste
            credentials: (isAuthUrl && isSafari) ? 'same-origin' : 'omit'
          });
          clearTimeout(timeoutId);
          
          if (!response.ok && response.status >= 500) {
            logger.warn(`âš ï¸ Supabase server error ${response.status}: ${urlStr}`);
          }
          
          return response;
        } catch (error) {
          clearTimeout(timeoutId);
          logger.error('âŒ Supabase fetch error:', error);
          throw error;
        }
      };
      
      if (isBypassUrl) {
        return executeFetch();
      }
      
      return supabaseCircuitBreaker.execute(executeFetch);
    }
  },
  db: {
    schema: 'public'
  },
  realtime: {
    params: {
      eventsPerSecond: 2
    }
  }
});

// Export du client Supabase configurÃ© pour l'application
export const supabase = baseClient;

// Attach to window for legacy components referencing window.supabase
if (typeof window !== 'undefined') {
  (window as any).supabase = supabase;
}

