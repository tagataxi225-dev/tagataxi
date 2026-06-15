import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-health-check',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

/**
 * VENDOR SUBSCRIPTION MANAGER
 * 
 * Cette Edge Function gère les abonnements pour les vendeurs marketplace.
 * STATUT: PRÉPARATION - Système actuellement INACTIF
 * 
 * Activation future prévue quand le modèle d'abonnement vendeurs sera lancé.
 */

interface VendorSubscriptionRequest {
  plan_id: string
  vendor_id: string
  payment_method: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // ✅ FEATURE ACTIVÉE
    const VENDOR_SUBSCRIPTIONS_ENABLED = true

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { plan_id, payment_method } = await req.json() as VendorSubscriptionRequest

    // 1. Récupérer le plan
    const { data: plan, error: planError } = await supabaseClient
      .from('vendor_subscription_plans')
      .select('*')
      .eq('id', plan_id)
      .single()

    if (planError || !plan) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Plan introuvable' 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 2. Si plan gratuit, activer directement
    if (plan.price === 0) {
      const { error: subError } = await supabaseClient
        .from('vendor_active_subscriptions')
        .upsert({
          vendor_id: user.id,
          plan_id: plan_id,
          status: 'active',
          payment_method: 'free',
          start_date: new Date().toISOString(),
          end_date: null,
        }, { onConflict: 'vendor_id' })

      if (subError) throw subError

      return new Response(JSON.stringify({
        success: true,
        message: 'Abonnement gratuit activé avec succès',
        subscription: { 
          plan_name: plan.name, 
          status: 'active',
          commission_rate: plan.commission_rate
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 3. Si plan payant, vérifier wallet
    const { data: wallet } = await supabaseClient
      .from('user_wallets')
      .select('balance')
      .eq('user_id', user.id)
      .single()

    if (!wallet || wallet.balance < plan.price) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Solde insuffisant',
        required: plan.price,
        current: wallet?.balance || 0
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 4. Débiter le wallet
    const { error: walletError } = await supabaseClient
      .from('user_wallets')
      .update({ balance: wallet.balance - plan.price })
      .eq('user_id', user.id)

    if (walletError) throw walletError

    // 5. Créer l'abonnement
    const end_date = new Date()
    end_date.setDate(end_date.getDate() + plan.duration_days)

    const { error: subError } = await supabaseClient
      .from('vendor_active_subscriptions')
      .upsert({
        vendor_id: user.id,
        plan_id: plan_id,
        status: 'active',
        payment_method: payment_method,
        start_date: new Date().toISOString(),
        end_date: end_date.toISOString(),
        payment_reference: `VENDOR-${Date.now()}`
      }, { onConflict: 'vendor_id' })

    if (subError) throw subError

    // 6. Logger la transaction
    await supabaseClient.from('activity_logs').insert({
      user_id: user.id,
      activity_type: 'vendor_subscription',
      description: `Abonnement ${plan.name} activé`,
      amount: -plan.monthly_price,
      currency: plan.currency,
      metadata: { plan_id, plan_name: plan.name }
    })

    return new Response(JSON.stringify({
      success: true,
      message: `Abonnement ${plan.name} activé avec succès`,
      subscription: {
        plan_name: plan.name,
        commission_rate: plan.commission_rate,
        end_date: end_date.toISOString()
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error: unknown) {
    console.error('[Vendor Subscription] Error:', error)
    return new Response(JSON.stringify({ 
      success: false,
      error: (error as any).message || 'Erreur interne du serveur' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})