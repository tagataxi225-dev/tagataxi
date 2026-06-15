// Version: 2025-11-07T10:00:00Z - Deployment forced
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { withRateLimit, RATE_LIMITS } from "../_shared/ratelimit.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-health-check',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

interface DeliveryRequest {
  orderId: string;
  pickupLat: number;
  pickupLng: number;
  deliveryType: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

interface DriverMatch {
  driver_id: string;
  distance_km: number;
  service_type: string;
  rating_average: number;
  total_deliveries: number;
  is_verified: boolean;
  score: number;
}

function calculateDriverScore(driver: any, priority: string = 'normal'): number {
  const distanceScore = Math.max(0, 100 - (driver.distance_km * 10));
  const ratingScore = (driver.rating_average || 0) * 20;
  const experienceScore = Math.min(50, (driver.total_deliveries || 0) * 0.5);
  const verificationBonus = driver.is_verified ? 20 : 0;
  const ridesBonus = Math.min(15, (driver.rides_remaining || 0) * 1.5);
  
  const priorityMultiplier = priority === 'urgent' ? 1.3 : priority === 'high' ? 1.2 : 1.0;
  
  return (distanceScore + ratingScore + experienceScore + verificationBonus + ridesBonus) * priorityMultiplier;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  return withRateLimit(req, RATE_LIMITS.CLIENT, async (req) => {

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { orderId, pickupLat, pickupLng, deliveryType, priority = 'normal' } = await req.json() as DeliveryRequest;

    console.log(`📦 Recherche livreur pour commande ${orderId}`);
    console.log(`📍 Position: ${pickupLat}, ${pickupLng}`);
    console.log(`🚛 Type: ${deliveryType}, Priorité: ${priority}`);

    const searchRadius = priority === 'urgent' ? 20 : priority === 'high' ? 15 : 10;

    // Rechercher les livreurs disponibles
    // Cascade radius: 2→4→7→10→15→20km pour trouver le chauffeur le plus proche
    const cascadeRadii = [2, 4, 7, 10, 15, 20];
    let drivers: any[] = [];
    let driversError: any = null;
    for (const r of cascadeRadii) {
      const { data: d, error: e } = await supabase.rpc('find_nearby_drivers', {
        p_lat: pickupLat, p_lng: pickupLng,
        p_max_distance_km: r,
        p_vehicle_class: null,
        p_service_type: 'delivery'
      });
      if (e) { driversError = e; continue; }
      if (d && d.length > 0) { drivers = d; console.log(`✅ ${d.length} livreurs trouvés à ${r}km`); break; }
    }

    console.log(`🔍 RPC params: lat=${pickupLat}, lng=${pickupLng}, radius=${searchRadius}km, service=delivery`);
    console.log(`📊 Found ${drivers?.length || 0} drivers`);

    if (driversError) {
      console.error('❌ Erreur recherche livreurs:', driversError);
      throw driversError;
    }

    if (!drivers || drivers.length === 0) {
      console.log('❌ Aucun livreur disponible');
      
      await supabase.from('activity_logs').insert([{
        activity_type: 'delivery_dispatch_failed',
        description: `Aucun livreur disponible pour ${orderId}`,
        metadata: {
          orderId,
          pickupLat,
          pickupLng,
          deliveryType,
          priority,
          searchRadius,
          reason: 'no_drivers_available'
        }
      }]);

      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Aucun livreur disponible. Veuillez réessayer.',
          drivers_searched: 0,
          reason: 'no_drivers_available',
          retry_suggested: true,
          retry_delay_seconds: priority === 'urgent' ? 30 : 60
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ ${drivers.length} livreurs trouvés`);

    // Calculer le score et trier
    const scoredDrivers = drivers.map((driver: any) => ({
      ...driver,
      score: calculateDriverScore(driver, priority)
    })).sort((a: DriverMatch, b: DriverMatch) => b.score - a.score);

    // Vérifier wallet/abonnement avant assignation (aligné avec ride-dispatcher)
    const estimatedPrice = 5000; // Prix minimum estimé pour calcul commission
    const estimatedCommission = Math.round(estimatedPrice * 0.12); // 12% commission standard

    let selectedDriver: any = null;
    for (const driver of scoredDrivers) {
      // Si le chauffeur a un abonnement actif avec courses restantes
      if ((driver.rides_remaining || 0) > 0) {
        selectedDriver = driver;
        console.log(`✅ Livreur ${driver.driver_id} sélectionné (abo actif, ${driver.rides_remaining} courses restantes)`);
        break;
      }
      // Sinon vérifier le wallet
      if ((driver.wallet_balance || 0) >= estimatedCommission) {
        selectedDriver = driver;
        console.log(`✅ Livreur ${driver.driver_id} sélectionné (wallet: ${driver.wallet_balance} CDF)`);
        break;
      }
      console.log(`⚠️ Livreur ${driver.driver_id} ignoré: wallet=${driver.wallet_balance || 0} CDF, rides_remaining=${driver.rides_remaining || 0}`);
    }

    if (!selectedDriver) {
      console.log('❌ Aucun livreur avec wallet/abonnement suffisant');
      
      await supabase.from('activity_logs').insert([{
        activity_type: 'delivery_dispatch_failed',
        description: `Aucun livreur solvable pour ${orderId}`,
        metadata: {
          orderId, deliveryType, priority,
          driversFound: drivers.length,
          reason: 'no_solvent_drivers'
        }
      }]);

      return new Response(
        JSON.stringify({
          success: false,
          message: 'Aucun livreur disponible avec un solde suffisant.',
          drivers_searched: drivers.length,
          reason: 'no_solvent_drivers',
          retry_suggested: true,
          retry_delay_seconds: 60
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`🎯 Livreur sélectionné: ${selectedDriver.driver_id} (Score: ${selectedDriver.score.toFixed(1)}, Distance: ${selectedDriver.distance_km}km)`);

    // Mettre à jour la commande avec assignation
    const { error: updateError } = await supabase
      .from('delivery_orders')
      .update({
        driver_id: selectedDriver.driver_id,
        status: 'driver_assigned',
        driver_assigned_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('❌ Erreur mise à jour commande:', updateError);
      throw updateError;
    }

    // Marquer le livreur comme non disponible
    await supabase
      .from('driver_locations')
      .update({
        is_available: false,
        updated_at: new Date().toISOString()
      })
      .eq('driver_id', selectedDriver.driver_id);

    console.log(`🔒 [${orderId}] Crédit sera consommé à l'arrivée du livreur`);

    // Récupérer les détails de la commande
    const { data: orderDetails, error: orderError } = await supabase
      .from('delivery_orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError) {
      console.warn('⚠️ Impossible de récupérer détails commande:', orderError);
    }

    // Créer notification pour le livreur
    const notificationData = {
      user_id: selectedDriver.driver_id,
      title: `Nouvelle livraison ${deliveryType.toUpperCase()}`,
      message: `Nouvelle livraison assignée. Distance: ${selectedDriver.distance_km.toFixed(1)}km`,
      notification_type: 'delivery_assignment',
      delivery_order_id: orderId,
      reference_id: orderId,
      metadata: {
        orderId,
        deliveryType,
        distance: selectedDriver.distance_km,
        priority,
        score: selectedDriver.score,
        estimatedPrice: orderDetails?.estimated_price,
        pickupLocation: orderDetails?.pickup_location,
        deliveryLocation: orderDetails?.delivery_location,
        rides_remaining: selectedDriver.rides_remaining || 0
      }
    };

    await supabase.from('push_notifications').insert([notificationData]);

    // Logger l'assignation
    await supabase.from('activity_logs').insert([{
      activity_type: 'delivery_dispatch_success',
      description: `Livreur ${selectedDriver.driver_id} assigné à ${orderId}`,
      metadata: {
        orderId,
        driverId: selectedDriver.driver_id,
        distance: selectedDriver.distance_km,
        score: selectedDriver.score,
        priority,
        deliveryType,
        driversConsidered: drivers.length,
        rides_remaining: selectedDriver.rides_remaining || 0
      }
    }]);

    console.log('✅ Assignation livreur terminée avec succès');

    return new Response(
      JSON.stringify({
        success: true,
        driver: {
          id: selectedDriver.driver_id,
          distance: selectedDriver.distance_km,
          service_type: selectedDriver.service_type,
          rating: selectedDriver.rating_average,
          score: selectedDriver.score,
          rides_remaining: selectedDriver.rides_remaining || 0
        },
        assignment_details: {
          priority_level: priority,
          drivers_considered: drivers.length,
          search_radius_km: searchRadius
        },
        message: 'Livreur assigné avec succès'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('❌ Erreur dispatch livraison:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        message: 'Erreur lors de l\'assignation du livreur'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
  });
});
