/**
 * 🎯 PHASE 5: RATE LIMITING CLIENT-SIDE
 * 
 * Protection côté client pour éviter les abus d'API
 * Complète le rate limiting Edge Functions (PHASE_2_4_6_IMPLEMENTATION.md)
 * 
 * Limites:
 * - Anonymous: 10 req/min
 * - Authenticated: 60 req/min
 * - Premium: 300 req/min
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class ClientRateLimiter {
  private limits = new Map<string, RateLimitEntry>();
  private configs: Record<string, RateLimitConfig> = {
    anonymous: { maxRequests: 10, windowMs: 60000 }, // 10/min
    authenticated: { maxRequests: 60, windowMs: 60000 }, // 60/min
    premium: { maxRequests: 300, windowMs: 60000 }, // 300/min
  };

  /**
   * Vérifier si une requête est autorisée
   */
  checkLimit(key: string, tier: 'anonymous' | 'authenticated' | 'premium' = 'anonymous'): {
    allowed: boolean;
    remaining: number;
    resetAt: number;
  } {
    const config = this.configs[tier];
    const now = Date.now();
    const entry = this.limits.get(key);

    // Nettoyer les entrées expirées
    this.cleanup();

    if (!entry || now > entry.resetTime) {
      // Nouvelle fenêtre
      this.limits.set(key, {
        count: 1,
        resetTime: now + config.windowMs,
      });

      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetAt: now + config.windowMs,
      };
    }

    // Vérifier la limite
    if (entry.count >= config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: entry.resetTime,
      };
    }

    // Incrémenter
    entry.count++;
    this.limits.set(key, entry);

    return {
      allowed: true,
      remaining: config.maxRequests - entry.count,
      resetAt: entry.resetTime,
    };
  }

  /**
   * Nettoyer les entrées expirées
   */
  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.limits.entries()) {
      if (now > entry.resetTime) {
        this.limits.delete(key);
      }
    }
  }

  /**
   * Réinitialiser une clé spécifique
   */
  reset(key: string) {
    this.limits.delete(key);
  }

  /**
   * Obtenir les statistiques
   */
  getStats() {
    return {
      totalKeys: this.limits.size,
      entries: Array.from(this.limits.entries()).map(([key, entry]) => ({
        key,
        count: entry.count,
        resetTime: new Date(entry.resetTime).toISOString(),
      })),
    };
  }
}

// Instance globale
export const rateLimiter = new ClientRateLimiter();

/**
 * 🎯 Wrapper pour fetch avec rate limiting
 */
export async function fetchWithRateLimit(
  url: string,
  options?: RequestInit,
  tier: 'anonymous' | 'authenticated' | 'premium' = 'authenticated'
): Promise<Response> {
  const key = `fetch:${url}`;
  const { allowed, remaining, resetAt } = rateLimiter.checkLimit(key, tier);

  if (!allowed) {
    const waitTime = Math.ceil((resetAt - Date.now()) / 1000);
    throw new Error(
      `Rate limit exceeded. Please wait ${waitTime} seconds before retrying.`
    );
  }

  console.log(`[Rate Limit] ${remaining} requests remaining for ${url}`);

  try {
    const response = await fetch(url, options);
    return response;
  } catch (error) {
    console.error(`[Fetch Error] ${url}:`, error);
    throw error;
  }
}

/**
 * 🎯 Hook React pour rate limiting
 */
export function useRateLimit(
  key: string,
  tier: 'anonymous' | 'authenticated' | 'premium' = 'authenticated'
) {
  const checkLimit = () => rateLimiter.checkLimit(key, tier);
  const reset = () => rateLimiter.reset(key);

  return {
    checkLimit,
    reset,
  };
}
