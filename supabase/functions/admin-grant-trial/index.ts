// Version: 2025-11-07T12:00:00Z - Admin functions deployment
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-health-check',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

interface GrantTrialRequest {
  driverId: string;
  trialDurationDays?: number;
  ridesIncluded?: number;
}

Deno.serve(async (req) => {
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

    // Vérifier que l'utilisateur est admin
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Non authentifié' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const { data: adminCheck } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .eq('is_active', true)
      .single();

    if (!adminCheck) {
      return new Response(
        JSON.stringify({ error: 'Accès non autorisé - Admin uniquement' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    const { driverId, trialDurationDays = 30, ridesIncluded = 20 }: GrantTrialRequest = await req.json();

    console.log(`Admin ${user.id} granting trial to driver ${driverId}`);

    // Vérifier que le chauffeur existe et n'a pas déjà d'essai actif
    const { data: driver, error: driverError } = await supabaseClient
      .from('chauffeurs')
      .select('id, user_id, email, display_name')
      .eq('user_id', driverId)
      .single();

    if (driverError || !driver) {
      return new Response(
        JSON.stringify({ error: 'Chauffeur introuvable' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // Vérifier s'il a déjà un abonnement actif
    const { data: existingSubscription } = await supabaseClient
      .from('driver_subscriptions')
      .select('id, status, is_trial')
      .eq('driver_id', driverId)
      .eq('status', 'active')
      .gte('end_date', new Date().toISOString())
      .single();

    if (existingSubscription) {
      return new Response(
        JSON.stringify({ 
          error: existingSubscription.is_trial 
            ? 'Ce chauffeur a déjà un essai actif' 
            : 'Ce chauffeur a déjà un abonnement actif'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Récupérer le plan d'essai gratuit
    const { data: trialPlan, error: planError } = await supabaseClient
      .from('subscription_plans')
      .select('id, name, price, rides_included')
      .eq('is_trial', true)
      .eq('is_active', true)
      .single();

    if (planError || !trialPlan) {
      return new Response(
        JSON.stringify({ error: 'Plan d\'essai introuvable' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Créer l'abonnement d'essai
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + trialDurationDays);

    const { data: subscription, error: subscriptionError } = await supabaseClient
      .from('driver_subscriptions')
      .insert({
        driver_id: driverId,
        plan_id: trialPlan.id,
        status: 'active',
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        payment_method: 'admin_granted',
        rides_used: 0,
        rides_remaining: ridesIncluded,
        is_trial: true,
        trial_granted_by: user.id,
        trial_granted_at: new Date().toISOString(),
        auto_renew: false
      })
      .select()
      .single();

    if (subscriptionError) {
      console.error('Subscription creation error:', subscriptionError);
      return new Response(
        JSON.stringify({ error: 'Erreur lors de la création de l\'abonnement', details: subscriptionError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Logger l'action
    await supabaseClient.from('activity_logs').insert({
      user_id: user.id,
      activity_type: 'trial_granted',
      description: `Essai gratuit accordé au chauffeur ${driver.display_name || driver.email}`,
      metadata: {
        driver_id: driverId,
        subscription_id: subscription.id,
        duration_days: trialDurationDays,
        rides_included: ridesIncluded
      }
    });

    console.log(`Trial subscription created successfully: ${subscription.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        subscription: {
          id: subscription.id,
          driver: {
            id: driver.user_id,
            name: driver.display_name,
            email: driver.email
          },
          start_date: subscription.start_date,
          end_date: subscription.end_date,
          rides_included: ridesIncluded,
          rides_remaining: subscription.rides_remaining
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error in admin-grant-trial:', error);
    return new Response(
      JSON.stringify({ error: (error as any).message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});