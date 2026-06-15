import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-health-check',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    console.log('🔄 Starting auto-release escrow job...');

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const results = {
      marketplace: [] as any[],
      food: [] as any[],
      escrowDirect: [] as any[]
    };

    // ========== 1. MARKETPLACE ORDERS ==========
    console.log('📦 Checking marketplace orders...');
    
    const { data: marketplaceOrders, error: mpError } = await supabaseClient
      .from('marketplace_orders')
      .select('id, buyer_id, seller_id, total_amount, delivered_at, status')
      .eq('status', 'delivered')
      .lt('delivered_at', sevenDaysAgo.toISOString())
      .is('completed_at', null);

    if (mpError) {
      console.error('Marketplace query error:', mpError);
    } else if (marketplaceOrders && marketplaceOrders.length > 0) {
      console.log(`Found ${marketplaceOrders.length} marketplace orders to auto-release`);

      for (const order of marketplaceOrders) {
        try {
          // Marquer comme complétée — garde idempotente : uniquement si encore 'delivered'
          const { data: updatedOrder } = await supabaseClient
            .from('marketplace_orders')
            .update({
              status: 'completed',
              completed_at: new Date().toISOString(),
              customer_feedback: 'Auto-complété après 7 jours',
              updated_at: new Date().toISOString()
            })
            .eq('id', order.id)
            .eq('status', 'delivered')
            .select('id');

          if (!updatedOrder || updatedOrder.length === 0) {
            console.log(`⏭️ Marketplace order ${order.id} already processed, skipping`);
            continue;
          }

          // Libérer l'escrow via la fonction existante
          const { data: releaseData, error: releaseError } = await supabaseClient.functions.invoke('release-escrow-payment', {
            body: { orderId: order.id }
          });

          if (releaseError) {
            console.error(`Error releasing marketplace escrow ${order.id}:`, releaseError);
            results.marketplace.push({ id: order.id, success: false, error: releaseError.message });
            await supabaseClient.from('activity_logs').insert({
              activity_type: 'escrow_release_failed',
              description: `release-escrow-payment failed for marketplace order ${order.id}: ${releaseError.message}`,
              metadata: { order_id: order.id, type: 'marketplace', error: releaseError.message }
            }).catch(() => {});
            continue;
          }

          // Notifier le vendeur
          await supabaseClient.from('system_notifications').insert({
            user_id: order.seller_id,
            title: '💰 Paiement auto-libéré',
            message: `Les fonds de votre commande ont été automatiquement libérés après 7 jours de livraison.`,
            notification_type: 'escrow_auto_released',
            data: { order_id: order.id, amount: releaseData?.sellerAmount }
          });

          // Notifier l'acheteur
          await supabaseClient.from('system_notifications').insert({
            user_id: order.buyer_id,
            title: '✅ Commande auto-confirmée',
            message: `Votre commande a été automatiquement confirmée après 7 jours.`,
            notification_type: 'escrow_auto_released',
            data: { order_id: order.id }
          });

          results.marketplace.push({ id: order.id, success: true, amount: releaseData?.sellerAmount });
          console.log(`✅ Auto-released marketplace order: ${order.id}`);

        } catch (err: any) {
          console.error(`Error processing marketplace order ${order.id}:`, err);
          results.marketplace.push({ id: order.id, success: false, error: err.message });
          await supabaseClient.from('activity_logs').insert({
            activity_type: 'escrow_release_failed',
            description: `Auto-release failed for marketplace order ${order.id}: ${err.message}`,
            metadata: { order_id: order.id, type: 'marketplace', error: err.message }
          }).catch(() => {});
        }
      }
    }

    // ========== 2. FOOD ORDERS ==========
    console.log('🍽️ Checking food orders...');

    const { data: foodOrders, error: foodError } = await supabaseClient
      .from('food_orders')
      .select(`
        id, 
        order_number,
        user_id, 
        restaurant_id,
        total_amount, 
        delivered_at, 
        status,
        restaurant_profiles (
          user_id,
          restaurant_name
        )
      `)
      .eq('status', 'delivered')
      .lt('delivered_at', sevenDaysAgo.toISOString())
      .is('completed_at', null);

    if (foodError) {
      console.error('Food query error:', foodError);
    } else if (foodOrders && foodOrders.length > 0) {
      console.log(`Found ${foodOrders.length} food orders to auto-release`);

      for (const order of foodOrders) {
        try {
          const restaurantUserId = (order as any).restaurant_profiles?.user_id;
          const restaurantAmount = order.total_amount * 0.95; // 95% au restaurant

          // Marquer comme complétée — garde idempotente : uniquement si encore 'delivered'
          const { data: updatedFoodOrder } = await supabaseClient
            .from('food_orders')
            .update({
              status: 'completed',
              completed_at: new Date().toISOString(),
              customer_feedback: 'Auto-complété après 7 jours',
              updated_at: new Date().toISOString()
            })
            .eq('id', order.id)
            .eq('status', 'delivered')
            .select('id');

          if (!updatedFoodOrder || updatedFoodOrder.length === 0) {
            console.log(`⏭️ Food order ${order.id} already processed, skipping`);
            continue;
          }

          // Créditer le wallet restaurant
          const { data: wallet } = await supabaseClient
            .from('restaurant_wallets')
            .select('*')
            .eq('restaurant_id', order.restaurant_id)
            .single();

          if (wallet) {
            await supabaseClient
              .from('restaurant_wallets')
              .update({
                balance: (wallet.balance || 0) + restaurantAmount,
                total_earned: (wallet.total_earned || 0) + restaurantAmount,
                updated_at: new Date().toISOString()
              })
              .eq('restaurant_id', order.restaurant_id);
          }

          // Notifier le restaurant
          if (restaurantUserId) {
            await supabaseClient.from('system_notifications').insert({
              user_id: restaurantUserId,
              title: '💰 Paiement auto-libéré',
              message: `Commande #${order.order_number} - ${restaurantAmount.toLocaleString()} CDF crédités après 7 jours.`,
              notification_type: 'food_escrow_auto_released',
              data: { order_id: order.id, amount: restaurantAmount }
            });
          }

          // Notifier le client
          await supabaseClient.from('system_notifications').insert({
            user_id: order.user_id,
            title: '✅ Commande auto-confirmée',
            message: `Votre commande #${order.order_number} a été automatiquement confirmée.`,
            notification_type: 'food_escrow_auto_released',
            data: { order_id: order.id }
          });

          results.food.push({ id: order.id, success: true, amount: restaurantAmount });
          console.log(`✅ Auto-released food order: ${order.id}`);

        } catch (err: any) {
          console.error(`Error processing food order ${order.id}:`, err);
          results.food.push({ id: order.id, success: false, error: err.message });
          await supabaseClient.from('activity_logs').insert({
            activity_type: 'escrow_release_failed',
            description: `Auto-release failed for food order ${order.id}: ${err.message}`,
            metadata: { order_id: order.id, type: 'food', error: err.message }
          }).catch(() => {});
        }
      }
    }

    // ========== 3. ESCROW TRANSACTIONS DIRECTES (timeout_at) ==========
    console.log('💳 Checking escrow transactions with timeout...');

    const now = new Date().toISOString();
    const { data: timedOutEscrows, error: escrowError } = await supabaseClient
      .from('escrow_transactions')
      .select('*')
      .eq('status', 'held')
      .lt('timeout_at', now);

    if (escrowError) {
      console.error('Escrow timeout query error:', escrowError);
    } else if (timedOutEscrows && timedOutEscrows.length > 0) {
      console.log(`Found ${timedOutEscrows.length} timed out escrows`);

      for (const escrow of timedOutEscrows) {
        try {
          // Mettre à jour l'escrow — garde idempotente : uniquement si encore 'held'
          const { data: updatedEscrow } = await supabaseClient
            .from('escrow_transactions')
            .update({
              status: 'released',
              released_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', escrow.id)
            .eq('status', 'held')
            .select('id');

          if (!updatedEscrow || updatedEscrow.length === 0) {
            console.log(`⏭️ Escrow ${escrow.id} already released, skipping`);
            continue;
          }

          // Créditer le vendeur
          const { data: vendorWallet } = await supabaseClient
            .from('vendor_wallets')
            .select('*')
            .eq('vendor_id', escrow.seller_id)
            .eq('currency', 'CDF')
            .single();

          if (vendorWallet) {
            await supabaseClient
              .from('vendor_wallets')
              .update({
                balance: (vendorWallet.balance || 0) + escrow.seller_amount,
                total_earned: (vendorWallet.total_earned || 0) + escrow.seller_amount,
                updated_at: new Date().toISOString()
              })
              .eq('id', vendorWallet.id);
          }

          // Notifier
          await supabaseClient.from('system_notifications').insert({
            user_id: escrow.seller_id,
            title: '💰 Paiement libéré (timeout)',
            message: `${escrow.seller_amount?.toLocaleString()} CDF ont été libérés automatiquement.`,
            notification_type: 'escrow_timeout_released',
            data: { escrow_id: escrow.id, order_id: escrow.order_id, amount: escrow.seller_amount }
          });

          results.escrowDirect.push({ id: escrow.id, success: true, amount: escrow.seller_amount });
          console.log(`✅ Auto-released escrow (timeout): ${escrow.id}`);

        } catch (err: any) {
          console.error(`Error processing escrow ${escrow.id}:`, err);
          results.escrowDirect.push({ id: escrow.id, success: false, error: err.message });
          await supabaseClient.from('activity_logs').insert({
            activity_type: 'escrow_release_failed',
            description: `Auto-release failed for escrow_transaction ${escrow.id}: ${err.message}`,
            metadata: { escrow_id: escrow.id, order_id: escrow.order_id, type: 'escrow_direct', error: err.message }
          }).catch(() => {});
        }
      }
    }

    // ========== SUMMARY ==========
    const summary = {
      marketplace: {
        total: results.marketplace.length,
        success: results.marketplace.filter(r => r.success).length,
        failed: results.marketplace.filter(r => !r.success).length
      },
      food: {
        total: results.food.length,
        success: results.food.filter(r => r.success).length,
        failed: results.food.filter(r => !r.success).length
      },
      escrowDirect: {
        total: results.escrowDirect.length,
        success: results.escrowDirect.filter(r => r.success).length,
        failed: results.escrowDirect.filter(r => !r.success).length
      }
    };

    const totalProcessed = summary.marketplace.total + summary.food.total + summary.escrowDirect.total;
    const totalSuccess = summary.marketplace.success + summary.food.success + summary.escrowDirect.success;

    console.log('📊 Auto-release job completed:', summary);

    // Logger l'activité
    await supabaseClient.from('activity_logs').insert({
      activity_type: 'escrow_auto_release_job',
      description: `Job auto-release: ${totalSuccess}/${totalProcessed} traités avec succès`,
      metadata: summary
    });

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Processed ${totalProcessed} items (${totalSuccess} success)`,
        summary,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Auto-release job error:', error);

    // Logger le crash global pour intervention admin
    try {
      const emergencyClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      );
      await emergencyClient.from('activity_logs').insert({
        activity_type: 'escrow_release_failed',
        description: `Auto-release job crashed: ${error.message}`,
        metadata: { error: error.message, stack: error.stack }
      });
    } catch (_) { /* ne pas masquer l'erreur originale si le log échoue */ }

    return new Response(
      JSON.stringify({ success: false, error: (error as any).message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
