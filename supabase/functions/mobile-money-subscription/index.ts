import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MobileMoneyRequest {
  plan_id: string;
  payment_method: 'orange_money' | 'mpesa' | 'airtel_money';
  phone_number: string;
  driver_id: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Authentification
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { plan_id, payment_method, phone_number, driver_id }: MobileMoneyRequest = await req.json();

    // Validation
    if (!plan_id || !payment_method || !phone_number || !driver_id) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (user.id !== driver_id) {
      return new Response(JSON.stringify({ error: 'Unauthorized driver access' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Récupérer le plan
    const { data: plan, error: planError } = await supabaseService
      .from('subscription_plans')
      .select('*')
      .eq('id', plan_id)
      .eq('is_active', true)
      .single();

    if (planError || !plan) {
      return new Response(JSON.stringify({ error: 'Invalid subscription plan' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Vérifier abonnement actif
    const { data: activeSub } = await supabaseService
      .from('driver_subscriptions')
      .select('*')
      .eq('driver_id', driver_id)
      .eq('status', 'active')
      .gte('end_date', new Date().toISOString())
      .single();

    if (activeSub) {
      return new Response(JSON.stringify({ 
        error: 'Active subscription exists',
        message: `Vous avez déjà un abonnement actif avec ${activeSub.rides_remaining} courses restantes`
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`💳 Processing Mobile Money payment: ${payment_method} for ${plan.name}`);

    // Simulation paiement Mobile Money (90% succès)
    const paymentSuccess = Math.random() > 0.1;
    const transactionRef = `MM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    if (!paymentSuccess) {
      await supabaseService.from('activity_logs').insert({
        user_id: driver_id,
        activity_type: 'mobile_money_payment_failed',
        description: `Paiement Mobile Money échoué pour ${plan.name}`,
        amount: plan.price,
        currency: plan.currency,
        metadata: { 
          plan_id, 
          payment_method, 
          phone_number,
          transaction_ref: transactionRef
        }
      });

      return new Response(JSON.stringify({ 
        error: 'Payment failed',
        message: `Échec du paiement ${payment_method}. Vérifiez votre solde et réessayez.`,
        transaction_ref: transactionRef
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Calculer dates
    const startDate = new Date();
    const endDate = new Date();
    if (plan.duration_type === 'weekly') {
      endDate.setDate(startDate.getDate() + 7);
    } else if (plan.duration_type === 'monthly') {
      endDate.setDate(startDate.getDate() + 30);
    }

    // Créer l'abonnement
    const { data: subscription, error: subError } = await supabaseService
      .from('driver_subscriptions')
      .insert({
        driver_id,
        plan_id,
        status: 'active',
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        payment_method,
        last_payment_date: startDate.toISOString(),
        next_payment_date: endDate.toISOString(),
        rides_used: 0,
        rides_remaining: plan.rides_included,
        is_trial: false,
        auto_renew: true
      })
      .select()
      .single();

    if (subError) {
      console.error('❌ Subscription creation failed:', subError);
      return new Response(JSON.stringify({ error: 'Failed to create subscription' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Logger le paiement
    await supabaseService.from('wallet_transactions').insert({
      user_id: driver_id,
      transaction_type: 'subscription_payment',
      amount: -plan.price,
      currency: plan.currency,
      description: `Abonnement ${plan.name} via ${payment_method}`,
      reference_type: 'subscription',
      reference_id: subscription.id,
      metadata: {
        payment_method,
        phone_number,
        transaction_ref: transactionRef
      }
    });

    // Logger activité
    await supabaseService.from('activity_logs').insert({
      user_id: driver_id,
      activity_type: 'subscription_activated_mobile_money',
      description: `Abonnement ${plan.name} activé via ${payment_method} (${plan.rides_included} courses)`,
      amount: plan.price,
      currency: plan.currency,
      metadata: {
        plan_id,
        subscription_id: subscription.id,
        payment_method,
        transaction_ref: transactionRef,
        rides_included: plan.rides_included
      }
    });

    // Notification
    await supabaseService.from('system_notifications').insert({
      user_id: driver_id,
      notification_type: 'subscription_activated',
      title: '✅ Abonnement Activé',
      message: `Votre abonnement ${plan.name} est actif avec ${plan.rides_included} courses !`,
      data: {
        subscription_id: subscription.id,
        rides_remaining: plan.rides_included,
        payment_method,
        end_date: endDate.toISOString()
      },
      priority: 'high'
    });

    console.log(`✅ Mobile Money subscription created: ${subscription.id}`);

    return new Response(JSON.stringify({
      success: true,
      subscription: {
        id: subscription.id,
        rides_included: plan.rides_included,
        rides_remaining: subscription.rides_remaining,
        end_date: subscription.end_date,
        payment_method,
        transaction_ref: transactionRef
      },
      message: 'Abonnement activé avec succès'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('❌ Mobile Money subscription error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
