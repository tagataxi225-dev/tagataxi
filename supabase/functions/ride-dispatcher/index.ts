// Version: 2026-03-11 - Stabilized dispatch with flexible eligibility
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { withRateLimit, RATE_LIMITS } from "../_shared/ratelimit.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-health-check, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

interface RideRequest {
  bookingId: string;
  pickupLat: number;
  pickupLng: number;
  serviceType: string;
  vehicleClass?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

function calculateDriverScore(driver: any, priority: string = 'normal'): number {
  const distanceScore = Math.max(0, 100 - (driver.distance_km * 10));
  const ratingScore = (driver.rating_average || 0) * 20;
  const experienceScore = Math.min(50, (driver.total_rides || 0) * 0.5);
  const verificationBonus = driver.is_verified ? 20 : 0;
  const ridesBonus = Math.min(15, (driver.rides_remaining || 0) * 1.5);
  const priorityMultiplier = priority === 'urgent' ? 1.3 : priority === 'high' ? 1.2 : 1.0;
  return (distanceScore + ratingScore + experienceScore + verificationBonus + ridesBonus) * priorityMultiplier;
}

/**
 * ✅ PHASE 2: Flexible driver eligibility
 * Priority: 1) Active subscription  2) Wallet balance  3) Verified + online (grace mode)
 */
function isDriverEligible(driver: any, estimatedCommission: number): { eligible: boolean; reason: string } {
  // 1. Active subscription with rides remaining
  if (driver.rides_remaining > 0) {
    return { eligible: true, reason: 'subscription' };
  }
  // 2. Sufficient wallet balance to cover commission
  const walletBalance = driver.wallet_balance || 0;
  if (walletBalance >= estimatedCommission && walletBalance >= 500) {
    return { eligible: true, reason: 'wallet' };
  }
  // 3. Grace mode: verified driver with decent wallet (> 50% of commission)
  // This prevents blocking ALL drivers when subscription system is not fully set up
  if (driver.is_verified && walletBalance >= Math.min(estimatedCommission * 0.5, 500)) {
    return { eligible: true, reason: 'grace_verified' };
  }
  // 4. Ultimate fallback: if driver is verified and online, allow with warning
  // This ensures the service works even in cities where subscriptions aren't enforced yet
  if (driver.is_verified && driver.is_available) {
    return { eligible: true, reason: 'fallback_verified_online' };
  }
  return { 
    eligible: false, 
    reason: `wallet=${walletBalance} < commission=${estimatedCommission}, rides_remaining=${driver.rides_remaining || 0}, verified=${driver.is_verified}` 
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  return withRateLimit(req, RATE_LIMITS.CLIENT, async (req) => {
  try {
    const body = await req.json() as RideRequest & { health_check?: boolean };
    
    if (body.health_check === true) {
      return new Response(JSON.stringify({ status: 'ok', service: 'ride-dispatcher' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { bookingId, pickupLat, pickupLng, serviceType, vehicleClass, priority = 'normal', searchRadius: clientRadius } = body;
    const correlationId = `dispatch-${bookingId}-${Date.now()}`;

    // Récupérer la ville depuis le booking
    const { data: bookingData } = await supabase
      .from('transport_bookings')
      .select('city, estimated_price')
      .eq('id', bookingId)
      .single();
    const city = bookingData?.city || null;
    const estimatedPrice = bookingData?.estimated_price || 0;
    const estimatedCommission = estimatedPrice * 0.12;

    // ✅ Use client-provided searchRadius, fallback to priority-based
    const searchRadius = clientRadius || (priority === 'urgent' ? 20 : priority === 'high' ? 15 : 15);

    console.log(`🚗 [${correlationId}] Dispatch started`);
    console.log(`📍 Position: ${pickupLat}, ${pickupLng} | City: ${city} | Service: ${serviceType} | Vehicle: ${vehicleClass || 'any'} | Priority: ${priority} | Radius: ${searchRadius}km`);
    console.log(`💰 Price: ${estimatedPrice} | Commission: ${estimatedCommission}`);

    // Mapper le vehicle_type du booking vers le vehicle_class des chauffeurs
    const VEHICLE_CLASS_MAP: Record<string, string> = {
      'taxi_moto': 'moto',
      'taxi_eco': 'eco',
      'taxi_confort': 'standard',
      'taxi_premium': 'premium',
    };
    const mappedVehicleClass = vehicleClass ? (VEHICLE_CLASS_MAP[vehicleClass] ?? vehicleClass) : null;
    if (vehicleClass && mappedVehicleClass !== vehicleClass) {
      console.log(`🔀 [${correlationId}] vehicle_class mapped: ${vehicleClass} → ${mappedVehicleClass}`);
    }

    // ✅ Cascade search: 3km → 5km → 8km → 12km → 20km (optimal for Abidjan/Kinshasa density)
    const cascadeRadii = [3, 5, 8, 12, 20].filter(r => r <= Math.max(searchRadius, 20));
    let finalDrivers: any[] = [];
    let usedFallback = false;
    let actualRadius = 0;
    let driversError: any = null;

    for (const r of cascadeRadii) {
      const { data: drivers, error } = await supabase.rpc('find_nearby_drivers', {
        p_lat: pickupLat,
        p_lng: pickupLng,
        p_max_distance_km: r,
        p_vehicle_class: mappedVehicleClass,
        p_service_type: serviceType || null,
        p_city: city
      });

      if (error) { driversError = error; console.error(`❌ RPC error at ${r}km:`, error); continue; }
      console.log(`🔍 [${correlationId}] ${drivers?.length || 0} drivers at ${r}km`);

      if (drivers && drivers.length > 0) {
        finalDrivers = drivers;
        actualRadius = r;
        console.log(`✅ [${correlationId}] Found ${drivers.length} drivers at ${r}km`);
        break;
      }
    }

    // Fallback sans filtre véhicule si toujours vide
    if (finalDrivers.length === 0 && vehicleClass) {
      for (const r of [5, 10, 20]) {
        const { data: fallbackDrivers } = await supabase.rpc('find_nearby_drivers', {
          p_lat: pickupLat, p_lng: pickupLng, p_max_distance_km: r,
          p_vehicle_class: null, p_service_type: serviceType || null, p_city: city
        });
        if (fallbackDrivers && fallbackDrivers.length > 0) {
          finalDrivers = fallbackDrivers;
          usedFallback = true;
          actualRadius = r;
          console.log(`✅ [${correlationId}] Fallback: ${fallbackDrivers.length} drivers at ${r}km (any class)`);
          break;
        }
      }
    }

    if (driversError && finalDrivers.length === 0) throw driversError;

    if (!finalDrivers || finalDrivers.length === 0) {
      console.log(`❌ [${correlationId}] No drivers found in area (fallback also empty)`);
      
      await supabase.from('activity_logs').insert([{
        activity_type: 'ride_dispatch_failed',
        user_id: null,
        description: `No drivers in area for ${bookingId}`,
        metadata: { correlationId, bookingId, pickupLat, pickupLng, city, serviceType, vehicleClass, priority, searchRadius, reason: 'no_drivers_in_area', fallbackAttempted: !!vehicleClass }
      }]);

      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Aucun chauffeur disponible dans votre zone.',
          drivers_searched: 0,
          reason: 'no_drivers_in_area',
          retry_suggested: true,
          retry_delay_seconds: priority === 'urgent' ? 30 : 60
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log all drivers found for debugging
    console.log(`📊 [${correlationId}] Drivers found (fallback=${usedFallback}):`, finalDrivers.map((d: any) => ({
      id: d.driver_id?.slice(0, 8),
      dist: d.distance_km,
      class: d.vehicle_class,
      rides: d.rides_remaining,
      wallet: d.wallet_balance,
      verified: d.is_verified
    })));

    // Score and sort drivers
    const scoredDrivers = finalDrivers.map((driver: any) => ({
      ...driver,
      score: calculateDriverScore(driver, priority)
    })).sort((a: any, b: any) => b.score - a.score);

    // ✅ PHASE 2: Flexible eligibility check
    let selectedDriver = null;
    let selectionReason = '';
    const rejectionReasons: string[] = [];

    for (const driver of scoredDrivers) {
      const { eligible, reason } = isDriverEligible(driver, estimatedCommission);
      if (eligible) {
        selectedDriver = driver;
        selectionReason = reason;
        console.log(`✅ [${correlationId}] Driver ${driver.driver_id?.slice(0, 8)} selected (${reason}, score: ${driver.score.toFixed(1)})`);
        break;
      }
      rejectionReasons.push(`${driver.driver_id?.slice(0, 8)}: ${reason}`);
      console.log(`⏭️ [${correlationId}] Driver ${driver.driver_id?.slice(0, 8)} rejected: ${reason}`);
    }

    if (!selectedDriver) {
      console.log(`❌ [${correlationId}] No eligible driver. Rejections: ${rejectionReasons.join(' | ')}`);
      
      await supabase.from('activity_logs').insert([{
        activity_type: 'ride_dispatch_failed',
        user_id: null,
        description: `No eligible driver for ${bookingId}`,
        metadata: { correlationId, bookingId, driversFound: finalDrivers.length, estimatedCommission, rejectionReasons, reason: 'no_eligible_driver' }
      }]);

      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Aucun chauffeur éligible disponible. Veuillez réessayer.',
          drivers_searched: finalDrivers.length,
          reason: 'no_eligible_driver',
          retry_suggested: true,
          retry_delay_seconds: 60
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Race condition guard: check booking is still unassigned
    const { data: currentBooking } = await supabase
      .from('transport_bookings')
      .select('driver_id, status')
      .eq('id', bookingId)
      .single();

    if (currentBooking?.driver_id) {
      console.warn(`⚠️ [${correlationId}] Booking already assigned to ${currentBooking.driver_id}, skipping.`);
      return new Response(
        JSON.stringify({ success: true, already_assigned: true, driver_id: currentBooking.driver_id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Lookup partner vehicle assigned to this driver
    let vehicleId: string | null = null;
    const { data: partnerVehicle } = await supabase
      .from('partner_taxi_vehicles')
      .select('id')
      .eq('assigned_driver_id', selectedDriver.driver_id)
      .eq('status', 'approved')
      .maybeSingle();
    if (partnerVehicle?.id) {
      vehicleId = partnerVehicle.id;
      console.log(`🚙 [${correlationId}] Partner vehicle found: ${vehicleId}`);
    }

    // Assign driver to booking
    const bookingUpdate: Record<string, unknown> = {
      driver_id: selectedDriver.driver_id,
      status: 'driver_assigned',
      driver_assigned_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    if (vehicleId) bookingUpdate.vehicle_id = vehicleId;

    const { error: updateError } = await supabase
      .from('transport_bookings')
      .update(bookingUpdate)
      .eq('id', bookingId);

    if (updateError) {
      console.error(`❌ [${correlationId}] Booking update error:`, updateError);
      throw updateError;
    }

    // ⚠️ Ne plus toucher driver_locations.is_available ici —
    // c'est l'acceptation par le chauffeur qui doit le passer à false.
    console.log(`🔒 [${correlationId}] Driver assigned, credit deduction deferred to arrival`);

    // Notify driver
    try {
      await supabase.from('push_notifications').insert([{
        user_id: selectedDriver.driver_id,
        title: `Nouvelle course ${serviceType.toUpperCase()}`,
        message: `Nouvelle course assignée. Distance: ${selectedDriver.distance_km.toFixed(1)}km`,
        notification_type: 'ride_assignment',
        transport_booking_id: bookingId,
        metadata: {
          bookingId, serviceType, correlationId,
          vehicleClass: selectedDriver.vehicle_class,
          distance: selectedDriver.distance_km,
          priority, selectionReason,
          estimatedPrice
        }
      }]);
    } catch (notifError) {
      console.warn(`⚠️ [${correlationId}] push_notifications insert failed (non-blocking):`, notifError);
    }

    // Log success
    await supabase.from('activity_logs').insert([{
      activity_type: 'ride_dispatch_success',
      user_id: selectedDriver.driver_id,
      description: `Driver ${selectedDriver.driver_id} assigned to ${bookingId} (${selectionReason})`,
      metadata: {
        correlationId, bookingId, driverId: selectedDriver.driver_id,
        distance: selectedDriver.distance_km, score: selectedDriver.score,
        selectionReason, priority, serviceType, usedFallback,
        driversConsidered: finalDrivers.length,
        rides_remaining: selectedDriver.rides_remaining || 0,
        wallet_balance: selectedDriver.wallet_balance || 0,
        searchRadius
      }
    }]);

    console.log(`✅ [${correlationId}] Dispatch complete`);

    return new Response(
      JSON.stringify({
        success: true,
        driver: {
          driver_id: selectedDriver.driver_id,
          id: selectedDriver.driver_id,
          distance_km: selectedDriver.distance_km,
          distance: selectedDriver.distance_km,
          vehicle_class: selectedDriver.vehicle_class,
          rating_average: selectedDriver.rating_average,
          rating: selectedDriver.rating_average,
          score: selectedDriver.score,
          driver_name: selectedDriver.display_name || null,
          total_rides: selectedDriver.total_rides || 0,
          rides_remaining: selectedDriver.rides_remaining || 0
        },
        assignment_details: {
          priority_level: priority,
          drivers_considered: finalDrivers.length,
          search_radius_km: searchRadius,
          selection_reason: selectionReason,
          used_fallback: usedFallback,
          correlation_id: correlationId
        },
        message: 'Chauffeur assigné avec succès'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('❌ Dispatch error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        message: 'Erreur lors de l\'assignation du chauffeur'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
  });
});
