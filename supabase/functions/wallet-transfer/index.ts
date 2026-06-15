// ============================================================================
// 💸 EDGE FUNCTION: Transfert entre wallets - VERSION 3.0
// ============================================================================
// Fix: utilise SERVICE_ROLE_KEY pour les lookups recipient (bypass RLS)
// Sécurité: JWT requis pour auth, adminClient pour recherche cross-user
// ============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-health-check, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

interface TransferRequest {
  recipientIdentifier: string;
  amount: number;
  description?: string;
}

interface TransferResponse {
  success: boolean;
  transferId?: string;
  senderNewBalance?: number;
  recipientNewBalance?: number;
  recipientName?: string;
  error?: string;
}

/**
 * Recherche destinataire par email — utilise adminClient (SERVICE_ROLE_KEY)
 */
async function findRecipientByEmail(adminClient: any, email: string): Promise<{ userId: string | null; name: string | null }> {
  console.log('📧 Recherche par email:', email);
  
  try {
    // 1️⃣ Clients
    const { data: clientData } = await adminClient
      .from('clients')
      .select('user_id, display_name')
      .eq('email', email.toLowerCase())
      .maybeSingle();
    
    if (clientData?.user_id) {
      console.log('✅ Client trouvé:', clientData.display_name);
      return { userId: clientData.user_id, name: clientData.display_name };
    }

    // 2️⃣ Chauffeurs
    const { data: driverData } = await adminClient
      .from('chauffeurs')
      .select('user_id, display_name')
      .eq('email', email.toLowerCase())
      .maybeSingle();
    
    if (driverData?.user_id) {
      console.log('✅ Chauffeur trouvé:', driverData.display_name);
      return { userId: driverData.user_id, name: driverData.display_name };
    }

    // 3️⃣ Partners
    const { data: partnerData } = await adminClient
      .from('partner_profiles')
      .select('user_id, company_name')
      .eq('company_email', email.toLowerCase())
      .maybeSingle();
    
    if (partnerData?.user_id) {
      console.log('✅ Partner trouvé:', partnerData.company_name);
      return { userId: partnerData.user_id, name: partnerData.company_name };
    }

    // 4️⃣ Fallback: RPC get_user_by_email
    const { data: authData } = await adminClient.rpc('get_user_by_email', { p_email: email.toLowerCase() });
    
    if (authData && Array.isArray(authData) && authData.length > 0) {
      console.log('✅ Utilisateur trouvé via RPC auth');
      return { userId: authData[0].id, name: null };
    }

    console.log('❌ Email introuvable');
    return { userId: null, name: null };
  } catch (err) {
    console.error('❌ Erreur recherche email:', err);
    return { userId: null, name: null };
  }
}

/**
 * Recherche destinataire par téléphone — utilise adminClient (SERVICE_ROLE_KEY)
 */
async function findRecipientByPhone(adminClient: any, phone: string): Promise<{ userId: string | null; name: string | null }> {
  console.log('📞 Recherche par téléphone:', phone);
  
  try {
    // 1️⃣ Clients
    const { data: clientData } = await adminClient
      .from('clients')
      .select('user_id, display_name')
      .eq('phone_number', phone)
      .maybeSingle();
    
    if (clientData?.user_id) {
      console.log('✅ Client trouvé:', clientData.display_name);
      return { userId: clientData.user_id, name: clientData.display_name };
    }

    // 2️⃣ Chauffeurs
    const { data: driverData } = await adminClient
      .from('chauffeurs')
      .select('user_id, display_name')
      .eq('phone_number', phone)
      .maybeSingle();
    
    if (driverData?.user_id) {
      console.log('✅ Chauffeur trouvé:', driverData.display_name);
      return { userId: driverData.user_id, name: driverData.display_name };
    }

    // 3️⃣ Partners
    const { data: partnerData } = await adminClient
      .from('partner_profiles')
      .select('user_id, company_name')
      .eq('company_phone', phone)
      .maybeSingle();
    
    if (partnerData?.user_id) {
      console.log('✅ Partner trouvé:', partnerData.company_name);
      return { userId: partnerData.user_id, name: partnerData.company_name };
    }

    console.log('❌ Téléphone introuvable');
    return { userId: null, name: null };
  } catch (err) {
    console.error('❌ Erreur recherche téléphone:', err);
    return { userId: null, name: null };
  }
}

/**
 * Récupère le nom d'affichage d'un user_id
 */
