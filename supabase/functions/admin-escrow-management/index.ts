import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-health-check, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Non autorisé');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Non autorisé');
    }

    const { data: adminData } = await supabaseClient
      .from('admins')
      .select('id, admin_level')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle();

    if (!adminData) {
      throw new Error('Accès refusé - Admin requis');
    }

    const { action, escrowId, adminNotes, resolution } = await req.json();

    console.log(`Admin escrow action: ${action} for escrow ${escrowId} by admin ${user.id}`);

    const { data: escrow, error: escrowError } = await supabaseClient
      .from('escrow_transactions')
      .select('*')
      .eq('id', escrowId)
      .single();

    if (escrowError || !escrow) {
      throw new Error('Transaction escrow non trouvée');
    }

    let result = { success: false, message: '' };

    switch (action) {
      case 'force_release':
        result = await forceRelease(supabaseClient, escrow, user.id, adminNotes);
        break;
      case 'force_refund':
        result = await forceRefund(supabaseClient, escrow, user.id, adminNotes);
        break;
      case 'open_dispute':
        result = await openDispute(supabaseClient, escrow, user.id, adminNotes, resolution?.reason);
        break;
      case 'resolve_dispute':
        result = await resolveDispute(supabaseClient, escrow, user.id, adminNotes, resolution);
        break;
      default:
        throw new Error(`Action non supportée: ${action}`);
    }

    // Log admin action
    await supabaseClient
      .from('activity_logs')
      .insert({
        user_id: user.id,
        activity_type: 'admin_escrow_action',
        description: `Action admin escrow: ${action}`,
        reference_id: escrowId,
        reference_type: 'escrow_transaction',
        metadata: { action, admin_notes: adminNotes, resolution, result: result.success }
      });

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Admin escrow error:', error);
    return new Response(
      JSON.stringify({ success: false, error: (error as any).message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Helper: notify buyer & seller
async function notifyParties(
  supabase: any,
  escrow: any,
  title: string,
  message: string,
  type: string
) {
  const userIds = [escrow.buyer_id, escrow.seller_id].filter(Boolean);
  const notifications = userIds.map(userId => ({
    user_id: userId,
    title,
    message,
    notification_type: type,
    priority: 'high',
    data: { escrow_id: escrow.id, order_id: escrow.order_id },
    is_sent: false
  }));

  await supabase.from('push_notifications').insert(notifications);

  // Also insert into user_notification_logs
  const logs = userIds.map(userId => ({
    user_id: userId,
    title,
    message,
    category: 'marketplace',
    priority: 'high',
    is_read: false,
    is_archived: false,
    metadata: { escrow_id: escrow.id, order_id: escrow.order_id }
  }));

  await supabase.from('user_notification_logs').insert(logs);

  // Broadcast via Realtime to each user
  for (const userId of userIds) {
    try {
      const channel = supabase.channel(`notifications:${userId}`);
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('timeout')), 3000);
        channel.subscribe((status: string) => {
          if (status === 'SUBSCRIBED') { clearTimeout(timeout); resolve(); }
          else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            clearTimeout(timeout); reject(new Error(status));
          }
        });
      });
      await channel.send({
        type: 'broadcast',
        event: 'new_notification',
        payload: { id: crypto.randomUUID(), title, message, type, priority: 'high', timestamp: new Date().toISOString() }
      });
      await supabase.removeChannel(channel);
    } catch (e) {
      console.warn(`⚠️ Realtime notify failed for ${userId}:`, e);
    }
  }
}

