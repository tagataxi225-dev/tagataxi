/**
 * 🚚 Edge Function: Notification aux Livreurs Proches
 * Recherche en cascade + Notification push + Logging
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-health-check',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { orderId, pickupLat, pickupLng, deliveryType, radius = 20 } = await req.json();

    console.log('🔍 Searching for drivers:', {
      orderId,
      pickupLat,
      pickupLng,
      deliveryType,
      radius
    });

    // Recherche en cascade: 5km → 10km → 15km → 20km
    const radii = [2, 4, 7, 10, 15, 20].filter(r => r <= Math.max(radius, 20));
    let nearbyDrivers: any[] = [];
    let searchRadius = 0;

    for (const r of radii) {
      const { data, error } = await supabase.rpc('find_nearby_drivers_secure', {
        user_lat: pickupLat,
        user_lng: pickupLng,
        max_distance_km: r,
        vehicle_class_filter: deliveryType === 'maxicharge' ? 'maxicharge' : 'standard'
      });

      if (error) {
        console.error(`Error searching drivers at ${r}km:`, error);
        continue;
      }

      if (data && data.length > 0) {
        nearbyDrivers = data;
        searchRadius = r;
        console.log(`✅ Found ${data.length} drivers at ${r}km`);
        break;
      }

      console.log(`⚪ No drivers found at ${r}km, expanding search...`);
    }

    if (nearbyDrivers.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Aucun livreur disponible',
          notifiedDrivers: 0,
          radius: searchRadius
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Récupérer les détails de la commande
    const { data: orderData, error: orderError } = await supabase
      .from('delivery_orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError) {
      throw new Error('Order not found');
    }

    // Créer des alertes pour tous les livreurs disponibles
    const alerts = nearbyDrivers.map(driver => ({
      order_id: orderId,
      driver_id: driver.driver_id,
      alert_type: 'new_delivery_request',
      distance_km: driver.distance_km,
      response_status: 'sent',
      sent_at: new Date().toISOString(),
      order_details: {
        pickup_location: orderData.pickup_location,
        delivery_location: orderData.delivery_location,
        estimated_price: orderData.estimated_price,
        delivery_type: orderData.delivery_type
      }
    }));

    const { error: alertError } = await supabase
      .from('delivery_driver_alerts')
      .insert(alerts);

    if (alertError) {
      console.error('Error creating alerts:', alertError);
      throw alertError;
    }

    console.log(`📬 Sent alerts to ${alerts.length} drivers`);

    // Logger l'activité
    await supabase.from('activity_logs').insert({
      user_id: orderData.user_id,
      activity_type: 'driver_notification',
      description: `Notification envoyée à ${alerts.length} livreurs`,
      metadata: {
        order_id: orderId,
        drivers_notified: alerts.length,
        search_radius: searchRadius,
        delivery_type: deliveryType
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        notifiedDrivers: alerts.length,
        radius: searchRadius,
        drivers: nearbyDrivers.map(d => ({
          id: d.driver_id,
          distance_km: d.distance_km
        }))
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in notify-nearby-drivers:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: (error as any).message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
