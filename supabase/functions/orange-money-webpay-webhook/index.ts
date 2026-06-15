import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * ✅ Orange Money WebPay - Webhook Handler
 * 
 * Reçoit les notifications serveur-à-serveur d'Orange Money pour les paiements WebPay (CASHIN)
 * Plus fiable que le callback car ne dépend pas du navigateur client
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const webhookData = await req.json();
    console.log('🔔 Orange Money WebPay Webhook:', JSON.stringify(webhookData, null, 2));

    const { 
      transaction_id, 
      order_id, 
      status, 
      amount, 
      currency,
      customer_msisdn,
      timestamp 
    } = webhookData;

    if (!transaction_id || !order_id || !status) {
      throw new Error('Webhook data incomplet');
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Récupérer la transaction
    const { data: transaction, error: txError } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('transaction_reference', order_id)
      .single();

    if (txError || !transaction) {
      console.error('❌ Transaction non trouvée:', order_id);
      return new Response(
        JSON.stringify({ error: 'Transaction not found' }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Traiter selon le statut
    if (status === 'SUCCESS' || status === 'COMPLETED') {
      // ✅ Paiement réussi
      await supabase
        .from('payment_transactions')
        .update({ 
          status: 'completed',
          processed_at: new Date().toISOString(),
          external_transaction_id: transaction_id,
          metadata: { 
            ...transaction.metadata, 
            webhook_data: webhookData,
            confirmed_at: timestamp 
          }
        })
        .eq('id', transaction.id);

      // Créditer le wallet selon le type de transaction
      if (transaction.order_type === 'wallet_topup') {
        const { data: wallet } = await supabase
          .from('user_wallets')
          .select('balance')
          .eq('user_id', transaction.user_id)
          .single();

        await supabase
          .from('user_wallets')
          .update({ 
            balance: (wallet?.balance || 0) + transaction.amount,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', transaction.user_id);

        console.log(`✅ Wallet crédité : +${transaction.amount} CDF`);
      }

      // Notifier l'utilisateur
      await supabase.from('system_notifications').insert({
        user_id: transaction.user_id,
        title: '✅ Paiement confirmé',
        message: `Votre paiement de ${amount} ${currency} a été confirmé`,
        notification_type: 'payment_confirmed',
        data: { transaction_id, amount, currency }
      });

      console.log('✅ Transaction WebPay confirmée:', transaction_id);
      
      return new Response(
        JSON.stringify({ success: true, message: 'Webhook processed' }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } else if (status === 'FAILED' || status === 'CANCELLED') {
      // ❌ Paiement échoué
      await supabase
        .from('payment_transactions')
        .update({ 
          status: 'failed',
          metadata: { ...transaction.metadata, webhook_data: webhookData }
        })
        .eq('id', transaction.id);

      await supabase.from('system_notifications').insert({
        user_id: transaction.user_id,
        title: '❌ Paiement échoué',
        message: `Votre paiement de ${amount} ${currency} a échoué`,
        notification_type: 'payment_failed',
        data: { transaction_id, amount, currency, reason: status }
      });

      console.log('❌ Transaction WebPay échouée:', transaction_id);
      
      return new Response(
        JSON.stringify({ success: true, message: 'Webhook processed (failed)' }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } else if (status === 'PENDING') {
      // ⏳ En attente de confirmation client
      await supabase
        .from('payment_transactions')
        .update({ 
          status: 'pending',
          metadata: { ...transaction.metadata, webhook_data: webhookData }
        })
        .eq('id', transaction.id);

      console.log('⏳ Transaction WebPay en attente:', transaction_id);
      
      return new Response(
        JSON.stringify({ success: true, message: 'Webhook processed (pending)' }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Statut inconnu
    console.warn('⚠️ Statut WebPay inconnu:', status);
    return new Response(
      JSON.stringify({ success: true, message: 'Unknown status' }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error('❌ Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
