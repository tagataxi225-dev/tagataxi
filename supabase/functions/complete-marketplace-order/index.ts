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
    // Client authentifié pour vérifier l'identité de l'acheteur
    const authClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Client service role pour les opérations financières sécurisées
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { orderId, rating, feedback } = await req.json();

    console.log('Completing marketplace order:', orderId);

    // Vérifier que l'utilisateur est l'acheteur
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) {
      throw new Error('Non authentifié');
    }

    // Récupérer la commande
    const { data: order, error: orderError } = await serviceClient
      .from('marketplace_orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      throw new Error('Commande non trouvée');
    }

    if (order.buyer_id !== user.id) {
      throw new Error('Non autorisé');
    }

    if (order.status !== 'delivered') {
      throw new Error('La commande doit être livrée avant de pouvoir être confirmée');
    }

    // Mettre à jour le statut via service role
    const { error: updateError } = await serviceClient
      .from('marketplace_orders')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        customer_rating: rating,
        customer_feedback: feedback,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (updateError) throw updateError;

    // Appeler la fonction de libération d'escrow
    console.log('📞 Calling release-escrow-payment for order:', orderId);
    
    const { data: releaseData, error: releaseError } = await serviceClient.functions.invoke('release-escrow-payment', {
      body: { orderId }
    });

    if (releaseError) {
      console.error('❌ Error calling release-escrow-payment:', releaseError);
    } else if (releaseData?.success === false) {
      console.error('❌ release-escrow-payment returned error:', releaseData.error);
    } else {
      console.log('✅ Escrow released successfully:', releaseData);
    }

    // Notifier le vendeur via service role
    await serviceClient.from('push_notifications').insert({
      user_id: order.seller_id,
      title: '💰 Paiement libéré !',
      message: `Le client a confirmé la réception. Vos fonds ont été libérés sur votre wallet vendeur.`,
      notification_type: 'marketplace_payment',
      metadata: { 
        order_id: orderId,
        amount: releaseData?.sellerAmount || 0
      }
    });

    // Logger l'activité
    await serviceClient.from('activity_logs').insert({
      user_id: user.id,
      activity_type: 'marketplace_order_completed',
      description: `Commande confirmée par le client`,
      reference_id: orderId,
      reference_type: 'marketplace_order',
      metadata: {
        rating,
        feedback,
        seller_amount: releaseData?.sellerAmount
      }
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Commande terminée et paiement libéré',
        data: releaseData
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error completing order:', error);
    return new Response(
      JSON.stringify({ success: false, error: (error as any).message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
