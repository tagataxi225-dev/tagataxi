import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-health-check',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

interface SubscribeRequest {
  action: 'subscribe' | 'renew' | 'upgrade' | 'cancel' | 'check_expiring';
  vehicle_id?: string;
  plan_id?: string;
  subscription_id?: string;
  partner_id?: string;
  payment_method?: 'wallet' | 'mobile_money';
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body: SubscribeRequest = await req.json();
    console.log('📦 Rental subscription request:', body);

    switch (body.action) {
      case 'subscribe': {
        if (!body.vehicle_id || !body.plan_id || !body.partner_id) {
          throw new Error('Missing required fields: vehicle_id, plan_id, partner_id');
        }

        // 1. Vérifier le plan
        const { data: plan, error: planError } = await supabase
          .from('rental_subscription_plans')
          .select('*')
          .eq('id', body.plan_id)
          .single();

        if (planError || !plan) {
          console.error('❌ Plan not found:', planError);
          throw new Error('Plan non trouvé');
        }

        console.log('✅ Plan found:', plan.name, plan.monthly_price);

        // 2. Vérifier le véhicule
        const { data: vehicle, error: vehicleError } = await supabase
          .from('rental_vehicles')
          .select('*, rental_vehicle_categories(name)')
          .eq('id', body.vehicle_id)
          .single();

        if (vehicleError || !vehicle) {
          console.error('❌ Vehicle not found:', vehicleError);
          throw new Error('Véhicule non trouvé');
        }

        console.log('✅ Vehicle found:', vehicle.name);

        // 3. Vérifier le solde wallet si paiement wallet
        if (body.payment_method === 'wallet') {
          const { data: wallet, error: walletError } = await supabase
            .from('user_wallets')
            .select('balance, ecosystem_credits')
            .eq('partner_id', body.partner_id)
            .single();

          if (walletError) {
            console.log('⚠️ No wallet found for partner, checking user wallet');
          } else {
            const totalBalance = (wallet?.balance || 0) + (wallet?.ecosystem_credits || 0);
            if (totalBalance < plan.monthly_price) {
              throw new Error(`Solde insuffisant. Requis: ${plan.monthly_price} CDF, Disponible: ${totalBalance} CDF`);
            }
          }
        }

        // 4. Vérifier si abonnement actif existe déjà
        const { data: existingSub } = await supabase
          .from('partner_rental_subscriptions')
          .select('id')
          .eq('vehicle_id', body.vehicle_id)
          .eq('status', 'active')
          .single();

        if (existingSub) {
          throw new Error('Un abonnement actif existe déjà pour ce véhicule');
        }

        // 5. Créer l'abonnement
        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 1);

        const { data: subscription, error: subError } = await supabase
          .from('partner_rental_subscriptions')
          .insert({
            partner_id: body.partner_id,
            plan_id: body.plan_id,
            vehicle_id: body.vehicle_id,
            status: 'active',
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
            payment_method: body.payment_method || 'wallet'
          })
          .select()
          .single();

        if (subError) {
          console.error('❌ Failed to create subscription:', subError);
          throw new Error('Échec de la création de l\'abonnement');
        }

        console.log('✅ Subscription created:', subscription.id);

        // 6. Activer le véhicule
        const { error: activateError } = await supabase
          .from('rental_vehicles')
          .update({ is_active: true })
          .eq('id', body.vehicle_id);

        if (activateError) {
          console.error('⚠️ Failed to activate vehicle:', activateError);
        }

        console.log('✅ Vehicle activated');

        return new Response(JSON.stringify({
          success: true,
          subscription_id: subscription.id,
          message: 'Abonnement activé avec succès'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'renew': {
        if (!body.subscription_id) {
          throw new Error('Missing subscription_id');
        }

        // 1. Récupérer l'abonnement
        const { data: sub, error: subError } = await supabase
          .from('partner_rental_subscriptions')
          .select('*, rental_subscription_plans(*)')
          .eq('id', body.subscription_id)
          .single();

        if (subError || !sub) {
          throw new Error('Abonnement non trouvé');
        }

        // 2. Calculer nouvelle date de fin
        const currentEnd = new Date(sub.end_date);
        const newEnd = new Date(Math.max(currentEnd.getTime(), Date.now()));
        newEnd.setMonth(newEnd.getMonth() + 1);

        // 3. Mettre à jour
        const { error: updateError } = await supabase
          .from('partner_rental_subscriptions')
          .update({
            end_date: newEnd.toISOString(),
            status: 'active',
            updated_at: new Date().toISOString()
          })
          .eq('id', body.subscription_id);

        if (updateError) {
          throw new Error('Échec du renouvellement');
        }

        // 4. Réactiver le véhicule si nécessaire
        if (sub.vehicle_id) {
          await supabase
            .from('rental_vehicles')
            .update({ is_active: true })
            .eq('id', sub.vehicle_id);
        }

        console.log('✅ Subscription renewed:', body.subscription_id);

        return new Response(JSON.stringify({
          success: true,
          new_end_date: newEnd.toISOString(),
          message: 'Abonnement renouvelé avec succès'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'cancel': {
        if (!body.subscription_id) {
          throw new Error('Missing subscription_id');
        }

        const { data: sub, error: subError } = await supabase
          .from('partner_rental_subscriptions')
          .update({ status: 'cancelled' })
          .eq('id', body.subscription_id)
          .select('vehicle_id')
          .single();

        if (subError) {
          throw new Error('Échec de l\'annulation');
        }

        // Désactiver le véhicule
        if (sub?.vehicle_id) {
          await supabase
            .from('rental_vehicles')
            .update({ is_active: false })
            .eq('id', sub.vehicle_id);
        }

        console.log('✅ Subscription cancelled:', body.subscription_id);

        return new Response(JSON.stringify({
          success: true,
          message: 'Abonnement annulé'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'check_expiring': {
        // Récupérer les abonnements qui expirent dans les 7 jours
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

        const { data: expiring, error } = await supabase
          .from('partner_rental_subscriptions')
          .select(`
            *,
            rental_vehicles(name, brand, model),
            rental_subscription_plans(name, tier_name),
            partenaires(display_name, user_id)
          `)
          .eq('status', 'active')
          .lte('end_date', sevenDaysFromNow.toISOString())
          .gte('end_date', new Date().toISOString());

        if (error) {
          console.error('❌ Failed to check expiring:', error);
          throw new Error('Échec de la vérification');
        }

        console.log(`📋 Found ${expiring?.length || 0} expiring subscriptions`);

        // TODO: Envoyer des notifications aux partenaires

        return new Response(JSON.stringify({
          success: true,
          count: expiring?.length || 0,
          subscriptions: expiring
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      default:
        throw new Error(`Unknown action: ${body.action}`);
    }

  } catch (error: unknown) {
    console.error('❌ Rental subscription error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: (error as any).message || 'Une erreur est survenue'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
