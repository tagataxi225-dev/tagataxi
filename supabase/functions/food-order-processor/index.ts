import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-health-check',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

interface OrderItem {
  product_id: string;
  quantity: number;
  unit_price: number;
  special_instructions?: string;
}

interface OrderData {
  restaurant_id: string;
  items: OrderItem[];
  delivery_address: string;
  delivery_phone: string;
  delivery_coordinates?: { lat: number; lng: number };
  delivery_instructions?: string;
  payment_method: 'kwenda_pay' | 'cash';
  currency?: string;
}

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

    const orderData: OrderData = await req.json();
    const currency = orderData.currency || 'CDF';
    console.log('📦 Nouvelle commande food:', { user_id: user.id, restaurant_id: orderData.restaurant_id, currency });

    if (!orderData.restaurant_id || !orderData.items || orderData.items.length === 0) {
      throw new Error('Données invalides');
    }

    // Récupérer le restaurant avec son user_id
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurant_profiles')
      .select('id, user_id, restaurant_name, is_active, verification_status, average_preparation_time')
      .eq('id', orderData.restaurant_id)
      .eq('is_active', true)
      .eq('verification_status', 'approved')
      .single();

    if (restaurantError || !restaurant) {
      throw new Error('Restaurant non disponible');
    }

    const productIds = orderData.items.map(item => item.product_id);
    const { data: products, error: productsError } = await supabase
      .from('food_products')
      .select('id, name, price, is_available')
      .in('id', productIds)
      .eq('restaurant_id', orderData.restaurant_id)
      .eq('is_available', true)
      .eq('moderation_status', 'approved');

    if (productsError || !products || products.length !== orderData.items.length) {
      throw new Error('Produits non disponibles');
    }

    const subtotal = orderData.items.reduce((sum, item) => {
      const product = products.find(p => p.id === item.product_id);
      return sum + ((product?.price || 0) * item.quantity);
    }, 0);

    // Frais de service configurable (table restaurant_commission_config, défaut 5%)
    const { data: feeConfig } = await supabase
      .from('restaurant_commission_config')
      .select('service_fee_rate')
      .limit(1)
      .single();
    const serviceFeeRate = Number(feeConfig?.service_fee_rate ?? 5);
    const serviceFee = Math.round(subtotal * serviceFeeRate / 100);
    const totalAmount = subtotal + serviceFee;

    let walletId: string | null = null;
    let bonusUsed = 0;
    let balanceUsed = 0;

    if (orderData.payment_method === 'kwenda_pay') {
      const { data: wallet } = await supabase
        .from('user_wallets')
        .select('id, balance, bonus_balance')
        .eq('user_id', user.id)
        .single();

      if (!wallet) {
        return new Response(
          JSON.stringify({ error: 'wallet_not_found', message: 'Portefeuille introuvable' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
        );
      }

      walletId = wallet.id;
      const bonusBalance = Number(wallet.bonus_balance || 0);
      const mainBalance = Number(wallet.balance || 0);
      const totalAvailable = bonusBalance + mainBalance;

      if (totalAvailable < totalAmount) {
        return new Response(
          JSON.stringify({ 
            error: 'insufficient_funds',
            message: 'Solde insuffisant',
            required: totalAmount,
            available: totalAvailable,
            bonus: bonusBalance,
            main: mainBalance
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
        );
      }

      // ✅ Paiement mixte : bonus en priorité, puis complément avec balance
      bonusUsed = Math.min(bonusBalance, totalAmount);
      balanceUsed = totalAmount - bonusUsed;

      const { error: updateError } = await supabase
        .from('user_wallets')
        .update({ 
          bonus_balance: bonusBalance - bonusUsed,
          balance: mainBalance - balanceUsed,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      const isMixed = bonusUsed > 0 && balanceUsed > 0;
      const transactionType = bonusUsed === totalAmount ? 'food_order_bonus' : isMixed ? 'food_order_mixed' : 'food_order';
      const transactionDescription = `Commande Food - ${restaurant.restaurant_name}${isMixed ? ` (${bonusUsed} bonus + ${balanceUsed} solde)` : ''}`;

      console.log(`💰 Payment: ${bonusUsed} bonus + ${balanceUsed} balance`);

      // Logger transaction wallet
      await supabase.from('wallet_transactions').insert({
        wallet_id: wallet.id,
        transaction_type: transactionType,
        amount: -totalAmount,
        currency: currency,
        description: transactionDescription,
        status: 'completed',
        metadata: {
          order_type: 'food',
          restaurant_id: orderData.restaurant_id,
          restaurant_name: restaurant.restaurant_name,
          bonus_used: bonusUsed,
          balance_used: balanceUsed
        }
      });

      // Logger activity
      await supabase.from('activity_logs').insert({
        user_id: user.id,
        activity_type: bonusUsed > 0 ? 'mixed_payment' : 'wallet_payment',
        description: transactionDescription,
        amount: -totalAmount,
        currency: currency,
        reference_type: 'food_order',
        reference_id: orderData.restaurant_id,
        metadata: { bonus_used: bonusUsed, balance_used: balanceUsed }
      });
    }

    // Créer la commande
    const orderNumber = `FOOD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const { data: order, error: orderError } = await supabase
      .from('food_orders')
      .insert({
        order_number: orderNumber,
        customer_id: user.id,
        restaurant_id: orderData.restaurant_id,
        items: orderData.items.map(item => {
          const product = products.find(p => p.id === item.product_id);
          return {
            product_id: item.product_id,
            name: product?.name || 'Produit',
            quantity: item.quantity,
            price: product?.price || 0,
            special_instructions: item.special_instructions || ''
          };
        }),
        subtotal,
        delivery_fee: 0,
        service_fee: serviceFee,
        total_amount: totalAmount,
        delivery_payment_status: 'not_required',
        currency: currency,
        delivery_address: orderData.delivery_address,
        delivery_coordinates: orderData.delivery_coordinates || {},
        delivery_phone: orderData.delivery_phone,
        delivery_instructions: orderData.delivery_instructions,
        payment_method: orderData.payment_method,
        payment_status: orderData.payment_method === 'kwenda_pay' ? 'completed' : 'pending',
        paid_at: orderData.payment_method === 'kwenda_pay' ? new Date().toISOString() : null,
        status: 'pending',
        estimated_preparation_time: restaurant.average_preparation_time || 30
      })
      .select()
      .single();

    if (orderError) throw orderError;

    console.log('✅ Commande créée:', order.id);

    // Créer escrow dans escrow_payments
    if (orderData.payment_method === 'kwenda_pay') {
      const { error: escrowError } = await supabase
        .from('escrow_payments')
        .insert({
          order_id: order.id,
          buyer_id: user.id,
          seller_id: restaurant.user_id,
          amount: subtotal,
          currency: currency,
          payment_method: 'wallet',
          status: 'held',
          held_at: new Date().toISOString()
        });

      if (escrowError) {
        console.error('❌ Escrow creation error:', escrowError);
      } else {
        console.log(`✅ Escrow créé: ${subtotal} CDF pour restaurant user ${restaurant.user_id}`);
      }
    }

    // Créer les items de commande
    await supabase.from('food_order_items').insert(
      orderData.items.map(item => {
        const product = products.find(p => p.id === item.product_id);
        return {
          order_id: order.id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: product?.price || 0,
          special_instructions: item.special_instructions || ''
        };
      })
    );

    // Notifier le restaurant
    await supabase.from('system_notifications').insert({
      user_id: restaurant.user_id,
      title: '🍽️ Nouvelle commande !',
      message: `Nouvelle commande #${orderNumber} - ${totalAmount.toLocaleString()} ${currency}`,
      notification_type: 'food_order',
      data: { order_id: order.id, amount: totalAmount }
    });

    return new Response(
      JSON.stringify({
        success: true,
        order_id: order.id,
        order_number: orderNumber,
        total_amount: totalAmount,
        estimated_time: restaurant.average_preparation_time || 30,
        bonus_used: bonusUsed,
        balance_used: balanceUsed
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
