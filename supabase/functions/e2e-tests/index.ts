import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TestScenario {
  name: string;
  type: 'taxi_workflow' | 'delivery_workflow' | 'performance_test';
  payload: any;
  expected_duration_ms?: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { scenario }: { scenario: TestScenario } = await req.json();

    if (!scenario || !scenario.type) {
      throw new Error("Missing test scenario configuration");
    }

    console.log(`🧪 Running E2E test: ${scenario.name} (${scenario.type})`);

    const testStartTime = Date.now();
    let testResults: any = {};

    switch (scenario.type) {
      case 'taxi_workflow':
        testResults = await runTaxiWorkflowTest(supabaseClient, scenario.payload);
        break;
      
      case 'delivery_workflow':
        testResults = await runDeliveryWorkflowTest(supabaseClient, scenario.payload);
        break;
      
      case 'performance_test':
        testResults = await runPerformanceTest(supabaseClient, scenario.payload);
        break;
      
      default:
        throw new Error(`Unknown test type: ${scenario.type}`);
    }

    const totalDuration = Date.now() - testStartTime;
    const performancePass = scenario.expected_duration_ms ? 
      totalDuration <= scenario.expected_duration_ms : true;

    console.log(`✅ Test completed in ${totalDuration}ms - Performance: ${performancePass ? 'PASS' : 'FAIL'}`);

    // Enregistrer les résultats de test
    await supabaseClient
      .from('function_monitoring_logs')
      .insert({
        function_name: 'e2e-tests',
        status: testResults.success && performancePass ? 'healthy' : 'degraded',
        response_time_ms: totalDuration,
        error_count: testResults.errors?.length || 0,
        success_rate: testResults.success ? 100 : 0,
        metadata: {
          test_scenario: scenario.name,
          test_type: scenario.type,
          results: testResults,
          performance_pass: performancePass
        }
      });

    return new Response(
      JSON.stringify({
        success: testResults.success && performancePass,
        test_name: scenario.name,
        duration_ms: totalDuration,
        performance_pass: performancePass,
        results: testResults,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error: unknown) {
    console.error('❌ E2E test error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

async function runTaxiWorkflowTest(supabase: any, payload: any) {
  const results: any = {
    success: true,
    steps: [] as any[],
    errors: [] as any[],
    metrics: {} as any
  };

  try {
    // Étape 1: Créer une réservation taxi
    console.log('🚗 Step 1: Creating taxi booking...');
    const stepStart = Date.now();
    
    const { data: booking, error: bookingError } = await supabase
      .from('transport_bookings')
      .insert({
        user_id: payload.user_id || '00000000-0000-0000-0000-000000000000',
        pickup_location: payload.pickup_location || 'Place Victoire, Kinshasa',
        destination: payload.destination || 'Aéroport de Ndjili',
        pickup_coordinates: payload.pickup_coordinates || { lat: -4.3217, lng: 15.3069 },
        delivery_coordinates: payload.delivery_coordinates || { lat: -4.3856, lng: 15.4442 },
        service_type: 'taxi',
        status: 'pending',
        estimated_price: 15000
      })
      .select()
      .single();

    if (bookingError) throw bookingError;

    results.steps.push({
      name: 'create_booking',
      duration_ms: Date.now() - stepStart,
      success: true,
      booking_id: booking.id
    });

    // Étape 2: Dispatcher la course
    console.log('📡 Step 2: Dispatching ride...');
    const dispatchStart = Date.now();
    
    const { data: dispatchResult, error: dispatchError } = await supabase.functions.invoke('ride-dispatcher', {
      body: {
        booking_id: booking.id,
        pickup_coordinates: booking.pickup_coordinates,
        service_type: 'taxi',
        radius_km: 10
      }
    });

    if (dispatchError) throw dispatchError;

    results.steps.push({
      name: 'dispatch_ride',
      duration_ms: Date.now() - dispatchStart,
      success: dispatchResult.success,
      drivers_found: dispatchResult.total_drivers_found || 0
    });

    // Étape 3: Vérifier l'assignation du chauffeur
    console.log('👤 Step 3: Verifying driver assignment...');
    const verifyStart = Date.now();
    
    const { data: updatedBooking, error: verifyError } = await supabase
      .from('transport_bookings')
      .select('status, driver_id, driver_assigned_at')
      .eq('id', booking.id)
      .single();

    if (verifyError) throw verifyError;

    const driverAssigned = updatedBooking.status === 'driver_assigned' && updatedBooking.driver_id;

    results.steps.push({
      name: 'verify_assignment',
      duration_ms: Date.now() - verifyStart,
      success: driverAssigned,
      status: updatedBooking.status,
      driver_assigned: !!updatedBooking.driver_id
    });

    // Étape 4: Simuler progression de la course
    if (driverAssigned) {
      console.log('🚗 Step 4: Simulating ride progression...');
      const progressStart = Date.now();
      
      // Mettre à jour le statut vers "pickup"
      await supabase
        .from('transport_bookings')
        .update({ 
          status: 'picked_up',
          pickup_time: new Date().toISOString()
        })
        .eq('id', booking.id);

      // Puis vers "completed"
      await supabase
        .from('transport_bookings')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString(),
          actual_price: 15000
        })
        .eq('id', booking.id);

      results.steps.push({
        name: 'complete_ride',
        duration_ms: Date.now() - progressStart,
        success: true
      });
    }

    console.log('✅ Taxi workflow test completed successfully');

  } catch (error: unknown) {
    console.error('❌ Taxi workflow test failed:', error);
    results.success = false;
    results.errors.push(error instanceof Error ? error.message : 'Unknown error');
  }

  return results;
}

async function runDeliveryWorkflowTest(supabase: any, payload: any) {
  const results: any = {
    success: true,
    steps: [] as any[],
    errors: [] as any[],
    metrics: {} as any
  };

  try {
    // Étape 1: Créer une commande de livraison
    console.log('📦 Step 1: Creating delivery order...');
    const stepStart = Date.now();
    
    const { data: delivery, error: deliveryError } = await supabase
      .from('delivery_orders')
      .insert({
        user_id: payload.user_id || '00000000-0000-0000-0000-000000000000',
        pickup_location: payload.pickup_location || 'Marché Central, Kinshasa',
        delivery_location: payload.delivery_location || 'Gombe, Kinshasa',
        pickup_coordinates: payload.pickup_coordinates || { lat: -4.3217, lng: 15.3069 },
        delivery_coordinates: payload.delivery_coordinates || { lat: -4.3095, lng: 15.3074 },
        delivery_type: 'flash',
        package_type: 'envelope',
        estimated_price: 5000,
        status: 'pending'
      })
      .select()
      .single();

    if (deliveryError) throw deliveryError;

    results.steps.push({
      name: 'create_delivery',
      duration_ms: Date.now() - stepStart,
      success: true,
      delivery_id: delivery.id
    });

    // Étape 2: Calculer la vraie distance avec géolocalisation
    console.log('📍 Step 2: Calculating real distance with geolocation...');
    const geoStart = Date.now();
    
    const pickup = delivery.pickup_coordinates;
    const dropoff = delivery.delivery_coordinates;
    
    // Simuler un appel à l'API Google Maps pour la distance réelle
    const distance = calculateDistance(pickup.lat, pickup.lng, dropoff.lat, dropoff.lng);
    const realPrice = Math.round(5000 + (distance * 800)); // 5000 base + 800/km

    await supabase
      .from('delivery_orders')
      .update({ 
        estimated_price: realPrice,
        updated_at: new Date().toISOString()
      })
      .eq('id', delivery.id);

    results.steps.push({
      name: 'calculate_distance',
      duration_ms: Date.now() - geoStart,
      success: true,
      distance_km: distance,
      adjusted_price: realPrice
    });

    // Étape 3: Dispatcher la livraison
    console.log('🚚 Step 3: Dispatching delivery...');
    const dispatchStart = Date.now();
    
    const { data: dispatchResult, error: dispatchError } = await supabase.functions.invoke('delivery-dispatcher', {
      body: {
        orderId: delivery.id,
        pickupLat: pickup.lat,
        pickupLng: pickup.lng,
        deliveryType: 'flash'
      }
    });

    if (dispatchError) throw dispatchError;

    results.steps.push({
      name: 'dispatch_delivery',
      duration_ms: Date.now() - dispatchStart,
      success: dispatchResult.success,
      drivers_found: dispatchResult.driversFound || 0
    });

    console.log('✅ Delivery workflow test completed successfully');

  } catch (error: unknown) {
    console.error('❌ Delivery workflow test failed:', error);
    results.success = false;
    results.errors.push(error instanceof Error ? error.message : 'Unknown error');
  }

  return results;
}

async function runPerformanceTest(supabase: any, payload: any) {
  const results = {
    success: true,
    metrics: {},
    errors: []
  };

  try {
    console.log('⚡ Running performance tests...');

    // Test 1: Recherche de lieux intelligente
    const searchStart = Date.now();
    const { data: places, error: searchError } = await supabase
      .rpc('intelligent_places_search', {
        search_query: payload.search_query || 'gombe',
        search_city: 'Kinshasa',
        max_results: 10
      });

    if (searchError) throw searchError;

    (results.metrics as any).places_search_ms = Date.now() - searchStart;

    // Test 2: Recherche de chauffeurs disponibles
    const driversStart = Date.now();
    const { data: drivers, error: driversError } = await supabase
      .rpc('find_nearby_drivers', {
        pickup_lat: -4.3217,
        pickup_lng: 15.3069,
        service_type_param: 'taxi',
        radius_km: 10
      });

    if (driversError) throw driversError;

    (results.metrics as any).drivers_search_ms = Date.now() - driversStart;

    // Test 3: Calcul de prix de livraison
    const pricingStart = Date.now();
    const { data: pricing, error: pricingError } = await supabase
      .rpc('calculate_delivery_price', {
        service_type_param: 'flash',
        distance_km_param: 5.2,
        city_param: 'Kinshasa'
      });

    if (pricingError) throw pricingError;

    (results.metrics as any).pricing_calc_ms = Date.now() - pricingStart;

    // Vérifier que tous les tests sont sous 2 secondes
    const allTestsUnder2s = Object.values(results.metrics).every((time: any) => time < 2000);
    results.success = allTestsUnder2s;

    console.log('📊 Performance metrics:', results.metrics);

  } catch (error: unknown) {
    console.error('❌ Performance test failed:', error);
    results.success = false;
    (results.errors as any).push(error instanceof Error ? error.message : 'Unknown error');
  }

  return results;
}

// Fonction helper pour calculer la distance
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Rayon de la Terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
          Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}