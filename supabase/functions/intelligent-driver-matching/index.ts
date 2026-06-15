import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-health-check',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

interface MatchingRequest {
  pickup_latitude: number;
  pickup_longitude: number;
  destination_latitude?: number;
  destination_longitude?: number;
  vehicle_class?: string;
  city: string;
  priority?: 'normal' | 'high' | 'urgent';
}

interface DriverMatch {
  driver_id: string;
  full_name: string;
  rating: number;
  vehicle_type: string;
  vehicle_model: string;
  distance_km: number;
  score: number;
  latitude: number;
  longitude: number;
  phone_number: string;
}

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function calculateDriverScore(distance: number, rating: number, tripCount: number): number {
  const distanceScore = Math.max(0, 100 - (distance * 10));
  const ratingScore = rating * 20;
  const experienceScore = Math.min(tripCount * 2, 20);
  return distanceScore + ratingScore + experienceScore;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const request: MatchingRequest = await req.json();
    const { pickup_latitude, pickup_longitude, city, vehicle_class, priority = 'normal' } = request;

    let searchRadius = priority === 'urgent' ? 25 : priority === 'high' ? 15 : 10;
    let minRating = priority === 'urgent' ? 3.0 : priority === 'high' ? 4.0 : 4.5;

    // ✅ MODE TEST: Augmenter la fenêtre de temps pour les tests
    const testMode = Deno.env.get('ENVIRONMENT') === 'test' || 
                     Deno.env.get('ENABLE_TEST_MODE') === 'true' ||
                     true; // Activer par défaut pour développement

    const pingWindowMinutes = testMode ? 60 : 10; // 60 min en test, 10 min en prod
    const pingThreshold = new Date(Date.now() - pingWindowMinutes * 60 * 1000).toISOString();

    console.log(`🔍 Mode: ${testMode ? 'TEST' : 'PRODUCTION'}, Fenêtre last_ping: ${pingWindowMinutes} minutes`);

    // ✅ CORRECTION: Utiliser chauffeurs table qui existe
    const { data: drivers, error } = await supabase
      .from('driver_locations')
      .select(`
        driver_id,
        latitude,
        longitude,
        is_online,
        is_available,
        last_ping
      `)
      .eq('is_online', true)
      .eq('is_available', true)
      .gte('last_ping', pingThreshold);

    if (error) {
      console.error('❌ Database query error:', error);
      throw error;
    }

    console.log(`📊 Found ${drivers?.length || 0} online drivers`);
    console.log(`🚗 Filtering by vehicle_class: ${vehicle_class || 'ALL'}`);

    // Récupérer les infos des chauffeurs depuis la table chauffeurs
    const driverIds = (drivers || []).map(d => d.driver_id);
    
    const { data: driverProfiles, error: profilesError } = await supabase
      .from('chauffeurs')
      .select('id, display_name, rating_average, vehicle_type, vehicle_model, phone_number, total_rides')
      .in('id', driverIds);

    if (profilesError) {
      console.error('❌ Error fetching driver profiles:', profilesError);
      // Continue même sans profils
    }

    // Créer un map des profils pour accès rapide
    const profilesMap = new Map(
      (driverProfiles || []).map(p => [p.id, p])
    );

    if (error) {
      console.error('Database query error:', error);
      throw error;
    }

    const matches: DriverMatch[] = [];

    for (const driver of drivers || []) {
      const profile = profilesMap.get(driver.driver_id);
      
      // Skip si pas de profil trouvé
      if (!profile) {
        console.warn(`⚠️ No profile found for driver ${driver.driver_id}`);
        continue;
      }

      // ✅ Filtrer par vehicle_class si spécifié
      if (vehicle_class && profile.vehicle_type !== vehicle_class) {
        console.log(`⏭️ Skipping driver ${profile.display_name}: vehicle_type ${profile.vehicle_type} !== ${vehicle_class}`);
        continue;
      }

      const distance = calculateDistance(
        pickup_latitude,
        pickup_longitude,
        driver.latitude,
        driver.longitude
      );

      const rating = profile.rating_average || 4.0;

      if (distance <= searchRadius && rating >= minRating) {
        const score = calculateDriverScore(
          distance,
          rating,
          profile.total_rides || 0
        );

        matches.push({
          driver_id: driver.driver_id,
          full_name: profile.display_name || 'Chauffeur',
          rating: rating,
          vehicle_type: profile.vehicle_type || 'unknown',
          vehicle_model: profile.vehicle_model || 'N/A',
          distance_km: parseFloat(distance.toFixed(2)),
          score: parseFloat(score.toFixed(2)),
          latitude: driver.latitude,
          longitude: driver.longitude,
          phone_number: profile.phone_number || ''
        });
      }
    }

    matches.sort((a, b) => b.score - a.score);
    const topMatches = matches.slice(0, 10);

    return new Response(JSON.stringify({
      success: true,
      matches: topMatches,
      search_params: {
        city,
        radius_km: searchRadius,
        min_rating: minRating,
        priority
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Driver matching error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});