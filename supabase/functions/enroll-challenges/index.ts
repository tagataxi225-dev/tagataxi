import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-health-check',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Get the user from the Authorization header
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Enrolling driver in new challenges:', { user_id: user.id })

    // Get all active challenges
    const { data: activeChallenges, error: challengesError } = await supabaseClient
      .from('challenges')
      .select('*')
      .eq('is_active', true)
      .gte('end_date', new Date().toISOString())

    if (challengesError) {
      console.error('Error fetching challenges:', challengesError)
      return new Response(
        JSON.stringify({ error: 'Error fetching challenges' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!activeChallenges || activeChallenges.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: 'No active challenges available',
          enrolled_count: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get driver's existing challenge enrollments
    const { data: existingEnrollments, error: enrollmentError } = await supabaseClient
      .from('driver_challenges')
      .select('challenge_id')
      .eq('driver_id', user.id)

    if (enrollmentError) {
      console.error('Error fetching existing enrollments:', enrollmentError)
      return new Response(
        JSON.stringify({ error: 'Error checking existing enrollments' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const existingChallengeIds = new Set(existingEnrollments?.map(e => e.challenge_id) || [])

    // Filter challenges that the driver hasn't enrolled in yet
    const newChallenges = activeChallenges.filter(
      challenge => !existingChallengeIds.has(challenge.id)
    )

    if (newChallenges.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: 'Driver already enrolled in all active challenges',
          enrolled_count: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Enroll driver in new challenges
    const enrollments = newChallenges.map(challenge => ({
      driver_id: user.id,
      challenge_id: challenge.id,
      current_progress: 0,
      is_completed: false,
      reward_claimed: false
    }))

    const { data: newEnrollments, error: insertError } = await supabaseClient
      .from('driver_challenges')
      .insert(enrollments)
      .select()

    if (insertError) {
      console.error('Error enrolling in challenges:', insertError)
      return new Response(
        JSON.stringify({ error: 'Error enrolling in challenges' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Log the activity
    const { error: logError } = await supabaseClient
      .from('activity_logs')
      .insert({
        user_id: user.id,
        activity_type: 'challenges_enrolled',
        description: `Inscrit dans ${newChallenges.length} nouveaux challenges`,
        metadata: {
          enrolled_challenges: newChallenges.map(c => ({
            id: c.id,
            title: c.title,
            type: c.challenge_type
          }))
        }
      })

    if (logError) {
      console.error('Error logging activity:', logError)
    }

    console.log('Successfully enrolled driver in challenges:', {
      user_id: user.id,
      enrolled_count: newChallenges.length,
      challenge_titles: newChallenges.map(c => c.title)
    })

    return new Response(
      JSON.stringify({
        success: true,
        enrolled_count: newChallenges.length,
        challenges: newChallenges.map(c => ({
          id: c.id,
          title: c.title,
          description: c.description,
          type: c.challenge_type,
          target_value: c.target_value,
          reward_value: c.reward_value
        })),
        message: `Inscrit avec succès dans ${newChallenges.length} nouveaux challenges`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: unknown) {
    console.error('Error in enroll-challenges function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})