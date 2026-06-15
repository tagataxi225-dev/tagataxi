import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-health-check, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

interface AutocompleteRequest {
  input: string;
  lat?: number;
  lng?: number;
  radius?: number;
  types?: string[];
  language?: string;
  sessionToken?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('GOOGLE_MAPS_SERVER_KEY') || Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!apiKey) {
      console.error('❌ GOOGLE_MAPS_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'API key not configured', predictions: [] }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { input, lat, lng, radius = 50000, types = [], language = 'fr', sessionToken, countries } = await req.json() as AutocompleteRequest & { countries?: string[] };

    if (!input || input.trim().length < 2) {
      return new Response(
        JSON.stringify({ predictions: [], status: 'ZERO_RESULTS' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json');
    url.searchParams.set('input', input.trim());
    url.searchParams.set('key', apiKey);
    url.searchParams.set('language', language);
    
    if (sessionToken) {
      url.searchParams.set('sessiontoken', sessionToken);
    }

    // Location bias pour résultats contextuels
    if (lat && lng) {
      url.searchParams.set('location', `${lat},${lng}`);
      url.searchParams.set('radius', radius.toString());
    }

    // Filtres de types
    if (types.length > 0) {
      url.searchParams.set('types', types.join('|'));
    }

    // Dynamic country restriction
    const countryList = countries && countries.length > 0 
      ? countries.map((c: string) => `country:${c.toLowerCase()}`).join('|')
      : 'country:cd|country:ci';
    url.searchParams.set('components', countryList);

    console.log(`🔍 Google Autocomplete: "${input}" | Location: ${lat},${lng} | Session: ${sessionToken ? 'yes' : 'no'}`);

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('❌ Google API error:', data.status, data.error_message);
      // Return 200 with error info so client can detect and fallback gracefully
      return new Response(
        JSON.stringify({ 
          error: `Google API: ${data.status}`, 
          predictions: [],
          status: data.status,
          shouldFallback: data.status === 'REQUEST_DENIED'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const predictions = (data.predictions || []).map((pred: any) => ({
      placeId: pred.place_id,
      description: pred.description,
      structuredFormatting: {
        mainText: pred.structured_formatting?.main_text || '',
        secondaryText: pred.structured_formatting?.secondary_text || ''
      },
      types: pred.types || [],
      matchedSubstrings: pred.matched_substrings || [],
      terms: pred.terms || []
    }));

    console.log(`✅ Found ${predictions.length} predictions for "${input}"`);

    return new Response(
      JSON.stringify({ 
        predictions,
        status: data.status,
        requestId: crypto.randomUUID()
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('❌ Autocomplete error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', predictions: [] }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
