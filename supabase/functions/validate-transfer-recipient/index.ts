// ============================================================================
// 🔍 EDGE FUNCTION: Validation de destinataire pour transferts
// ============================================================================
// Description: Valide qu'un destinataire existe (email ou téléphone)
// Sécurité: JWT requis (authentifié uniquement)
// ============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ValidateRecipientRequest {
  identifier: string; // Email ou numéro de téléphone
}

interface ValidateRecipientResponse {
  success: boolean;
  valid: boolean;
  recipientId?: string;
  recipientName?: string;
  recipientEmail?: string;
  error?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔍 [1/6] Validation destinataire démarrée');

    // Initialiser le client Supabase avec SERVICE_ROLE_KEY pour accès complet
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Extraire et valider le JWT utilisateur
    const authHeader = req.headers.get('Authorization');
    
    console.log('🔑 [1.5/6] Authorization header:', authHeader ? 'Présent' : 'Absent');
    
    if (!authHeader) {
      console.error('❌ [2/6] Pas de header Authorization');
      return new Response(
        JSON.stringify({ success: false, valid: false, error: 'Non authentifié - Header manquant' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extraire le JWT token du header "Bearer <token>"
    const token = authHeader.replace('Bearer ', '');
    
    // Vérifier l'authentification avec le token extrait
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) {
      console.error('❌ [2/6] Erreur authentification:', authError);
      return new Response(
        JSON.stringify({ success: false, valid: false, error: 'Non authentifié' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ [2/6] Utilisateur authentifié:', user.id);

    // Parser le body
    const body: ValidateRecipientRequest = await req.json();
    const { identifier } = body;

    if (!identifier || identifier.trim() === '') {
      return new Response(
        JSON.stringify({ success: false, valid: false, error: 'Identifiant requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🔎 [3/6] Recherche destinataire:', identifier);

    // Déterminer si c'est un email ou un téléphone
    const isEmail = identifier.includes('@');
    let recipientUserId: string | null = null;
    let recipientName: string | null = null;
    let recipientEmail: string | null = null;

    if (isEmail) {
      // ✅ STRATÉGIE SIMPLIFIÉE: Recherche prioritaire dans auth.users
      console.log('📧 [3.1/6] Recherche par email dans auth.users (source de vérité)');
      
      try {
        const { data: authData, error: authSearchError } = await supabaseClient.rpc(
          'get_user_by_email',
          { p_email: identifier.toLowerCase() }
        );

        console.log('🔎 [4/6] Résultat auth.users:', authData ? '✅ Trouvé' : '❌ Non trouvé');

        if (authData && authData.length > 0) {
          recipientUserId = authData[0].id;
          recipientEmail = authData[0].email;
          
          console.log('👤 [4.1/6] User ID trouvé:', recipientUserId);

          // Enrichir avec le display_name depuis clients ou partner_profiles
          try {
            const { data: clientData } = await supabaseClient
              .from('clients')
              .select('display_name')
              .eq('user_id', recipientUserId)
              .maybeSingle();

            if (clientData?.display_name) {
              recipientName = clientData.display_name;
              console.log('✅ [4.2/6] Nom depuis clients:', recipientName);
            } else {
              // Fallback: chercher dans partner_profiles
              const { data: partnerData } = await supabaseClient
                .from('partner_profiles')
                .select('company_name')
                .eq('user_id', recipientUserId)
                .maybeSingle();

              if (partnerData?.company_name) {
                recipientName = partnerData.company_name;
                console.log('✅ [4.3/6] Nom depuis partner_profiles:', recipientName);
              } else {
                // Fallback final: utiliser l'email comme nom
                recipientName = authData[0].email?.split('@')[0] || 'Utilisateur';
                console.log('⚠️ [4.4/6] Fallback nom depuis email:', recipientName);
              }
            }
          } catch (enrichError) {
            console.warn('⚠️ Erreur enrichissement nom (non bloquant):', enrichError);
            recipientName = authData[0].email?.split('@')[0] || 'Utilisateur';
          }
        } else {
          console.log('❌ [4/6] Aucun utilisateur trouvé pour:', identifier);
        }
      } catch (authError) {
        console.error('❌ Erreur recherche auth.users:', authError);
      }
    } else {
      // ✅ RECHERCHE PAR TÉLÉPHONE
      console.log('📱 [3.1/6] Recherche par téléphone');

      try {
        // Chercher d'abord dans clients
        const { data: clientData, error: clientError } = await supabaseClient
          .from('clients')
          .select('user_id, display_name, email, phone_number')
          .eq('phone_number', identifier)
          .maybeSingle();

        console.log('🔎 [4/6] Résultat clients:', clientData ? '✅ Trouvé' : '❌ Non trouvé');

        if (clientData) {
          recipientUserId = clientData.user_id;
          recipientName = clientData.display_name;
          recipientEmail = clientData.email;
          console.log('✅ [4.1/6] Client trouvé:', recipientUserId, recipientName);
        } else {
          // Chercher dans partner_profiles
          const { data: partnerData, error: partnerError } = await supabaseClient
            .from('partner_profiles')
            .select('user_id, company_name, company_phone')
            .eq('company_phone', identifier)
            .maybeSingle();

          console.log('🔎 [4.2/6] Résultat partners:', partnerData ? '✅ Trouvé' : '❌ Non trouvé');

          if (partnerData) {
            recipientUserId = partnerData.user_id;
            recipientName = partnerData.company_name;

            // ✅ CORRECTION: Récupérer l'email depuis auth.users au lieu de company_email
            try {
              const { data: authData } = await supabaseClient.rpc(
                'get_user_by_email_from_id',
                { p_user_id: partnerData.user_id }
              );
              recipientEmail = authData?.email || null;
              console.log('✅ [4.3/6] Email récupéré depuis auth.users:', recipientEmail);
            } catch (emailError) {
              console.warn('⚠️ Impossible de récupérer email (non bloquant):', emailError);
            }

            console.log('✅ [4.4/6] Partner trouvé:', recipientUserId, recipientName);
          } else {
            console.log('❌ [4.5/6] Aucun utilisateur trouvé pour téléphone:', identifier);
          }
        }
      } catch (phoneError) {
        console.error('❌ Erreur recherche par téléphone:', phoneError);
      }
    }

    // Vérifier si un destinataire a été trouvé
    if (!recipientUserId) {
      console.log('❌ [5/6] Destinataire introuvable');
      return new Response(
        JSON.stringify({
          success: true,
          valid: false,
          error: 'Destinataire introuvable'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Vérifier que l'utilisateur ne transfère pas vers lui-même
    if (recipientUserId === user.id) {
      console.log('❌ [5/6] Auto-transfert détecté');
      return new Response(
        JSON.stringify({
          success: true,
          valid: false,
          error: 'Impossible de transférer vers soi-même'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Vérifier que le destinataire a un wallet
    const { data: walletData, error: walletError } = await supabaseClient
      .from('user_wallets')
      .select('id')
      .eq('user_id', recipientUserId)
      .maybeSingle();

    if (!walletData) {
      console.log('❌ [5/6] Wallet destinataire introuvable');
      return new Response(
        JSON.stringify({
          success: true,
          valid: false,
          error: 'Le destinataire n\'a pas de wallet actif'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ [6/6] Destinataire validé avec succès');

    const response: ValidateRecipientResponse = {
      success: true,
      valid: true,
      recipientId: recipientUserId,
      recipientName: recipientName || undefined,
      recipientEmail: recipientEmail || undefined,
    };

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('❌ [ERROR] Erreur validation destinataire:', error);
    return new Response(
      JSON.stringify({
        success: false,
        valid: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
