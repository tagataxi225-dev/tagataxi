import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-health-check',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

interface CommissionRequest {
  subscription_id: string
  driver_id: string
  subscription_amount: number
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { subscription_id, driver_id, subscription_amount } = await req.json() as CommissionRequest

    console.log('[Partner Commission] Processing for subscription:', subscription_id)

    // 1. Vérifier si le chauffeur appartient à un partenaire (via driver_codes)
    const { data: driverCode, error: codeError } = await supabaseService
      .from('driver_codes')
      .select(`
        code,
        driver_id,
        partner_id:partenaires!inner(id, user_id, company_name, is_active)
      `)
      .eq('driver_id', driver_id)
      .eq('is_active', true)
      .maybeSingle()

    if (codeError) {
      console.error('[Partner Commission] Error checking driver code:', codeError)
      return new Response(JSON.stringify({ error: 'Failed to check partner affiliation' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!driverCode || !driverCode.partner_id) {
      console.log('[Partner Commission] No partner found for driver, skipping commission')
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No partner commission (driver not affiliated)' 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const partnerId = driverCode.partner_id.id
    const partnerUserId = driverCode.partner_id.user_id

    // 2. Calculer la commission partenaire (5%)
    const PARTNER_COMMISSION_RATE = 5.00
    const commissionAmount = (subscription_amount * PARTNER_COMMISSION_RATE) / 100

    console.log(`[Partner Commission] Calculating 5% of ${subscription_amount} = ${commissionAmount}`)

    // 3. Détecter la devise depuis le wallet existant du partenaire
    const { data: existingWallet } = await supabaseService
      .from('user_wallets')
      .select('id, balance, currency')
      .eq('user_id', partnerUserId)
      .limit(1)
      .maybeSingle()

    const currency = existingWallet?.currency || 'CDF'
    console.log(`[Partner Commission] Using currency: ${currency}`)

    // 4. Créditer le wallet du partenaire
    let partnerWallet = existingWallet

    if (!partnerWallet) {
      console.log('[Partner Commission] Partner wallet not found, creating one')
      const { data: newWallet, error: createError } = await supabaseService
        .from('user_wallets')
        .insert({
          user_id: partnerUserId,
          balance: 0,
          currency
        })
        .select()
        .single()

      if (createError || !newWallet) {
        console.error('[Partner Commission] Failed to create wallet:', createError)
        return new Response(JSON.stringify({ error: 'Failed to create partner wallet' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      partnerWallet = newWallet
    }

    const currentBalance = partnerWallet.balance || 0
    const newBalance = currentBalance + Number(commissionAmount)

    const { error: updateWalletError } = await supabaseService
      .from('user_wallets')
      .update({
        balance: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', partnerUserId)
      .eq('currency', currency)

    if (updateWalletError) {
      console.error('[Partner Commission] Failed to update wallet:', updateWalletError)
      return new Response(JSON.stringify({ error: 'Failed to credit partner wallet' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 5. Enregistrer la transaction wallet
    const { data: walletTransaction, error: txError } = await supabaseService
      .from('wallet_transactions')
      .insert({
        wallet_id: partnerWallet.id,
        user_id: partnerUserId,
        transaction_type: 'credit',
        amount: commissionAmount,
        currency,
        description: `Commission 5% - Abonnement chauffeur`,
        reference_id: subscription_id,
        reference_type: 'partner_subscription_commission'
      })
      .select()
      .single()

    if (txError) {
      console.error('[Partner Commission] Failed to log wallet transaction:', txError)
    }

    // 6. Enregistrer dans partner_subscription_earnings
    const { error: earningError } = await supabaseService
      .from('partner_subscription_earnings')
      .insert({
        partner_id: partnerId,
        driver_id,
        subscription_id,
        subscription_amount,
        partner_commission_rate: PARTNER_COMMISSION_RATE,
        partner_commission_amount: commissionAmount,
        status: 'paid',
        wallet_transaction_id: walletTransaction?.id
      })

    if (earningError) {
      console.error('[Partner Commission] Failed to log earning:', earningError)
    }

    // 7. Logger l'activité
    await supabaseService.from('activity_logs').insert({
      user_id: partnerUserId,
      activity_type: 'partner_subscription_commission',
      description: `Commission 5% reçue - Abonnement d'un chauffeur de votre flotte`,
      amount: commissionAmount,
      currency,
      metadata: {
        subscription_id,
        driver_id,
        commission_rate: PARTNER_COMMISSION_RATE,
        subscription_amount
      }
    })

    // 8. Notification partenaire
    await supabaseService.from('system_notifications').insert({
      user_id: partnerUserId,
      notification_type: 'partner_commission_earned',
      title: 'Commission Abonnement',
      message: `Vous avez reçu ${commissionAmount} ${currency} (5%) sur l'abonnement d'un de vos chauffeurs !`,
      data: {
        amount: commissionAmount,
        driver_id,
        subscription_id
      },
      priority: 'normal'
    })

    console.log(`[Partner Commission] Successfully credited ${commissionAmount} ${currency} to partner ${partnerId}`)

    return new Response(JSON.stringify({
      success: true,
      partner_id: partnerId,
      commission_amount: commissionAmount,
      currency,
      transaction_id: walletTransaction?.id
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error: unknown) {
    console.error('[Partner Commission] Unexpected error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