async function forceRelease(supabase: any, escrow: any, adminId: string, adminNotes?: string) {
  const { error: updateError } = await supabase
    .from('escrow_transactions')
    .update({
      status: 'released',
      released_at: new Date().toISOString(),
      resolved_at: new Date().toISOString(),
      resolved_by: adminId,
      resolution_type: 'seller_release',
      admin_notes: adminNotes,
      updated_at: new Date().toISOString()
    })
    .eq('id', escrow.id);

  if (updateError) throw updateError;

  const sellerAmount = escrow.seller_amount || (escrow.total_amount - (escrow.platform_fee || 0));

  let { data: wallet } = await supabase
    .from('vendor_wallets')
    .select('*')
    .eq('vendor_id', escrow.seller_id)
    .eq('currency', 'CDF')
    .maybeSingle();

  if (!wallet) {
    const { data: newWallet, error: createError } = await supabase
      .from('vendor_wallets')
      .insert({ vendor_id: escrow.seller_id, balance: 0, currency: 'CDF' })
      .select()
      .single();
    if (createError) throw createError;
    wallet = newWallet;
  }

  const { error: walletError } = await supabase
    .from('vendor_wallets')
    .update({
      balance: wallet.balance + sellerAmount,
      total_earned: (wallet.total_earned || 0) + sellerAmount,
      updated_at: new Date().toISOString()
    })
    .eq('id', wallet.id);

  if (walletError) throw walletError;

  await supabase.from('vendor_wallet_transactions').insert({
    vendor_id: escrow.seller_id,
    transaction_type: 'escrow_release',
    amount: sellerAmount,
    currency: 'CDF',
    description: `Libération admin - Commande #${escrow.order_id?.substring(0, 8)}`,
    reference_id: escrow.order_id,
    reference_type: 'marketplace_order',
    status: 'completed',
    metadata: { forced_by_admin: adminId, admin_notes: adminNotes }
  });

  await supabase.from('marketplace_orders').update({
    revenue_status: 'released',
    updated_at: new Date().toISOString()
  }).eq('id', escrow.order_id);

  // Notify parties
  await notifyParties(supabase, escrow,
    '💰 Fonds libérés',
    `Les fonds de ${sellerAmount.toLocaleString()} FC ont été libérés au vendeur pour la commande #${escrow.order_id?.substring(0, 8)}`,
    'escrow_released'
  );

  return { success: true, message: `Fonds libérés: ${sellerAmount.toLocaleString()} FC vers le vendeur` };
}

async function forceRefund(supabase: any, escrow: any, adminId: string, adminNotes?: string) {
  const { error: updateError } = await supabase
    .from('escrow_transactions')
    .update({
      status: 'refunded',
      refunded_at: new Date().toISOString(),
      resolved_at: new Date().toISOString(),
      resolved_by: adminId,
      resolution_type: 'buyer_refund',
      admin_notes: adminNotes,
      updated_at: new Date().toISOString()
    })
    .eq('id', escrow.id);

  if (updateError) throw updateError;

  const refundAmount = escrow.total_amount;

  let { data: wallet } = await supabase
    .from('user_wallets')
    .select('*')
    .eq('user_id', escrow.buyer_id)
    .eq('currency', 'CDF')
    .maybeSingle();

  if (!wallet) {
    const { data: newWallet, error: createError } = await supabase
      .from('user_wallets')
      .insert({ user_id: escrow.buyer_id, balance: 0, currency: 'CDF' })
      .select()
      .single();
    if (createError) throw createError;
    wallet = newWallet;
  }

  const { error: walletError } = await supabase
    .from('user_wallets')
    .update({ balance: wallet.balance + refundAmount, updated_at: new Date().toISOString() })
    .eq('id', wallet.id);

  if (walletError) throw walletError;

  await supabase.from('wallet_transactions').insert({
    user_id: escrow.buyer_id,
    type: 'refund',
    amount: refundAmount,
    currency: 'CDF',
    description: `Remboursement admin - Commande #${escrow.order_id?.substring(0, 8)}`,
    reference_id: escrow.order_id,
    reference_type: 'marketplace_order',
    status: 'completed',
    metadata: { forced_by_admin: adminId, admin_notes: adminNotes }
  });

  await supabase.from('marketplace_orders').update({
    status: 'refunded',
    revenue_status: 'refunded',
    updated_at: new Date().toISOString()
  }).eq('id', escrow.order_id);

  // Notify parties
  await notifyParties(supabase, escrow,
    '🔄 Remboursement effectué',
    `Un remboursement de ${refundAmount.toLocaleString()} FC a été effectué pour la commande #${escrow.order_id?.substring(0, 8)}`,
    'escrow_refunded'
  );

  return { success: true, message: `Remboursement effectué: ${refundAmount.toLocaleString()} FC vers l'acheteur` };
}

async function openDispute(supabase: any, escrow: any, adminId: string, adminNotes?: string, reason?: string) {
  const { error: updateError } = await supabase
    .from('escrow_transactions')
    .update({
      status: 'disputed',
      dispute_reason: reason || 'Conflit ouvert par admin',
      dispute_opened_at: new Date().toISOString(),
      admin_notes: adminNotes,
      updated_at: new Date().toISOString()
    })
    .eq('id', escrow.id);

  if (updateError) throw updateError;

  await supabase.from('marketplace_orders').update({
    status: 'disputed',
    updated_at: new Date().toISOString()
  }).eq('id', escrow.order_id);

  // Notify parties
  await notifyParties(supabase, escrow,
    '⚠️ Conflit ouvert',
    `Un conflit a été ouvert sur votre commande #${escrow.order_id?.substring(0, 8)}. Raison: ${reason || 'Investigation admin'}`,
    'escrow_disputed'
  );

  return { success: true, message: 'Conflit ouvert avec succès' };
}

