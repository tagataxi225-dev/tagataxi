/**
 * RATE LIMITING MIDDLEWARE - PHASE 2
 * Protection contre abus et DDoS avec limites multi-niveaux
 * Utilise localStorage en dev, Redis en production
 */

interface RateLimitConfig {
  requests: number;
  window: number; // secondes
  prefix: string;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number;
  limit: number;
}

// Configurations par type d'utilisateur
export const RATE_LIMITS = {
  ANONYMOUS: { requests: 10, window: 60, prefix: 'rl:anon' } as RateLimitConfig,
  CLIENT: { requests: 100, window: 60, prefix: 'rl:client' } as RateLimitConfig,
  DRIVER: { requests: 200, window: 60, prefix: 'rl:driver' } as RateLimitConfig,
  PARTNER: { requests: 500, window: 60, prefix: 'rl:partner' } as RateLimitConfig,
  ADMIN: { requests: 1000, window: 60, prefix: 'rl:admin' } as RateLimitConfig,
};

// Limites par endpoint
export const ENDPOINT_LIMITS = {
  BOOKING_CREATE: { requests: 5, window: 60, prefix: 'rl:booking' } as RateLimitConfig,
  WALLET_TOPUP: { requests: 3, window: 300, prefix: 'rl:wallet' } as RateLimitConfig,
  PASSWORD_RESET: { requests: 3, window: 3600, prefix: 'rl:pwd' } as RateLimitConfig,
  LOGIN: { requests: 5, window: 300, prefix: 'rl:login' } as RateLimitConfig,
  MOBILE_MONEY: { requests: 5, window: 300, prefix: 'rl:momo' } as RateLimitConfig,
  ACCOUNT_DELETE: { requests: 1, window: 86400, prefix: 'rl:delete' } as RateLimitConfig,
  ADMIN_OPS: { requests: 20, window: 60, prefix: 'rl:admin' } as RateLimitConfig,
};

/**
 * Simple in-memory rate limiter (dev mode)
 * En production, remplacer par Redis/Upstash
 */
class InMemoryRateLimiter {
  private store: Map<string, { count: number; resetAt: number }> = new Map();

  async check(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
    const now = Math.floor(Date.now() / 1000);
    const fullKey = `${config.prefix}:${key}`;
    
    let record = this.store.get(fullKey);
    
    // Reset si fenêtre expirée
    if (!record || now >= record.resetAt) {
      record = {
        count: 0,
        resetAt: now + config.window
      };
      this.store.set(fullKey, record);
    }

    // Vérifier limite
    if (record.count >= config.requests) {
      return {
        success: false,
        remaining: 0,
        reset: record.resetAt,
        limit: config.requests
      };
    }

    // Incrémenter compteur
    record.count++;
    
    return {
      success: true,
      remaining: config.requests - record.count,
      reset: record.resetAt,
      limit: config.requests
    };
  }

  // Cleanup périodique des entrées expirées
  cleanup() {
    const now = Math.floor(Date.now() / 1000);
    for (const [key, record] of this.store.entries()) {
      if (now >= record.resetAt) {
        this.store.delete(key);
      }
    }
  }
}

const rateLimiter = new InMemoryRateLimiter();

// Cleanup automatique toutes les 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => rateLimiter.cleanup(), 5 * 60 * 1000);
}

/**
 * Vérifier rate limit pour un utilisateur/IP
 */
export async function rateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  // TODO: En production, utiliser Upstash Redis
  // const redis = Redis.fromEnv();
  // const result = await redis.incr(`${config.prefix}:${identifier}`);
  // if (result === 1) await redis.expire(`${config.prefix}:${identifier}`, config.window);
  
  return await rateLimiter.check(identifier, config);
}

/**
 * Middleware rate limiting pour Edge Functions
 */
export async function withRateLimit(
  req: Request,
  config: RateLimitConfig,
  handler: (req: Request) => Promise<Response>
): Promise<Response> {
  // Identifier par IP ou user ID
  const identifier = req.headers.get('x-forwarded-for') || 
                     req.headers.get('x-real-ip') || 
                     'unknown';

  const result = await rateLimit(identifier, config);

  // Headers de rate limit
  const headers = {
    'X-RateLimit-Limit': config.requests.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.toString(),
  };

  if (!result.success) {
    const retryAfter = result.reset - Math.floor(Date.now() / 1000);
    
    return new Response(
      JSON.stringify({
        error: 'Rate limit exceeded',
        message: `Trop de requêtes. Réessayez dans ${retryAfter} secondes.`,
        retry_after: retryAfter
      }),
      {
        status: 429,
        headers: {
          ...headers,
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-health-check, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
          'Retry-After': retryAfter.toString(),
          'Content-Type': 'application/json'
        }
      }
    );
  }

  // Exécuter handler et ajouter headers
  const response = await handler(req);
  
  // Ajouter headers de rate limit à la réponse
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

/**
 * Obtenir le type d'utilisateur pour appliquer les bonnes limites
 */
export function getUserRateLimit(userType?: string): RateLimitConfig {
  switch (userType?.toLowerCase()) {
    case 'admin':
      return RATE_LIMITS.ADMIN;
    case 'partner':
    case 'partenaire':
      return RATE_LIMITS.PARTNER;
    case 'driver':
    case 'chauffeur':
      return RATE_LIMITS.DRIVER;
    case 'client':
      return RATE_LIMITS.CLIENT;
    default:
      return RATE_LIMITS.ANONYMOUS;
  }
}
