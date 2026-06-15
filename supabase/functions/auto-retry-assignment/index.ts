// Version: 2025-11-07T10:00:00Z - Deployment forced
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * 🔄 AUTO-RETRY ASSIGNMENT SYSTEM
 * Réassigne automatiquement les courses/livraisons bloquées
 * Exécuté toutes les 60 secondes via Supabase Cron
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⏰ Timestamp:', new Date().toISOString());
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔄 AUTO-RETRY ASSIGNMENT SYSTEM');

    // === TRANSPORT BOOKINGS ===
    const { data: stalledRides, error: ridesError } = await supabase
      .from('transport_bookings')
      .select('id, pickup_coordinates, vehicle_type, driver_id, driver_assigned_at')
      .eq('status', 'driver_assigned')
      .is('driver_arrived_at', null)
      .lt('driver_assigned_at', new Date(Date.now() - 5 * 60 * 1000).toISOString());

    if (ridesError) {
      console.error('❌ Error fetching stalled rides:', ridesError);
    } else if (stalledRides && stalledRides.length > 0) {
      console.log(`🚗 Found ${stalledRides.length} stalled transport bookings`);

      for (const ride of stalledRides) {
        console.log(`📍 Retrying booking ${ride.id}`);

        // Réinitialiser le statut (libère le driver_id de la course orpheline)
        await supabase
          .from('transport_bookings')
          .update({
            status: 'pending',
            driver_id: null,
            driver_assigned_at: null,
            retry_count: supabase.rpc('increment', { x: 1, amount: 1 }),
            updated_at: new Date().toISOString()
          })
          .eq('id', ride.id);

        // Réinvoquer le dispatcher avec rayon élargi
        try {
          const coords = ride.pickup_coordinates as any;
          await supabase.functions.invoke('ride-dispatcher', {
            body: {
              bookingId: ride.id,
              pickupLat: coords.lat,
              pickupLng: coords.lng,
              serviceType: 'taxi',
              vehicleClass: ride.vehicle_type,
              priority: 'high'
            }
          });
          console.log(`✅ Dispatcher reinvoked for ${ride.id}`);
        } catch (error: unknown) {
          console.error(`❌ Failed to reinvoke dispatcher for ${ride.id}:`, error);
        }
      }
    } else {
      console.log('✅ No stalled transport bookings');
    }

    // === DELIVERY ORDERS ===
    const { data: stalledDeliveries, error: deliveriesError } = await supabase
      .from('delivery_orders')
      .select('id, pickup_coordinates, delivery_type, driver_id, driver_assigned_at')
      .eq('status', 'driver_assigned')
      .is('pickup_time', null)
      .lt('driver_assigned_at', new Date(Date.now() - 5 * 60 * 1000).toISOString());

    if (deliveriesError) {
      console.error('❌ Error fetching stalled deliveries:', deliveriesError);
    } else if (stalledDeliveries && stalledDeliveries.length > 0) {
      console.log(`📦 Found ${stalledDeliveries.length} stalled delivery orders`);

      for (const delivery of stalledDeliveries) {
        console.log(`📍 Retrying delivery ${delivery.id}`);

        // Réinitialiser le statut (libère le driver_id de la course orpheline)
        await supabase
          .from('delivery_orders')
          .update({
            status: 'pending',
            driver_id: null,
            driver_assigned_at: null,
            retry_count: supabase.rpc('increment', { x: 1, amount: 1 }),
            updated_at: new Date().toISOString()
          })
          .eq('id', delivery.id);

        // Réinvoquer le dispatcher avec rayon élargi
        try {
          const coords = delivery.pickup_coordinates as any;
          await supabase.functions.invoke('delivery-dispatcher', {
            body: {
              orderId: delivery.id,
              pickupLat: coords.lat,
              pickupLng: coords.lng,
              serviceType: 'delivery',
              deliveryType: delivery.delivery_type,
              priority: 'high'
            }
          });
          console.log(`✅ Dispatcher reinvoked for delivery ${delivery.id}`);
        } catch (error: unknown) {
          console.error(`❌ Failed to reinvoke dispatcher for ${delivery.id}:`, error);
        }
      }
    } else {
      console.log('✅ No stalled delivery orders');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    return new Response(
      JSON.stringify({
        success: true,
        retriedRides: stalledRides?.length || 0,
        retriedDeliveries: stalledDeliveries?.length || 0,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('❌ Auto-retry error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
