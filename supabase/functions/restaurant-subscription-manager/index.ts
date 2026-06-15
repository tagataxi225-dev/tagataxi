import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-health-check',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

interface SubscriptionPaymentRequest {
  plan_id: string;
  restaurant_id: string;
  payment_method: 'kwenda_pay' | 'mobile_money';
  auto_renew?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization')!;
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Vérifier l'authentification
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      console.error('❌ Authentication error:', authError);
      return new Response(
        JSON.stringify({ error: 'Non authentifié' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { plan_id, restaurant_id, payment_method, auto_renew = true }: SubscriptionPaymentRequest = await req.json();

    console.log('🍽️ Restaurant Subscription Manager');
    console.log('📋 Plan ID:', plan_id);
    console.log('🏪 Restaurant ID:', restaurant_id);
    console.log('💳 Payment Method:', payment_method);

    // 1. Vérifier que l'utilisateur est propriétaire du restaurant
    const { data: restaurant, error: restaurantError } = await supabaseClient
      .from('restaurant_profiles')
      .select('*')
      .eq('id', restaurant_id)
      .eq('user_id', user.id)
      .single();

    if (restaurantError || !restaurant) {
      console.error('❌ Restaurant not found or unauthorized:', restaurantError);
      return new Response(
        JSON.stringify({ error: 'Restaurant non trouvé ou accès non autorisé' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Récupérer les détails du plan
    const { data: plan, error: planError } = await supabaseClient
      .from('restaurant_subscription_plans')
      .select('*')
      .eq('id', plan_id)
      .eq('is_active', true)
      .single();

    if (planError || !plan) {
      console.error('❌ Plan not found:', planError);
      return new Response(
        JSON.stringify({ error: 'Plan d\'abonnement non trouvé' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('💰 Plan Price:', plan.monthly_price, plan.currency);

    // 3. Vérifier le solde KwendaPay
    const { data: wallet, error: walletError } = await supabaseClient
      .from('user_wallets')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (walletError || !wallet) {
      console.error('❌ Wallet not found:', walletError);
      return new Response(
        JSON.stringify({ error: 'Portefeuille KwendaPay non trouvé', needsTopUp: true }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (wallet.balance < plan.monthly_price) {
      console.warn('⚠️ Insufficient balance:', wallet.balance, '<', plan.monthly_price);
      return new Response(
        JSON.stringify({
          error: 'Solde insuffisant',
          needsTopUp: true,
          required: plan.monthly_price,
          current: wallet.balance,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Débiter le wallet (transaction atomique)
    const newBalance = wallet.balance - plan.monthly_price;
    
    const { error: walletUpdateError } = await supabaseClient
      .from('user_wallets')
      .update({ balance: newBalance })
      .eq('id', wallet.id)
      .eq('balance', wallet.balance); // Optimistic locking

    if (walletUpdateError) {
      console.error('❌ Wallet update failed:', walletUpdateError);
      return new Response(
        JSON.stringify({ error: 'Échec du paiement (conflit de transaction)' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Logger la transaction
    await supabaseClient
      .from('wallet_transactions')
      .insert({
        user_id: user.id,
        wallet_id: wallet.id,
        transaction_type: 'debit',
        amount: plan.monthly_price,
        currency: plan.currency,
        description: `Abonnement ${plan.name} - Kwenda Food`,
        payment_method: 'kwenda_pay',
        status: 'completed',
        reference_type: 'restaurant_subscription',
      });

    console.log('✅ Wallet debited successfully (new balance:', newBalance, ')');

    // 5. Créer l'abonnement
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1); // Abonnement mensuel

    const { data: subscription, error: subscriptionError } = await supabaseClient
      .from('restaurant_subscriptions')
      .insert({
        restaurant_id,
        plan_id,
        status: 'active',
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        payment_method,
        last_payment_date: startDate.toISOString(),
        next_payment_date: endDate.toISOString(),
        auto_renew,
      })
      .select()
      .single();

    if (subscriptionError) {
      console.error('❌ Subscription creation failed:', subscriptionError);
      // Rembourser si l'abonnement échoue
      await supabaseClient.from('wallet_transactions').insert({
        user_id: user.id,
        wallet_id: wallet.id,
        transaction_type: 'credit',
        amount: plan.monthly_price,
        currency: plan.currency,
        description: `Remboursement abonnement ${plan.name}`,
        payment_method: 'kwenda_pay',
        status: 'completed',
        reference_type: 'refund',
      });

      return new Response(
        JSON.stringify({ error: 'Échec de la création de l\'abonnement' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Subscription created:', subscription.id);

    // 6. Activer le restaurant et mettre à jour active_subscription_id
    const { error: updateError } = await supabaseClient
      .from('restaurant_profiles')
      .update({
        is_active: true,
        active_subscription_id: subscription.id,
      })
      .eq('id', restaurant_id);

    if (updateError) {
      console.error('⚠️ Restaurant activation warning:', updateError);
    } else {
      console.log('✅ Restaurant activated with subscription_id:', subscription.id);
    }

    // 7. Logger l'action
    await supabaseClient.from('restaurant_audit_logs').insert({
      restaurant_id,
      action: 'subscription_activated',
      performed_by: user.id,
      metadata: {
        plan_id,
        plan_name: plan.name,
        amount: plan.monthly_price,
        subscription_id: subscription.id,
      },
    });

    console.log('🎉 Subscription successfully activated!');

    return new Response(
      JSON.stringify({
        success: true,
        subscription,
        message: 'Abonnement activé avec succès',
        expiresAt: endDate.toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('❌ Subscription manager error:', error);
    return new Response(
      JSON.stringify({ error: (error as any).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
