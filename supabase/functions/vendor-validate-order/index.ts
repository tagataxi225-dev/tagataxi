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
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { orderId, vendorId, deliveryFee, deliveryMethod, selfDelivery } = await req.json();

    console.log('Validating order:', { orderId, vendorId, deliveryFee, deliveryMethod });

    // Vérifier que la commande existe et appartient au vendeur
    const { data: order, error: orderError } = await supabaseClient
      .from('marketplace_orders')
      .select('*, marketplace_products!inner(seller_id)')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      throw new Error('Commande non trouvée');
    }

    if (order.marketplace_products.seller_id !== vendorId) {
      throw new Error('Accès non autorisé à cette commande');
    }

    // ✅ CORRIGÉ: Mettre à jour la commande en attente d'approbation client
    const { error: updateError } = await supabaseClient
      .from('marketplace_orders')
      .update({
        delivery_fee: deliveryFee,
        vendor_delivery_method: deliveryMethod,
        vendor_confirmation_status: 'confirmed',
        vendor_confirmed_at: new Date().toISOString(),
        status: 'pending_buyer_approval', // ✅ Client doit approuver les frais
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (updateError) throw updateError;

    // ✅ AJOUT: Notifier le client des frais de livraison proposés
    const { error: notifError } = await supabaseClient
      .from('system_notifications')
      .insert({
        user_id: order.buyer_id,
        title: 'Frais de livraison proposés',
        message: `Le vendeur propose ${deliveryFee} FC pour la livraison. Consultez votre commande pour accepter ou refuser.`,
        type: 'delivery_fee_approval',
        related_id: orderId,
        related_type: 'marketplace_order'
      });

    if (notifError) {
      console.error('Notification error:', notifError);
    }

    // Créer une transaction dans le wallet du vendeur (en attente)
    const { error: walletError } = await supabaseClient
      .from('vendor_wallet_transactions')
      .insert({
        vendor_id: vendorId,
        transaction_type: 'sale',
        amount: order.total_amount,
        currency: 'CDF',
        description: `Vente - Commande #${orderId.substring(0, 8)}`,
        reference_id: orderId,
        reference_type: 'marketplace_order',
        status: 'pending'
      });

    if (walletError) {
      console.error('Wallet transaction error:', walletError);
    }

    // Si livraison par le vendeur, créer une notification
    if (selfDelivery) {
      await supabaseClient
        .from('activity_logs')
        .insert({
          user_id: vendorId,
          activity_type: 'vendor_self_delivery',
          description: `Auto-assignation livraison commande #${orderId.substring(0, 8)}`,
          reference_id: orderId,
          reference_type: 'marketplace_order'
        });
    }

    // Logger l'activité
    await supabaseClient
      .from('activity_logs')
      .insert({
        user_id: vendorId,
        activity_type: 'order_validation',
        description: `Validation commande avec frais livraison: ${deliveryFee} FC`,
        reference_id: orderId,
        reference_type: 'marketplace_order',
        metadata: {
          delivery_fee: deliveryFee,
          delivery_method: deliveryMethod
        }
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Commande validée. Le client va recevoir votre proposition de frais.',
        orderId,
        deliveryFee 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error validating order:', error);
    return new Response(
      JSON.stringify({ success: false, error: (error as any).message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
