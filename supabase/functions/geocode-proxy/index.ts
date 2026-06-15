import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { withRateLimit, RATE_LIMITS } from "../_shared/ratelimit.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-health-check, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // ✅ Apply rate limiting (100 req/min for anonymous)
  return withRateLimit(req, RATE_LIMITS.ANONYMOUS, async (req) => {

  try {
    // ✅ Safe JSON parsing — prevents crash on empty/invalid body
    let body: any = {};
    try {
      body = await req.json();
    } catch (_parseErr) {
      console.warn('⚠️ geocode-proxy: empty or invalid request body, using defaults');
      return new Response(JSON.stringify({ 
        status: 'INVALID_REQUEST', 
        results: [], 
        error: 'Request body is empty or invalid JSON' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // ✅ Handle health check requests
    if (body.health_check === true) {
      return new Response(JSON.stringify({ status: 'ok', service: 'geocode-proxy' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const { query, region = 'cd', language = 'fr' } = body;
    
    if (!query) {
      return new Response(JSON.stringify({ error: 'Query is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const googleApiKey = Deno.env.get('GOOGLE_MAPS_SERVER_KEY') || Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!googleApiKey) {
      console.log('Google Maps API key not configured, returning fallback data');
      // Retourner des données de fallback pour Kinshasa
      const fallbackResult = {
        place_id: 'fallback_' + Date.now(),
        name: query.includes(',') ? query.split(',')[0] : 'Kinshasa',
        formatted_address: query.includes('Kinshasa') ? query : `${query}, Kinshasa, République Démocratique du Congo`,
        address_components: [],
        geometry: {
          location: {
            lat: -4.3217 + (Math.random() - 0.5) * 0.02,
            lng: 15.3069 + (Math.random() - 0.5) * 0.02
          }
        },
        types: ['locality', 'political'],
        rating: null
      };
      
      return new Response(JSON.stringify({
        status: 'OK',
        results: [fallbackResult]
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`🔍 Geocoding avec Google API: ${query} | Region: ${region} | Language: ${language}`);

    // Construire l'URL de l'API Google Geocoding
    const googleUrl = new URL('https://maps.googleapis.com/maps/api/geocode/json');
    
    // 🔧 Détecter si c'est un géocodage inverse (coordonnées → adresse)
    const isCoordinates = /^-?\d+\.?\d*\s*,\s*-?\d+\.?\d*$/.test(query.trim());
    
    if (isCoordinates) {
      console.log('🔄 Géocodage inverse détecté pour:', query);
      googleUrl.searchParams.set('latlng', query.trim());
      googleUrl.searchParams.set('result_type', 'street_address|route|neighborhood|sublocality|locality');
    } else {
      googleUrl.searchParams.set('address', query);
    }
    
    googleUrl.searchParams.set('key', googleApiKey);
    googleUrl.searchParams.set('region', region);
    googleUrl.searchParams.set('language', language);

    // Si région CD ou CI, limiter aux résultats locaux
    if (region === 'cd') {
      googleUrl.searchParams.set('location', '-4.3217,15.3069'); // Kinshasa
      googleUrl.searchParams.set('radius', '100000'); // 100km
    } else if (region === 'ci') {
      googleUrl.searchParams.set('location', '5.3600,-4.0083'); // Abidjan
      googleUrl.searchParams.set('radius', '100000'); // 100km
    }

    const response = await fetch(googleUrl.toString());
    
    // Safe JSON parsing - handle empty or truncated responses
    const responseText = await response.text();
    let data: any;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ Failed to parse Google API response:', parseError);
      console.error('Response status:', response.status, '| Body length:', responseText.length);
      console.error('Body preview:', responseText.substring(0, 200));
      
      // Return fallback for coordinates
      if (isCoordinates) {
        const [latStr, lngStr] = query.trim().split(',').map((s: string) => s.trim());
        return new Response(JSON.stringify({
          status: 'OK',
          source: 'parse_error_fallback',
          results: [{
            place_id: `fallback_${Date.now()}`,
            name: 'Position GPS',
            formatted_address: `${latStr}, ${lngStr}`,
            address_components: [],
            geometry: { location: { lat: parseFloat(latStr), lng: parseFloat(lngStr) } },
            types: ['locality'],
            rating: null
          }]
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      return new Response(JSON.stringify({
        status: 'PARSE_ERROR',
        results: [],
        error: 'Failed to parse geocoding response'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`📍 Google API response status: ${data.status}`);
    console.log(`📊 Results found: ${data.results?.length || 0}`);

    if (data.status === 'OK') {
      // Fonction pour détecter les Plus Codes
      const isPlusCode = (address: string): boolean => {
        return /[A-Z0-9]{4,}\+[A-Z0-9]{2,}/.test(address);
      };

      // Fonction pour construire une adresse lisible depuis address_components
      const buildReadableAddress = (components: any[]): string => {
        const parts: any = {
          street: '',
          neighborhood: '',
          commune: '',
          city: '',
          country: ''
        };

        components.forEach((comp: any) => {
          if (comp.types.includes('route') || comp.types.includes('street_address')) {
            parts.street = comp.long_name;
          }
          if (comp.types.includes('neighborhood') || comp.types.includes('sublocality')) {
            parts.neighborhood = comp.long_name;
          }
          if (comp.types.includes('administrative_area_level_2')) {
            parts.commune = comp.long_name;
          }
          if (comp.types.includes('locality') || comp.types.includes('administrative_area_level_1')) {
            if (!parts.city) parts.city = comp.long_name;
          }
          if (comp.types.includes('country')) {
            parts.country = comp.long_name;
          }
        });

        const addressParts = [
          parts.street,
          parts.neighborhood,
          parts.commune || parts.city,
          parts.country
        ].filter(Boolean);

        return addressParts.join(', ') || '';
      };

      // Filtrer et formater les résultats
      const formattedResults = data.results.slice(0, 10).map((place: any) => {
        let finalAddress = place.formatted_address || '';

        // Si l'adresse contient un Plus Code, reconstruire manuellement
        if (isPlusCode(finalAddress)) {
          console.log('⚠️ Plus Code détecté:', finalAddress);
          
          if (place.address_components && place.address_components.length > 0) {
            const builtAddress = buildReadableAddress(place.address_components);
            if (builtAddress) {
              finalAddress = builtAddress;
              console.log('✅ Adresse reconstruite:', finalAddress);
            }
          }
        }

        return {
          place_id: place.place_id,
          name: finalAddress.split(',')[0], // Premier segment comme nom
          formatted_address: finalAddress,
          address_components: place.address_components || [],
          geometry: {
            location: {
              lat: place.geometry.location.lat,
              lng: place.geometry.location.lng
            }
          },
          types: place.types,
          rating: null
        };
      });

      return new Response(JSON.stringify({
        status: 'OK',
        results: formattedResults
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      // 🔧 Fallback intelligent pour géocodage inverse quand Google échoue
      if (isCoordinates && (data.status === 'REQUEST_DENIED' || data.status === 'ZERO_RESULTS' || !data.results?.length)) {
        console.log('⚠️ Google geocoding failed, using city detection fallback');
        const [latStr, lngStr] = query.trim().split(',').map((s: string) => s.trim());
        const lat = parseFloat(latStr);
        const lng = parseFloat(lngStr);

        // Détection de ville par bounds
        const cities = [
          { name: 'Abidjan', country: "Côte d'Ivoire", latMin: 5.1, latMax: 5.6, lngMin: -4.3, lngMax: -3.7, communes: [
            { name: 'Cocody', latMin: 5.32, latMax: 5.40, lngMin: -4.02, lngMax: -3.92 },
            { name: 'Plateau', latMin: 5.31, latMax: 5.33, lngMin: -4.03, lngMax: -3.99 },
            { name: 'Yopougon', latMin: 5.31, latMax: 5.40, lngMin: -4.12, lngMax: -4.03 },
            { name: 'Marcory', latMin: 5.29, latMax: 5.32, lngMin: -4.02, lngMax: -3.97 },
            { name: 'Treichville', latMin: 5.29, latMax: 5.31, lngMin: -4.02, lngMax: -3.98 },
            { name: 'Adjamé', latMin: 5.34, latMax: 5.37, lngMin: -4.04, lngMax: -3.99 },
            { name: 'Abobo', latMin: 5.38, latMax: 5.46, lngMin: -4.07, lngMax: -3.97 },
            { name: 'Koumassi', latMin: 5.28, latMax: 5.31, lngMin: -3.97, lngMax: -3.93 },
            { name: 'Port-Bouët', latMin: 5.24, latMax: 5.29, lngMin: -4.02, lngMax: -3.90 },
          ]},
          { name: 'Kinshasa', country: 'République Démocratique du Congo', latMin: -4.5, latMax: -4.2, lngMin: 15.1, lngMax: 15.5, communes: [
            { name: 'Gombe', latMin: -4.32, latMax: -4.29, lngMin: 15.28, lngMax: 15.32 },
            { name: 'Lemba', latMin: -4.38, latMax: -4.34, lngMin: 15.30, lngMax: 15.35 },
            { name: 'Limete', latMin: -4.35, latMax: -4.31, lngMin: 15.32, lngMax: 15.38 },
            { name: 'Ngaliema', latMin: -4.34, latMax: -4.28, lngMin: 15.22, lngMax: 15.28 },
            { name: 'Kintambo', latMin: -4.33, latMax: -4.30, lngMin: 15.27, lngMax: 15.30 },
            { name: 'Barumbu', latMin: -4.31, latMax: -4.29, lngMin: 15.30, lngMax: 15.33 },
          ]},
          { name: 'Lubumbashi', country: 'République Démocratique du Congo', latMin: -11.9, latMax: -11.5, lngMin: 27.3, lngMax: 27.7, communes: [] },
          { name: 'Kolwezi', country: 'République Démocratique du Congo', latMin: -10.9, latMax: -10.5, lngMin: 25.2, lngMax: 25.7, communes: [] },
        ];

        let cityName = 'Position GPS';
        let communeName = '';
        let countryName = '';

        for (const city of cities) {
          if (lat >= city.latMin && lat <= city.latMax && lng >= city.lngMin && lng <= city.lngMax) {
            cityName = city.name;
            countryName = city.country;
            // Chercher la commune
            for (const commune of city.communes) {
              if (lat >= commune.latMin && lat <= commune.latMax && lng >= commune.lngMin && lng <= commune.lngMax) {
                communeName = commune.name;
                break;
              }
            }
            break;
          }
        }

        const fallbackAddress = communeName 
          ? `${communeName}, ${cityName}, ${countryName}`
          : `${cityName}, ${countryName}`;

        console.log(`✅ Fallback address: ${fallbackAddress}`);

        return new Response(JSON.stringify({
          status: 'OK',
          source: 'fallback',
          results: [{
            place_id: `fallback_${Date.now()}`,
            name: communeName || cityName,
            formatted_address: fallbackAddress,
            address_components: [],
            geometry: { location: { lat, lng } },
            types: ['locality'],
            rating: null
          }]
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({
        status: data.status,
        results: [],
        error: data.error_message || 'No results found'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error: unknown) {
    console.error('Geocode proxy error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  }); // withRateLimit
});