import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"
import { withRateLimit, ENDPOINT_LIMITS } from "../_shared/ratelimit.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Wrap with rate limiting (1 request per 24h)
  return withRateLimit(req, ENDPOINT_LIMITS.ACCOUNT_DELETE, async (req) => {
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      )

      const { user_id } = await req.json()

      if (!user_id || typeof user_id !== 'string') {
        return new Response(
          JSON.stringify({ error: 'Valid User ID is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(user_id)) {
        return new Response(
          JSON.stringify({ error: 'Invalid user ID format' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log(`Starting account deletion for user: ${user_id}`)

      // Get user auth token from request
      const authHeader = req.headers.get('Authorization')
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: 'Authorization header required' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Verify the user is authenticated and requesting their own account deletion
      const token = authHeader.replace('Bearer ', '')
      const { data: { user }, error: authError } = await supabase.auth.getUser(token)
      
      if (authError || !user || user.id !== user_id) {
        console.error('Authentication failed:', authError)
        return new Response(
          JSON.stringify({ error: 'Unauthorized: Cannot delete another user\'s account' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Step 1: Delete user data in reverse order (to respect foreign keys)
      
      // Delete wallet transactions
      const { error: walletTransError } = await supabase
        .from('wallet_transactions')
        .delete()
        .eq('user_id', user_id)
      if (walletTransError) console.error('Error deleting wallet transactions:', walletTransError)

      // Delete payment transactions
      const { error: paymentTransError } = await supabase
        .from('payment_transactions')
        .delete()
        .eq('user_id', user_id)
      if (paymentTransError) console.error('Error deleting payment transactions:', paymentTransError)

      // Delete user ratings
      const { error: ratingsError1 } = await supabase.from('user_ratings').delete().eq('rater_user_id', user_id)
      const { error: ratingsError2 } = await supabase.from('user_ratings').delete().eq('rated_user_id', user_id)
      if (ratingsError1 || ratingsError2) console.error('Error deleting ratings:', ratingsError1, ratingsError2)

      // Delete user places
      const { error: placesError } = await supabase.from('user_places').delete().eq('user_id', user_id)
      if (placesError) console.error('Error deleting user places:', placesError)

      // Delete favorites
      const { error: favoritesError } = await supabase.from('favorites').delete().eq('user_id', user_id)
      if (favoritesError) console.error('Error deleting favorites:', favoritesError)

      // Delete user settings
      const { error: settingsError } = await supabase.from('user_settings').delete().eq('user_id', user_id)
      if (settingsError) console.error('Error deleting user settings:', settingsError)

      // Delete payment methods
      const { error: paymentMethodsError } = await supabase.from('payment_methods').delete().eq('user_id', user_id)
      if (paymentMethodsError) console.error('Error deleting payment methods:', paymentMethodsError)

      // Delete user wallet
      const { error: walletError } = await supabase.from('user_wallets').delete().eq('user_id', user_id)
      if (walletError) console.error('Error deleting wallet:', walletError)

      // Delete user verifications
      const { error: verificationsError } = await supabase.from('user_verifications').delete().eq('user_id', user_id)
      if (verificationsError) console.error('Error deleting verifications:', verificationsError)

      // Delete transport bookings
      const { error: bookingsError } = await supabase.from('transport_bookings').delete().or(`user_id.eq.${user_id},driver_id.eq.${user_id}`)
      if (bookingsError) console.error('Error deleting transport bookings:', bookingsError)

      // Delete delivery orders
      const { error: deliveryError } = await supabase.from('delivery_orders').delete().or(`user_id.eq.${user_id},driver_id.eq.${user_id}`)
      if (deliveryError) console.error('Error deleting delivery orders:', deliveryError)

      // Delete marketplace products
      const { error: productsError } = await supabase.from('marketplace_products').delete().eq('seller_id', user_id)
      if (productsError) console.error('Error deleting marketplace products:', productsError)

      // Delete driver requests
      const { error: driverRequestsError } = await supabase.from('driver_requests').delete().eq('user_id', user_id)
      if (driverRequestsError) console.error('Error deleting driver requests:', driverRequestsError)

      // Delete support tickets
      const { error: ticketsError } = await supabase.from('support_tickets').delete().eq('user_id', user_id)
      if (ticketsError) console.error('Error deleting support tickets:', ticketsError)

      // Delete team memberships
      const { error: teamMembersError } = await supabase.from('team_members').delete().eq('user_id', user_id)
      if (teamMembersError) console.error('Error deleting team members:', teamMembersError)

      // Delete team accounts
      const { error: teamAccountsError } = await supabase.from('team_accounts').delete().eq('owner_id', user_id)
      if (teamAccountsError) console.error('Error deleting team accounts:', teamAccountsError)

      // Step 2: Delete storage files
      const { data: files } = await supabase.storage.from('profile-pictures').list(user_id)
      if (files && files.length > 0) {
        const filePaths = files.map(file => `${user_id}/${file.name}`)
        await supabase.storage.from('profile-pictures').remove(filePaths)
      }

      // Step 3: Delete profile
      const { error: profileError } = await supabase.from('profiles').delete().eq('user_id', user_id)
      if (profileError) {
        console.error('Error deleting profile:', profileError)
        return new Response(
          JSON.stringify({ error: 'Failed to delete user profile' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Step 4: Delete auth user (must be last)
      const { error: authDeleteError } = await supabase.auth.admin.deleteUser(user_id)
      if (authDeleteError) {
        console.error('Error deleting auth user:', authDeleteError)
        return new Response(
          JSON.stringify({ error: 'Failed to delete user authentication' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log(`Successfully deleted account for user: ${user_id}`)

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Account deleted successfully',
          deleted_at: new Date().toISOString()
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )

    } catch (error: unknown) {
      console.error('Error in delete-user-account function:', error)
      return new Response(
        JSON.stringify({ error: 'Internal server error during account deletion' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  });
})