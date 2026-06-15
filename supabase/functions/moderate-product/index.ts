// Version 2.2.0 - Deployed 2025-10-15 - Force rebuild
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const FUNCTION_VERSION = '2.2.0';

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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { productId, action, rejectionReason } = await req.json();

    if (!productId || !action) {
      throw new Error('Missing required parameters: productId and action');
    }

    if (!['approve', 'reject'].includes(action)) {
      throw new Error('Invalid action. Must be "approve" or "reject"');
    }

    console.log('🔍 Moderating product:', { productId, action, rejectionReason });

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { data: adminData, error: adminError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .eq('is_active', true)
      .maybeSingle();

    if (adminError || !adminData) {
      throw new Error('Admin privileges required');
    }

    const { data: product, error: productError } = await supabase
      .from('marketplace_products')
      .select('*')
      .eq('id', productId)
      .single();

    if (productError) {
      console.error('❌ Error fetching product:', productError);
      throw new Error(`Product not found: ${productError.message}`);
    }

    if (!product) {
      throw new Error('Product not found');
    }

    const { data: sellerProfile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', product.seller_id)
      .single();

    let sellerName = sellerProfile?.display_name;
    if (!sellerName) {
      const { data: clientProfile } = await supabase
        .from('clients')
        .select('display_name')
        .eq('user_id', product.seller_id)
        .single();
      
      sellerName = clientProfile?.display_name || 'Vendeur inconnu';
    }

    console.log('✅ Product found:', product.title, 'Seller:', sellerName);

    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    const updateData: any = {
      moderation_status: newStatus,
      moderated_at: new Date().toISOString(),
      moderator_id: user.id
    };

    if (action === 'reject' && rejectionReason) {
      updateData.rejection_reason = rejectionReason;
    }

    const { error: updateError } = await supabase
      .from('marketplace_products')
      .update(updateData)
      .eq('id', productId);

    if (updateError) {
      console.error('❌ Error updating product:', updateError);
      throw new Error(`Failed to update product: ${updateError.message}`);
    }

    console.log('✅ Product status updated to:', newStatus);

    // ✅ PHASE 1.2 : Notification vendeur améliorée avec logs détaillés
    const notificationTitle = action === 'approve' 
      ? 'Produit approuvé ✅' 
      : 'Produit rejeté ❌';
    
    const notificationMessage = action === 'approve'
      ? `Votre produit "${product.title}" a été approuvé et est maintenant visible sur la marketplace.`
      : `Votre produit "${product.title}" a été rejeté. Raison: ${rejectionReason || 'Non spécifiée'}`;

    const vendorNotificationType = action === 'approve' ? 'product_approved' : 'product_rejected';
    const vendorNotificationMetadata = {
      product_title: product.title,
      product_image: product.images?.[0] || null,
      action,
      rejection_reason: rejectionReason,
      moderator_id: user.id,
      moderated_at: new Date().toISOString()
    };

    console.log('📧 Sending notification to vendor:', {
      vendor_id: product.seller_id,
      type: vendorNotificationType,
      title: notificationTitle
    });

    const { error: notificationError } = await supabase
      .from('vendor_product_notifications')
      .insert({
        vendor_id: product.seller_id,
        product_id: productId,
        notification_type: vendorNotificationType,
        title: notificationTitle,
        message: notificationMessage,
        metadata: vendorNotificationMetadata,
        is_read: false
      });

    if (notificationError) {
      console.error('❌ Error creating vendor notification:', notificationError);
      console.error('Notification details:', JSON.stringify({
        vendor_id: product.seller_id,
        product_id: productId,
        error: notificationError.message
      }));
    } else {
      console.log('✅ Vendor notification created successfully:', vendorNotificationType);
      
      // ✅ Marquer la notification comme envoyée
      await supabase
        .from('marketplace_products')
        .update({ moderation_notified_at: new Date().toISOString() })
        .eq('id', productId);
    }

    await supabase
      .from('activity_logs')
      .insert({
        user_id: user.id,
        activity_type: 'product_moderation',
        description: `${action === 'approve' ? 'Approved' : 'Rejected'} product: ${product.title}`,
        metadata: {
          product_id: productId,
          action,
          rejection_reason: rejectionReason,
          seller_id: product.seller_id
        }
      });

    console.log('✅ Product moderation completed:', { productId, action });

    return new Response(
      JSON.stringify({ 
        success: true, 
        productId,
        status: newStatus
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('❌ Moderation error:', error);
    return new Response(
      JSON.stringify({ error: (error as any).message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
