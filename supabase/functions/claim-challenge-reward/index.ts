import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-health-check',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Get the user from the Authorization header
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { driver_challenge_id } = await req.json()

    if (!driver_challenge_id) {
      return new Response(
        JSON.stringify({ error: 'driver_challenge_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Processing challenge reward claim:', { driver_challenge_id, user_id: user.id })

    // Get the driver challenge details
    const { data: driverChallenge, error: challengeError } = await supabaseClient
      .from('driver_challenges')
      .select(`
        *,
        challenge:challenges(*)
      `)
      .eq('id', driver_challenge_id)
      .eq('driver_id', user.id)
      .eq('is_completed', true)
      .eq('reward_claimed', false)
      .single()

    if (challengeError || !driverChallenge) {
      console.error('Challenge not found or already claimed:', challengeError)
      return new Response(
        JSON.stringify({ error: 'Challenge not found or already claimed' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get or create user wallet
    let { data: wallet, error: walletError } = await supabaseClient
      .from('user_wallets')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (walletError) {
      console.error('Error fetching wallet:', walletError)
      return new Response(
        JSON.stringify({ error: 'Error processing wallet' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!wallet) {
      const { data: newWallet, error: createWalletError } = await supabaseClient
        .from('user_wallets')
        .insert({
          user_id: user.id,
          balance: 0,
          currency: 'CDF'
        })
        .select()
        .single()

      if (createWalletError) {
        console.error('Error creating wallet:', createWalletError)
        return new Response(
          JSON.stringify({ error: 'Error creating wallet' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      wallet = newWallet
    }

    const rewardAmount = Number(driverChallenge.challenge.reward_value)
    const newBalance = Number(wallet.balance) + rewardAmount

    // Update wallet balance
    const { error: updateWalletError } = await supabaseClient
      .from('user_wallets')
      .update({ balance: newBalance })
      .eq('id', wallet.id)

    if (updateWalletError) {
      console.error('Error updating wallet:', updateWalletError)
      return new Response(
        JSON.stringify({ error: 'Error updating wallet balance' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Mark challenge as reward claimed
    const { error: updateChallengeError } = await supabaseClient
      .from('driver_challenges')
      .update({ 
        reward_claimed: true,
        reward_claimed_at: new Date().toISOString()
      })
      .eq('id', driver_challenge_id)

    if (updateChallengeError) {
      console.error('Error updating challenge:', updateChallengeError)
      return new Response(
        JSON.stringify({ error: 'Error updating challenge status' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create wallet transaction record
    const { error: transactionError } = await supabaseClient
      .from('wallet_transactions')
      .insert({
        user_id: user.id,
        wallet_id: wallet.id,
        transaction_type: 'credit',
        amount: rewardAmount,
        currency: driverChallenge.challenge.reward_currency,
        description: `Récompense challenge: ${driverChallenge.challenge.title}`,
        reference_type: 'challenge_reward',
        reference_id: driverChallenge.challenge.id,
        balance_before: Number(wallet.balance),
        balance_after: newBalance,
        status: 'completed'
      })

    if (transactionError) {
      console.error('Error creating transaction:', transactionError)
    }

    // Create challenge reward record
    const { error: rewardError } = await supabaseClient
      .from('challenge_rewards')
      .insert({
        driver_id: user.id,
        challenge_id: driverChallenge.challenge.id,
        driver_challenge_id: driverChallenge.id,
        reward_type: driverChallenge.challenge.reward_type,
        reward_value: rewardAmount,
        reward_currency: driverChallenge.challenge.reward_currency
      })

    if (rewardError) {
      console.error('Error creating reward record:', rewardError)
    }

    // Log the activity
    const { error: logError } = await supabaseClient
      .from('activity_logs')
      .insert({
        user_id: user.id,
        activity_type: 'challenge_reward_claimed',
        description: `Récompense de challenge réclamée: ${driverChallenge.challenge.title}`,
        amount: rewardAmount,
        currency: driverChallenge.challenge.reward_currency,
        reference_type: 'challenge',
        reference_id: driverChallenge.challenge.id
      })

    if (logError) {
      console.error('Error logging activity:', logError)
    }

    console.log('Challenge reward claimed successfully:', {
      driver_id: user.id,
      challenge_id: driverChallenge.challenge.id,
      reward_amount: rewardAmount,
      new_balance: newBalance
    })

    return new Response(
      JSON.stringify({
        success: true,
        reward_amount: rewardAmount,
        new_balance: newBalance,
        message: 'Récompense réclamée avec succès'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: unknown) {
    console.error('Error in claim-challenge-reward function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})