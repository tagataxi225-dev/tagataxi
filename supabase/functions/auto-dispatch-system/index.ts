import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DispatchRequest {
  booking_id?: string;
  order_id?: string;
  type: 'transport' | 'delivery';
  pickup_lat: number;
  pickup_lng: number;
  city?: string;
  priority?: 'normal' | 'high' | 'urgent';
  delivery_type?: string;
  service_type?: string;
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

function calculateDriverScore(distance: number, rating: number, totalTrips: number, priority: string = 'normal'): number {
  const distanceScore = Math.max(0, 100 - (distance * 8));
  const ratingScore = rating * 20;
  const experienceScore = Math.min(totalTrips * 1.5, 25);
  
  let priorityBonus = 0;
  if (priority === 'urgent') priorityBonus = 15;
  else if (priority === 'high') priorityBonus = 10;
  
  return distanceScore + ratingScore + experienceScore + priorityBonus;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const request: DispatchRequest = await req.json();
    const { 
      booking_id, 
      order_id, 
      type, 
      pickup_lat, 
      pickup_lng, 
      city = 'Kinshasa', 
      priority = 'normal',
      delivery_type,
      service_type 
    } = request;

    console.log(`🚀 Auto-dispatch ${type} request:`, { booking_id, order_id, city, priority });

    // Rechercher les chauffeurs disponibles
    const searchRadius = priority === 'urgent' ? 25 : priority === 'high' ? 15 : 10;
    const minRating = priority === 'urgent' ? 3.0 : 4.0;

    const { data: drivers, error: driversError } = await supabase
      .from('driver_locations')
      .select(`
        driver_id,
        latitude,
        longitude,
        is_online,
        is_available,
        last_ping,
        chauffeurs!inner(
          rating_average,
          total_rides,
          verification_status,
          is_active,
          service_type,
          vehicle_class
        )
      `)
      .eq('is_online', true)
      .eq('is_available', true)
      .gte('last_ping', new Date(Date.now() - 10 * 60 * 1000).toISOString());

    if (driversError) {
      console.error('❌ Erreur recherche chauffeurs:', driversError);
      throw driversError;
    }

    if (!drivers || drivers.length === 0) {
      console.log('⚠️ Aucun chauffeur disponible trouvé');
      
      // Fallback: créer une notification d'urgence pour les admins
      await supabase.from('admin_notifications').insert({
        type: 'dispatch_failure',
        title: 'Aucun chauffeur disponible',
        message: `Commande ${type} non assignée - ID: ${booking_id || order_id}`,
        severity: 'warning',
        data: { booking_id, order_id, type, city, priority }
      });

      return new Response(JSON.stringify({
        success: false,
        error: 'No available drivers found',
        fallback_notification_sent: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Calculer les scores et distances
    const matches = [];
    for (const driver of drivers) {
      const distance = calculateDistance(
        pickup_lat,
        pickup_lng,
        driver.latitude,
        driver.longitude
      );

      if (distance <= searchRadius) {
        const chauffeur = driver.chauffeurs as any;
        if (chauffeur?.rating_average >= minRating && chauffeur?.is_active) {
          const score = calculateDriverScore(
            distance,
            chauffeur.rating_average || 4.0,
            chauffeur.total_rides || 0,
            priority
          );

          matches.push({
            driver_id: driver.driver_id,
            distance_km: parseFloat(distance.toFixed(2)),
            score: parseFloat(score.toFixed(2)),
            rating: chauffeur.rating_average,
            total_trips: chauffeur.total_rides
          });
        }
      }
    }

    if (matches.length === 0) {
      console.log('⚠️ Aucun chauffeur éligible dans le rayon');
      return new Response(JSON.stringify({
        success: false,
        error: 'No eligible drivers in radius',
        search_radius: searchRadius,
        drivers_found: drivers.length
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Sélectionner le meilleur chauffeur
    matches.sort((a, b) => b.score - a.score);
    const bestDriver = matches[0];

    console.log(`✅ Meilleur chauffeur sélectionné:`, bestDriver);

    // Assigner le chauffeur selon le type de commande
    let updateResult;
    
    if (type === 'transport') {
      const { error: updateError } = await supabase
        .from('transport_bookings')
        .update({
          driver_id: bestDriver.driver_id,
          status: 'driver_assigned',
          driver_assigned_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', booking_id);

      if (updateError) throw updateError;
      updateResult = { table: 'transport_bookings', id: booking_id };
    } else {
      const { error: updateError } = await supabase
        .from('delivery_orders')
        .update({
          driver_id: bestDriver.driver_id,
          status: 'driver_assigned',
          driver_assigned_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', order_id);

      if (updateError) throw updateError;
      updateResult = { table: 'delivery_orders', id: order_id };
    }

    // Marquer le chauffeur comme occupé
    await supabase
      .from('driver_locations')
      .update({
        is_available: false,
        updated_at: new Date().toISOString()
      })
      .eq('driver_id', bestDriver.driver_id);

    // Créer une notification pour le chauffeur
    await supabase.from('delivery_notifications').insert({
      user_id: bestDriver.driver_id,
      title: type === 'transport' ? 'Nouvelle course assignée' : 'Nouvelle livraison assignée',
      message: `Une ${type === 'transport' ? 'course' : 'livraison'} vous a été assignée. Consultez l'application pour plus de détails.`,
      notification_type: 'assignment',
      delivery_order_id: type === 'delivery' ? order_id : null,
      metadata: {
        booking_id: type === 'transport' ? booking_id : null,
        order_id: type === 'delivery' ? order_id : null,
        priority,
        assignment_score: bestDriver.score
      }
    });

    // Logger l'activité
    await supabase.from('activity_logs').insert({
      user_id: bestDriver.driver_id,
      activity_type: 'order_assignment',
      description: `${type} order auto-assigned`,
      metadata: {
        [type === 'transport' ? 'booking_id' : 'order_id']: booking_id || order_id,
        distance_km: bestDriver.distance_km,
        score: bestDriver.score,
        priority,
        assignment_method: 'auto_dispatch'
      }
    });

    console.log(`🎯 Assignation réussie: ${type} ${booking_id || order_id} → Chauffeur ${bestDriver.driver_id}`);

    return new Response(JSON.stringify({
      success: true,
      assigned_driver: {
        driver_id: bestDriver.driver_id,
        distance_km: bestDriver.distance_km,
        score: bestDriver.score,
        rating: bestDriver.rating
      },
      assignment_details: updateResult,
      search_params: {
        radius_km: searchRadius,
        min_rating: minRating,
        drivers_evaluated: matches.length,
        priority
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('❌ Erreur dispatch système:', error);
    return new Response(JSON.stringify({ 
      error: 'Auto-dispatch system error',
      details: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});