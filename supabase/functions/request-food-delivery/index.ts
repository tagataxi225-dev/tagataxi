import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-health-check',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Non authentifié');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Session invalide');
    }

    const { orderId } = await req.json();
    console.log('🚚 Demande de livreur Kwenda pour commande:', orderId);

    if (!orderId) {
      throw new Error('orderId requis');
    }

    // 1. Récupérer les détails de la commande
    const { data: order, error: orderError } = await supabase
      .from('food_orders')
      .select(`
        id,
        order_number,
        customer_id,
        restaurant_id,
        delivery_address,
        delivery_coordinates,
        status,
        restaurant_profiles (
          restaurant_name,
          address,
          coordinates
        )
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('❌ Commande introuvable:', orderError);
      throw new Error('Commande introuvable');
    }

    // Vérifier que c'est bien le restaurant qui demande
    const { data: restaurant } = await supabase
      .from('restaurant_profiles')
      .select('user_id')
      .eq('id', order.restaurant_id)
      .single();

    if (!restaurant || restaurant.user_id !== user.id) {
      throw new Error('Non autorisé');
    }

    const restaurantData = order.restaurant_profiles as any;
    
    // Extraire lat/lng depuis coordinates (jsonb)
    const restaurantCoords = {
      lat: restaurantData?.coordinates?.lat || -4.4419,
      lng: restaurantData?.coordinates?.lng || 15.2663
    };

    const deliveryCoords = order.delivery_coordinates as any;

    // 2. Calculer la distance et le prix estimé
    const distance = haversineDistance(restaurantCoords, deliveryCoords);
    const basePrice = 5000; // CDF
    const pricePerKm = 500; // CDF
    const estimatedDeliveryFee = Math.round(basePrice + (distance * pricePerKm));

    console.log(`📍 Distance: ${distance.toFixed(2)}km, Prix estimé: ${estimatedDeliveryFee} CDF`);

    // 3. Mettre à jour la commande avec le prix de livraison estimé
    const { error: updateError } = await supabase
      .from('food_orders')
      .update({
        delivery_fee: estimatedDeliveryFee,
        delivery_payment_status: 'pending'
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('❌ Erreur mise à jour commande:', updateError);
      throw updateError;
    }

    // 4. Appeler delivery-dispatcher pour notifier les livreurs
    console.log('📡 Appel delivery-dispatcher...');
    
    try {
      const dispatchResponse = await fetch(
        `${Deno.env.get('SUPABASE_URL')}/functions/v1/delivery-dispatcher`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
          },
          body: JSON.stringify({
            orderId,
            orderType: 'food',
            pickupLocation: restaurantData.address,
            pickupCoordinates: restaurantCoords,
            deliveryLocation: order.delivery_address,
            deliveryCoordinates: deliveryCoords,
            estimatedPrice: estimatedDeliveryFee,
            deliveryType: 'food_delivery'
          })
        }
      );

      if (!dispatchResponse.ok) {
        console.error('⚠️ Dispatch failed but not blocking');
      } else {
        console.log('✅ Livreurs notifiés');
      }
    } catch (dispatchError) {
      console.error('⚠️ Erreur dispatch (non bloquant):', dispatchError);
    }

    // 5. Notifier le client
    await supabase.from('system_notifications').insert({
      user_id: order.customer_id,
      title: '🚚 Livreur en recherche',
      message: `Un livreur Kwenda Flash va récupérer votre commande. Frais de livraison estimés: ${estimatedDeliveryFee.toLocaleString()} CDF`,
      notification_type: 'food_delivery',
      data: { 
        order_id: orderId,
        order_number: order.order_number,
        estimated_delivery_fee: estimatedDeliveryFee,
        distance_km: distance
      }
    });

    // 6. Logger l'activité
    await supabase.from('activity_logs').insert({
      user_id: user.id,
      activity_type: 'delivery_requested',
      description: `Livreur Kwenda demandé pour commande ${order.order_number}`,
      reference_type: 'food_order',
      reference_id: orderId
    });

    console.log('✅ Demande de livreur créée avec succès');

    return new Response(
      JSON.stringify({
        success: true,
        estimatedDeliveryFee,
        distance,
        message: 'Livreur Kwenda en recherche'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
    );

  } catch (error: any) {
    console.error('❌ Erreur:', error);
    return new Response(
      JSON.stringify({ error: (error as any).message || 'Erreur serveur' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
    );
  }
});

/**
 * Formule de Haversine pour calculer distance entre 2 points GPS (en km)
 */
function haversineDistance(
  coords1: { lat: number; lng: number },
  coords2: { lat: number; lng: number }
): number {
  const R = 6371; // Rayon de la Terre en km
  const dLat = toRad(coords2.lat - coords1.lat);
  const dLng = toRad(coords2.lng - coords1.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coords1.lat)) *
      Math.cos(toRad(coords2.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}
