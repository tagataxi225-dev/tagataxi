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
    console.log('[driver-profile-photo-upload] Starting upload process');

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('[driver-profile-photo-upload] No authorization header');
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with user token
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Client for user authentication
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Get authenticated user
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !user) {
      console.error('[driver-profile-photo-upload] User auth failed:', userError?.message);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[driver-profile-photo-upload] User authenticated:', user.id);

    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const profileType = formData.get('profileType') as string || 'taxi';

    if (!file) {
      console.error('[driver-profile-photo-upload] No file in request');
      return new Response(
        JSON.stringify({ error: 'No file provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[driver-profile-photo-upload] File received:', file.name, 'Size:', file.size, 'Type:', file.type);

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      console.error('[driver-profile-photo-upload] Invalid file type:', file.type);
      return new Response(
        JSON.stringify({ error: 'Invalid file type. Only JPEG, PNG and WebP are allowed.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      console.error('[driver-profile-photo-upload] File too large:', file.size);
      return new Response(
        JSON.stringify({ error: 'File too large. Maximum size is 5MB.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create admin client for storage operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Generate file path
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `profile-${Date.now()}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    console.log('[driver-profile-photo-upload] Uploading to path:', filePath);

    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = new Uint8Array(arrayBuffer);

    // Upload to storage using admin client (bypasses RLS)
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('profile-pictures')
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error('[driver-profile-photo-upload] Upload error:', uploadError);
      return new Response(
        JSON.stringify({ error: `Upload failed: ${uploadError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[driver-profile-photo-upload] Upload successful:', uploadData.path);

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('profile-pictures')
      .getPublicUrl(filePath);

    console.log('[driver-profile-photo-upload] Public URL:', publicUrl);

    // Update the appropriate profile table based on profileType
    if (profileType === 'delivery') {
      // Update driver_profiles for delivery drivers
      const { error: updateError } = await supabaseAdmin
        .from('driver_profiles')
        .update({ 
          photo_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('[driver-profile-photo-upload] Profile update error (delivery):', updateError);
        // Don't fail - photo is uploaded, just log the error
      } else {
        console.log('[driver-profile-photo-upload] driver_profiles updated');
      }
    }

    // Always update chauffeurs table (for taxi drivers and as backup for delivery)
    const { error: chauffeurError } = await supabaseAdmin
      .from('chauffeurs')
      .update({ 
        profile_photo_url: publicUrl,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);

    if (chauffeurError) {
      console.error('[driver-profile-photo-upload] Chauffeur update error:', chauffeurError);
    } else {
      console.log('[driver-profile-photo-upload] chauffeurs table updated');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        publicUrl,
        path: filePath 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: unknown) {
    console.error('[driver-profile-photo-upload] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: `Server error: ${(error as any).message}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
