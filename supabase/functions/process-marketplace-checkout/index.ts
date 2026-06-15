import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { cartItems, userId, userCoordinates, deliveryAddress, buyerPhone } = await req.json();

    console.log('🛒 Processing marketplace checkout', { 
      userId, 
      itemCount: cartItems.length,
      hasDeliveryAddress: !!deliveryAddress,
      hasPhone: !!buyerPhone 
    });

    // 1. Calculer le total
    const totalAmount = cartItems.reduce((sum: number, item: any) => 
      sum + (item.price * item.quantity), 0
    );

    console.log('💰 Total amount:', totalAmount);

    // 2. Vérifier et débiter le wallet
    const { data: wallet, error: walletError } = await supabase
      .from('user_wallets')
      .select('balance, bonus_balance')
      .eq('user_id', userId)
      .single();

    if (walletError || !wallet) {
      console.error('❌ Wallet error:', walletError);
      throw new Error('Portefeuille introuvable');
    }

    const bonusBalance = Number(wallet.bonus_balance || 0);
    const mainBalance = Number(wallet.balance || 0);
    const totalAvailable = bonusBalance + mainBalance;
    
    if (totalAvailable < totalAmount) {
      console.error('❌ Insufficient balance:', { available: totalAvailable, required: totalAmount });
      throw new Error(`Solde insuffisant. Requis: ${totalAmount} CDF | Disponible: ${totalAvailable} CDF`);
    }

    // 3. ✅ Paiement mixte : bonus en priorité, puis complément avec balance
    const bonusUsed = Math.min(bonusBalance, totalAmount);
    const balanceUsed = totalAmount - bonusUsed;

    const { error: updateError } = await supabase
      .from('user_wallets')
      .update({ 
        bonus_balance: bonusBalance - bonusUsed,
        balance: mainBalance - balanceUsed,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (updateError) throw updateError;

    const paidWithBonus = bonusUsed > 0;
    console.log(`✅ Payment: ${bonusUsed} bonus + ${balanceUsed} balance`);

    // 4. Créer les commandes ET les escrow dans escrow_payments
    const orderIds: string[] = [];
    
    for (const item of cartItems) {
      const orderTotal = item.price * item.quantity;

      const { data: order, error: orderError } = await supabase
        .from('marketplace_orders')
        .insert({
          product_id: item.product_id || item.id,
          buyer_id: userId,
          seller_id: item.seller_id,
          quantity: item.quantity,
          unit_price: item.price,
          total_amount: orderTotal,
          status: 'pending',
          payment_status: 'paid',
          revenue_status: 'pending',
          delivery_coordinates: userCoordinates,
          delivery_address: deliveryAddress || null,
          buyer_phone: buyerPhone || null,
          vendor_confirmation_status: 'awaiting_confirmation',
          delivery_payment_status: 'pending'
        })
        .select()
        .single();

      if (orderError) {
        console.error('❌ Order creation error:', orderError);
        throw orderError;
      }

      orderIds.push(order.id);
      console.log(`✅ Order created: ${order.id}`);

      const { error: escrowError } = await supabase
        .from('escrow_payments')
        .insert({
          order_id: order.id,
          buyer_id: userId,
          seller_id: item.seller_id,
          amount: orderTotal,
          currency: 'CDF',
          payment_method: 'wallet',
          status: 'held',
          held_at: new Date().toISOString()
        });

      if (escrowError) {
        console.error('❌ Escrow creation error:', escrowError);
        throw new Error(`Échec création escrow: ${escrowError.message}`);
      }

      console.log(`✅ Escrow created for order: ${order.id}`);

      await supabase.from('activity_logs').insert({
        user_id: userId,
        activity_type: bonusUsed > 0 ? 'mixed_payment' : 'wallet_payment',
        description: `Achat - ${item.name}${bonusUsed > 0 && balanceUsed > 0 ? ` (${bonusUsed} bonus + ${balanceUsed} solde)` : ''}`,
        amount: -orderTotal,
        currency: 'CDF',
        reference_type: 'marketplace_order',
        reference_id: order.id,
        metadata: { bonus_used: bonusUsed, balance_used: balanceUsed }
      });

      await supabase.from('system_notifications').insert({
        user_id: item.seller_id,
        title: 'Nouvelle commande payée',
        message: `Vous avez reçu une commande payée pour ${item.name}. Montant: ${orderTotal} CDF`,
        notification_type: 'marketplace_order',
        data: { order_id: order.id, amount: orderTotal }
      });
    }

    console.log(`✅ Checkout complete. ${orderIds.length} orders created with escrow`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        orderIds, 
        totalAmount,
        paidWithBonus,
        bonusUsed,
        balanceUsed
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Checkout error:', error);
    return new Response(
      JSON.stringify({ error: (error as any).message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
