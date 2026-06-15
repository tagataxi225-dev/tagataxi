import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-health-check',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

interface SubscriptionRequest {
  driver_id: string
  plan_id: string
  payment_method: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { driver_id, plan_id, payment_method }: SubscriptionRequest = await req.json()

    console.log('📦 Subscription Request:', { driver_id, plan_id, payment_method })

    // 1. Récupérer le plan d'abonnement
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', plan_id)
      .single()

    if (planError || !plan) {
      throw new Error('Plan d\'abonnement introuvable')
    }

    console.log('✅ Plan trouvé:', plan.name, plan.price, plan.currency)

    // ✅ PHASE 4: Vérifier la cohérence service_type / plan
    const { data: driverService, error: serviceError } = await supabase
      .from('driver_service_preferences')
      .select('service_type')
      .eq('driver_id', driver_id)
      .single()

    if (serviceError && serviceError.code !== 'PGRST116') {
      console.error('⚠️ Erreur récupération service:', serviceError)
    }

    // Valider la cohérence
    if (driverService && plan.service_type !== 'all') {
      const driverServiceType = driverService.service_type === 'taxi' ? 'transport' : driverService.service_type
      
      if (plan.service_type !== driverServiceType) {
        const errorMsg = driverServiceType === 'transport' 
          ? `❌ Ce plan est réservé aux livreurs. Choisissez un plan VTC.`
          : `❌ Ce plan est réservé aux chauffeurs VTC. Choisissez un plan Livraison.`
        
        console.error(errorMsg, { plan_service: plan.service_type, driver_service: driverServiceType })
        throw new Error(errorMsg)
      }
      
      console.log('✅ Cohérence plan/service validée:', driverServiceType, '→', plan.service_type)
    }

    // 2. Récupérer le portefeuille du chauffeur
    const { data: wallet, error: walletError } = await supabase
      .from('user_wallets')
      .select('balance, bonus_balance')
      .eq('user_id', driver_id)
      .single()

    if (walletError || !wallet) {
      throw new Error('Portefeuille du chauffeur introuvable')
    }

    console.log('💰 Portefeuille:', { balance: wallet.balance, bonus_balance: wallet.bonus_balance })

    const requiredAmount = plan.price
    let paidWithBonus = false
    let bonusUsed = 0
    let balanceUsed = 0

    // 3. Logique de paiement : Priorité au bonus_balance
    if (wallet.bonus_balance >= requiredAmount) {
      // Cas 1 : bonus_balance suffit entièrement
      bonusUsed = requiredAmount
      paidWithBonus = true
      console.log('✅ Paiement intégral avec bonus_balance:', bonusUsed, 'CDF')
    } else if (wallet.bonus_balance > 0 && (wallet.balance + wallet.bonus_balance) >= requiredAmount) {
      // Cas 2 : bonus_balance partiel + balance
      bonusUsed = wallet.bonus_balance
      balanceUsed = requiredAmount - bonusUsed
      console.log('✅ Paiement mixte - Bonus:', bonusUsed, 'CDF | Balance:', balanceUsed, 'CDF')
    } else if (wallet.balance >= requiredAmount) {
      // Cas 3 : balance uniquement
      balanceUsed = requiredAmount
      console.log('✅ Paiement avec balance uniquement:', balanceUsed, 'CDF')
    } else {
      throw new Error('Solde insuffisant pour l\'abonnement')
    }

    // 4. Débiter le portefeuille
    const newBonusBalance = wallet.bonus_balance - bonusUsed
    const newBalance = wallet.balance - balanceUsed

