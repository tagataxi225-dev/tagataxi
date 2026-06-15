import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-health-check',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Récupérer le token de téléchargement
    const { token } = await req.json();

    if (!token) {
      console.error('❌ [digital-download] Token manquant');
      return new Response(
        JSON.stringify({ error: 'Token de téléchargement requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('📥 [digital-download] Vérification du token:', token.substring(0, 20) + '...');

    // Récupérer les infos de téléchargement
    const { data: downloadInfo, error: fetchError } = await supabase
      .from('marketplace_digital_downloads')
      .select(`
        *,
        product:marketplace_products(
          id,
          title,
          digital_file_url,
          digital_file_name,
          seller_id
        )
      `)
      .eq('download_token', token)
      .single();

    if (fetchError || !downloadInfo) {
      console.error('❌ [digital-download] Token invalide ou non trouvé:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Lien de téléchargement invalide' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('📦 [digital-download] Download info:', {
      id: downloadInfo.id,
      download_count: downloadInfo.download_count,
      max_downloads: downloadInfo.max_downloads,
      expires_at: downloadInfo.expires_at
    });

    // Vérifier l'expiration
    if (new Date(downloadInfo.expires_at) < new Date()) {
      console.error('❌ [digital-download] Lien expiré');
      return new Response(
        JSON.stringify({ error: 'Ce lien de téléchargement a expiré' }),
        { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Vérifier la limite de téléchargements
    if (downloadInfo.download_count >= downloadInfo.max_downloads) {
      console.error('❌ [digital-download] Limite atteinte:', downloadInfo.download_count, '/', downloadInfo.max_downloads);
      return new Response(
        JSON.stringify({ error: 'Vous avez atteint la limite de téléchargements pour ce produit' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Récupérer le fichier depuis le storage
    const product = downloadInfo.product;
    if (!product?.digital_file_url) {
      console.error('❌ [digital-download] Fichier non trouvé pour le produit');
      return new Response(
        JSON.stringify({ error: 'Fichier non disponible' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('📄 [digital-download] Génération URL signée pour:', product.digital_file_url);

    // Générer une URL signée (valide 5 minutes)
    const { data: signedUrl, error: signError } = await supabase.storage
      .from('digital-products')
      .createSignedUrl(product.digital_file_url, 300); // 5 minutes

    if (signError || !signedUrl) {
      console.error('❌ [digital-download] Erreur génération URL signée:', signError);
      return new Response(
        JSON.stringify({ error: 'Impossible de générer le lien de téléchargement' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Incrémenter le compteur de téléchargements
    const { error: updateError } = await supabase
      .from('marketplace_digital_downloads')
      .update({
        download_count: downloadInfo.download_count + 1,
        last_downloaded_at: new Date().toISOString()
      })
      .eq('id', downloadInfo.id);

    if (updateError) {
      console.error('⚠️ [digital-download] Erreur mise à jour compteur:', updateError);
      // On continue quand même, le téléchargement est plus important
    }

    console.log('✅ [digital-download] Téléchargement autorisé:', {
      product: product.title,
      newCount: downloadInfo.download_count + 1,
      maxDownloads: downloadInfo.max_downloads
    });

    return new Response(
      JSON.stringify({
        success: true,
        downloadUrl: signedUrl.signedUrl,
        fileName: product.digital_file_name || 'download',
        remainingDownloads: downloadInfo.max_downloads - downloadInfo.download_count - 1
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ [digital-download] Erreur inattendue:', error);
    return new Response(
      JSON.stringify({ error: (error as any).message || 'Erreur serveur' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
