import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OrangeMoneyWebhookPayload {
  partnerTransactionId: string;
  transactionStatus: 'SUCCESS' | 'FAILED' | 'PENDING';
  transactionId?: string;
  amount?: number;
  currency?: string;
  peerId?: string;
  errorCode?: string;
  errorMessage?: string;
}

serve(async (req) => {
  const url = new URL(req.url);
  
  // Logger toutes les requêtes reçues pour debugging
  console.log('🍊 [orange-money-webhook] ━━━━━━━━━━━━━━━━━━━━━');
  console.log('🍊 [orange-money-webhook] Timestamp:', new Date().toISOString());
  console.log('🍊 [orange-money-webhook] Method:', req.method);
  console.log('🍊 [orange-money-webhook] Path:', url.pathname);
  console.log('🍊 [orange-money-webhook] Expected path:', '/orange-money-webhook/notifications');

  // Endpoint de santé pour tester la disponibilité
  if (url.pathname.endsWith('/health')) {
    console.log('🍊 [orange-money-webhook] Health check requested');
    return new Response(
      JSON.stringify({ 
        status: 'ok', 
        service: 'orange-money-webhook',
        timestamp: new Date().toISOString(),
        endpoints: {
          notifications: '/orange-money-webhook/notifications',
          health: '/orange-money-webhook/health'
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  }

  // Gérer le path /notifications requis par Orange
  if (!url.pathname.endsWith('/notifications') && req.method !== 'OPTIONS') {
    console.warn('⚠️ [orange-money-webhook] Invalid endpoint accessed:', url.pathname);
    return new Response(
      JSON.stringify({ 
        error: 'Invalid endpoint. Use /notifications',
        received_path: url.pathname,
        expected_path: '/orange-money-webhook/notifications'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
    );
  }

  if (req.method === 'OPTIONS') {
    console.log('🍊 [orange-money-webhook] CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    console.warn('⚠️ [orange-money-webhook] Method not allowed:', req.method);
    return new Response(
      JSON.stringify({ error: 'Method not allowed. Use POST.' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 405 }
    );
  }

  try {
    console.log('🍊 [orange-money-webhook] Notification POST reçue');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const payload: OrangeMoneyWebhookPayload = await req.json();
    
    // Logs détaillés du payload reçu
    console.log('📱 [orange-money-webhook] Payload reçu:');
    console.log('📱 [orange-money-webhook] ', JSON.stringify(payload, null, 2));
    console.log('📱 [orange-money-webhook] Headers:', JSON.stringify(Object.fromEntries(req.headers.entries()), null, 2));

    const {
      partnerTransactionId,
      transactionStatus,
      transactionId,
      amount,
      currency,
      peerId,
      errorCode,
      errorMessage
    } = payload;

    if (!partnerTransactionId || !transactionStatus) {
      console.error('❌ [orange-money-webhook] Missing required fields');
      console.error('❌ [orange-money-webhook] partnerTransactionId:', partnerTransactionId);
      console.error('❌ [orange-money-webhook] transactionStatus:', transactionStatus);
      throw new Error('Missing partnerTransactionId or transactionStatus');
    }

    console.log('🔍 [orange-money-webhook] Searching for transaction:', partnerTransactionId);

    // D'abord, vérifier combien de transactions correspondent
    const { count, error: countError } = await supabaseClient
      .from('payment_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('transaction_id', partnerTransactionId);

    if (countError) {
      console.error('❌ [orange-money-webhook] Error counting transactions:', countError);
    } else {
      console.log(`🔍 [orange-money-webhook] Found ${count} transaction(s) with ID: ${partnerTransactionId}`);
    }

    // Récupérer la transaction en attente
    const { data: pendingTx, error: txError } = await supabaseClient
      .from('payment_transactions')
      .select('*')
      .eq('transaction_id', partnerTransactionId)
      .single();

    if (txError || !pendingTx) {
      console.error('❌ [orange-money-webhook] Transaction lookup failed');
      console.error('❌ [orange-money-webhook] Search criteria:', { 
        transaction_id: partnerTransactionId 
      });
      console.error('❌ [orange-money-webhook] Error details:', txError);
      console.error('❌ [orange-money-webhook] Suggestion: Verify the transaction exists in payment_transactions table');
      
      // Lister quelques transactions récentes pour debugging
      const { data: recentTxs, error: recentError } = await supabaseClient
        .from('payment_transactions')
        .select('transaction_id, status, payment_provider, created_at')
        .eq('payment_provider', 'orange')
        .order('created_at', { ascending: false })
        .limit(5);

      if (!recentError && recentTxs) {
        console.log('🔍 [orange-money-webhook] Recent Orange transactions in DB:');
        recentTxs.forEach(tx => {
          console.log(`   - ${tx.transaction_id} (${tx.status}) at ${tx.created_at}`);
        });
      }
      
      // Retourner 200 quand même pour éviter les retry d'Orange
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Transaction not found but acknowledged',
          debug: {
            searched_id: partnerTransactionId,
            error: txError?.message,
            count: count
          }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    console.log('✅ [orange-money-webhook] Transaction found:', pendingTx.id);
    console.log('✅ [orange-money-webhook] Current status:', pendingTx.status);
    console.log('✅ [orange-money-webhook] User ID:', pendingTx.user_id);
    console.log('✅ [orange-money-webhook] Amount:', pendingTx.amount, pendingTx.currency);

    // Traiter selon le statut
    if (transactionStatus === 'SUCCESS') {
      // Mettre à jour le statut de la transaction
      const { error: updateError } = await supabaseClient
        .from('payment_transactions')
        .update({
          status: 'completed',
          metadata: {
            ...pendingTx.metadata,
            orange_transaction_id: transactionId,
            completed_at: new Date().toISOString(),
            webhook_received_at: new Date().toISOString()
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', pendingTx.id);

      if (updateError) {
        console.error('❌ [orange-money-webhook] Update error:', updateError);
        throw updateError;
      }

      console.log('✅ [orange-money-webhook] Payment confirmed successfully');
      console.log('✅ [orange-money-webhook] Transaction ID:', pendingTx.id);
      console.log('✅ [orange-money-webhook] Orange Transaction ID:', transactionId);

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Payment processed successfully',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    } else if (transactionStatus === 'FAILED') {
      // Marquer comme échoué
      await supabaseClient
        .from('payment_transactions')
        .update({
          status: 'failed',
          metadata: {
            ...pendingTx.metadata,
            orange_transaction_id: transactionId,
            error_code: errorCode,
            error_message: errorMessage,
            failure_reason: errorMessage || 'Payment failed',
            failed_at: new Date().toISOString(),
            webhook_received_at: new Date().toISOString()
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', pendingTx.id);

      console.log('❌ [orange-money-webhook] Payment failed');
      console.log('❌ [orange-money-webhook] Error code:', errorCode);
      console.log('❌ [orange-money-webhook] Error message:', errorMessage);

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Payment failure recorded',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    } else if (transactionStatus === 'PENDING') {
      // Mettre à jour avec le statut pending
      await supabaseClient
        .from('payment_transactions')
        .update({
          status: 'pending',
          metadata: {
            ...pendingTx.metadata,
            orange_transaction_id: transactionId,
            pending_at: new Date().toISOString(),
            webhook_received_at: new Date().toISOString()
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', pendingTx.id);

      console.log('⏳ [orange-money-webhook] Payment pending');

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Payment pending status recorded',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    } else {
      throw new Error(`Unknown status: ${transactionStatus}`);
    }
  } catch (error: any) {
    console.error('❌ [orange-money-webhook] Error:', error);
    // Toujours retourner 200 pour éviter les retry infinis d'Orange
    return new Response(
      JSON.stringify({
        success: true,
        error: (error as any).message,
        message: 'Error acknowledged'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  }
});
