import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-health-check',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

/**
 * 🔄 REFRESH ADMIN CACHE
 * 
 * Cette Edge Function rafraîchit la vue matérialisée `admin_users_cache`
 * pour maintenir les données admin à jour sans impacter les performances.
 * 
 * Exécution: Toutes les 5 minutes via cron job
 * Timeout: 30 secondes max
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const startTime = Date.now()

  try {
    console.log('🔄 Starting admin cache refresh...')

    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Rafraîchir la vue matérialisée avec timeout
    const refreshController = new AbortController()
    const refreshTimeout = setTimeout(() => refreshController.abort(), 30000) // 30s max

    const { error: refreshError } = await supabaseService
      .rpc('refresh_admin_cache')
      .abortSignal(refreshController.signal)

    clearTimeout(refreshTimeout)

    if (refreshError) {
      console.error('🔴 Cache refresh failed:', {
        error: refreshError.message,
        code: refreshError.code,
        duration: `${Date.now() - startTime}ms`
      })

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: refreshError.message,
          duration: Date.now() - startTime
        }), 
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Compter les admins dans le cache
    const { count: adminCount } = await supabaseService
      .from('admin_users_cache')
      .select('*', { count: 'exact', head: true })

    const duration = Date.now() - startTime

    console.log('✅ Admin cache refreshed successfully:', {
      adminCount: adminCount || 0,
      duration: `${duration}ms`,
      nextRefresh: 'in 5 minutes'
    })

    return new Response(
      JSON.stringify({ 
        success: true, 
        adminCount: adminCount || 0,
        duration,
        message: 'Admin cache refreshed successfully',
        nextRefresh: new Date(Date.now() + 5 * 60 * 1000).toISOString()
      }), 
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error: unknown) {
    const duration = Date.now() - startTime

    if (error instanceof Error && (error as any).name === 'AbortError') {
      console.error('🔴 Cache refresh timeout after 30s')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Cache refresh timeout',
          duration
        }), 
        {
          status: 504,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.error('🔴 Cache refresh error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        duration
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
