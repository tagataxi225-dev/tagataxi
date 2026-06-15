import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-health-check',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

const PLATFORM_COMMISSION_RATE = 0.05; // 5%

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { orderId, buyerId, rating } = await req.json();

    console.log('💰 Releasing marketplace escrow:', { orderId, buyerId, rating });

    // 1. Récupérer la commande complète
    const { data: order, error: orderError } = await supabase
      .from('marketplace_orders')
      .select(`
        *,
        escrow_payments(*),
        delivery_escrow_payments(*),
        marketplace_delivery_assignments(driver_id)
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      throw new Error('Commande introuvable');
    }

    // Vérifications de sécurité
    if (order.buyer_id !== buyerId) {
      throw new Error('Accès non autorisé');
    }

    if (order.status !== 'delivered') {
      throw new Error(`Impossible de libérer: commande en statut ${order.status}`);
    }

    const productEscrow = order.escrow_payments?.[0];
    const deliveryEscrow = order.delivery_escrow_payments?.[0];

    if (!productEscrow || productEscrow.status !== 'held') {
      throw new Error('Aucun escrow produit à libérer');
    }

    // 2. Libérer escrow PRODUIT
    console.log('📦 Releasing product escrow:', productEscrow.amount);

    const { error: productReleaseError } = await supabase
      .from('escrow_payments')
      .update({
        status: 'released',
        released_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', productEscrow.id);

    if (productReleaseError) throw productReleaseError;

    // Calculer montant net vendeur (95%)
    const vendorNetAmount = productEscrow.amount * (1 - PLATFORM_COMMISSION_RATE);
    const platformCommission = productEscrow.amount * PLATFORM_COMMISSION_RATE;

    // Transférer au wallet vendeur
    const { data: vendorWallet, error: vendorWalletError } = await supabase
      .from('vendor_wallets')
      .select('*')
      .eq('vendor_id', order.seller_id)
      .maybeSingle();

    if (vendorWalletError) throw vendorWalletError;

    if (vendorWallet) {
      const { error: updateWalletError } = await supabase
        .from('vendor_wallets')
        .update({
          available_balance: vendorWallet.available_balance + vendorNetAmount,
          total_earnings: vendorWallet.total_earnings + vendorNetAmount,
          updated_at: new Date().toISOString()
        })
        .eq('vendor_id', order.seller_id);

      if (updateWalletError) throw updateWalletError;
    } else {
      const { error: createWalletError } = await supabase
        .from('vendor_wallets')
        .insert({
          vendor_id: order.seller_id,
          available_balance: vendorNetAmount,
          total_earnings: vendorNetAmount
        });

      if (createWalletError) throw createWalletError;
    }

    // Logger transaction vendeur
    const { error: vendorTxError } = await supabase
      .from('vendor_wallet_transactions')
      .insert({
        vendor_id: order.seller_id,
        amount: vendorNetAmount,
        transaction_type: 'escrow_release',
        description: `Vente produit - Commande #${orderId.slice(0, 8)}`,
        reference_type: 'marketplace_order',
        reference_id: orderId,
        status: 'completed'
      });

    if (vendorTxError) console.error('⚠️ Error logging vendor transaction:', vendorTxError);

    // Logger commission plateforme
    const { error: commissionError } = await supabase
      .from('vendor_wallet_transactions')
      .insert({
        vendor_id: order.seller_id,
        amount: -platformCommission,
        transaction_type: 'platform_commission',
        description: `Commission plateforme (5%) - #${orderId.slice(0, 8)}`,
        reference_type: 'marketplace_order',
        reference_id: orderId,
        status: 'completed'
      });

    if (commissionError) console.error('⚠️ Error logging commission:', commissionError);

    // 3. Libérer escrow LIVRAISON
    if (deliveryEscrow && deliveryEscrow.status === 'held') {
      console.log('🚚 Releasing delivery escrow:', deliveryEscrow.amount);

      const { error: deliveryReleaseError } = await supabase
        .from('delivery_escrow_payments')
        .update({
          status: 'released',
          released_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', deliveryEscrow.id);

      if (deliveryReleaseError) console.error('⚠️ Error releasing delivery escrow:', deliveryReleaseError);

      // Transférer au wallet du livreur si Kwenda
      const driverId = deliveryEscrow.driver_id || order.marketplace_delivery_assignments?.[0]?.driver_id;

      if (driverId && order.vendor_delivery_method === 'kwenda') {
        const { data: driverWallet, error: driverWalletError } = await supabase
          .from('user_wallets')
          .select('balance')
          .eq('user_id', driverId)
          .single();

        if (!driverWalletError && driverWallet) {
          const { error: updateDriverError } = await supabase
            .from('user_wallets')
            .update({
              balance: driverWallet.balance + deliveryEscrow.amount,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', driverId);

          if (updateDriverError) console.error('⚠️ Error updating driver wallet:', updateDriverError);

          // Logger transaction livreur
          await supabase.from('wallet_transactions').insert({
            user_id: driverId,
            amount: deliveryEscrow.amount,
            transaction_type: 'delivery_earning',
            description: `Frais de livraison marketplace - #${orderId.slice(0, 8)}`,
            reference_type: 'marketplace_order',
            reference_id: orderId,
            status: 'completed'
          });
        }
      } else if (order.vendor_delivery_method === 'self') {
        // Si livraison par le vendeur, ajouter les frais au vendeur
        const { error: vendorDeliveryError } = await supabase
          .from('vendor_wallets')
          .update({
            available_balance: vendorWallet.available_balance + deliveryEscrow.amount,
            updated_at: new Date().toISOString()
          })
          .eq('vendor_id', order.seller_id);

        if (!vendorDeliveryError) {
          await supabase.from('vendor_wallet_transactions').insert({
            vendor_id: order.seller_id,
            amount: deliveryEscrow.amount,
            transaction_type: 'delivery_earning',
            description: `Frais de livraison auto-gérée - #${orderId.slice(0, 8)}`,
            reference_type: 'marketplace_order',
            reference_id: orderId,
            status: 'completed'
          });
        }
      }
    }

    // 4. Mettre à jour la commande
    const { error: finalUpdateError } = await supabase
      .from('marketplace_orders')
      .update({
        payment_status: 'released',
        revenue_status: 'completed',
        buyer_rating: rating || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (finalUpdateError) console.error('⚠️ Error updating order:', finalUpdateError);

    // 5. Notifier le vendeur
    await supabase.from('push_notifications').insert({
      user_id: order.seller_id,
      title: '💰 Fonds libérés !',
      message: `${vendorNetAmount.toFixed(0)} FC ont été transférés dans votre wallet KwendaPay`,
      notification_type: 'marketplace_payment',
      metadata: {
        order_id: orderId,
        amount: vendorNetAmount
      }
    });

    console.log('✅ Escrow released successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        vendorAmount: vendorNetAmount,
        deliveryAmount: deliveryEscrow?.amount || 0,
        platformCommission
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('❌ Error:', error);
    return new Response(
      JSON.stringify({ error: (error as any).message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
