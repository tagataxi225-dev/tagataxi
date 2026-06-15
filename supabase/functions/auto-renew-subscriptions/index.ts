import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SubscriptionToRenew {
  id: string;
  driver_id: string;
  plan_id: string;
  end_date: string;
  payment_method: string;
  auto_renew: boolean;
  subscription_plans?: {
    id: string;
    name: string;
    price: number;
    currency: string;
    duration_days: number;
    rides_included: number;
  };
  chauffeurs?: {
    display_name: string;
    email: string;
    phone_number: string;
  };
}

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔄 Auto-renewal process started');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Trouver les abonnements à renouveler (expirent dans les 3 prochains jours + auto_renew activé)
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    const { data: subscriptionsToRenew, error: fetchError } = await supabase
      .from('driver_subscriptions')
      .select(`
        *,
        subscription_plans!inner (
          id, name, price, currency, duration_days, rides_included
        ),
        chauffeurs!inner (
          display_name, email, phone_number
        )
      `)
      .eq('status', 'active')
      .eq('auto_renew', true)
      .lte('end_date', threeDaysFromNow.toISOString())
      .gte('end_date', new Date().toISOString());

    if (fetchError) {
      console.error('❌ Error fetching subscriptions:', fetchError);
      throw fetchError;
    }

    console.log(`📋 Found ${subscriptionsToRenew?.length || 0} subscriptions to renew`);

    if (!subscriptionsToRenew || subscriptionsToRenew.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No subscriptions to renew',
          processed: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results = {
      success: 0,
      failed: 0,
      details: [] as any[]
    };

    // 2. Traiter chaque abonnement
    for (const subscription of subscriptionsToRenew as SubscriptionToRenew[]) {
      console.log(`🔄 Processing subscription ${subscription.id} for driver ${subscription.chauffeurs?.display_name}`);

      const oldEndDate = new Date(subscription.end_date);
      const newEndDate = new Date(oldEndDate);
      newEndDate.setDate(newEndDate.getDate() + (subscription.subscription_plans?.duration_days || 30));

      // 3. Tenter le paiement (simulé pour l'instant - à intégrer avec Mobile Money)
      let paymentStatus = 'success';
      let failureReason = null;
      let paymentReference = `RENEW-${Date.now()}-${subscription.id.slice(0, 8)}`;

      // TODO: Intégrer vraiment avec Orange Money / M-Pesa
      // const paymentResult = await processMobileMoneyPayment({
      //   phone: subscription.chauffeurs?.phone_number,
      //   amount: subscription.subscription_plans?.price,
      //   currency: subscription.subscription_plans?.currency,
      //   reference: paymentReference
      // });

      // Simuler un échec aléatoire pour test (10% de chances)
      if (Math.random() < 0.1) {
        paymentStatus = 'failed';
        failureReason = 'Insufficient funds or payment declined';
      }

      // 4. Créer l'entrée dans l'historique
      const { error: historyError } = await supabase
        .from('subscription_renewal_history')
        .insert({
          subscription_id: subscription.id,
          subscription_type: 'driver',
          old_end_date: oldEndDate.toISOString(),
          new_end_date: newEndDate.toISOString(),
          payment_method: subscription.payment_method,
          payment_status: paymentStatus,
          payment_reference: paymentReference,
          amount_charged: subscription.subscription_plans?.price,
          currency: subscription.subscription_plans?.currency,
          failure_reason: failureReason,
          retry_count: 0,
          next_retry_at: paymentStatus === 'failed' 
            ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Retry dans 24h
            : null
        });

      if (historyError) {
        console.error('❌ Error creating renewal history:', historyError);
      }

      // 5. Si paiement réussi, renouveler l'abonnement
      if (paymentStatus === 'success') {
        const { error: renewError } = await supabase
          .from('driver_subscriptions')
          .update({ 
            end_date: newEndDate.toISOString(),
            rides_remaining: subscription.subscription_plans?.rides_included || 0,
            updated_at: new Date().toISOString()
          })
          .eq('id', subscription.id);

        if (renewError) {
          console.error('❌ Error renewing subscription:', renewError);
          results.failed++;
          results.details.push({
            subscription_id: subscription.id,
            driver: subscription.chauffeurs?.display_name,
            status: 'error',
            error: renewError.message
          });
        } else {
          console.log(`✅ Successfully renewed subscription ${subscription.id}`);
          results.success++;
          results.details.push({
            subscription_id: subscription.id,
            driver: subscription.chauffeurs?.display_name,
            status: 'renewed',
            new_end_date: newEndDate.toISOString()
          });

          // ✅ PHASE 2: Appeler commission admin (10%)
          try {
            const { error: adminCommError } = await supabase.functions.invoke(
              'admin-subscription-commission',
              {
                body: {
                  subscription_id: subscription.id,
                  driver_id: subscription.driver_id,
                  subscription_amount: subscription.subscription_plans?.price || 0
                }
              }
            );

            if (adminCommError) {
              console.error('⚠️ Admin commission failed:', adminCommError);
            } else {
              console.log('✅ Admin commission processed (10%)');
            }
          } catch (commErr) {
            console.error('⚠️ Admin commission error:', commErr);
          }

          // ✅ PHASE 2: Vérifier partenaire et appeler commission partenaire (5%)
          const { data: driverCode } = await supabase
            .from('driver_codes')
            .select('partner_id')
            .eq('driver_id', subscription.driver_id)
            .maybeSingle();

          if (driverCode?.partner_id) {
            try {
              const { error: partnerCommError } = await supabase.functions.invoke(
                'partner-subscription-commission',
                {
                  body: {
                    subscription_id: subscription.id,
                    driver_id: subscription.driver_id,
                    subscription_amount: subscription.subscription_plans?.price || 0,
                    partner_id: driverCode.partner_id
                  }
                }
              );

              if (partnerCommError) {
                console.error('⚠️ Partner commission failed:', partnerCommError);
              } else {
                console.log('✅ Partner commission processed (5%)');
              }
            } catch (partCommErr) {
              console.error('⚠️ Partner commission error:', partCommErr);
            }
          }

          // Créer une alerte de succès
          await supabase.rpc('create_subscription_alert', {
            p_subscription_id: subscription.id,
            p_subscription_type: 'driver',
            p_alert_type: 'expiring_soon',
            p_message: `Votre abonnement ${subscription.subscription_plans?.name} a été renouvelé automatiquement jusqu'au ${newEndDate.toLocaleDateString('fr-FR')}`,
            p_severity: 'info',
            p_metadata: {
              payment_reference: paymentReference,
              amount: subscription.subscription_plans?.price,
              currency: subscription.subscription_plans?.currency
            }
          });
        }
      } else {
        // 6. Si échec paiement, créer une alerte critique
        console.log(`⚠️ Payment failed for subscription ${subscription.id}`);
        results.failed++;
        results.details.push({
          subscription_id: subscription.id,
          driver: subscription.chauffeurs?.display_name,
          status: 'payment_failed',
          reason: failureReason
        });

        await supabase.rpc('create_subscription_alert', {
          p_subscription_id: subscription.id,
          p_subscription_type: 'driver',
          p_alert_type: 'renewal_failed',
          p_message: `Échec du renouvellement automatique de votre abonnement. Raison: ${failureReason}. Veuillez recharger votre compte.`,
          p_severity: 'critical',
          p_metadata: {
            failure_reason: failureReason,
            amount_required: subscription.subscription_plans?.price,
            currency: subscription.subscription_plans?.currency,
            next_retry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          }
        });
      }
    }

    console.log(`✅ Auto-renewal process completed: ${results.success} success, ${results.failed} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Auto-renewal process completed',
        processed: subscriptionsToRenew.length,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Auto-renewal error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: (error as any).message || 'Unknown error during auto-renewal' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
