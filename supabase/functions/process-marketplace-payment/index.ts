import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-health-check',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

interface PaymentRequest {
  cartItems: Array<{
    product_id: string;
    quantity: number;
    price_at_purchase: number;
    vendor_id: string;
  }>;
  totalPrice: number;
  deliveryAddress: string;
  deliveryZone?: string;
  deliveryFee?: number;
  phoneNumber: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Authenticate user
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('❌ [Payment] Auth failed:', authError);
      return new Response(
        JSON.stringify({ error: 'Non authentifié' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const paymentData: PaymentRequest = await req.json();
    const { cartItems, totalPrice, deliveryAddress, deliveryZone, deliveryFee, phoneNumber } = paymentData;

    console.log('💳 [Payment] Processing payment', {
      userId: user.id,
      amount: totalPrice,
      itemsCount: cartItems.length
    });

    // ATOMIC TRANSACTION: Check balance, debit wallet, create order
    const { data: result, error: rpcError } = await supabase.rpc('process_marketplace_payment', {
      p_user_id: user.id,
      p_total_price: totalPrice,
      p_cart_items: cartItems,
      p_delivery_address: deliveryAddress,
      p_delivery_zone: deliveryZone,
      p_delivery_fee: deliveryFee || 0,
      p_phone_number: phoneNumber
    });

    if (rpcError) {
      console.error('❌ [Payment] RPC failed:', rpcError);
      
      // Check for insufficient balance
      if (rpcError.message.includes('Insufficient balance')) {
        return new Response(
          JSON.stringify({ error: 'Solde insuffisant' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'Erreur lors du traitement du paiement' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ [Payment] Success', { orderId: result.order_id });

    return new Response(
      JSON.stringify({
        success: true,
        orderId: result.order_id,
        transactionId: result.transaction_id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('❌ [Payment] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Erreur serveur interne' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