    const { error: updateWalletError } = await supabase
      .from('user_wallets')
      .update({
        bonus_balance: newBonusBalance,
        balance: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', driver_id)

    if (updateWalletError) {
      console.error('❌ Erreur mise à jour portefeuille:', updateWalletError)
      throw new Error('Erreur lors du débit du portefeuille')
    }

    console.log('✅ Portefeuille débité - Nouveau solde:', { bonus_balance: newBonusBalance, balance: newBalance })

    // 5. Calculer les dates d'abonnement
    const startDate = new Date()
    const endDate = new Date()
    
    if (plan.duration_type === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1)
    } else if (plan.duration_type === 'daily') {
      endDate.setDate(endDate.getDate() + 1)
    } else if (plan.duration_type === 'weekly') {
      endDate.setDate(endDate.getDate() + 7)
    }

    // 6. Créer l'abonnement
    const { data: subscription, error: subscriptionError } = await supabase
      .from('driver_subscriptions')
      .insert({
        driver_id,
        plan_id,
        status: 'active',
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        payment_method,
        auto_renew: true,
        rides_remaining: plan.max_rides_per_day || 999,
        rides_used: 0
      })
      .select()
      .single()

    if (subscriptionError) {
      console.error('❌ Erreur création abonnement:', subscriptionError)
      throw subscriptionError
    }

    console.log('✅ Abonnement créé:', subscription.id)

    // 7. Vérifier si le chauffeur a un partenaire
    const { data: driverCode, error: driverCodeError } = await supabase
      .from('driver_codes')
      .select('partner_id')
      .eq('driver_id', driver_id)
      .maybeSingle()

    if (driverCodeError) {
      console.error('⚠️ Erreur vérification partenaire:', driverCodeError)
    }

    // 8. Si partenaire trouvé, appeler l'Edge Function de commission
    if (driverCode && driverCode.partner_id) {
      console.log('🎯 Partenaire détecté:', driverCode.partner_id)
      console.log('💰 Invocation Edge Function partner-subscription-commission...')

      try {
        const { data: commissionData, error: commissionError } = await supabase.functions.invoke(
          'partner-subscription-commission',
          {
            body: {
              subscription_id: subscription.id,
              driver_id,
              subscription_amount: plan.price,
              partner_id: driverCode.partner_id
            }
          }
        )

        if (commissionError) {
          console.error('❌ Erreur commission partenaire:', commissionError)
        } else {
          console.log('✅ Commission partenaire créée:', commissionData)
        }
      } catch (commissionErr) {
        console.error('❌ Exception commission:', commissionErr)
      }
    } else {
      console.log('ℹ️ Aucun partenaire lié à ce chauffeur')
    }

    // 9. ✅ PHASE 2: Commission admin (10%) - TOUJOURS appliquée
    console.log('💰 Calcul commission admin (10%)...')

    try {
      const { data: adminCommissionData, error: adminCommissionError } = await supabase.functions.invoke(
        'admin-subscription-commission',
        {
          body: {
            subscription_id: subscription.id,
            driver_id,
            subscription_amount: plan.price
          }
        }
      )

      if (adminCommissionError) {
        console.error('❌ Erreur commission admin:', adminCommissionError)
        // Ne pas bloquer l'abonnement si la commission échoue
      } else {
        console.log('✅ Commission admin créée:', adminCommissionData?.commission_amount, 'CDF')
      }
    } catch (adminCommErr) {
      console.error('❌ Exception commission admin:', adminCommErr)
    }

    // 10. Logger l'activité avec détails de paiement
    await supabase
      .from('activity_logs')
      .insert({
        user_id: driver_id,
        activity_type: 'driver_subscription',
        description: `Abonnement ${plan.name} activé`,
        amount: -requiredAmount,
        currency: plan.currency,
        metadata: {
          plan_id,
          subscription_id: subscription.id,
          amount: plan.price,
          currency: plan.currency,
          payment_method,
          bonus_used: bonusUsed,
          balance_used: balanceUsed,
          paid_with_bonus: paidWithBonus
        }
      })

    return new Response(
      JSON.stringify({
        success: true,
        subscription,
        message: 'Abonnement créé avec succès'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: unknown) {
    console.error('❌ Erreur subscription-manager:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: (error as any).message
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
