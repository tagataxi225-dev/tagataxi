import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-health-check',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

interface SubscriptionPaymentRequest {
  planId: string;
  vehicleId: string;
  provider: string;
  phoneNumber: string;
  autoRenew?: boolean;
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

    const supabaseServiceRole = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify user authentication
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ error: 'Non autorisé' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { planId, vehicleId, provider, phoneNumber, autoRenew = false } = await req.json() as SubscriptionPaymentRequest;

    console.log('Processing subscription payment for user:', user.id, 'plan:', planId, 'vehicle:', vehicleId);

    // Get subscription plan details
    const { data: plan, error: planError } = await supabaseServiceRole
      .from('rental_subscription_plans')
      .select('*, rental_vehicle_categories(*)')
      .eq('id', planId)
      .single();

    if (planError || !plan) {
      console.error('Plan not found:', planError);
      return new Response(
        JSON.stringify({ error: 'Plan d\'abonnement non trouvé' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Verify vehicle ownership
    const { data: vehicle, error: vehicleError } = await supabaseServiceRole
      .from('rental_vehicles')
      .select('*')
      .eq('id', vehicleId)
      .eq('partner_id', user.id)
      .single();

    if (vehicleError || !vehicle) {
      console.error('Vehicle not found or not owned by user:', vehicleError);
      return new Response(
        JSON.stringify({ error: 'Véhicule non trouvé ou non autorisé' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check if subscription already exists for this vehicle
    const { data: existingSubscription } = await supabaseServiceRole
      .from('partner_rental_subscriptions')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .eq('status', 'active')
      .gte('end_date', new Date().toISOString())
      .single();

    if (existingSubscription) {
      return new Response(
        JSON.stringify({ error: 'Ce véhicule a déjà un abonnement actif' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const transactionId = `RENT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create subscription payment record (without subscription_id initially)
    const { data: payment, error: paymentError } = await supabaseServiceRole
      .from('rental_subscription_payments')
      .insert({
        partner_id: user.id,
        amount: plan.monthly_price,
        currency: plan.currency,
        payment_method: 'mobile_money',
        provider: provider,
        phone_number: phoneNumber,
        transaction_id: transactionId,
        status: 'processing',
        subscription_id: null, // Sera mis à jour après création de l'abonnement
        metadata: {
          plan_name: plan.name,
          vehicle_id: vehicleId,
          category: plan.rental_vehicle_categories?.name
        }
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Failed to create payment record:', paymentError);
      return new Response(
        JSON.stringify({ error: 'Erreur lors de la création du paiement' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Payment record created:', payment.id);

    // Simulate mobile money payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    const paymentSuccess = Math.random() > 0.1; // 90% success rate

    if (paymentSuccess) {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1); // 1 month subscription

      // Update payment status to completed
      await supabaseServiceRole
        .from('rental_subscription_payments')
        .update({
          status: 'completed',
          payment_date: new Date().toISOString()
        })
        .eq('id', payment.id);

      // Create active subscription
      const { data: subscription, error: subscriptionError } = await supabaseServiceRole
        .from('partner_rental_subscriptions')
        .insert({
          partner_id: user.id,
          plan_id: planId,
          vehicle_id: vehicleId,
          status: 'active',
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          last_payment_date: new Date().toISOString(),
          next_payment_date: endDate.toISOString(),
          auto_renew: autoRenew
        })
        .select()
        .single();

      if (subscriptionError) {
        console.error('Failed to create subscription:', subscriptionError);
        // Rollback: marquer le paiement comme échoué
        await supabaseServiceRole
          .from('rental_subscription_payments')
          .update({ status: 'failed' })
          .eq('id', payment.id);
        
        return new Response(
          JSON.stringify({ error: 'Erreur lors de la création de l\'abonnement' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Lier le paiement à l'abonnement créé
      await supabaseServiceRole
        .from('rental_subscription_payments')
        .update({ subscription_id: subscription.id })
        .eq('id', payment.id);

      // Log activity
      await supabaseServiceRole
        .from('activity_logs')
        .insert({
          user_id: user.id,
          activity_type: 'subscription_payment',
          description: `Paiement d'abonnement location - ${plan.name}`,
          amount: plan.monthly_price,
          currency: plan.currency,
          reference_type: 'rental_subscription',
          reference_id: subscription.id,
          metadata: {
            provider: provider,
            phone_number: phoneNumber,
            transaction_id: transactionId,
            vehicle_id: vehicleId,
            plan_name: plan.name
          }
        });

      console.log('Subscription created successfully:', subscription.id);

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Paiement réussi, votre véhicule est maintenant visible sur l\'application',
          transactionId: transactionId,
          subscription: {
            id: subscription.id,
            endDate: endDate.toISOString(),
            planName: plan.name
          }
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    } else {
      // Payment failed
      await supabaseServiceRole
        .from('rental_subscription_payments')
        .update({
          status: 'failed'
        })
        .eq('id', payment.id);

      console.log('Payment simulation failed for:', transactionId);

      return new Response(
        JSON.stringify({
          success: false,
          error: 'Paiement échoué, veuillez réessayer'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

  } catch (error: unknown) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Erreur interne du serveur' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});