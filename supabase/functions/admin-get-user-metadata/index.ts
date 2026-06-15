// Version: 2025-11-07T12:00:00Z - Admin functions deployment
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Créer client Supabase avec service_role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Vérifier que l'utilisateur est authentifié
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Unauthorized: No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      console.error('❌ Authentication failed:', userError);
      throw new Error('Unauthorized: Invalid token');
    }

    console.log('✅ User authenticated:', user.id);

    // Vérifier que l'utilisateur est admin via user_roles (système unifié)
    const { data: adminCheck, error: adminError } = await supabaseAdmin
      .from('user_roles')
      .select('id')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .eq('is_active', true)
      .maybeSingle();

    if (adminError || !adminCheck) {
      console.error('❌ Admin check failed:', adminError);
      throw new Error('Access denied: Admin privileges required');
    }

    console.log('✅ Admin verified:', adminCheck);

    // Récupérer les user_ids depuis le body
    const { user_ids } = await req.json();

    if (!user_ids || !Array.isArray(user_ids)) {
      throw new Error('user_ids array required');
    }

    console.log(`📊 Fetching metadata for ${user_ids.length} users`);

    // Récupérer tous les utilisateurs via admin.listUsers()
    const { data: { users: allUsers }, error: listUsersError } = await supabaseAdmin.auth.admin.listUsers();

    if (listUsersError) {
      console.error('❌ Error listing users:', listUsersError);
      throw new Error(`Failed to list users: ${listUsersError.message}`);
    }

    console.log(`📊 Total auth users found: ${allUsers.length}`);

    // Filtrer uniquement les users demandés et construire les métadonnées
    const metadata: Record<string, any> = {};
    const errors: string[] = [];

    for (const userId of user_ids) {
      const authUser = allUsers.find(u => u.id === userId);
      
      if (authUser) {
        metadata[userId] = {
          last_sign_in_at: authUser.last_sign_in_at,
          email_confirmed_at: authUser.email_confirmed_at,
          created_at: authUser.created_at,
          email: authUser.email,
          phone: authUser.phone,
          updated_at: authUser.updated_at,
        };
      } else {
        console.warn(`⚠️ User ${userId} not found in auth.users`);
        errors.push(`User ${userId}: Not found in auth system`);
      }
    }

    console.log(`✅ Successfully fetched metadata for ${Object.keys(metadata).length} users`);
    if (errors.length > 0) {
      console.warn('⚠️ Some errors occurred:', errors);
    }

    return new Response(
      JSON.stringify({ 
        metadata,
        total_requested: user_ids.length,
        total_fetched: Object.keys(metadata).length,
        errors: errors.length > 0 ? errors : undefined
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('❌ Fatal error:', error);
    return new Response(
      JSON.stringify({ error: (error as any).message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
