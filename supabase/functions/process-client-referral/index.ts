import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-health-check',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

const REWARD_AMOUNT = 500; // 500 CDF

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, referral_code, user_id } = await req.json();
    console.log(`[process-client-referral] Action: ${action}, Code: ${referral_code}, User: ${user_id}`);

    if (action === 'validate_code') {
      // Valider un code de parrainage lors de l'inscription
      if (!referral_code || !user_id) {
        return new Response(
          JSON.stringify({ success: false, error: 'Code et user_id requis' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Vérifier que le code existe
      const { data: codeData, error: codeError } = await supabase
        .from('user_referral_codes')
        .select('user_id, is_active')
        .eq('code', referral_code.toUpperCase())
        .single();

      if (codeError || !codeData) {
        console.log('[process-client-referral] Code invalide:', referral_code);
        return new Response(
          JSON.stringify({ success: false, error: 'Code de parrainage invalide' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!codeData.is_active) {
        return new Response(
          JSON.stringify({ success: false, error: 'Ce code n\'est plus actif' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (codeData.user_id === user_id) {
        return new Response(
          JSON.stringify({ success: false, error: 'Vous ne pouvez pas utiliser votre propre code' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Vérifier si l'utilisateur n'a pas déjà été parrainé
      const { data: existingRef } = await supabase
        .from('referral_system')
        .select('id')
        .eq('referee_id', user_id)
        .single();

      if (existingRef) {
        return new Response(
          JSON.stringify({ success: false, error: 'Vous avez déjà été parrainé' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Créer la relation de parrainage
      const { error: insertError } = await supabase
        .from('referral_system')
        .insert({
          referrer_id: codeData.user_id,
          referee_id: user_id,
          referral_code: referral_code.toUpperCase(),
          status: 'pending',
          referrer_reward_amount: REWARD_AMOUNT,
          referee_reward_amount: REWARD_AMOUNT
        });

      if (insertError) {
        console.error('[process-client-referral] Insert error:', insertError);
        throw insertError;
      }

      // Incrémenter le compteur d'usage
      await supabase.rpc('increment_referral_usage', { p_code: referral_code.toUpperCase() });

      console.log(`[process-client-referral] Parrainage créé: ${codeData.user_id} -> ${user_id}`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          referrer_id: codeData.user_id,
          bonus_amount: REWARD_AMOUNT 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'complete_referral') {
      // Compléter un parrainage après la première course
      if (!user_id) {
        return new Response(
          JSON.stringify({ success: false, error: 'user_id requis' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Trouver le parrainage en attente
      const { data: referral, error: refError } = await supabase
        .from('referral_system')
        .select('id, referrer_id, referrer_reward_amount, referee_reward_amount')
        .eq('referee_id', user_id)
        .eq('status', 'pending')
        .single();

      if (refError || !referral) {
        console.log('[process-client-referral] Pas de parrainage en attente pour:', user_id);
        return new Response(
          JSON.stringify({ success: false, error: 'Pas de parrainage en attente' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Marquer comme complété
      const { error: updateError } = await supabase
        .from('referral_system')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', referral.id);

      if (updateError) throw updateError;

      // Créditer le parrain
      const { error: walletError1 } = await supabase
        .from('user_wallets')
        .update({ 
          balance: supabase.rpc('increment_balance', { 
            p_user_id: referral.referrer_id, 
            p_amount: referral.referrer_reward_amount 
          })
        })
        .eq('user_id', referral.referrer_id);

      // Créditer le filleul
      const { error: walletError2 } = await supabase
        .from('user_wallets')
        .update({ 
          balance: supabase.rpc('increment_balance', { 
            p_user_id: user_id, 
            p_amount: referral.referee_reward_amount 
          })
        })
        .eq('user_id', user_id);

      // Créer les transactions wallet
      await supabase.from('wallet_transactions').insert([
        {
          user_id: referral.referrer_id,
          transaction_type: 'referral_bonus',
          amount: referral.referrer_reward_amount,
          description: 'Bonus parrainage - Ami inscrit',
          status: 'completed'
        },
        {
          user_id: user_id,
          transaction_type: 'referral_bonus',
          amount: referral.referee_reward_amount,
          description: 'Bonus bienvenue - Parrainage',
          status: 'completed'
        }
      ]);

      // Mettre à jour les gains totaux du code
      await supabase
        .from('user_referral_codes')
        .update({ 
          total_earnings: supabase.rpc('add_referral_earnings', { 
            p_user_id: referral.referrer_id, 
            p_amount: referral.referrer_reward_amount 
          })
        })
        .eq('user_id', referral.referrer_id);

      console.log(`[process-client-referral] Parrainage complété: ${referral.referrer_id} -> ${user_id}`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          referrer_bonus: referral.referrer_reward_amount,
          referee_bonus: referral.referee_reward_amount
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Action invalide' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('[process-client-referral] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: (error as any).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
