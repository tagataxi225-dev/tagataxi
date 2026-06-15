import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-health-check, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

const RATE_LIMIT_ENDPOINT = 'google_maps_key_requests'
const MAX_REQUESTS_PER_HOUR = 100

// Générer un hash simple pour les IPs (compatible Deno)
async function hashIp(ip: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip + '_kwenda_salt_2024');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  // Prendre les 32 premiers caractères du hash pour créer un UUID-like
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  // Formater en UUID v4-like: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
  return `${hashHex.slice(0, 8)}-${hashHex.slice(8, 12)}-4${hashHex.slice(13, 16)}-a${hashHex.slice(17, 20)}-${hashHex.slice(20, 32)}`;
}

async function checkRateLimit(rateLimitId: string, isIpBased: boolean): Promise<{ allowed: boolean; remaining: number }> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, supabaseKey)

  const now = new Date()
  const resetTime = new Date(now.getTime() + 3600000) // +1 hour

  // Pour les IP, générer un UUID valide à partir du hash
  let userId = rateLimitId;
  if (isIpBased) {
    userId = await hashIp(rateLimitId);
    console.log(`🔐 IP hash generated: ${userId.slice(0, 8)}...`);
  }

  try {
    // Get or create rate limit record
    const { data: existingLimit, error: selectError } = await supabase
      .from('api_rate_limits')
      .select('request_count, reset_at')
      .eq('user_id', userId)
      .eq('endpoint', RATE_LIMIT_ENDPOINT)
      .maybeSingle()

    if (selectError) {
      console.error('Rate limit select error:', selectError);
      // En cas d'erreur, permettre la requête
      return { allowed: true, remaining: MAX_REQUESTS_PER_HOUR }
    }

    // Reset if expired or first request
    if (!existingLimit || new Date(existingLimit.reset_at) < now) {
      try {
        const { error: upsertError } = await supabase.from('api_rate_limits').upsert(
          {
            user_id: userId,
            endpoint: RATE_LIMIT_ENDPOINT,
            request_count: 1,
            reset_at: resetTime.toISOString()
          },
          {
            onConflict: 'user_id,endpoint',
            ignoreDuplicates: false
          }
        );
        
        if (upsertError) {
          console.error('Rate limit upsert error:', upsertError);
          // Ne pas bloquer en cas d'erreur upsert
        }
      } catch (upsertCatchError) {
        console.error('Rate limit upsert catch error:', upsertCatchError);
        // Continuer malgré l'erreur
      }
      return { allowed: true, remaining: MAX_REQUESTS_PER_HOUR - 1 }
    }

    // Check if limit exceeded
    if (existingLimit.request_count >= MAX_REQUESTS_PER_HOUR) {
      return { allowed: false, remaining: 0 }
    }

    // Increment counter
    await supabase
      .from('api_rate_limits')
      .update({ request_count: existingLimit.request_count + 1 })
      .eq('user_id', userId)
      .eq('endpoint', RATE_LIMIT_ENDPOINT)

    return { allowed: true, remaining: MAX_REQUESTS_PER_HOUR - existingLimit.request_count - 1 }
  } catch (error: unknown) {
    console.error('Rate limit check error:', error);
    // En cas d'erreur, permettre la requête mais logger
    return { allowed: true, remaining: MAX_REQUESTS_PER_HOUR }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Authentication REQUIRED
    const authHeader = req.headers.get('Authorization')
    
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    })

    const token = authHeader.replace('Bearer ', '')
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token)
    
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    const userId = claimsData.claims.sub as string
    const isAuthenticated = true
    console.log(`🔑 get-google-maps-key called by authenticated user ${userId}`)

    // Rate limiting by authenticated user
    const isIpBased = false;
    const rateLimitId = userId;
    const rateLimitCheck = await checkRateLimit(rateLimitId, isIpBased)
    
    if (!rateLimitCheck.allowed) {
      console.warn(`⚠️ Rate limit exceeded for ${rateLimitId}`)
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded. Please try again later.',
          retryAfter: 3600 // seconds
        }),
        {
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Retry-After': '3600'
          },
          status: 429,
        },
      )
    }

    console.log(`✅ Rate limit OK - ${rateLimitCheck.remaining} requests remaining (${isAuthenticated ? 'authenticated' : 'IP-based'})`)

    const googleMapsApiKey = Deno.env.get('GOOGLE_MAPS_API_KEY')
    const googleMapsMapId = Deno.env.get('GOOGLE_MAPS_MAP_ID')
    
    if (!googleMapsApiKey) {
      console.error('❌ GOOGLE_MAPS_API_KEY not found in environment variables')
      throw new Error('Google Maps API key not configured')
    }

    // ✅ Map ID est OPTIONNEL - valider le format (ne doit pas être une clé API)
    let validMapId: string | null = null;
    if (googleMapsMapId) {
      // Un Map ID valide ne commence PAS par "AIza" (c'est une clé API)
      if (googleMapsMapId.startsWith('AIza')) {
        console.warn('⚠️ GOOGLE_MAPS_MAP_ID contient une clé API au lieu d\'un Map ID valide');
        console.warn('⚠️ Un Map ID ressemble à "8e0a97af9386fef" ou "DEMO_MAP_ID"');
        validMapId = null;
      } else {
        validMapId = googleMapsMapId;
      }
    } else {
      console.warn('⚠️ GOOGLE_MAPS_MAP_ID non configuré - fonctionnement sans Map ID');
    }

    console.log('✅ Google Maps API key found:', googleMapsApiKey.substring(0, 10) + '...')
    console.log(validMapId 
      ? `✅ Google Maps Map ID valide: ${validMapId}` 
      : '⚠️ Pas de Map ID valide - utilisation des marqueurs classiques');
    
    return new Response(
      JSON.stringify({ 
        apiKey: googleMapsApiKey,
        mapId: validMapId,  // Peut être null
        requestsRemaining: rateLimitCheck.remaining,
        authenticated: isAuthenticated
      }),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-RateLimit-Remaining': rateLimitCheck.remaining.toString(),
          'X-RateLimit-Limit': MAX_REQUESTS_PER_HOUR.toString(),
          'X-Auth-Mode': isAuthenticated ? 'authenticated' : 'ip-based'
        },
        status: 200,
      },
    )
  } catch (error: unknown) {
    console.error('❌ Error in get-google-maps-key:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})