async function getDisplayName(adminClient: any, userId: string): Promise<string> {
  const { data: client } = await adminClient.from('clients').select('display_name').eq('user_id', userId).maybeSingle();
  if (client?.display_name) return client.display_name;
  
  const { data: driver } = await adminClient.from('chauffeurs').select('display_name').eq('user_id', userId).maybeSingle();
  if (driver?.display_name) return driver.display_name;
  
  const { data: partner } = await adminClient.from('partner_profiles').select('company_name').eq('user_id', userId).maybeSingle();
  if (partner?.company_name) return partner.company_name;
  
  return 'Utilisateur';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('💸 ============ TRANSFERT WALLET V3 START ============');

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    // Client authentifié (pour vérifier le JWT + exécuter le RPC SECURITY DEFINER)
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: req.headers.get('Authorization')! } },
    });

    // Client admin (pour les recherches cross-user, bypass RLS)
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      console.error('❌ AUTH ERROR:', authError);
      return new Response(
        JSON.stringify({ success: false, error: 'Non authentifié' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ USER:', user.id);

    const body: TransferRequest = await req.json();
    const { recipientIdentifier, amount, description } = body;

    console.log('📋 REQUEST:', { recipientIdentifier, amount, senderId: user.id });

    if (!recipientIdentifier || !amount || amount <= 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Paramètres invalides' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Limites
    const MIN_AMOUNT = 100;
    const MAX_AMOUNT = 500000;
    const MAX_DAILY_AMOUNT = 2000000;

    if (amount < MIN_AMOUNT || amount > MAX_AMOUNT) {
      return new Response(
        JSON.stringify({ success: false, error: `Montant invalide. Min: ${MIN_AMOUNT.toLocaleString()} CDF, Max: ${MAX_AMOUNT.toLocaleString()} CDF` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Vérifier limite journalière (via adminClient pour fiabilité)
    const today = new Date().toISOString().split('T')[0];
    const { data: todayTransfers } = await adminClient
      .from('wallet_transfers')
      .select('amount')
      .eq('sender_id', user.id)
      .gte('created_at', `${today}T00:00:00Z`);

    const totalToday = (todayTransfers || []).reduce((sum: number, t: any) => sum + Number(t.amount), 0);

    if (totalToday + amount > MAX_DAILY_AMOUNT) {
      return new Response(
        JSON.stringify({ success: false, error: `Limite journalière atteinte (${MAX_DAILY_AMOUNT.toLocaleString()} CDF). Déjà transféré: ${totalToday.toLocaleString()} CDF.` }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 🔍 Recherche destinataire avec adminClient (bypass RLS)
    const isEmail = recipientIdentifier.includes('@');
    const result = isEmail 
      ? await findRecipientByEmail(adminClient, recipientIdentifier)
      : await findRecipientByPhone(adminClient, recipientIdentifier);

    if (!result.userId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Destinataire introuvable. Vérifiez le numéro ou l\'email.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ RECIPIENT:', result.userId, result.name);

    if (result.userId === user.id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Impossible de transférer vers soi-même' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Exécuter le transfert atomique via RPC (SECURITY DEFINER)
    console.log('🔄 EXECUTING TRANSFER...');
    
    const { data: transferData, error: transferError } = await userClient.rpc(
      'execute_wallet_transfer',
      {
        p_sender_id: user.id,
        p_recipient_id: result.userId,
        p_amount: amount,
        p_description: description || 'Transfert KwendaPay'
      }
    );

    if (transferError) {
      console.error('❌ TRANSFER ERROR:', transferError);
      return new Response(
        JSON.stringify({ success: false, error: `Erreur: ${transferError.message}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ TRANSFER SUCCESS:', transferData);

    // Récupérer les noms pour logs/notifs
    const senderName = await getDisplayName(adminClient, user.id);
    const recipientName = result.name || await getDisplayName(adminClient, result.userId);

    // Activity logs (non-blocking)
    try {
      await adminClient.from('activity_logs').insert([
        {
          user_id: user.id,
          activity_type: 'wallet_transfer_sent',
          description: `Transfert envoyé vers ${recipientName}`,
          amount: -amount,
          currency: 'CDF',
          reference_type: 'wallet_transfer',
          reference_id: transferData?.transfer_id
        },
        {
          user_id: result.userId,
          activity_type: 'wallet_transfer_received',
          description: `Transfert reçu de ${senderName}`,
          amount: amount,
          currency: 'CDF',
          reference_type: 'wallet_transfer',
          reference_id: transferData?.transfer_id
        }
      ]);
    } catch (e) {
      console.warn('⚠️ Activity log error:', e);
    }

    // Notification (non-blocking)
    try {
      await adminClient.from('notifications').insert({
        user_id: result.userId,
        title: 'Transfert reçu',
        message: `Vous avez reçu ${amount.toLocaleString()} CDF de ${senderName}`,
        type: 'wallet_transfer',
        reference_id: transferData?.transfer_id,
        reference_type: 'wallet_transfer'
      });
    } catch (e) {
      console.warn('⚠️ Notification error:', e);
    }

    const response: TransferResponse = {
      success: true,
      transferId: transferData?.transfer_id,
      senderNewBalance: transferData?.sender_new_balance,
      recipientNewBalance: transferData?.recipient_new_balance,
      recipientName: recipientName,
    };

    console.log('💸 ============ TRANSFERT SUCCESS ============');

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('❌ TRANSFERT ERROR:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Erreur inconnue' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
