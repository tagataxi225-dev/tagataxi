import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-health-check',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

interface TopUpRequest {
  driverId: string;
  amount: number;
  paymentMethod: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase clients
    const authHeader = req.headers.get('Authorization')!;
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const supabaseServiceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get authenticated user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { driverId, amount, paymentMethod }: TopUpRequest = await req.json();

    // Validation
    if (!driverId || !amount || amount <= 0 || !paymentMethod) {
      return new Response(
        JSON.stringify({ error: 'Invalid request parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Partner ${user.id} topping up ${amount} CDF for driver ${driverId}`);

    // Verify partner owns this driver
    const { data: partnerDriver, error: partnerDriverError } = await supabaseServiceClient
      .from('partner_drivers')
      .select('*')
      .eq('partner_id', user.id)
      .eq('driver_id', driverId)
      .eq('status', 'active')
      .single();

    if (partnerDriverError || !partnerDriver) {
      console.error('Partner driver verification failed:', partnerDriverError);
      return new Response(
        JSON.stringify({ error: 'Driver not found or not associated with your account' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get or create driver credits
    let { data: driverCredits, error: creditsError } = await supabaseServiceClient
      .from('driver_credits')
      .select('*')
      .eq('driver_id', driverId)
      .single();

    if (creditsError && creditsError.code === 'PGRST116') {
      // Create driver credits if not exists
      const { data: newCredits, error: createError } = await supabaseServiceClient
        .from('driver_credits')
        .insert({
          driver_id: driverId,
          balance: 0,
          total_earned: 0,
          total_spent: 0,
          currency: 'CDF',
          is_active: true
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating driver credits:', createError);
        return new Response(
          JSON.stringify({ error: 'Failed to create driver credits' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      driverCredits = newCredits;
    } else if (creditsError) {
      console.error('Error fetching driver credits:', creditsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch driver credits' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const balanceBefore = driverCredits.balance;
    const balanceAfter = balanceBefore + amount;

    // Update driver credits
    const { error: updateError } = await supabaseServiceClient
      .from('driver_credits')
      .update({
        balance: balanceAfter,
        total_earned: driverCredits.total_earned + amount,
        last_topup_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('driver_id', driverId);

    if (updateError) {
      console.error('Error updating driver credits:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update driver credits' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Record credit transaction
    const { error: transactionError } = await supabaseServiceClient
      .from('credit_transactions')
      .insert({
        driver_id: driverId,
        transaction_type: 'credit',
        amount: amount,
        currency: 'CDF',
        description: `Recharge par partenaire - ${paymentMethod}`,
        reference_type: 'partner_topup',
        reference_id: user.id,
        balance_before: balanceBefore,
        balance_after: balanceAfter
      });

    if (transactionError) {
      console.error('Error recording transaction:', transactionError);
      // Don't fail the whole operation for transaction logging
    }

    // Log activity
    const { error: activityError } = await supabaseServiceClient
      .from('activity_logs')
      .insert({
        user_id: driverId,
        activity_type: 'wallet_topup',
        description: `Recharge de ${amount} CDF par partenaire`,
        amount: amount,
        currency: 'CDF',
        reference_type: 'partner_topup',
        reference_id: user.id,
        metadata: {
          partner_id: user.id,
          payment_method: paymentMethod,
          balance_before: balanceBefore,
          balance_after: balanceAfter
        }
      });

    if (activityError) {
      console.error('Error logging activity:', activityError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Top-up successful',
        data: {
          driver_id: driverId,
          amount: amount,
          balance_before: balanceBefore,
          balance_after: balanceAfter,
          currency: 'CDF',
          payment_method: paymentMethod,
          timestamp: new Date().toISOString()
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: unknown) {
    console.error('Unexpected error in partner-driver-wallet-topup:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});