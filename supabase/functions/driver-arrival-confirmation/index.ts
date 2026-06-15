import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-health-check',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

interface ArrivalRequest {
  booking_id: string;
  driver_id: string;
  driver_location: {
    lat: number;
    lng: number;
  };
}

// Calculate distance using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Non authentifié');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Non authentifié');
    }

    const { booking_id, driver_id, driver_location } = await req.json() as ArrivalRequest;

    console.log(`📍 [${booking_id}] Driver ${driver_id} confirming arrival at ${driver_location.lat},${driver_location.lng}`);

    // Verify driver is the assigned one
    if (user.id !== driver_id) {
      throw new Error('Vous n\'êtes pas assigné à cette course');
    }

    // Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from('transport_bookings')
      .select('*, driver_subscriptions!inner(rides_remaining, rides_used, id)')
      .eq('id', booking_id)
      .eq('driver_id', driver_id)
      .single();

    if (bookingError || !booking) {
      console.error('❌ Booking not found:', bookingError);
      throw new Error('Course introuvable');
    }

    // Verify booking status
    if (booking.status !== 'driver_assigned') {
      throw new Error(`Statut invalide: ${booking.status}`);
    }

    // Check minimum delay (2 minutes after acceptance)
    const assignedAt = new Date(booking.driver_assigned_at);
    const now = new Date();
    const minutesElapsed = (now.getTime() - assignedAt.getTime()) / 1000 / 60;

    if (minutesElapsed < 2) {
      const remainingSeconds = Math.ceil((2 - minutesElapsed) * 60);
      console.warn(`⏰ [${booking_id}] Too early: ${minutesElapsed.toFixed(1)} minutes`);
      throw new Error(`Veuillez attendre encore ${remainingSeconds} secondes avant de confirmer l'arrivée`);
    }

    // Parse pickup coordinates
    let pickupLat: number, pickupLng: number;
    
    if (typeof booking.pickup_location === 'string') {
      try {
        const parsed = JSON.parse(booking.pickup_location);
        pickupLat = parsed.lat;
        pickupLng = parsed.lng;
      } catch {
        throw new Error('Coordonnées pickup invalides (string)');
      }
    } else if (booking.pickup_location && typeof booking.pickup_location === 'object') {
      pickupLat = (booking.pickup_location as any).lat;
      pickupLng = (booking.pickup_location as any).lng;
    } else {
      throw new Error('Coordonnées pickup manquantes');
    }

    // Calculate distance to pickup
    const distanceMeters = calculateDistance(
      driver_location.lat,
      driver_location.lng,
      pickupLat,
      pickupLng
    ) * 1000;

    console.log(`📏 [${booking_id}] Distance to pickup: ${distanceMeters.toFixed(0)}m`);

    // Verify distance (must be <= 100m)
    const MAX_DISTANCE = 100; // meters
    if (distanceMeters > MAX_DISTANCE) {
      throw new Error(`Vous êtes trop loin (${distanceMeters.toFixed(0)}m). Rapprochez-vous du client (max ${MAX_DISTANCE}m).`);
    }

    // Check rides remaining
    const subscription = booking.driver_subscriptions;
    if (!subscription || subscription.rides_remaining <= 0) {
      throw new Error('Aucune course restante dans votre abonnement');
    }

    console.log(`💳 [${booking_id}] Rides before: ${subscription.rides_remaining}`);

    // Consume ride by calling the existing function
    const { data: consumeResult, error: consumeError } = await supabase.functions.invoke('consume-ride', {
      body: {
        driver_id,
        booking_id,
        service_type: 'transport'
      }
    });

    if (consumeError) {
      console.error('❌ Error consuming ride:', consumeError);
      throw new Error('Erreur lors du décompte de la course');
    }

    const ridesRemaining = consumeResult?.rides_remaining || (subscription.rides_remaining - 1);
    console.log(`✅ [${booking_id}] Credit consumed. Rides remaining: ${ridesRemaining}`);

    // Update booking status to driver_arrived
    const { error: updateError } = await supabase
      .from('transport_bookings')
      .update({
        status: 'driver_arrived',
        driver_arrived_at: now.toISOString(),
        updated_at: now.toISOString()
      })
      .eq('id', booking_id);

    if (updateError) {
      console.error('❌ Error updating booking:', updateError);
      throw new Error('Erreur lors de la mise à jour');
    }

    // Create audit log
    await supabase.from('activity_logs').insert({
      activity_type: 'driver_arrival_confirmed',
      description: `Driver ${driver_id} arrived at booking ${booking_id}`,
      metadata: {
        booking_id,
        driver_id,
        distance_to_pickup: distanceMeters,
        driver_location,
        pickup_location: { lat: pickupLat, lng: pickupLng },
        rides_before: subscription.rides_remaining,
        rides_after: ridesRemaining,
        minutes_after_acceptance: minutesElapsed
      }
    });

    // Notify client
    await supabase.from('push_notifications').insert({
      user_id: booking.user_id,
      title: 'Votre chauffeur est arrivé',
      message: 'Votre chauffeur vous attend au point de rendez-vous',
      notification_type: 'driver_arrival',
      transport_booking_id: booking_id,
      metadata: {
        driver_id,
        distance: distanceMeters,
        booking_id
      }
    });

    // Send low credit warning if needed
    if (ridesRemaining <= 5 && ridesRemaining > 0) {
      await supabase.from('push_notifications').insert({
        user_id: driver_id,
        title: '⚠️ Crédits faibles',
        message: `Il vous reste ${ridesRemaining} courses. Pensez à renouveler votre abonnement.`,
        notification_type: 'subscription_warning',
        metadata: { rides_remaining: ridesRemaining }
      });
    }

    console.log(`✅ [${booking_id}] Arrival confirmed successfully`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Arrivée confirmée avec succès',
        rides_remaining: ridesRemaining,
        distance_to_pickup: distanceMeters,
        credit_consumed: true
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('❌ Arrival confirmation error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
