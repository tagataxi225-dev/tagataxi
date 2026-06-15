import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Validate JWT from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing Authorization header');
      return new Response(
        JSON.stringify({ error: 'Non authentifié - Veuillez vous reconnecter' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !authUser) {
      console.error('Auth validation failed:', authError);
      return new Response(
        JSON.stringify({ error: 'Session expirée - Veuillez vous reconnecter' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { orderId, customerId, paymentMethod = 'wallet' } = await req.json();

    // Verify that the authenticated user matches the customerId
    if (authUser.id !== customerId) {
      console.error('User mismatch:', { authUserId: authUser.id, customerId });
      return new Response(
        JSON.stringify({ error: 'Vous ne pouvez accepter que vos propres commandes' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Customer accepting food delivery fees:', { orderId, customerId, paymentMethod });

    // Récupérer la commande food
    const { data: order, error: orderError } = await supabase
      .from('food_orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('Order not found:', orderError);
      return new Response(
        JSON.stringify({ error: 'Commande introuvable' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Vérifier que le client est bien le propriétaire
    if (order.customer_id !== customerId) {
      console.error('Order ownership mismatch:', { orderCustomerId: order.customer_id, requestCustomerId: customerId });
      return new Response(
        JSON.stringify({ error: 'Cette commande appartient à un autre utilisateur' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Vérifier le statut
    if (order.status !== 'pending_delivery_approval' && order.delivery_payment_status !== 'pending_approval') {
      console.error('Invalid order status:', order.status);
      return new Response(
        JSON.stringify({ error: `Impossible d'accepter: commande en statut "${order.status}"` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const deliveryFee = order.delivery_fee || 0;
    let actualPaymentMethod = paymentMethod;

    // Gérer le paiement selon la méthode
    if (paymentMethod === 'wallet' && deliveryFee > 0) {
      const { data: wallet, error: walletError } = await supabase
        .from('user_wallets')
        .select('balance, bonus_balance')
        .eq('user_id', customerId)
        .single();

      if (walletError || !wallet) {
        console.warn('Wallet not found, switching to cash');
        actualPaymentMethod = 'cash';
      } else {
        const bonusBalance = Number(wallet.bonus_balance || 0);
        const mainBalance = Number(wallet.balance || 0);
        const totalBalance = bonusBalance + mainBalance;

        if (totalBalance < deliveryFee) {
          console.log('Insufficient balance, switching to cash:', { totalBalance, deliveryFee });
          actualPaymentMethod = 'cash';
        } else {
          // Débiter le wallet
          if (bonusBalance >= deliveryFee) {
            await supabase
              .from('user_wallets')
              .update({
                bonus_balance: bonusBalance - deliveryFee,
                updated_at: new Date().toISOString()
              })
              .eq('user_id', customerId);
          } else {
            await supabase
              .from('user_wallets')
              .update({
                balance: mainBalance - deliveryFee,
                updated_at: new Date().toISOString()
              })
              .eq('user_id', customerId);
          }

          // Log la transaction
          await supabase
            .from('wallet_transactions')
            .insert({
              user_id: customerId,
              amount: -deliveryFee,
              transaction_type: 'delivery_fee',
              reference_id: orderId,
              reference_type: 'food_order',
              description: 'Frais de livraison commande food',
              status: 'completed'
            });
        }
      }
    }

    // Mettre à jour la commande
    const updateData: any = {
      delivery_payment_status: actualPaymentMethod === 'wallet' ? 'paid' : 'pending_cash',
      delivery_fee_payment_method: actualPaymentMethod,
      updated_at: new Date().toISOString()
    };

    // Si le statut était pending_delivery_approval, passer à preparing
    if (order.status === 'pending_delivery_approval') {
      updateData.status = 'preparing';
    }

    const { error: updateError } = await supabase
      .from('food_orders')
      .update(updateData)
      .eq('id', orderId);

    if (updateError) throw updateError;

    // Notifier le restaurant
    await supabase
      .from('push_notifications')
      .insert({
        user_id: order.restaurant_id,
        title: 'Livraison confirmée',
        message: `Le client a accepté les frais de livraison (${deliveryFee} CDF). Un livreur sera assigné.`,
        notification_type: 'food_order',
        metadata: { order_id: orderId }
      });

    // Déclencher le dispatch livreur si nécessaire
    if (!order.driver_id) {
      try {
        await supabase.functions.invoke('food-delivery-dispatcher', {
          body: {
            orderId,
            restaurantId: order.restaurant_id,
            deliveryCoordinates: order.delivery_coordinates
          }
        });
      } catch (dispatchError) {
        console.error('Error dispatching driver:', dispatchError);
      }
    }

    console.log('Food delivery fee accepted successfully', { orderId, actualPaymentMethod });

    return new Response(
      JSON.stringify({ 
        success: true,
        orderId,
        paymentMethod: actualPaymentMethod
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in accept-food-delivery-fee:', error);
    return new Response(
      JSON.stringify({ error: (error as any).message || 'Erreur lors du traitement' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
