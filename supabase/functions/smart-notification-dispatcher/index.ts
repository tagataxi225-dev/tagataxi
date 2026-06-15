import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-health-check',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

interface NotificationRequest {
  booking_id: string;
  client_id: string;
  pickup_latitude: number;
  pickup_longitude: number;
  pickup_address: string;
  destination_address?: string;
  vehicle_type: string;
  estimated_price: number;
  city: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const notificationRequest: NotificationRequest = await req.json();
    const { booking_id, pickup_latitude, pickup_longitude, city, vehicle_type, estimated_price } = notificationRequest;

    console.log(`Dispatching notifications for booking ${booking_id} in ${city}`);

    // Call intelligent matching function
    const { data: matchingResult, error: matchingError } = await supabase.functions.invoke('intelligent-driver-matching', {
      body: {
        pickup_latitude,
        pickup_longitude,
        city,
        vehicle_class: vehicle_type,
        priority: 'normal'
      }
    });

    if (matchingError || !matchingResult?.matches) {
      console.error('Matching error:', matchingError);
      throw new Error('No drivers found');
    }

    const drivers = matchingResult.matches;
    console.log(`Found ${drivers.length} eligible drivers`);

    // Create priority waves
    const wave1 = drivers.slice(0, 3);
    const wave2 = drivers.slice(3, 6);
    const wave3 = drivers.slice(6);

    const notifications: any[] = [];
    const dispatchTime = new Date();

    // Wave 1: Immediate
    wave1.forEach((driver: any) => {
      notifications.push({
        driver_id: driver.driver_id,
        booking_id,
        notification_type: 'ride_request',
        message: `Nouvelle course disponible à ${notificationRequest.pickup_address}`,
        priority: 1,
        expires_at: new Date(dispatchTime.getTime() + 30 * 1000).toISOString(),
        booking_details: {
          pickup_address: notificationRequest.pickup_address,
          destination_address: notificationRequest.destination_address,
          estimated_price,
          distance_km: driver.distance_km,
          vehicle_type
        }
      });
    });

    // Wave 2: After 30 seconds
    wave2.forEach((driver: any) => {
      notifications.push({
        driver_id: driver.driver_id,
        booking_id,
        notification_type: 'ride_request',
        message: `Course disponible - ${notificationRequest.pickup_address}`,
        priority: 2,
        expires_at: new Date(dispatchTime.getTime() + 90 * 1000).toISOString(),
        booking_details: {
          pickup_address: notificationRequest.pickup_address,
          destination_address: notificationRequest.destination_address,
          estimated_price,
          distance_km: driver.distance_km,
          vehicle_type
        }
      });
    });

    // Wave 3: After 90 seconds
    wave3.forEach((driver: any) => {
      notifications.push({
        driver_id: driver.driver_id,
        booking_id,
        notification_type: 'ride_request',
        message: `Course urgente disponible`,
        priority: 3,
        expires_at: new Date(dispatchTime.getTime() + 180 * 1000).toISOString(),
        booking_details: {
          pickup_address: notificationRequest.pickup_address,
          destination_address: notificationRequest.destination_address,
          estimated_price,
          distance_km: driver.distance_km,
          vehicle_type
        }
      });
    });

    console.log(`Successfully dispatched ${notifications.length} notifications in 3 waves`);

    return new Response(JSON.stringify({
      success: true,
      message: `Notifications sent to ${notifications.length} drivers`,
      dispatch_summary: {
        wave_1: wave1.length,
        wave_2: wave2.length,
        wave_3: wave3.length,
        total: notifications.length
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Notification dispatch error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});