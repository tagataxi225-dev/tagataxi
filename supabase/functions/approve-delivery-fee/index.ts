import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { orderId, userId, approved } = await req.json();

    console.log('📦 Processing delivery fee approval', { orderId, userId, approved });

    // 1. Vérifier que l'utilisateur est le buyer
    const { data: order, error: orderError } = await supabase
      .from('marketplace_orders')
      .select(`
        *,
        escrow_transactions(*)
      `)
      .eq('id', orderId)
      .eq('buyer_id', userId)
      .single();

    if (orderError || !order) {
      console.error('❌ Order not found:', orderError);
      throw new Error('Commande introuvable ou non autorisée');
    }

    if (order.status !== 'pending_buyer_approval') {
      throw new Error('Cette commande ne nécessite pas d\'approbation');
    }

    // 2. Si refusé, annuler et rembourser
    if (!approved) {
      console.log('❌ Buyer rejected fees, refunding...');
      
      const { error: updateError } = await supabase
        .from('marketplace_orders')
        .update({
          status: 'cancelled',
          vendor_confirmation_status: 'buyer_rejected',
          cancellation_reason: 'Frais de livraison refusés par le client',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (updateError) throw updateError;

      // Rembourser l'escrow
      const escrowAmount = order.escrow_transactions[0]?.amount || order.total_amount;
      
      await supabase
        .from('escrow_transactions')
        .update({ status: 'refunded', updated_at: new Date().toISOString() })
        .eq('order_id', orderId);

      await supabase.rpc('increment_wallet_balance', {
        p_user_id: userId,
        p_amount: escrowAmount
      });

      // Notifier le vendeur
      await supabase.from('system_notifications').insert({
        user_id: order.seller_id,
        title: 'Frais refusés',
        message: 'Le client a refusé les frais de livraison proposés.',
        notification_type: 'delivery_fee_rejected',
        data: { order_id: orderId }
      });

      console.log('✅ Order cancelled and refunded');

      return new Response(
        JSON.stringify({ success: true, refunded: escrowAmount }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Si approuvé, traiter les frais de livraison
    const deliveryFee = order.delivery_fee || 0;
    let paymentMethod = 'wallet';

    if (deliveryFee <= 0) {
      throw new Error('Aucun frais de livraison à approuver');
    }

    console.log('💰 Processing delivery fee:', deliveryFee);

    // Vérifier le solde
    const { data: wallet, error: walletError } = await supabase
      .from('user_wallets')
      .select('balance, bonus_balance')
      .eq('user_id', userId)
      .single();

    if (walletError || !wallet) {
      throw new Error('Portefeuille introuvable');
    }

    const bonusBalance = Number(wallet.bonus_balance || 0);
    const mainBalance = Number(wallet.balance || 0);
    const totalBalance = bonusBalance + mainBalance;

    // Si solde insuffisant, basculer automatiquement en cash
    if (totalBalance < deliveryFee) {
      console.log('💵 Solde insuffisant, bascule automatique vers cash:', { totalBalance, deliveryFee });
      paymentMethod = 'cash_on_delivery';
    } else {
      // Débiter le wallet (priorité bonus)
      if (bonusBalance >= deliveryFee) {
        await supabase
          .from('user_wallets')
          .update({ 
            bonus_balance: bonusBalance - deliveryFee,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);
      } else {
        await supabase
          .from('user_wallets')
          .update({ 
            balance: mainBalance - deliveryFee,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);
      }
    }

    // 4. Mettre à jour l'escrow avec les frais de livraison (seulement si wallet)
    if (paymentMethod === 'wallet') {
      const platformFeeLivraison = deliveryFee * 0.05;
      const sellerFeeLivraison = deliveryFee - platformFeeLivraison;

      await supabase
        .from('escrow_transactions')
        .update({
          delivery_fee: deliveryFee,
          updated_at: new Date().toISOString()
        })
        .eq('order_id', orderId);

      // Logger l'activité wallet
      await supabase.from('activity_logs').insert({
        user_id: userId,
        activity_type: 'delivery_fee_payment',
        description: `Frais de livraison - Commande #${orderId.slice(0, 8)}`,
        amount: -deliveryFee,
        currency: 'CDF',
        reference_type: 'marketplace_order',
        reference_id: orderId
      });
    }

    // 5. Confirmer la commande
    await supabase
      .from('marketplace_orders')
      .update({
        status: 'confirmed',
        vendor_confirmation_status: 'buyer_approved',
        delivery_fee_payment_method: paymentMethod,
        buyer_approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    // 6. Notifier le vendeur
    const paymentInfo = paymentMethod === 'cash_on_delivery' 
      ? ' (paiement en espèces à la livraison)' 
      : '';
    
    await supabase.from('system_notifications').insert({
      user_id: order.seller_id,
      title: 'Frais acceptés ✅',
      message: `Le client a accepté les frais de livraison (${deliveryFee} CDF)${paymentInfo}. Préparez la commande.`,
      notification_type: 'delivery_fee_accepted',
      data: { order_id: orderId, delivery_fee: deliveryFee, payment_method: paymentMethod }
    });

    console.log('✅ Delivery fee approved successfully', { paymentMethod });

    return new Response(
      JSON.stringify({ success: true, deliveryFee, paymentMethod }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Approval error:', error);
    return new Response(
      JSON.stringify({ error: (error as any).message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
