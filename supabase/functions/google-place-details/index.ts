import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-health-check, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

interface PlaceDetailsRequest {
  placeId: string;
  sessionToken?: string;
  fields?: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    // ✅ Handle health check requests
    if (body.health_check === true) {
      return new Response(
        JSON.stringify({ status: 'ok', service: 'google-place-details' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const apiKey = Deno.env.get('GOOGLE_MAPS_SERVER_KEY') || Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!apiKey) {
      console.error('❌ GOOGLE_MAPS_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { placeId, sessionToken, fields = ['geometry', 'formatted_address', 'name', 'types', 'place_id'] }: PlaceDetailsRequest = body;

    if (!placeId) {
      return new Response(
        JSON.stringify({ error: 'placeId required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
    url.searchParams.set('place_id', placeId);
    url.searchParams.set('key', apiKey);
    url.searchParams.set('fields', fields.join(','));
    url.searchParams.set('language', 'fr');
    
    if (sessionToken) {
      url.searchParams.set('sessiontoken', sessionToken);
    }

    console.log(`📍 Place details request: ${placeId} | Session: ${sessionToken ? 'yes' : 'no'}`);

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status !== 'OK') {
      console.error('❌ Google Place Details error:', data.status, data.error_message);
      return new Response(
        JSON.stringify({ error: `Google API: ${data.status}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const place = data.result;
    const geometry = place.geometry;
    
    const result = {
      id: place.place_id,
      placeId: place.place_id,
      name: place.name || place.formatted_address || '',
      address: place.formatted_address || '',
      coordinates: {
        lat: geometry?.location?.lat || 0,
        lng: geometry?.location?.lng || 0
      },
      types: place.types || [],
      geometry: {
        location: geometry?.location,
        viewport: geometry?.viewport
      },
      requestId: crypto.randomUUID()
    };

    console.log(`✅ Place details: ${result.name} at (${result.coordinates.lat}, ${result.coordinates.lng})`);

    return new Response(
      JSON.stringify({ 
        result,
        status: data.status
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('❌ Place details error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
