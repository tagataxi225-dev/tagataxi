import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { withRateLimit, ENDPOINT_LIMITS } from "../_shared/ratelimit.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-health-check',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

interface TopUpRequest {
  amount: number;
  provider: string;
  phone: string;
  currency?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // ✅ Apply strict rate limiting (3 req/5min for wallet top-up)
  return withRateLimit(req, ENDPOINT_LIMITS.WALLET_TOPUP, async (req) => {

  try {
    // Parse request body first
    const body = await req.json();
    
    // ✅ Handle health check requests (no auth required)
    if (body.health_check === true) {
      return new Response(JSON.stringify({ status: 'ok', service: 'wallet-topup' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Autorisation manquante');
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Utilisateur non authentifié');
    }

    // Extract request data
    const { amount, provider, phone, currency = 'CDF' }: TopUpRequest = body;

    // Validate input - strict validation
    if (!amount || typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
      throw new Error('Montant invalide');
    }

    // Enforce integer amounts (no fractional CDF)
    const sanitizedAmount = Math.floor(amount);

    // Max amount limit for all providers
    const MAX_TOPUP_AMOUNT = 500000; // 500,000 CDF
    const MIN_TOPUP_AMOUNT = 500; // 500 CDF
    if (sanitizedAmount < MIN_TOPUP_AMOUNT || sanitizedAmount > MAX_TOPUP_AMOUNT) {
      throw new Error(`Montant doit être entre ${MIN_TOPUP_AMOUNT} et ${MAX_TOPUP_AMOUNT} CDF`);
    }

    if (!provider || !['airtel', 'orange', 'mpesa'].includes(provider)) {
      throw new Error('Opérateur non supporté');
    }

    if (!phone || typeof phone !== 'string') {
      throw new Error('Numéro de téléphone requis');
    }

    // Validate phone format for all providers (DRC format)
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    if (!/^(\+?243)?[0-9]{9}$/.test(cleanPhone)) {
      throw new Error('Format de numéro de téléphone invalide. Utilisez le format: 0XXXXXXXXX ou +243XXXXXXXXX');
    }

    // Use sanitized amount for all subsequent operations
    const validatedAmount = sanitizedAmount;

    // Create service client for database operations
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get or create user wallet
    let { data: wallet, error: walletError } = await supabaseService
      .from('user_wallets')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (walletError && walletError.code === 'PGRST116') {
      // Create wallet if it doesn't exist
      const { data: newWallet, error: createError } = await supabaseService
        .from('user_wallets')
        .insert({
          user_id: user.id,
          balance: 0,
          currency: currency,
          is_active: true
        })
        .select()
        .single();

      if (createError) {
        throw new Error(`Erreur création wallet: ${createError.message}`);
      }
      wallet = newWallet;
    } else if (walletError) {
      throw new Error(`Erreur wallet: ${walletError.message}`);
    }

    const currentBalance = wallet?.balance || 0;

    // Generate transaction ID
    const transactionId = `top_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create payment transaction record
    const { error: paymentError } = await supabaseService
      .from('payment_transactions')
      .insert({
        user_id: user.id,
        amount: amount,
        currency: currency,
        payment_method: `${provider}_money`,
        payment_provider: provider,
        transaction_id: transactionId,
        status: 'processing'
      });

    if (paymentError) {
      throw new Error(`Erreur transaction: ${paymentError.message}`);
    }

    console.log(`Processing ${provider} Money payment: ${amount} ${currency} from ${phone}`);

    // Get commission settings for wallet top-up
    const { data: commissionData, error: commissionError } = await supabaseService
      .from('commission_settings')
      .select('*')
      .eq('service_type', 'wallet_topup')
      .eq('is_active', true)
      .maybeSingle();

    if (commissionError) {
      console.error('Error fetching commission settings:', commissionError);
    }

    const adminRate = commissionData?.admin_rate || 1.0; // Default 1% if not found
    const adminCommission = (amount * adminRate) / 100;
    const netAmount = amount - adminCommission;

    console.log(`Processing payment: ${amount} CDF, Admin commission: ${adminCommission} CDF, Net amount: ${netAmount} CDF`);

    // Update wallet balance with net amount (after commission)
    const newBalance = currentBalance + netAmount;

    const { error: updateWalletError } = await supabaseService
      .from('user_wallets')
      .update({
        balance: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);

    if (updateWalletError) {
      throw new Error(`Erreur mise à jour wallet: ${updateWalletError.message}`);
    }

    // Create wallet transaction record for net amount credited
    const { error: walletTxError } = await supabaseService
      .from('wallet_transactions')
      .insert({
        wallet_id: wallet.id,
        user_id: user.id,
        transaction_type: 'credit',
        amount: netAmount,
        currency: currency,
        description: `Rechargement via ${provider} Money (après frais: ${adminCommission.toFixed(0)} CDF)`,
        reference_type: 'topup',
        status: 'completed',
        payment_method: `${provider}_money`,
        balance_before: currentBalance,
        balance_after: newBalance
      });

    if (walletTxError) {
      console.error('Wallet transaction error:', walletTxError);
    }

    // Create separate transaction for admin commission if applicable
    if (adminCommission > 0) {
      const { error: commissionTxError } = await supabaseService
        .from('wallet_transactions')
        .insert({
          wallet_id: wallet.id,
          user_id: user.id,
          transaction_type: 'debit',
          amount: adminCommission,
          currency: currency,
          description: `Frais de recharge (${adminRate}%)`,
          reference_type: 'commission',
          status: 'completed',
          payment_method: `${provider}_money`,
          balance_before: currentBalance + amount,
          balance_after: newBalance
        });

      if (commissionTxError) {
        console.error('Commission transaction error:', commissionTxError);
      }
    }

    // Update payment transaction status
    await supabaseService
      .from('payment_transactions')
      .update({ status: 'completed' })
      .eq('transaction_id', transactionId);

    // Log activity
    await supabaseService
      .from('activity_logs')
      .insert({
        user_id: user.id,
        activity_type: 'payment',
        description: `Rechargement Kwenda Pay: ${amount} ${currency} via ${provider} Money (net: ${netAmount.toFixed(0)} CDF, frais: ${adminCommission.toFixed(0)} CDF)`,
        amount: netAmount,
        currency: currency,
        reference_type: 'wallet_topup',
        metadata: {
          provider: provider,
          phone: phone,
          transaction_id: transactionId,
          gross_amount: amount,
          admin_commission: adminCommission,
          commission_rate: adminRate
        }
      });

    return new Response(
      JSON.stringify({
        success: true,
        transaction_id: transactionId,
        message: `Rechargement réussi. Montant crédité: ${netAmount.toFixed(0)} CDF (frais: ${adminCommission.toFixed(0)} CDF)`,
        new_balance: newBalance,
        gross_amount: amount,
        admin_commission: adminCommission,
        net_amount: netAmount
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    console.error('Wallet top-up error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: (error as any).message || 'Erreur interne du serveur'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
  }); // withRateLimit
});