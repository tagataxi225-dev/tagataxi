import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    // Utiliser SERVICE_ROLE pour bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Récupérer l'utilisateur authentifié
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header manquant');
    }

    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      throw new Error('Utilisateur non authentifié');
    }

    const { action, amount, description, reference_id, reference_type, currency = 'CDF' } = await req.json();
    console.log(`[vendor-wallet-manager] Action: ${action}, User: ${user.id}`);

    switch (action) {
      case 'get_or_create': {
        // Récupérer ou créer le wallet vendeur avec UPSERT pour éviter les race conditions
        let wallet = null;
        
        // D'abord essayer de récupérer
        const { data: existingWallet, error: fetchError } = await supabaseAdmin
          .from('vendor_wallets')
          .select('*')
          .eq('vendor_id', user.id)
          .eq('currency', currency)
          .maybeSingle();

        if (fetchError) {
          console.error('[vendor-wallet-manager] Erreur fetch:', fetchError);
          throw fetchError;
        }

        if (existingWallet) {
          wallet = existingWallet;
        } else {
          // Créer avec upsert pour gérer les race conditions
          const { data: upsertedWallet, error: upsertError } = await supabaseAdmin
            .from('vendor_wallets')
            .upsert({
              vendor_id: user.id,
              balance: 0,
              currency: currency,
              total_earned: 0,
              total_withdrawn: 0,
              is_active: true
            }, { 
              onConflict: 'vendor_id,currency',
              ignoreDuplicates: false 
            })
            .select()
            .single();

          if (upsertError) {
            console.error('[vendor-wallet-manager] Erreur upsert wallet:', upsertError);
            // En cas d'erreur, re-tenter de récupérer (peut arriver avec race condition)
            const { data: retryWallet } = await supabaseAdmin
              .from('vendor_wallets')
              .select('*')
              .eq('vendor_id', user.id)
              .eq('currency', currency)
              .single();
            
            wallet = retryWallet;
          } else {
            wallet = upsertedWallet;
            console.log(`[vendor-wallet-manager] Wallet créé pour ${user.id}`);
          }
        }

        // Récupérer les transactions
        const { data: transactions, error: txError } = await supabaseAdmin
          .from('vendor_wallet_transactions')
          .select('*')
          .eq('vendor_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50);

        if (txError) {
          console.error('[vendor-wallet-manager] Erreur transactions:', txError);
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            wallet, 
            transactions: transactions || [] 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'credit': {
        // Créditer le wallet vendeur (utilisé après une vente)
        if (!amount || amount <= 0) {
          throw new Error('Montant invalide');
        }

        // Récupérer le wallet actuel
        let { data: wallet, error: walletError } = await supabaseAdmin
          .from('vendor_wallets')
          .select('*')
          .eq('vendor_id', user.id)
          .eq('currency', currency)
          .single();

        if (walletError && walletError.code === 'PGRST116') {
          // Créer le wallet s'il n'existe pas
          const { data: newWallet, error: createError } = await supabaseAdmin
            .from('vendor_wallets')
            .insert({
              vendor_id: user.id,
              balance: amount,
              currency: currency,
              total_earned: amount,
              total_withdrawn: 0,
              is_active: true
            })
            .select()
            .single();

          if (createError) throw createError;
          wallet = newWallet;
        } else if (walletError) {
          throw walletError;
        } else {
          // Mettre à jour le wallet existant
          const { data: updatedWallet, error: updateError } = await supabaseAdmin
            .from('vendor_wallets')
            .update({
              balance: (wallet.balance || 0) + amount,
              total_earned: (wallet.total_earned || 0) + amount,
              updated_at: new Date().toISOString()
            })
            .eq('id', wallet.id)
            .select()
            .single();

          if (updateError) throw updateError;
          wallet = updatedWallet;
        }

        // Enregistrer la transaction
        const { error: txError } = await supabaseAdmin
          .from('vendor_wallet_transactions')
          .insert({
            vendor_id: user.id,
            wallet_id: wallet.id,
            transaction_type: 'sale_credit',
            amount: amount,
            currency: currency,
            description: description || 'Crédit de vente',
            reference_id: reference_id,
            reference_type: reference_type || 'marketplace_order',
            status: 'completed',
            balance_before: (wallet.balance || 0) - amount,
            balance_after: wallet.balance
          });

        if (txError) {
          console.error('[vendor-wallet-manager] Erreur transaction:', txError);
        }

        console.log(`[vendor-wallet-manager] Crédité ${amount} CDF au vendeur ${user.id}`);

        return new Response(
          JSON.stringify({ success: true, wallet, credited: amount }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_balance': {
        const { data: wallet, error } = await supabaseAdmin
          .from('vendor_wallets')
          .select('balance, currency, total_earned, total_withdrawn')
          .eq('vendor_id', user.id)
          .eq('currency', currency)
          .single();

        if (error && (error as any).code !== 'PGRST116') throw error;

        return new Response(
          JSON.stringify({ 
            success: true, 
            balance: wallet?.balance || 0,
            currency: wallet?.currency || currency,
            total_earned: wallet?.total_earned || 0,
            total_withdrawn: wallet?.total_withdrawn || 0
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        throw new Error(`Action non supportée: ${action}`);
    }

  } catch (error: unknown) {
    console.error('[vendor-wallet-manager] Erreur:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
})