async function resolveDispute(supabase: any, escrow: any, adminId: string, adminNotes?: string, resolution?: any) {
  const resolutionType = resolution?.type || 'seller_release';

  if (resolutionType === 'split' && resolution?.vendorAmount != null && resolution?.buyerAmount != null) {
    // Custom split: refund buyer partial + release vendor partial
    const vendorAmount = resolution.vendorAmount;
    const buyerAmount = resolution.buyerAmount;

    // Update escrow status
    await supabase.from('escrow_transactions').update({
      status: 'released',
      resolved_at: new Date().toISOString(),
      resolved_by: adminId,
      resolution_type: 'split',
      admin_notes: adminNotes,
      updated_at: new Date().toISOString()
    }).eq('id', escrow.id);

    // Release vendor portion
    if (vendorAmount > 0) {
      let { data: vWallet } = await supabase.from('vendor_wallets').select('*').eq('vendor_id', escrow.seller_id).eq('currency', 'CDF').maybeSingle();
      if (!vWallet) {
        const { data: nw } = await supabase.from('vendor_wallets').insert({ vendor_id: escrow.seller_id, balance: 0, currency: 'CDF' }).select().single();
        vWallet = nw;
      }
      await supabase.from('vendor_wallets').update({
        balance: (vWallet?.balance || 0) + vendorAmount,
        total_earned: (vWallet?.total_earned || 0) + vendorAmount,
        updated_at: new Date().toISOString()
      }).eq('id', vWallet.id);

      await supabase.from('vendor_wallet_transactions').insert({
        vendor_id: escrow.seller_id,
        transaction_type: 'escrow_release',
        amount: vendorAmount,
        currency: 'CDF',
        description: `Libération partielle (split) - Commande #${escrow.order_id?.substring(0, 8)}`,
        reference_id: escrow.order_id,
        reference_type: 'marketplace_order',
        status: 'completed',
        metadata: { split: true, forced_by_admin: adminId, admin_notes: adminNotes }
      });
    }

    // Refund buyer portion
    if (buyerAmount > 0) {
      let { data: bWallet } = await supabase.from('user_wallets').select('*').eq('user_id', escrow.buyer_id).eq('currency', 'CDF').maybeSingle();
      if (!bWallet) {
        const { data: nw } = await supabase.from('user_wallets').insert({ user_id: escrow.buyer_id, balance: 0, currency: 'CDF' }).select().single();
        bWallet = nw;
      }
      await supabase.from('user_wallets').update({
        balance: (bWallet?.balance || 0) + buyerAmount,
        updated_at: new Date().toISOString()
      }).eq('id', bWallet.id);

      await supabase.from('wallet_transactions').insert({
        user_id: escrow.buyer_id,
        type: 'refund',
        amount: buyerAmount,
        currency: 'CDF',
        description: `Remboursement partiel (split) - Commande #${escrow.order_id?.substring(0, 8)}`,
        reference_id: escrow.order_id,
        reference_type: 'marketplace_order',
        status: 'completed',
        metadata: { split: true, forced_by_admin: adminId, admin_notes: adminNotes }
      });
    }

    await supabase.from('marketplace_orders').update({
      revenue_status: 'released',
      updated_at: new Date().toISOString()
    }).eq('id', escrow.order_id);

    await notifyParties(supabase, escrow,
      '⚖️ Conflit résolu (partage)',
      `Le conflit sur la commande #${escrow.order_id?.substring(0, 8)} a été résolu. Vendeur: ${vendorAmount.toLocaleString()} FC, Acheteur: ${buyerAmount.toLocaleString()} FC`,
      'escrow_split_resolved'
    );

    return { success: true, message: `Conflit résolu par partage: Vendeur ${vendorAmount.toLocaleString()} FC / Acheteur ${buyerAmount.toLocaleString()} FC` };
  }

  if (resolutionType === 'buyer_refund') {
    return await forceRefund(supabase, escrow, adminId, adminNotes);
  }

  // Default: seller_release
  return await forceRelease(supabase, escrow, adminId, adminNotes);
}
