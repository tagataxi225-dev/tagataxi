import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-health-check, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

interface GeocodeRequest {
  lat: number;
  lng: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { lat, lng }: GeocodeRequest = await req.json();
    console.log(`🌍 Reverse geocoding for ${lat}, ${lng}`);

    // === 1. Try Google Maps API ===
    const googleApiKey = Deno.env.get('GOOGLE_MAPS_SERVER_KEY') || Deno.env.get('GOOGLE_MAPS_API_KEY');
    
    if (googleApiKey) {
      try {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${googleApiKey}&language=fr&result_type=street_address|route|sublocality|neighborhood`;
        console.log(`🔑 Calling Google Maps reverse geocoding...`);
        
        const googleResponse = await fetch(url);
        const googleData = await googleResponse.json();
        
        console.log(`📡 Google status: ${googleData.status}, results: ${googleData.results?.length || 0}`);
        
        if (googleData.status === 'OK' && googleData.results?.length > 0) {
          const address = googleData.results[0].formatted_address;
          console.log(`✅ Google precise address: ${address}`);
          
          return new Response(
            JSON.stringify({ address, source: 'google', success: true }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        if (googleData.status !== 'OK') {
          console.warn(`⚠️ Google API error: ${googleData.status} - ${googleData.error_message || 'no details'}`);
        }
      } catch (error: unknown) {
        console.warn(`⚠️ Google geocoding fetch failed:`, (error as any).message);
      }
    } else {
      console.warn('⚠️ GOOGLE_MAPS_API_KEY not set');
    }

    // === 2. Try Nominatim (OpenStreetMap) - free, precise, no API key ===
    try {
      const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=fr`;
      console.log(`🗺️ Calling Nominatim...`);
      
      const nominatimResponse = await fetch(nominatimUrl, {
        headers: { 'User-Agent': 'KwendaApp/1.0' }
      });
      
      if (nominatimResponse.ok) {
        const nominatimData = await nominatimResponse.json();
        
        if (nominatimData.display_name) {
          // Build a clean address from components
          const addr = nominatimData.address || {};
          const parts: string[] = [];
          
          // Street level
          if (addr.road) parts.push(addr.road);
          if (addr.house_number && addr.road) parts[parts.length - 1] = `${addr.house_number} ${addr.road}`;
          
          // Neighborhood/suburb
          if (addr.neighbourhood) parts.push(addr.neighbourhood);
          else if (addr.suburb) parts.push(addr.suburb);
          
          // City district
          if (addr.city_district && addr.city_district !== addr.suburb) parts.push(addr.city_district);
          
          // City
          if (addr.city) parts.push(addr.city);
          else if (addr.town) parts.push(addr.town);
          else if (addr.village) parts.push(addr.village);
          
          // Country
          if (addr.country) parts.push(addr.country);
          
          const address = parts.length > 0 ? parts.join(', ') : nominatimData.display_name;
          console.log(`✅ Nominatim precise address: ${address}`);
          
          return new Response(
            JSON.stringify({ address, source: 'nominatim', success: true }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    } catch (error: unknown) {
      console.warn(`⚠️ Nominatim failed:`, (error as any).message);
    }

    // === 3. Generic fallback ===
    const address = `Position ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    console.log(`📍 Final fallback: ${address}`);

    return new Response(
      JSON.stringify({ address, source: 'fallback', success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('❌ Geocoding error:', error);
    return new Response(
      JSON.stringify({ error: 'Geocoding failed', address: 'Position inconnue', source: 'error', success: false }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
