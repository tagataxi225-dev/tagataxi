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
    // ✅ CORRECTION: Utiliser SERVICE_ROLE pour toutes les opérations financières
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Vérifier l'authentification du caller
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization required');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      throw new Error('Utilisateur non authentifié');
    }

    const { orderId } = await req.json();

    console.log('🔓 Releasing escrow for order:', orderId, 'by user:', user.id);

    // Récupérer la commande
    const { data: order, error: orderError } = await supabase
      .from('marketplace_orders')
      .select('*, marketplace_products!inner(seller_id, price)')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('❌ Order not found:', orderError);
      throw new Error('Commande non trouvée');
    }

    // ✅ Vérifier que le caller est bien l'acheteur
    if (order.buyer_id !== user.id) {
      console.error('❌ User is not the buyer:', { userId: user.id, buyerId: order.buyer_id });
      throw new Error('Seul l\'acheteur peut confirmer la réception');
    }

    console.log('📦 Order found:', order.id, 'Status:', order.status);

    // Vérifier que la commande est complétée ou livrée
    if (!['completed', 'delivered'].includes(order.status)) {
      throw new Error('La commande doit être livrée avant de libérer les fonds');
    }

    // ✅ Chercher dans escrow_payments
    const { data: escrowPayment, error: escrowError } = await supabase
      .from('escrow_payments')
      .select('*')
      .eq('order_id', orderId)
      .single();

    if (escrowError || !escrowPayment) {
      console.error('❌ No escrow payment found:', escrowError);
      throw new Error('Aucun paiement escrow trouvé pour cette commande');
    }

    // ✅ IDEMPOTENCE: Si déjà released, retourner succès sans re-traiter
    if (escrowPayment.status === 'released') {
      console.log('⚠️ Escrow already released, returning success');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Paiement déjà libéré',
          alreadyReleased: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('💰 Escrow payment found:', escrowPayment.id, 'Amount:', escrowPayment.amount);

    // ✅ Calculer les montants (95% vendeur, 5% plateforme)
    const totalAmount = escrowPayment.amount;
    const platformCommission = Math.round(totalAmount * 0.05);
    const sellerAmount = totalAmount - platformCommission;

    console.log('📊 Amounts - Total:', totalAmount, 'Commission (5%):', platformCommission, 'Seller (95%):', sellerAmount);

    // ✅ Mettre à jour le paiement escrow avec SERVICE_ROLE
    const { error: escrowUpdateError } = await supabase
      .from('escrow_payments')
      .update({
        status: 'released',
        released_at: new Date().toISOString()
      })
      .eq('id', escrowPayment.id);

    if (escrowUpdateError) {
      console.error('❌ Failed to update escrow:', escrowUpdateError);
      throw escrowUpdateError;
    }

    console.log('✅ Escrow status updated to released');

    // ✅ Récupérer ou créer le wallet vendeur
    const sellerId = escrowPayment.seller_id || order.marketplace_products.seller_id;
    
    let { data: wallet } = await supabase
      .from('vendor_wallets')
      .select('*')
      .eq('vendor_id', sellerId)
      .eq('currency', escrowPayment.currency || 'CDF')
      .single();

    if (!wallet) {
      console.log('📝 Creating new vendor wallet');
      const { data: newWallet, error: createError } = await supabase
        .from('vendor_wallets')
        .insert({
          vendor_id: sellerId,
          balance: 0,
          total_earned: 0,
          total_withdrawn: 0,
          currency: escrowPayment.currency || 'CDF',
          is_active: true
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Failed to create wallet:', createError);
        throw createError;
      }
      wallet = newWallet;
    }

    // ✅ Mettre à jour le solde vendeur avec SERVICE_ROLE
    const { error: walletUpdateError } = await supabase
      .from('vendor_wallets')
      .update({
        balance: (wallet.balance || 0) + sellerAmount,
        total_earned: (wallet.total_earned || 0) + sellerAmount,
        updated_at: new Date().toISOString()
      })
      .eq('id', wallet.id);

    if (walletUpdateError) {
      console.error('❌ Failed to update wallet:', walletUpdateError);
      throw walletUpdateError;
    }

    console.log('💳 Wallet updated. New balance:', (wallet.balance || 0) + sellerAmount);

    // ✅ Créer transaction de crédit vendeur
    const { error: creditTxError } = await supabase
      .from('vendor_wallet_transactions')
      .insert({
        wallet_id: wallet.id,
        vendor_id: sellerId,
        transaction_type: 'credit',
        amount: sellerAmount,
        currency: escrowPayment.currency || 'CDF',
        description: `Vente - Commande #${orderId.substring(0, 8)} (95%)`,
        reference_id: orderId,
        reference_type: 'marketplace_order',
        status: 'completed'
      });

    if (creditTxError) {
      console.error('❌ Failed to create credit transaction:', creditTxError);
    } else {
      console.log('✅ Credit transaction created');
    }

    // ✅ Créer transaction commission plateforme (pour tracking)
    const { error: commissionTxError } = await supabase
      .from('vendor_wallet_transactions')
      .insert({
        wallet_id: wallet.id,
        vendor_id: sellerId,
        transaction_type: 'commission',
        amount: -platformCommission,
        currency: escrowPayment.currency || 'CDF',
        description: `Commission plateforme (5%) - Commande #${orderId.substring(0, 8)}`,
        reference_id: orderId,
        reference_type: 'marketplace_order',
        status: 'completed'
      });

    if (commissionTxError) {
      console.error('❌ Failed to create commission transaction:', commissionTxError);
    } else {
      console.log('✅ Commission transaction created');
    }

    // ✅ Mettre à jour le statut de revenus de la commande
    const { error: orderUpdateError } = await supabase
      .from('marketplace_orders')
      .update({
        revenue_status: 'released',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (orderUpdateError) {
      console.error('❌ Failed to update order revenue_status:', orderUpdateError);
    }

    // Logger l'activité
    await supabase
      .from('activity_logs')
      .insert({
        user_id: sellerId,
        activity_type: 'escrow_release',
        description: `Paiement libéré: ${sellerAmount.toLocaleString()} CDF (95% après commission)`,
        reference_id: orderId,
        reference_type: 'marketplace_order',
        amount: sellerAmount,
        currency: escrowPayment.currency || 'CDF'
      });

    // Notifier le vendeur
    await supabase
      .from('system_notifications')
      .insert({
        user_id: sellerId,
        title: '💰 Paiement libéré !',
        message: `${sellerAmount.toLocaleString()} CDF crédités sur votre wallet vendeur`,
        notification_type: 'escrow_released',
        data: { order_id: orderId, amount: sellerAmount }
      });

    console.log('🎉 Escrow release completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Paiement libéré avec succès',
        sellerAmount,
        platformCommission 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Error releasing escrow:', error);
    return new Response(
      JSON.stringify({ success: false, error: (error as any).message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
