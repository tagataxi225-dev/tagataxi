import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Utilitaire pour fetch avec timeout
async function fetchWithTimeout(url: string, options: any, timeoutMs: number) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Obtenir l'IP du client
    const clientIP = req.headers.get('x-forwarded-for') || 
                    req.headers.get('x-real-ip') || 
                    '127.0.0.1';

    console.log(`🌐 Géolocalisation IP pour: ${clientIP}`);

    // Initialiser Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Vérifier le cache d'abord
    const { data: cached, error: cacheError } = await supabase
      .from('ip_geolocation_cache')
      .select('*')
      .eq('ip_address', clientIP)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (cached && !cacheError) {
      console.log('📍 Position récupérée du cache');
      return new Response(JSON.stringify({
        success: true,
        cached: true,
        data: {
          address: `${cached.city}, ${cached.country_name}`,
          lat: cached.latitude,
          lng: cached.longitude,
          type: 'ip',
          accuracy: cached.accuracy,
          source: 'cache'
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // Essayer plusieurs services de géolocalisation IP
    let locationData = null;

    // Essayer plusieurs services en parallèle avec timeout intelligent
    const services = [
      () => fetchWithTimeout(`https://ipapi.co/${clientIP}/json/`, {
        headers: { 'User-Agent': 'Kwenda-App/1.0' }
      }, 4000).then(data => {
        if (data.latitude && data.longitude && !data.error) {
          return {
            latitude: data.latitude,
            longitude: data.longitude,
            city: data.city,
            country_name: data.country_name,
            country_code: data.country_code,
            provider: 'ipapi.co',
            accuracy: 8000
          };
        }
        throw new Error('Invalid data from ipapi.co');
      }),
      
      () => fetchWithTimeout(`https://ipinfo.io/${clientIP}/json`, {
        headers: { 'User-Agent': 'Kwenda-App/1.0' }
      }, 5000).then(data => {
        if (data.loc) {
          const [lat, lng] = data.loc.split(',').map(Number);
          return {
            latitude: lat,
            longitude: lng,
            city: data.city,
            country_name: data.country,
            country_code: data.country,
            provider: 'ipinfo.io',
            accuracy: 12000
          };
        }
        throw new Error('Invalid data from ipinfo.io');
      }),
      
      () => fetchWithTimeout(`https://get.geojs.io/v1/ip/geo.json`, {
        headers: { 'User-Agent': 'Kwenda-App/1.0' }
      }, 6000).then(data => {
        if (data.latitude && data.longitude) {
          return {
            latitude: parseFloat(data.latitude),
            longitude: parseFloat(data.longitude),
            city: data.city,
            country_name: data.country,
            country_code: data.country_code,
            provider: 'geojs.io',
            accuracy: 15000
          };
        }
        throw new Error('Invalid data from geojs.io');
      })
    ];

    // Essayer les services séquentiellement avec retry intelligent
    for (let i = 0; i < services.length; i++) {
      try {
        console.log(`🔄 Tentative service ${i + 1}/3...`);
        locationData = await services[i]();
        console.log(`✅ Service ${i + 1} réussi:`, locationData.provider);
        break;
      } catch (error: unknown) {
        console.warn(`❌ Service ${i + 1} échoué:`, error instanceof Error ? error.message : 'Unknown error');
        // Continuer avec le service suivant
      }
    }

    if (!locationData) {
      console.log('❌ Tous les services ont échoué, utilisation du fallback');
      // Fallback basé sur des heuristiques de pays
      locationData = {
        latitude: -4.3217,
        longitude: 15.3069,
        city: 'Kinshasa',
        country_name: 'République Démocratique du Congo',
        country_code: 'CD',
        provider: 'fallback',
        accuracy: 50000
      };
    }

    // Mettre en cache le résultat
    try {
      await supabase
        .from('ip_geolocation_cache')
        .insert({
          ip_address: clientIP,
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          city: locationData.city,
          country_name: locationData.country_name,
          country_code: locationData.country_code,
          accuracy: locationData.accuracy,
          provider: locationData.provider
        });
      console.log('💾 Résultat mis en cache');
    } catch (error: unknown) {
      console.warn('⚠️ Échec cache:', error instanceof Error ? error.message : 'Unknown error');
    }

    return new Response(JSON.stringify({
      success: true,
      cached: false,
      data: {
        address: `${locationData.city}, ${locationData.country_name}`,
        lat: locationData.latitude,
        lng: locationData.longitude,
        type: 'ip',
        accuracy: locationData.accuracy,
        source: locationData.provider
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: unknown) {
    console.error('❌ Erreur edge function:', error);
    
    // Fallback final
    return new Response(JSON.stringify({
      success: true,
      cached: false,
      fallback: true,
      data: {
        address: 'Kinshasa, République Démocratique du Congo',
        lat: -4.3217,
        lng: 15.3069,
        type: 'ip',
        accuracy: 50000,
        source: 'fallback'
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  }
})