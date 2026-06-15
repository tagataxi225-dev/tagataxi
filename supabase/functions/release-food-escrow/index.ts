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
    // ✅ Utiliser SERVICE_ROLE pour toutes les opérations financières
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Récupérer l'utilisateur authentifié
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Authorization required');

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error('Utilisateur non authentifié');

    const { orderId, rating, feedback } = await req.json();

    console.log('🍽️ Releasing food escrow for order:', orderId, 'by user:', user.id);

    // Récupérer la commande food
    const { data: order, error: orderError } = await supabase
      .from('food_orders')
      .select(`
        *,
        restaurant_profiles (
          id,
          user_id,
          restaurant_name
        )
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('Order not found:', orderError);
      throw new Error('Commande non trouvée');
    }

    // ✅ CORRECTION: Utiliser customer_id (pas user_id)
    if (order.customer_id !== user.id) {
      throw new Error('Vous ne pouvez confirmer que vos propres commandes');
    }

    // Vérifier que la commande est livrée
    if (order.status !== 'delivered') {
      throw new Error('La commande doit être livrée avant confirmation');
    }

    const restaurantUserId = order.restaurant_profiles?.user_id;
    if (!restaurantUserId) {
      throw new Error('Restaurant non trouvé');
    }

    // ✅ Chercher l'escrow dans escrow_payments
    const { data: escrowPayment, error: escrowCheckError } = await supabase
      .from('escrow_payments')
      .select('*')
      .eq('order_id', orderId)
      .single();

    if (escrowCheckError) {
      console.error('Escrow check error:', escrowCheckError);
    }

    // ✅ IDEMPOTENCE: Si déjà released, retourner succès
    if (escrowPayment?.status === 'released') {
      console.log('⚠️ Escrow already released, returning success');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Paiement déjà libéré',
          alreadyReleased: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ✅ Calculer les montants (100% au restaurant car service_fee est séparé)
    // La plateforme a déjà prélevé service_fee (5%) sur le total
    // Le subtotal va 100% au restaurant
    const restaurantId = order.restaurant_profiles?.id;
    const { data: rateData } = await supabase.rpc('get_restaurant_commission_rate', { p_restaurant_id: restaurantId });
    const commissionRate = Number(rateData) || 15;
    const commissionAmount = Math.round(order.subtotal * commissionRate / 100);
    const restaurantAmount = order.subtotal - commissionAmount;

    console.log('💰 Amounts:', { subtotal: order.subtotal, restaurant: restaurantAmount });

    // Si escrow existe, le libérer
    if (escrowPayment) {
      const { error: escrowUpdateError } = await supabase
        .from('escrow_payments')
        .update({
          status: 'released',
          released_at: new Date().toISOString()
        })
        .eq('id', escrowPayment.id);

      if (escrowUpdateError) {
        console.error('Escrow update error:', escrowUpdateError);
      } else {
        console.log('✅ Escrow released in escrow_payments');
      }
    }

    // ✅ Récupérer ou créer le wallet restaurant dans restaurant_wallets (pas vendor_wallets)
    let { data: wallet } = await supabase
      .from('restaurant_wallets')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .single();

    if (!wallet) {
      console.log('📝 Creating new restaurant wallet');
      const { data: newWallet, error: createError } = await supabase
        .from('restaurant_wallets')
        .insert({
          restaurant_id: restaurantId,
          balance: 0,
          total_earned: 0
        })
        .select()
        .single();

      if (createError) {
        console.error('Wallet creation error:', createError);
        throw createError;
      }
      wallet = newWallet;
    }

    // ✅ Créditer le wallet
    const { error: walletUpdateError } = await supabase
      .from('restaurant_wallets')
      .update({
        balance: (wallet.balance || 0) + restaurantAmount,
        total_earned: (wallet.total_earned || 0) + restaurantAmount,
        updated_at: new Date().toISOString()
      })
      .eq('id', wallet.id);

    if (walletUpdateError) {
      console.error('Wallet update error:', walletUpdateError);
      throw walletUpdateError;
    }

    console.log('💳 Wallet updated. New balance:', (wallet.balance || 0) + restaurantAmount);

    // ✅ Créer transaction de crédit
    await supabase.from('vendor_wallet_transactions').insert({
      wallet_id: wallet.id,
      vendor_id: restaurantUserId,
      transaction_type: 'credit',
      amount: restaurantAmount,
      currency: 'CDF',
      description: `Vente Food - Commande #${order.order_number}`,
      reference_id: orderId,
      reference_type: 'food_order',
      status: 'completed'
    });

    await supabase.from('vendor_wallet_transactions').insert({
      wallet_id: wallet.id,
      vendor_id: restaurantUserId,
      transaction_type: 'commission',
      amount: -commissionAmount,
      currency: 'CDF',
      description: `Commission plateforme (${commissionRate}%) - Commande #${order.order_number}`,
      reference_id: orderId,
      reference_type: 'food_commission',
      status: 'completed'
    });

    // Mettre à jour la commande
    const updateData: Record<string, any> = {
      status: 'completed',
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (rating !== undefined) updateData.customer_rating = rating;
    if (feedback) updateData.customer_feedback = feedback;

    const { error: orderUpdateError } = await supabase
      .from('food_orders')
      .update(updateData)
      .eq('id', orderId);

    if (orderUpdateError) {
      console.error('Order update error:', orderUpdateError);
      throw orderUpdateError;
    }

    // Logger l'activité
    await supabase.from('activity_logs').insert({
      user_id: restaurantUserId,
      activity_type: 'food_escrow_released',
      description: `Paiement reçu pour commande #${order.order_number}: ${restaurantAmount.toLocaleString()} CDF`,
      amount: restaurantAmount,
      currency: 'CDF',
      reference_id: orderId,
      reference_type: 'food_order'
    });

    // Notifier le restaurant
    await supabase.from('system_notifications').insert({
      user_id: restaurantUserId,
      title: '💰 Paiement reçu',
      message: `Client a confirmé la réception. ${restaurantAmount.toLocaleString()} CDF crédités sur votre compte.`,
      notification_type: 'food_payment',
      data: { order_id: orderId, amount: restaurantAmount }
    });

    console.log('✅ Food escrow released successfully');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Paiement libéré avec succès',
        restaurantAmount,
        platformFee: order.service_fee || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Error releasing food escrow:', error);
    return new Response(
      JSON.stringify({ success: false, error: (error as any).message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
