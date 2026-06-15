import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-health-check',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

interface TopUpRequest {
  amount: number;
  payment_method: 'orange_money' | 'm_pesa' | 'airtel_money';
  phone_number: string;
  currency: string;
}

interface OrangeMoneyTokenResponse {
  token_type: string;
  access_token: string;
  expires_in: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('💰 [wallet-restaurant-topup] Starting top-up process');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Vérifier l'authentification
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      console.error('❌ [wallet-restaurant-topup] Auth error:', authError);
      throw new Error('Non authentifié');
    }

    console.log('✅ [wallet-restaurant-topup] User authenticated:', user.id);

    // Vérifier que l'utilisateur est un restaurant
    const { data: restaurant, error: restaurantError } = await supabaseClient
      .from('restaurant_profiles')
      .select('id, restaurant_name')
      .eq('user_id', user.id)
      .single();

    if (restaurantError || !restaurant) {
      console.error('❌ [wallet-restaurant-topup] Not a restaurant:', restaurantError);
      throw new Error('Profil restaurant non trouvé');
    }

    console.log('✅ [wallet-restaurant-topup] Restaurant found:', restaurant.restaurant_name);

    const body: TopUpRequest = await req.json();
    const { amount, payment_method, phone_number, currency } = body;

    // Validation
    if (!amount || amount < 5000 || amount > 500000) {
      throw new Error('Montant invalide (min: 5000, max: 500000)');
    }

    if (!phone_number || phone_number.length < 9) {
      throw new Error('Numéro de téléphone invalide');
    }

    console.log('💰 [wallet-restaurant-topup] Processing:', {
      amount,
      payment_method,
      phone_number: phone_number.substring(0, 5) + '***',
      currency,
    });

    // Calculer les frais (2%)
    const feesAmount = Math.round(amount * 0.02);
    const netAmount = amount - feesAmount;

    // Générer référence unique (UUID pour Orange Money B2B)
    const transactionRef = crypto.randomUUID();

    // Récupérer ou créer le wallet
    let { data: wallet, error: walletError } = await supabaseService
      .from('user_wallets')
      .select('*')
      .eq('user_id', user.id)
      .eq('currency', currency)
      .single();

    if (walletError && walletError.code === 'PGRST116') {
      console.log('💰 [wallet-restaurant-topup] Creating new wallet');
      const { data: newWallet, error: createError } = await supabaseService
        .from('user_wallets')
        .insert({
          user_id: user.id,
          balance: 0,
          bonus_balance: 0,
          currency: currency,
        })
        .select()
        .single();

      if (createError) throw createError;
      wallet = newWallet;
    } else if (walletError) {
      throw walletError;
    }

    console.log('💰 [wallet-restaurant-topup] Wallet found:', wallet?.id);

    // ============================================
    // INTÉGRATION ORANGE MONEY B2B RÉEL
    // ============================================
    let paymentSuccessful = false;
    let orangeTransactionId = null;

    if (payment_method === 'orange_money') {
      console.log('🍊 [wallet-restaurant-topup] Starting Orange Money B2B payment');

      const orangeApiUrl = Deno.env.get('ORANGE_MONEY_API_URL');
      const clientId = Deno.env.get('ORANGE_MONEY_CLIENT_ID');
      const clientSecret = Deno.env.get('ORANGE_MONEY_CLIENT_SECRET');
      const posId = Deno.env.get('ORANGE_MONEY_POS_ID');

      if (!orangeApiUrl || !clientId || !clientSecret || !posId) {
        console.warn('⚠️ [wallet-restaurant-topup] Orange Money API not configured, using simulation');
        // Simulation pour dev
        paymentSuccessful = true;
      } else {
        try {
          // Calculer auth header
          const basicAuth = btoa(`${clientId}:${clientSecret}`);
          const authHeaderValue = `Basic ${basicAuth}`;

          // Étape 1 : Obtenir le token OAuth
          console.log('🔑 [wallet-restaurant-topup] Getting OAuth token...');
          const tokenResponse = await fetch('https://api.orange.com/oauth/v3/token', {
            method: 'POST',
            headers: {
              'Authorization': authHeaderValue,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'grant_type=client_credentials',
          });

          if (!tokenResponse.ok) {
            const errorText = await tokenResponse.text();
            console.error('❌ [wallet-restaurant-topup] Token error:', errorText);
            throw new Error(`OAuth token failed: ${tokenResponse.status}`);
          }

          const tokenData: OrangeMoneyTokenResponse = await tokenResponse.json();
          console.log('✅ [wallet-restaurant-topup] OAuth token obtained');

          // Format téléphone pour Orange Money B2B RDC (9 chiffres)
          let formattedPhone = phone_number.replace(/[\s\-\(\)]/g, '');
          if (formattedPhone.startsWith('+243')) {
            formattedPhone = formattedPhone.substring(4);
          } else if (formattedPhone.startsWith('243')) {
            formattedPhone = formattedPhone.substring(3);
          } else if (formattedPhone.startsWith('0')) {
            formattedPhone = formattedPhone.substring(1);
          }

          if (!/^[0-9]{9}$/.test(formattedPhone)) {
            throw new Error(`Format téléphone invalide: ${formattedPhone}. Attendu: 9 chiffres`);
          }

          // Étape 2 : Initier le paiement B2B
          console.log('💳 [wallet-restaurant-topup] Initiating B2B payment...');
          
          const paymentPayload = {
            peerId: formattedPhone,
            peerIdType: 'msisdn',
            amount: amount,
            currency: 'CDF',
            posId: posId,
            transactionId: transactionRef,
          };

          const baseUrl = orangeApiUrl.replace(/\/+$/, '');
          const fullEndpointUrl = `${baseUrl}/transactions/cashout`;

          console.log('🔗 [wallet-restaurant-topup] Endpoint:', fullEndpointUrl);

          const paymentResponse = await fetch(fullEndpointUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${tokenData.access_token}`,
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(paymentPayload),
          });

          if (!paymentResponse.ok && paymentResponse.status !== 202) {
            const errorText = await paymentResponse.text();
            console.error('❌ [wallet-restaurant-topup] B2B Error:', {
              status: paymentResponse.status,
              body: errorText,
            });
            throw new Error(`B2B payment failed: ${paymentResponse.status}`);
          }

          const paymentData = await paymentResponse.json();
          console.log('✅ [wallet-restaurant-topup] B2B Payment response:', JSON.stringify(paymentData));

          // Orange Money renvoie SUCCESS ou PENDING
          paymentSuccessful = paymentData.status === 'SUCCESS' || paymentData.status === 'PENDING';
          orangeTransactionId = paymentData.transactionData?.transactionId || transactionRef;

        } catch (orangeError: any) {
          console.error('❌ [wallet-restaurant-topup] Orange Money error:', orangeError.message);
          throw new Error(`Paiement Orange Money échoué: ${orangeError.message}`);
        }
      }
    } else {
      // Pour les autres providers (M-Pesa, Airtel), simulation pour le moment
      console.log(`📱 [wallet-restaurant-topup] Simulating ${payment_method} payment`);
      paymentSuccessful = true;
    }

    if (paymentSuccessful) {
      // Créditer le wallet
      const { error: updateError } = await supabaseService
        .from('user_wallets')
        .update({
          balance: (wallet!.balance || 0) + netAmount,
          updated_at: new Date().toISOString(),
        })
        .eq('id', wallet!.id);

      if (updateError) {
        console.error('❌ [wallet-restaurant-topup] Update error:', updateError);
        throw updateError;
      }

      console.log('✅ [wallet-restaurant-topup] Wallet credited with:', netAmount);

      // Logger la transaction
      const { error: txError } = await supabaseService.from('wallet_transactions').insert({
        user_id: user.id,
        transaction_type: 'credit',
        amount: netAmount,
        currency: currency,
        description: `Recharge wallet restaurant via ${payment_method}`,
        reference_id: transactionRef,
        reference_type: 'restaurant_topup',
        status: 'completed',
        metadata: {
          payment_method,
          phone_number: phone_number.substring(0, 5) + '***',
          fees_amount: feesAmount,
          gross_amount: amount,
          orange_transaction_id: orangeTransactionId,
          restaurant_id: restaurant.id,
          restaurant_name: restaurant.restaurant_name,
        },
      });

      if (txError) {
        console.warn('⚠️ [wallet-restaurant-topup] Transaction log error:', txError);
      }

      console.log('📧 [wallet-restaurant-topup] Top-up completed for restaurant:', restaurant.restaurant_name);

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Recharge effectuée avec succès',
          transaction_ref: transactionRef,
          net_amount: netAmount,
          fees_amount: feesAmount,
          new_balance: (wallet!.balance || 0) + netAmount,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    } else {
      throw new Error('Paiement Mobile Money échoué');
    }
  } catch (error: any) {
    console.error('❌ [wallet-restaurant-topup] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: (error as any).message || 'Erreur lors de la recharge',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
