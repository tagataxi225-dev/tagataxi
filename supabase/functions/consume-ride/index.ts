import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-health-check',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

interface ConsumeRideRequest {
  driver_id: string;
  booking_id: string;
  service_type: 'transport' | 'delivery' | 'marketplace';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Authentification
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { driver_id, booking_id, service_type }: ConsumeRideRequest = await req.json();

    // Validation
    if (!driver_id || !booking_id || !service_type) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (user.id !== driver_id) {
      return new Response(JSON.stringify({ error: 'Unauthorized access' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log(`🎫 Consuming ride for driver ${driver_id}, booking ${booking_id}`);

    // Récupérer l'abonnement actif
    const { data: subscription, error: subError } = await supabaseService
      .from('driver_subscriptions')
      .select('*')
      .eq('driver_id', driver_id)
      .eq('status', 'active')
      .gte('end_date', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (subError || !subscription) {
      return new Response(JSON.stringify({ 
        error: 'No active subscription',
        message: 'Aucun abonnement actif trouvé. Veuillez renouveler votre abonnement.'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Vérifier rides_remaining
    if (subscription.rides_remaining <= 0) {
      return new Response(JSON.stringify({ 
        error: 'No rides remaining',
        message: 'Plus de courses disponibles. Veuillez renouveler votre abonnement.',
        subscription_id: subscription.id,
        rides_remaining: 0
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Décrémenter rides_remaining
    const newRidesRemaining = subscription.rides_remaining - 1;
    const newRidesUsed = subscription.rides_used + 1;
    const newStatus = newRidesRemaining === 0 ? 'expired' : 'active';

    const { error: updateError } = await supabaseService
      .from('driver_subscriptions')
      .update({
        rides_used: newRidesUsed,
        rides_remaining: newRidesRemaining,
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', subscription.id);

    if (updateError) {
      console.error('❌ Failed to update subscription:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to consume ride' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Logger la consommation
    await supabaseService.from('activity_logs').insert({
      user_id: driver_id,
      activity_type: 'ride_consumed',
      description: `Course ${service_type} terminée (${newRidesUsed}/${subscription.rides_used + subscription.rides_remaining})`,
      metadata: {
        subscription_id: subscription.id,
        booking_id,
        service_type,
        rides_used: newRidesUsed,
        rides_remaining: newRidesRemaining,
        status: newStatus
      }
    });

    // Notifier si abonnement épuisé
    if (newRidesRemaining === 0) {
      await supabaseService.from('system_notifications').insert({
        user_id: driver_id,
        notification_type: 'subscription_depleted',
        title: '⚠️ Abonnement Épuisé',
        message: 'Vous avez utilisé toutes vos courses. Renouvelez votre abonnement pour continuer.',
        data: {
          subscription_id: subscription.id,
          rides_used: newRidesUsed
        },
        priority: 'high'
      });
    } else if (newRidesRemaining <= 2) {
      // Alerte si moins de 3 courses restantes
      await supabaseService.from('system_notifications').insert({
        user_id: driver_id,
        notification_type: 'subscription_low_rides',
        title: '⚡ Courses Bientôt Épuisées',
        message: `Plus que ${newRidesRemaining} course(s) restante(s). Pensez à renouveler !`,
        data: {
          subscription_id: subscription.id,
          rides_remaining: newRidesRemaining
        },
        priority: 'medium'
      });
    }

    console.log(`✅ Ride consumed. Remaining: ${newRidesRemaining}`);

    return new Response(JSON.stringify({
      success: true,
      subscription: {
        id: subscription.id,
        rides_used: newRidesUsed,
        rides_remaining: newRidesRemaining,
        status: newStatus
      },
      message: newRidesRemaining === 0 
        ? 'Dernière course consommée. Veuillez renouveler.' 
        : `Course consommée. ${newRidesRemaining} restante(s).`
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('❌ Consume ride error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
