import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

interface PrizeType {
  id: string;
  name: string;
  category: string;
  value: number;
  currency: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  image_url?: string;
  probability: number;
  physical_delivery_required: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Non autorisé' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { source_type, source_id } = await req.json();

    // Get active prize types with probabilities
    const { data: prizeTypes, error: prizeError } = await supabaseClient
      .from('lottery_prize_types')
      .select('*')
      .eq('is_active', true)
      .order('probability', { ascending: false });

    if (prizeError || !prizeTypes || prizeTypes.length === 0) {
      throw new Error('Aucun prix disponible');
    }

    // ========== PHASE 3: INTELLIGENT PRIZE SELECTION ==========
    
    // 1. Get user's pity tracker
    let { data: pityTracker } = await supabaseClient
      .from('scratch_card_pity_tracker')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Create tracker if doesn't exist
    if (!pityTracker) {
      const { data: newTracker } = await supabaseClient
        .from('scratch_card_pity_tracker')
        .insert({ user_id: user.id })
        .select()
        .single();
      pityTracker = newTracker;
    }

    const tracker = pityTracker || {
      total_scratched: 0,
      commons_streak: 0,
      guaranteed_rare_at: 10,
      guaranteed_epic_at: 50,
      guaranteed_legendary_at: 200,
      active_multiplier: 1.0
    };

    // 2. Check for pity system guarantees
    let forcedRarity: string | null = null;

    // Legendary garanti tous les 200
    if (tracker.total_scratched > 0 && (tracker.total_scratched + 1) % tracker.guaranteed_legendary_at === 0) {
      forcedRarity = 'legendary';
      console.log('🌟 PITY SYSTEM: Legendary garanti !', { total_scratched: tracker.total_scratched + 1 });
    }
    // Epic garanti tous les 50
    else if (tracker.total_scratched > 0 && (tracker.total_scratched + 1) % tracker.guaranteed_epic_at === 0) {
      forcedRarity = 'epic';
      console.log('💜 PITY SYSTEM: Epic garanti !', { total_scratched: tracker.total_scratched + 1 });
    }
    // Rare garanti après 10 commons consécutifs
    else if (tracker.commons_streak >= tracker.guaranteed_rare_at - 1) {
      forcedRarity = 'rare';
      console.log('💙 PITY SYSTEM: Rare garanti après 10 commons !', { commons_streak: tracker.commons_streak });
    }

    // 3. Apply temporal multipliers
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay();

    let timeMultiplier = 1.0;

    // Happy hour (18h-20h) : x1.5 pour rare+
    if (hour >= 18 && hour < 20) {
      timeMultiplier = 1.5;
      console.log('⏰ Happy Hour actif: x1.5 !');
    }

    // Weekend bonus : x1.2
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      timeMultiplier *= 1.2;
      console.log('🎉 Weekend Bonus: x1.2 !');
    }

    // Multiplicateur actif du tracker
    if (tracker.active_multiplier > 1.0 && tracker.multiplier_expires_at && new Date(tracker.multiplier_expires_at) > now) {
      timeMultiplier *= tracker.active_multiplier;
      console.log(`🔥 Multiplicateur actif: x${tracker.active_multiplier} !`);
    }

    // 4. Select prize intelligently
    let selectedPrize: PrizeType;

    if (forcedRarity) {
      // Pity system: force specific rarity
      const forcedPrizes = prizeTypes.filter((p: PrizeType) => p.rarity === forcedRarity);
      selectedPrize = forcedPrizes[Math.floor(Math.random() * forcedPrizes.length)];
      console.log('🎯 Prize forced by pity system:', { rarity: forcedRarity, prize: selectedPrize.name });
    } else {
      // Normal selection with time multipliers
      const adjustedPrizes = prizeTypes.map((p: PrizeType) => ({
        ...p,
        adjustedProbability: p.probability * (p.rarity !== 'common' ? timeMultiplier : 1.0)
      }));

      // Normalize probabilities (total = 1.0)
      const totalProb = adjustedPrizes.reduce((sum: number, p: any) => sum + p.adjustedProbability, 0);
      const normalizedPrizes = adjustedPrizes.map((p: any) => ({
        ...p,
        normalizedProb: p.adjustedProbability / totalProb
      }));

      // Weighted random with adjusted probabilities
      let random = Math.random();
      for (const prize of normalizedPrizes) {
        random -= prize.normalizedProb;
        if (random <= 0) {
          selectedPrize = prize;
          break;
        }
      }

      if (!selectedPrize) {
        selectedPrize = prizeTypes[prizeTypes.length - 1];
      }
    }

    // 5. Log stats for debugging
    console.log('🎲 Tirage effectué:', {
      user_id: user.id,
      total_scratched: tracker.total_scratched + 1,
      commons_streak: tracker.commons_streak,
      forced_rarity: forcedRarity,
      time_multiplier: timeMultiplier,
      won_prize: selectedPrize.name,
      won_rarity: selectedPrize.rarity,
      won_value: selectedPrize.value
    });

    // Create lottery win with scratch card
    const { data: win, error: winError } = await supabaseClient
      .from('lottery_wins')
      .insert({
        user_id: user.id,
        prize_type_id: selectedPrize.id,
        source_type: source_type,
        source_id: source_id,
        status: 'pending',
        prize_details: {
          prize_id: selectedPrize.id,
          name: selectedPrize.name,
          value: selectedPrize.value,
          currency: selectedPrize.currency,
          image_url: selectedPrize.image_url
        },
        rarity: selectedPrize.rarity,
        reward_type: selectedPrize.category === 'cash' ? 'cash' : 
                     selectedPrize.category === 'lottery_entry' ? 'points' : 'physical_gift',
        points_awarded: selectedPrize.category === 'lottery_entry' ? selectedPrize.value : 0,
        scratch_percentage: 0,
        scratch_revealed_at: null
      })
      .select()
      .single();

    if (winError) throw winError;

    // Log activity
    await supabaseClient
      .from('activity_logs')
      .insert({
        user_id: user.id,
        activity_type: 'scratch_card_won',
        description: `Carte à gratter ${selectedPrize.rarity} gagnée`,
        metadata: {
          win_id: win.id,
          prize_name: selectedPrize.name,
          rarity: selectedPrize.rarity,
          source_type,
          source_id
        }
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        win: {
          win_id: win.id,
          id: selectedPrize.id,
          name: selectedPrize.name,
          value: selectedPrize.value,
          currency: selectedPrize.currency,
          rarity: selectedPrize.rarity,
          reward_type: win.reward_type,
          image_url: selectedPrize.image_url,
          scratch_percentage: 0,
          created_at: win.created_at
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error in instant-scratch-win:', error);
    return new Response(
      JSON.stringify({ error: (error as any).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
