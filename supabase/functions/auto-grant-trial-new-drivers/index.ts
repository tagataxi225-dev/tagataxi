import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NewDriverRequest {
  driver_id: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { driver_id }: NewDriverRequest = await req.json();
    console.log(`🎁 Auto-granting trial to new driver: ${driver_id}`);

    // Vérifier que le chauffeur existe
    const { data: driver, error: driverError } = await supabase
      .from('chauffeurs')
      .select('id, user_id, email, display_name')
      .eq('user_id', driver_id)
      .single();

    if (driverError || !driver) {
      console.error('❌ Driver not found:', driverError);
      return new Response(
        JSON.stringify({ error: 'Driver not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // Vérifier qu'il n'a pas déjà un abonnement
    const { data: existingSub } = await supabase
      .from('driver_subscriptions')
      .select('id')
      .eq('driver_id', driver_id)
      .eq('status', 'active')
      .single();

    if (existingSub) {
      console.log(`⚠️ Driver ${driver_id} already has an active subscription`);
      return new Response(
        JSON.stringify({ message: 'Driver already has active subscription' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Récupérer le plan d'essai gratuit
    const { data: trialPlan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_trial', true)
      .eq('is_active', true)
      .single();

    if (planError || !trialPlan) {
      console.error('❌ Trial plan not found:', planError);
      return new Response(
        JSON.stringify({ error: 'Trial plan not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Créer l'abonnement d'essai (5 courses, 30 jours)
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);

    const { data: subscription, error: subError } = await supabase
      .from('driver_subscriptions')
      .insert({
        driver_id,
        plan_id: trialPlan.id,
        status: 'active',
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        payment_method: 'auto_trial',
        rides_used: 0,
        rides_remaining: trialPlan.rides_included || 5,
        is_trial: true,
        auto_renew: false
      })
      .select()
      .single();

    if (subError) {
      console.error('❌ Failed to create trial subscription:', subError);
      return new Response(
        JSON.stringify({ error: 'Failed to create trial', details: subError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Logger l'activation
    await supabase.from('activity_logs').insert({
      user_id: driver_id,
      activity_type: 'trial_auto_granted',
      description: `Essai gratuit automatique activé pour nouveau chauffeur (${trialPlan.rides_included} courses)`,
      metadata: {
        subscription_id: subscription.id,
        plan_id: trialPlan.id,
        rides_included: trialPlan.rides_included,
        end_date: endDate.toISOString()
      }
    });

    // Notifier le chauffeur
    await supabase.from('system_notifications').insert({
      user_id: driver_id,
      notification_type: 'trial_activated',
      title: '🎉 Bienvenue chez Kwenda !',
      message: `Votre essai gratuit de ${trialPlan.rides_included} courses est activé ! Profitez-en pendant 30 jours.`,
      data: {
        subscription_id: subscription.id,
        rides_remaining: trialPlan.rides_included,
        end_date: endDate.toISOString()
      },
      priority: 'high'
    });

    console.log(`✅ Trial granted successfully to ${driver_id}`);

    return new Response(
      JSON.stringify({
        success: true,
        subscription: {
          id: subscription.id,
          rides_included: trialPlan.rides_included,
          rides_remaining: subscription.rides_remaining,
          end_date: subscription.end_date
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('❌ Error in auto-grant-trial:', error);
    return new Response(
      JSON.stringify({ error: (error as any).message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
