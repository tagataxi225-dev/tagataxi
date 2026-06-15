import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WithdrawalRequest {
  amount: number;
  paymentMethod: 'mobile_money';
  paymentDetails: {
    provider: string;
    phoneNumber: string;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🏦 Vendor withdrawal request received');

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Authorization header is required");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error("User not authenticated");
    }

    console.log('👤 User authenticated:', user.id);

    const { amount, paymentMethod, paymentDetails }: WithdrawalRequest = await req.json();
    console.log('💰 Withdrawal request:', { amount, paymentMethod, provider: paymentDetails?.provider });

    if (!amount || amount <= 0) {
      throw new Error("Invalid withdrawal amount");
    }

    if (paymentMethod !== 'mobile_money') {
      throw new Error("Only mobile money withdrawals are supported");
    }

    if (!paymentDetails.provider || !paymentDetails.phoneNumber) {
      throw new Error("Payment details are incomplete");
    }

    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Récupérer le wallet vendeur
    const { data: wallet, error: walletError } = await supabaseService
      .from('vendor_wallets')
      .select('id, balance, total_withdrawn, currency')
      .eq('vendor_id', user.id)
      .maybeSingle();

    if (walletError) {
      console.error('❌ Error fetching wallet:', walletError);
      throw new Error('Erreur lors de la récupération du portefeuille');
    }

    if (!wallet) {
      console.error('❌ No wallet found for vendor:', user.id);
      throw new Error('Portefeuille vendeur non trouvé');
    }

    console.log('💳 Wallet found:', { id: wallet.id, balance: wallet.balance });

    const availableBalance = wallet.balance || 0;

    if (amount > availableBalance) {
      throw new Error(`Solde insuffisant. Disponible: ${availableBalance} ${wallet.currency || 'CDF'}`);
    }

    // Calculate fees (2% for mobile money)
    const fees = Math.round(amount * 0.02);
    const netAmount = amount - fees;

    console.log('📊 Withdrawal calculation:', { amount, fees, netAmount });

    // ✅ SYSTÈME MANUEL: Créer une demande dans withdrawal_requests au lieu d'appeler une API
    // Note: user_type doit être 'seller' (contrainte DB) et non 'vendor'
    const { data: withdrawalRequest, error: withdrawalError } = await supabaseService
      .from('withdrawal_requests')
      .insert({
        user_id: user.id,
        user_type: 'seller', // Contrainte DB: 'seller' ou 'driver' uniquement
        amount: amount,
        currency: wallet.currency || 'CDF',
        withdrawal_method: 'mobile_money',
        mobile_money_provider: paymentDetails.provider,
        mobile_money_phone: paymentDetails.phoneNumber,
        status: 'pending',
        auto_approved: false
      })
      .select()
      .single();

    if (withdrawalError) {
      console.error('❌ Error creating withdrawal request:', withdrawalError);
      throw new Error('Erreur lors de la création de la demande de retrait');
    }

    console.log('📝 Withdrawal request created:', withdrawalRequest.id);

    // ✅ Débiter immédiatement le solde du wallet (réservation)
    const newBalance = availableBalance - amount;
    const newTotalWithdrawn = (wallet.total_withdrawn || 0) + amount;

    const { error: updateWalletError } = await supabaseService
      .from('vendor_wallets')
      .update({ 
        balance: newBalance,
        total_withdrawn: newTotalWithdrawn,
        updated_at: new Date().toISOString()
      })
      .eq('id', wallet.id);

    if (updateWalletError) {
      console.error('❌ Error updating wallet balance:', updateWalletError);
      // Rollback: supprimer la demande
      await supabaseService
        .from('withdrawal_requests')
        .delete()
        .eq('id', withdrawalRequest.id);
      throw new Error('Erreur lors de la mise à jour du solde');
    }

    console.log('💰 Wallet balance reserved:', { newBalance });

    // Créer une transaction de retrait en attente
    const { error: txError } = await supabaseService
      .from('vendor_wallet_transactions')
      .insert({
        wallet_id: wallet.id,
        vendor_id: user.id,
        transaction_type: 'withdrawal',
        amount: -amount,
        currency: wallet.currency || 'CDF',
        description: `Demande de retrait ${paymentDetails.provider} - ${paymentDetails.phoneNumber}`,
        reference_id: withdrawalRequest.id,
        reference_type: 'withdrawal_request',
        status: 'pending'
      });

    if (txError) {
      console.error('❌ Error creating withdrawal transaction:', txError);
    } else {
      console.log('✅ Withdrawal transaction created');
    }

    // Créer une notification admin
    const { error: notifError } = await supabaseService
      .from('admin_notification_queue')
      .insert({
        notification_type: 'vendor_withdrawal_request',
        reference_type: 'withdrawal_request',
        reference_id: withdrawalRequest.id,
        data: {
          vendor_id: user.id,
          amount: amount,
          net_amount: netAmount,
          fees: fees,
          provider: paymentDetails.provider,
          phone: paymentDetails.phoneNumber,
          currency: wallet.currency || 'CDF'
        }
      });

    if (notifError) {
      console.error('⚠️ Error creating admin notification:', notifError);
    }

    console.log('✅ Vendor withdrawal request completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        withdrawalId: withdrawalRequest.id,
        amount: amount,
        fees: fees,
        netAmount: netAmount,
        newBalance: newBalance,
        status: 'pending',
        message: `Demande de retrait soumise. Vous recevrez ${netAmount} ${wallet.currency || 'CDF'} sous 1-24h.`
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error('❌ Vendor withdrawal error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Erreur lors de la demande de retrait'
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
