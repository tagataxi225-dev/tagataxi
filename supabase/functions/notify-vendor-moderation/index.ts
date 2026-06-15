import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { product_id, vendor_id, status, rejection_reason } = await req.json();

    console.log('📧 Notifying vendor:', { product_id, vendor_id, status });

    // 1️⃣ Récupérer les détails du produit
    const { data: product, error: productError } = await supabase
      .from('marketplace_products')
      .select('title')
      .eq('id', product_id)
      .single();

    if (productError) {
      console.error('Error fetching product:', productError);
      throw productError;
    }

    // 2️⃣ Créer notification vendeur dans vendor_notifications
    const notificationMessage = status === 'approved'
      ? `Votre produit "${product.title}" a été approuvé et est maintenant visible sur la marketplace !`
      : `Votre produit "${product.title}" a été rejeté. Raison : ${rejection_reason || 'Non conforme aux politiques'}`;

    const { error: notifError } = await supabase
      .from('vendor_notifications')
      .insert({
        user_id: vendor_id,
        title: status === 'approved' ? '✅ Produit approuvé' : '❌ Produit rejeté',
        message: notificationMessage,
        notification_type: 'product_moderation',
        metadata: {
          product_id,
          moderation_status: status,
          rejection_reason: rejection_reason || null
        },
        priority: 'high',
        read: false
      });

    if (notifError) {
      console.error('Error creating vendor notification:', notifError);
      throw notifError;
    }

    // 3️⃣ Créer push notification
    const { error: pushError } = await supabase
      .from('push_notifications')
      .insert({
        user_id: vendor_id,
        title: status === 'approved' ? '🎉 Produit approuvé' : '⚠️ Produit rejeté',
        message: notificationMessage,
        notification_type: 'vendor_moderation',
        metadata: { product_id, status }
      });

    if (pushError) {
      console.error('Error creating push notification:', pushError);
      // Continue même si push notification échoue
    }

    console.log('✅ Vendor notified successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Vendor notified successfully' 
      }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: unknown) {
    console.error('❌ Error in notify-vendor-moderation:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: (error as any).message 
      }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
