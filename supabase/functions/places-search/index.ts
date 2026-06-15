import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-health-check',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

interface PlacesSearchRequest {
  query: string;
  lat?: number;
  lng?: number;
  radius?: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
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

    const { query, lat, lng, radius = 50000 }: PlacesSearchRequest = await req.json();

    console.log(`🔍 Places search for: "${query}" ${lat && lng ? `near ${lat}, ${lng}` : ''}`);

    if (!query || query.trim().length < 2) {
      return new Response(
        JSON.stringify({ 
          error: 'Query too short',
          results: [],
          success: false 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Try Google Places API first if available
    const googleApiKey = Deno.env.get('GOOGLE_MAPS_SERVER_KEY') || Deno.env.get('GOOGLE_MAPS_API_KEY');
    
    if (googleApiKey) {
      try {
        let placesUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${googleApiKey}&language=fr`;
        
        // Add location bias if coordinates provided
        if (lat && lng) {
          placesUrl += `&location=${lat},${lng}&radius=${radius}`;
        }
        
        const googleResponse = await fetch(placesUrl);
        
        if (googleResponse.ok) {
          const googleData = await googleResponse.json();
          
          if (googleData.status === 'OK' && googleData.results.length > 0) {
            const results = googleData.results.slice(0, 8).map((place: any, index: number) => ({
              id: `google-${place.place_id || index}`,
              title: place.name,
              subtitle: place.formatted_address,
              address: place.formatted_address,
              lat: place.geometry.location.lat,
              lng: place.geometry.location.lng,
              type: 'geocoded',
              placeId: place.place_id,
              badge: place.rating ? `★ ${place.rating}` : null
            }));

            console.log(`✅ Google Places API found ${results.length} results`);
            
            return new Response(
              JSON.stringify({ 
                results,
                source: 'google_places',
                success: true 
              }),
              { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }
      } catch (error: unknown) {
        console.warn('⚠️ Google Places API failed:', error);
      }
    }

    // Fallback to geocoding search
    if (googleApiKey) {
      try {
        const geocodingUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${googleApiKey}&language=fr`;
        
        const geocodingResponse = await fetch(geocodingUrl);
        
        if (geocodingResponse.ok) {
          const geocodingData = await geocodingResponse.json();
          
          if (geocodingData.status === 'OK' && geocodingData.results.length > 0) {
            const results = geocodingData.results.slice(0, 5).map((result: any, index: number) => ({
              id: `geocoding-${result.place_id || index}`,
              title: result.formatted_address.split(',')[0],
              subtitle: result.formatted_address,
              address: result.formatted_address,
              lat: result.geometry.location.lat,
              lng: result.geometry.location.lng,
              type: 'geocoded',
              placeId: result.place_id,
              badge: 'Adresse'
            }));

            console.log(`✅ Google Geocoding found ${results.length} results`);
            
            return new Response(
              JSON.stringify({ 
                results,
                source: 'google_geocoding',
                success: true 
              }),
              { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }
      } catch (error: unknown) {
        console.warn('⚠️ Google Geocoding failed:', error);
      }
    }

    // Ultimate fallback - return generic suggestions
    const fallbackResults = [
      {
        id: 'search-1',
        title: query,
        subtitle: 'Rechercher cette adresse',
        address: query,
        lat: lat || 0,
        lng: lng || 0,
        type: 'default',
        badge: 'Recherche'
      }
    ];

    console.log(`📍 Fallback search result for: ${query}`);

    return new Response(
      JSON.stringify({ 
        results: fallbackResults,
        source: 'fallback',
        success: true 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('❌ Places search error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Search failed',
        results: [],
        success: false
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});