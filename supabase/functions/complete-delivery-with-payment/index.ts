import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { 
      orderId, 
      driverId, 
      deliveryProof,
      cashCollected = false,
      cashAmount = 0,
      recipientName,
      notes 
    } = await req.json();

    console.log('🚚 Driver completing delivery:', { orderId, driverId, cashCollected, cashAmount });

    // Récupérer la commande
    const { data: order, error: orderError } = await supabase
      .from('marketplace_orders')
      .select('*, delivery_escrow_payments(*)')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      throw new Error('Commande introuvable');
    }

    // Vérifier que c'est le bon livreur
    const { data: assignment } = await supabase
      .from('marketplace_delivery_assignments')
      .select('driver_id')
      .eq('order_id', orderId)
      .maybeSingle();

    if (assignment && assignment.driver_id !== driverId) {
      throw new Error('Vous n\'êtes pas assigné à cette livraison');
    }

    // 1. Mettre à jour le statut de la commande
    const { error: updateError } = await supabase
      .from('marketplace_orders')
      .update({
        status: 'delivered',
        delivered_at: new Date().toISOString(),
        delivery_proof_url: deliveryProof?.url || null,
        recipient_name: recipientName,
        delivery_notes: notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (updateError) throw updateError;

    // 2. Gérer le cash si collecté
    if (cashCollected && cashAmount > 0) {
      console.log('💵 Recording cash collection:', cashAmount);

      // Enregistrer la collecte de cash
      const { error: cashError } = await supabase
        .from('driver_cash_collections')
        .insert({
          driver_id: driverId,
          delivery_order_id: orderId,
          marketplace_order_id: orderId,
          amount: cashAmount,
          collection_type: 'delivery_fee',
          status: 'collected',
          notes: notes || 'Frais de livraison payés en espèces'
        });

      if (cashError) {
        console.error('⚠️ Error recording cash:', cashError);
      }

      // Mettre à jour l'escrow livraison si paiement cash
      const deliveryEscrow = order.delivery_escrow_payments?.[0];
      if (deliveryEscrow && deliveryEscrow.payment_method === 'cash_on_delivery') {
        const { error: escrowUpdateError } = await supabase
          .from('delivery_escrow_payments')
          .update({
            status: 'held', // Passe de pending_cash à held
            driver_id: driverId,
            updated_at: new Date().toISOString()
          })
          .eq('id', deliveryEscrow.id);

        if (escrowUpdateError) {
          console.error('⚠️ Error updating delivery escrow:', escrowUpdateError);
        }
      }
    }

    // 3. Assigner le driver à l'escrow livraison si Kwenda
    if (order.vendor_delivery_method === 'kwenda') {
      const { error: escrowAssignError } = await supabase
        .from('delivery_escrow_payments')
        .update({
          driver_id: driverId,
          updated_at: new Date().toISOString()
        })
        .eq('order_id', orderId);

      if (escrowAssignError) {
        console.error('⚠️ Error assigning driver to escrow:', escrowAssignError);
      }
    }

    // 4. Notifier le client
    const { error: notifError } = await supabase
      .from('push_notifications')
      .insert({
        user_id: order.buyer_id,
        title: '📦 Colis livré !',
        message: `Votre commande #${orderId.slice(0, 8)} a été livrée. Confirmez la réception pour libérer les fonds.`,
        notification_type: 'marketplace_delivery',
        metadata: {
          order_id: orderId,
          delivered_at: new Date().toISOString()
        }
      });

    if (notifError) {
      console.error('⚠️ Error sending notification:', notifError);
    }

    console.log('✅ Delivery completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        orderId,
        status: 'delivered'
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
