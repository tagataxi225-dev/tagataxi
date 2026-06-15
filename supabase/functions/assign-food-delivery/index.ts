// DEPRECATED: utiliser delivery-dispatcher à la place. Cette fonction ne filtre pas par GPS.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    console.log(`🍽️ Assigning food delivery for order: ${orderId}`);

    // 1️⃣ Récupérer la commande avec les infos du restaurant
    const { data: order, error: orderError } = await supabase
      .from('food_orders')
      .select(`
        *,
        restaurant:restaurant_profiles(
          id,
          restaurant_name,
          city,
          address,
          coordinates,
          user_id
        )
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('❌ Order fetch error:', orderError);
      return new Response(
        JSON.stringify({ error: 'Commande non trouvée' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!order.restaurant) {
      console.error('❌ Restaurant not found for order:', orderId);
      return new Response(
        JSON.stringify({ error: 'Restaurant non trouvé' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2️⃣ Trouver les livreurs disponibles dans la même ville
    const { data: drivers, error: driverError } = await supabase
      .from('chauffeurs')
      .select('user_id, display_name, phone_number, vehicle_type')
      .eq('is_active', true)
      .eq('city', order.restaurant.city)
      .eq('service_type', 'delivery')
      .limit(10);

    if (driverError) {
      console.error('❌ Driver fetch error:', driverError);
      return new Response(
        JSON.stringify({ error: 'Erreur lors de la recherche de livreur' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!drivers || drivers.length === 0) {
      console.log('⚠️ No available drivers found in', order.restaurant.city);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Aucun livreur disponible dans cette ville',
          needsManualAssignment: true 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3️⃣ Sélectionner le meilleur livreur (premier disponible pour l'instant)
    const selectedDriver = drivers[0];
    console.log(`✅ Selected driver: ${selectedDriver.user_id} - ${selectedDriver.display_name}`);

    // 4️⃣ Calculer les frais de livraison
    const deliveryFee = order.delivery_fee || 3000; // Utiliser les frais existants ou 3000 CDF par défaut
    const driverEarnings = deliveryFee * 0.75; // 75% pour le driver
    const platformFee = deliveryFee * 0.25; // 25% pour la plateforme

    // 5️⃣ Créer l'assignation de livraison
    const { data: assignment, error: assignError } = await supabase
      .from('food_delivery_assignments')
      .insert({
        food_order_id: orderId,
        driver_id: selectedDriver.user_id,
        restaurant_id: order.restaurant.id,
        pickup_location: order.restaurant.address || 'Adresse du restaurant',
        pickup_coordinates: order.restaurant.coordinates || {},
        delivery_location: order.delivery_address,
        delivery_coordinates: order.delivery_coordinates || {},
        delivery_fee: deliveryFee,
        driver_earnings: driverEarnings,
        assignment_status: 'driver_found',
        estimated_pickup_time: new Date(Date.now() + 15 * 60000).toISOString(), // +15 min
        estimated_delivery_time: new Date(Date.now() + 45 * 60000).toISOString() // +45 min
      })
      .select()
      .single();

    if (assignError) {
      console.error('❌ Assignment creation error:', assignError);
      return new Response(
        JSON.stringify({ error: 'Erreur lors de la création de l\'assignation' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 6️⃣ Mettre à jour le statut de la commande
    const { error: updateError } = await supabase
      .from('food_orders')
      .update({
        status: 'driver_assigned',
        driver_id: selectedDriver.user_id,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('⚠️ Order update error:', updateError);
    }

    // 7️⃣ Notifier le livreur
    await supabase.from('push_notifications').insert({
      user_id: selectedDriver.user_id,
      title: '🍽️ Nouvelle livraison Food',
      message: `Restaurant: ${order.restaurant.restaurant_name}\nLivraison: ${order.delivery_address}\nGain: ${driverEarnings} CDF`,
      notification_type: 'food_delivery_request',
      metadata: {
        assignment_id: assignment.id,
        restaurant_name: order.restaurant.restaurant_name,
        delivery_fee: deliveryFee,
        driver_earnings: driverEarnings,
        order_id: orderId
      }
    });

    // 8️⃣ Notifier le client
    await supabase.from('push_notifications').insert({
      user_id: order.customer_id,
      title: '🚗 Livreur assigné',
      message: `${selectedDriver.display_name} va récupérer votre commande chez ${order.restaurant.restaurant_name}`,
      notification_type: 'food_delivery_update',
      metadata: {
        order_id: orderId,
        driver_name: selectedDriver.display_name
      }
    });

    console.log(`✅ Food delivery assigned successfully to ${selectedDriver.display_name}`);

    return new Response(
      JSON.stringify({
        success: true,
        assignment,
        driver: {
          id: selectedDriver.user_id,
          name: selectedDriver.display_name,
          phone: selectedDriver.phone_number,
          vehicle: selectedDriver.vehicle_type
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('❌ Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: (error as any).message || 'Une erreur est survenue' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});