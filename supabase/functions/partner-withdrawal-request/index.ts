import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-health-check',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

interface WithdrawalRequest {
  amount: number;
  paymentMethod: string;
  accountDetails: {
    accountNumber?: string;
    accountName?: string;
    bankName?: string;
    phoneNumber?: string;
  };
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

    // Résoudre l'id de la table partenaires (le tracking est indexé dessus, pas sur user.id)
    const { data: partenaireRow } = await supabaseServiceClient
      .from('partenaires')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();
    const partenaireId = partenaireRow?.id || user.id;

    // Parse request body
    const { amount, paymentMethod, accountDetails }: WithdrawalRequest = await req.json();

    // Validation
    if (!amount || amount <= 0 || !paymentMethod || !accountDetails) {
      return new Response(
        JSON.stringify({ error: 'Invalid request parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Partner ${user.id} requesting withdrawal of ${amount} CDF`);

    // Check partner's available commission balance
    const { data: commissionData, error: commissionError } = await supabaseServiceClient
      .from('partner_commission_tracking')
      .select('commission_amount')
      .eq('partner_id', partenaireId);

    if (commissionError) {
      console.error('Error fetching commissions:', commissionError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch commission data' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate total earned commissions
    const totalEarned = commissionData?.reduce((sum, record) => sum + Number(record.commission_amount), 0) || 0;

    // Check existing withdrawals to calculate available balance
    const { data: withdrawalData, error: withdrawalError } = await supabaseServiceClient
      .from('partner_withdrawals')
      .select('amount')
      .eq('partner_id', user.id)
      .in('status', ['approved', 'paid']);

    if (withdrawalError) {
      console.error('Error fetching withdrawals:', withdrawalError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch withdrawal data' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const totalWithdrawn = withdrawalData?.reduce((sum, record) => sum + Number(record.amount), 0) || 0;
    const availableBalance = totalEarned - totalWithdrawn;

    // Check if sufficient balance
    if (amount > availableBalance) {
      return new Response(
        JSON.stringify({ 
          error: 'Insufficient balance', 
          available_balance: availableBalance,
          requested_amount: amount
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for pending withdrawals
    const { data: pendingWithdrawals, error: pendingError } = await supabaseServiceClient
      .from('partner_withdrawals')
      .select('id')
      .eq('partner_id', user.id)
      .eq('status', 'pending');

    if (pendingError) {
      console.error('Error checking pending withdrawals:', pendingError);
      return new Response(
        JSON.stringify({ error: 'Failed to check pending withdrawals' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (pendingWithdrawals && pendingWithdrawals.length > 0) {
      return new Response(
        JSON.stringify({ error: 'You already have a pending withdrawal request' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate withdrawal fee (2%) and net amount
    const withdrawalFee = Math.round(amount * 0.02);
    const netAmount = amount - withdrawalFee;

    // Create withdrawal request — try with dedicated fee columns first, fall back to metadata-only
    let withdrawal: any;
    let insertError: any;

    ({ data: withdrawal, error: insertError } = await supabaseServiceClient
      .from('partner_withdrawals')
      .insert({
        partner_id: user.id,
        amount: amount,
        fee: withdrawalFee,
        net_amount: netAmount,
        currency: 'CDF',
        payment_method: paymentMethod,
        account_details: accountDetails,
        status: 'pending',
        metadata: { fee: withdrawalFee, net_amount: netAmount, fee_rate: 0.02 }
      })
      .select()
      .single());

    // If unknown column error, retry without dedicated fee/net_amount columns
    if (insertError && insertError.code === '42703') {
      ({ data: withdrawal, error: insertError } = await supabaseServiceClient
        .from('partner_withdrawals')
        .insert({
          partner_id: user.id,
          amount: amount,
          currency: 'CDF',
          payment_method: paymentMethod,
          account_details: accountDetails,
          status: 'pending',
          metadata: { fee: withdrawalFee, net_amount: netAmount, fee_rate: 0.02 }
        })
        .select()
        .single());
    }

    if (insertError) {
      console.error('Error creating withdrawal request:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to create withdrawal request' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log activity
    const { error: activityError } = await supabaseServiceClient
      .from('activity_logs')
      .insert({
        user_id: user.id,
        activity_type: 'withdrawal_request',
        description: `Demande de retrait de ${amount} CDF`,
        amount: amount,
        currency: 'CDF',
        reference_type: 'withdrawal',
        reference_id: withdrawal.id,
        metadata: {
          payment_method: paymentMethod,
          account_details: accountDetails,
          available_balance: availableBalance
        }
      });

    if (activityError) {
      console.error('Error logging activity:', activityError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Withdrawal request submitted successfully',
        data: {
          withdrawal_id: withdrawal.id,
          amount: amount,
          currency: 'CDF',
          payment_method: paymentMethod,
          status: 'pending',
          requested_at: withdrawal.requested_at,
          available_balance: availableBalance - amount
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: unknown) {
    console.error('Unexpected error in partner-withdrawal-request:', error);
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