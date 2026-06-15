import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-health-check',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

interface CompleteRegistrationRequest {
  user_id: string;
  registration_type: 'driver' | 'partner' | 'restaurant';
  registration_data?: any;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { user_id, registration_type, registration_data }: CompleteRegistrationRequest = await req.json();

    console.log('📝 Completing registration:', { user_id, registration_type });

    // Vérifier que l'utilisateur existe
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(user_id);
    
    if (userError || !user) {
      throw new Error('User not found');
    }

    let result;

    // Compléter selon le type d'inscription
    if (registration_type === 'driver') {
      // Le trigger handle_new_user a déjà créé le profil chauffeur
      // On vérifie juste qu'il existe et on active si nécessaire
      const { data: driver, error: driverError } = await supabase
        .from('chauffeurs')
        .select('*')
        .eq('user_id', user_id)
        .single();

      if (driverError) {
        console.error('Driver profile error:', driverError);
      }

      result = { success: true, driver };
    } 
    else if (registration_type === 'partner') {
      // Vérifier le profil partenaire
      const { data: partner, error: partnerError } = await supabase
        .from('partenaires')
        .select('*')
        .eq('user_id', user_id)
        .single();

      if (partnerError) {
        console.error('Partner profile error:', partnerError);
      }

      result = { success: true, partner };
    }
    else if (registration_type === 'restaurant') {
      // Vérifier le profil restaurant
      const { data: restaurant, error: restaurantError } = await supabase
        .from('restaurant_profiles')
        .select('*')
        .eq('user_id', user_id)
        .single();

      if (restaurantError) {
        console.error('Restaurant profile error:', restaurantError);
      }

      result = { success: true, restaurant };
    }

    // Envoyer notification admin
    await supabase.from('admin_notifications').insert({
      type: 'new_registration',
      title: `Nouvelle inscription ${registration_type}`,
      message: `Un nouveau ${registration_type} s'est inscrit et attend validation`,
      severity: 'info',
      data: { user_id, registration_type }
    });

    console.log('✅ Registration completed successfully');

    return new Response(
      JSON.stringify(result),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error: any) {
    console.error('❌ Complete registration error:', error);
    return new Response(
      JSON.stringify({ error: (error as any).message }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 500
      }
    );
  }
});