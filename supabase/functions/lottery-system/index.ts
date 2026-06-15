import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-health-check, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

// ========== PROBABILITÉS TRÈS DÉFAVORABLES ==========
const REWARD_PROBABILITIES = {
  nothing: 0.60,
  xp_small: 0.25,
  xp_medium: 0.10,
  discount_5: 0.03,
  xp_large: 0.015,
  physical_gift: 0.005,
} as const;

const CARD_TYPE_MULTIPLIERS: Record<string, number> = {
  standard: 1,
  active: 1.5,
  rare: 2,
  mega: 3,
};

const MAX_DAILY_CARDS = 5;

// ========== HELPER: Check & increment daily card limit ==========
const checkAndIncrementDailyLimit = async (
  supabase: any,
  userId: string
): Promise<{ allowed: boolean; cardsToday: number }> => {
  const today = new Date().toISOString().split('T')[0];

  // Upsert the limit row, resetting if it's a new day
  const { data: limitRow } = await supabase
    .from('lottery_user_limits')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (!limitRow) {
    // Create new row
    await supabase.from('lottery_user_limits').insert({
      user_id: userId,
      cards_earned_today: 1,
      last_reset_date: today,
    });
    return { allowed: true, cardsToday: 0 };
  }

  // If last_reset_date is not today, reset counter
  const lastReset = limitRow.last_reset_date || '';
  if (lastReset !== today) {
    await supabase
      .from('lottery_user_limits')
      .update({ cards_earned_today: 1, last_reset_date: today })
      .eq('user_id', userId);
    return { allowed: true, cardsToday: 0 };
  }

  // Check limit
  const cardsToday = limitRow.cards_earned_today || 0;
  if (cardsToday >= MAX_DAILY_CARDS) {
    return { allowed: false, cardsToday };
  }

  // Increment
  await supabase
    .from('lottery_user_limits')
    .update({ cards_earned_today: cardsToday + 1 })
    .eq('user_id', userId);

  return { allowed: true, cardsToday };
};

// ========== HELPER: Atomic partner prize stock decrement ==========
const getAvailablePartnerPrize = async (supabase: any, rarity: string) => {
  try {
    if (!['epic', 'legendary'].includes(rarity)) return null;

    const now = new Date().toISOString();
    const { data: prizes, error } = await supabase
      .from('partner_prizes')
      .select('*')
      .eq('is_active', true)
      .eq('rarity_tier', rarity)
      .or('stock_unlimited.eq.true,stock_quantity.gt.0')
      .or(`valid_from.is.null,valid_from.lte.${now}`)
      .or(`valid_until.is.null,valid_until.gte.${now}`);

    if (error || !prizes?.length) return null;

    // Weighted random selection
    const totalProb = prizes.reduce((sum: number, p: any) => sum + (p.distribution_probability || 0.01), 0);
    let roll = Math.random() * totalProb;

    for (const prize of prizes) {
      roll -= prize.distribution_probability || 0.01;
      if (roll <= 0) {
        // ATOMIC stock decrement — prevents race condition
        if (!prize.stock_unlimited) {
          const { data: updated, error: updateErr } = await supabase
            .from('partner_prizes')
            .update({
              stock_quantity: prize.stock_quantity - 1,
              updated_at: new Date().toISOString(),
            })
            .eq('id', prize.id)
            .gt('stock_quantity', 0)
            .select()
            .single();

          if (updateErr || !updated) {
            console.log(`📦 Stock épuisé pour ${prize.name} (race condition évitée)`);
            continue; // Try next prize
          }
        }
        return prize;
      }
    }
    return null;
  } catch (error: unknown) {
    console.error('❌ Erreur récupération cadeau partenaire:', error);
    return null;
  }
};

// ========== FIXED: determineReward with correct probability redistribution ==========
const determineReward = async (supabase: any, cardType: string = 'standard') => {
  const roll = Math.random();
  const multiplier = CARD_TYPE_MULTIPLIERS[cardType] || 1;

  // Correct redistribution: multiplier boosts xp_small & xp_medium slightly,
  // keeping nothing >= 45% always, physical_gift unchanged at 0.5%
  const nothingBase = REWARD_PROBABILITIES.nothing;
  const boost = Math.min((multiplier - 1) * 0.05, 0.15); // max 15% redistribution
  const nothingAdjusted = Math.max(nothingBase - boost, 0.45); // never below 45%
  const actualBoost = nothingBase - nothingAdjusted;

  // Redistribute the boost proportionally to xp_small and xp_medium only
  const probs = {
    nothing: nothingAdjusted,
    xp_small: REWARD_PROBABILITIES.xp_small + actualBoost * 0.65,
    xp_medium: REWARD_PROBABILITIES.xp_medium + actualBoost * 0.35,
    discount_5: REWARD_PROBABILITIES.discount_5,
    xp_large: REWARD_PROBABILITIES.xp_large,
    physical_gift: REWARD_PROBABILITIES.physical_gift,
  };

  let cumulative = 0;

  // 1) Nothing
  cumulative += probs.nothing;
  if (roll < cumulative) {
    return {
      rewardType: 'nothing',
      prizeName: 'Dommage !',
      prizeValue: 0,
      rarity: 'common' as const,
      boostDetails: {},
      partnerPrize: null,
    };
  }

  // 2) XP small (5-20)
  cumulative += probs.xp_small;
  if (roll < cumulative) {
    const value = Math.floor(Math.random() * 16) + 5;
    return {
      rewardType: 'xp_points',
      prizeName: `+${value} XP`,
      prizeValue: value,
      rarity: 'common' as const,
      boostDetails: {},
      partnerPrize: null,
    };
  }

  // 3) XP medium (50-100)
  cumulative += probs.xp_medium;
  if (roll < cumulative) {
    const value = Math.floor(Math.random() * 51) + 50;
    return {
      rewardType: 'xp_points',
      prizeName: `+${value} XP`,
      prizeValue: value,
      rarity: 'rare' as const,
      boostDetails: {},
      partnerPrize: null,
    };
  }

  // 4) Discount 5%
  cumulative += probs.discount_5;
  if (roll < cumulative) {
    return {
      rewardType: 'discount_5',
      prizeName: 'Remise 5%',
      prizeValue: 5,
      rarity: 'rare' as const,
      boostDetails: { discountPercent: 5, validForDays: 7 },
      partnerPrize: null,
    };
  }

  // 5) XP large (200-500) — epic
  cumulative += probs.xp_large;
  if (roll < cumulative) {
    const value = Math.floor(Math.random() * 301) + 200;
    const partnerPrize = await getAvailablePartnerPrize(supabase, 'epic');
    if (partnerPrize) {
      return {
        rewardType: 'partner_gift',
        prizeName: partnerPrize.name,
        prizeValue: partnerPrize.estimated_value || 0,
        rarity: 'epic' as const,
        boostDetails: {
          partnerName: partnerPrize.partner_name,
          claimInstructions: partnerPrize.claim_instructions,
        },
        partnerPrize,
      };
    }
    return {
      rewardType: 'xp_points',
      prizeName: `+${value} XP`,
      prizeValue: value,
      rarity: 'epic' as const,
      boostDetails: {},
      partnerPrize: null,
    };
  }

  // 6) Legendary (0.5%)
  const partnerPrize = await getAvailablePartnerPrize(supabase, 'legendary');
  if (partnerPrize) {
    return {
      rewardType: 'partner_gift',
      prizeName: partnerPrize.name,
      prizeValue: partnerPrize.estimated_value || 0,
      rarity: 'legendary' as const,
      boostDetails: {
        partnerName: partnerPrize.partner_name,
        claimInstructions: partnerPrize.claim_instructions,
        requiresDelivery: partnerPrize.requires_delivery,
      },
      partnerPrize,
    };
  }

  return {
    rewardType: 'physical_gift',
    prizeName: 'Cadeau Surprise !',
    prizeValue: 0,
    rarity: 'legendary' as const,
    boostDetails: { requiresAdminApproval: true },
    partnerPrize: null,
  };
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const body = await req.json();
    const { action, userId, sourceType, sourceId, count, multiplier, drawId, cardType, pointsCost, actionType, metadata, customPoints } = body;

    console.log(`🎰 [lottery-system] Action: ${action}, User: ${userId}`);

    const jsonResponse = (data: any, status = 200) =>
      new Response(JSON.stringify(data), {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    // =========== ACTION: Attribuer une carte quotidienne ===========
    if (action === 'award_daily_card') {
      if (!userId) return jsonResponse({ error: 'userId requis' }, 400);

      // Server-side daily limit check
      const { allowed, cardsToday } = await checkAndIncrementDailyLimit(supabase, userId);
      if (!allowed) {
        console.log(`⚠️ Limite quotidienne atteinte (${cardsToday}/${MAX_DAILY_CARDS}) pour ${userId}`);
        return jsonResponse({ error: 'Limite quotidienne atteinte', limit: MAX_DAILY_CARDS, cardsToday }, 429);
      }

      // Check if daily card already claimed
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { data: existingCard } = await supabase
        .from('lottery_wins')
        .select('id')
        .eq('user_id', userId)
        .eq('daily_card', true)
        .gte('created_at', today.toISOString())
        .maybeSingle();

      if (existingCard) {
        return jsonResponse({ error: 'Carte du jour déjà récupérée', alreadyClaimed: true }, 400);
      }

      const selectedCardType = cardType || 'standard';
      const reward = await determineReward(supabase, selectedCardType);

      const cardData: any = {
        user_id: userId,
        prize_details: {
          name: reward.prizeName,
          value: reward.prizeValue,
          currency: reward.partnerPrize ? reward.partnerPrize.currency : 'XP',
          partnerName: reward.partnerPrize?.partner_name,
        },
        prize_value: reward.prizeValue,
        currency: reward.partnerPrize ? reward.partnerPrize.currency : 'XP',
        status: 'pending',
        rarity: reward.rarity,
        reward_type: reward.rewardType,
        scratch_percentage: 0,
        daily_card: true,
        card_type: selectedCardType,
        boost_details: reward.boostDetails,
        expires_in_hours: 24,
      };

      if (reward.partnerPrize) {
        cardData.partner_prize_id = reward.partnerPrize.id;
        cardData.is_partner_prize = true;
        cardData.claim_status = 'pending';
      }

      const { data: card, error } = await supabase
        .from('lottery_wins')
        .insert(cardData)
        .select()
        .single();

      if (error) return jsonResponse({ error: (error as any).message }, 500);

      console.log(`✅ Carte quotidienne: ${reward.prizeName} (${reward.rarity})`);
      return jsonResponse({ success: true, card, partnerPrize: reward.partnerPrize });
    }

    // =========== ACTION: Générer une carte à gratter ===========
    if (action === 'generate_scratch_card') {
      if (!userId) return jsonResponse({ error: 'userId requis' }, 400);

      // Server-side daily limit check
      const { allowed, cardsToday } = await checkAndIncrementDailyLimit(supabase, userId);
      if (!allowed) {
        console.log(`⚠️ Limite quotidienne atteinte (${cardsToday}/${MAX_DAILY_CARDS}) pour ${userId}`);
        return jsonResponse({ error: 'Limite quotidienne atteinte', limit: MAX_DAILY_CARDS, cardsToday }, 429);
      }

      const selectedType = cardType || 'standard';
      const reward = await determineReward(supabase, selectedType);

      const cardData: any = {
        user_id: userId,
        prize_details: {
          name: reward.prizeName,
          value: reward.prizeValue,
          currency: reward.partnerPrize ? reward.partnerPrize.currency : 'XP',
          partnerName: reward.partnerPrize?.partner_name,
        },
        prize_value: reward.prizeValue,
        currency: reward.partnerPrize ? reward.partnerPrize.currency : 'XP',
        status: 'pending',
        rarity: reward.rarity,
        reward_type: reward.rewardType,
        scratch_percentage: 0,
        card_type: selectedType,
        boost_details: reward.boostDetails,
        daily_card: false,
      };

      if (reward.partnerPrize) {
        cardData.partner_prize_id = reward.partnerPrize.id;
        cardData.is_partner_prize = true;
        cardData.claim_status = 'pending';
      }

      const { data: scratchCard, error } = await supabase
        .from('lottery_wins')
        .insert(cardData)
        .select()
        .single();

      if (error) return jsonResponse({ error: (error as any).message }, 500);

      console.log(`✅ Carte ${selectedType}: ${reward.prizeName}`);
      return jsonResponse({ success: true, scratchCard, partnerPrize: reward.partnerPrize });
    }

    // =========== ACTION: Add progress points (server-side) ===========
    if (action === 'add_progress_points') {
      if (!userId || !actionType) return jsonResponse({ error: 'userId et actionType requis' }, 400);

      const ACTION_POINTS: Record<string, number> = {
        vtc_ride: 15,
        delivery_order: 10,
        marketplace_purchase: 12,
        wallet_topup: 5,
        daily_login: 2,
        referral_success: 25,
      };

      const pointsToAdd = customPoints || ACTION_POINTS[actionType] || 0;
      if (pointsToAdd <= 0) return jsonResponse({ error: 'Points invalides' }, 400);

      const { data: wallet } = await supabase
        .from('user_wallets')
        .select('kwenda_points')
        .eq('user_id', userId)
        .maybeSingle();

      const currentPoints = wallet?.kwenda_points || 0;
      const newPoints = currentPoints + pointsToAdd;

      const { error } = await supabase
        .from('user_wallets')
        .update({ kwenda_points: newPoints })
        .eq('user_id', userId);

      if (error) return jsonResponse({ error: (error as any).message }, 500);

      console.log(`✅ +${pointsToAdd} points pour ${userId} (total: ${newPoints})`);
      return jsonResponse({ success: true, pointsAdded: pointsToAdd, newTotal: newPoints });
    }

    // =========== ACTION: Auto-award check (server-side probability) ===========
    if (action === 'auto_award_check') {
      if (!userId || !sourceType) return jsonResponse({ error: 'userId et sourceType requis' }, 400);

      const EVENT_PROBABILITIES: Record<string, number> = {
        ride: 0.15,
        delivery: 0.10,
        purchase: 0.20,
        referral: 1.0,
        rating: 0.25,
        daily_login: 0.05,
      };

      const probability = EVENT_PROBABILITIES[sourceType];
      if (probability === undefined) return jsonResponse({ error: `Type inconnu: ${sourceType}` }, 400);

      const roll = Math.random();
      const shouldAward = roll < probability;

      console.log(`🎲 Auto-award ${sourceType}: ${(roll * 100).toFixed(1)}% / ${probability * 100}% → ${shouldAward ? '✅' : '❌'}`);

      if (!shouldAward) {
        return jsonResponse({ success: true, awarded: false });
      }

      // Check daily limit before awarding
      const { allowed } = await checkAndIncrementDailyLimit(supabase, userId);
      if (!allowed) {
        return jsonResponse({ success: true, awarded: false, reason: 'daily_limit' });
      }

      const reward = await determineReward(supabase, 'standard');
      const cardData: any = {
        user_id: userId,
        prize_details: { name: reward.prizeName, value: reward.prizeValue, currency: 'XP' },
        prize_value: reward.prizeValue,
        currency: 'XP',
        status: 'pending',
        rarity: reward.rarity,
        reward_type: reward.rewardType,
        scratch_percentage: 0,
        card_type: 'standard',
        boost_details: { ...reward.boostDetails, source_event: sourceType, ...(metadata || {}) },
        daily_card: false,
      };

      const { data: card, error } = await supabase
        .from('lottery_wins')
        .insert(cardData)
        .select()
        .single();

      if (error) return jsonResponse({ error: (error as any).message }, 500);

      return jsonResponse({ success: true, awarded: true, card });
    }

    // =========== ACTION: Créer ou récupérer le tirage mensuel ===========
    if (action === 'get_or_create_monthly_draw') {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const monthName = now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

      const { data: existingDraw } = await supabase
        .from('super_lottery_draws')
        .select('*')
        .gte('draw_date', monthStart.toISOString())
        .lt('draw_date', nextMonth.toISOString())
        .maybeSingle();

      if (existingDraw) {
        const { count: entriesCount } = await supabase
          .from('super_lottery_entries')
          .select('*', { count: 'exact', head: true })
          .eq('draw_id', existingDraw.id);

        return jsonResponse({
          success: true,
          draw: { ...existingDraw, current_entries: entriesCount || 0 },
          isNew: false,
        });
      }

      const { data: newDraw, error } = await supabase
        .from('super_lottery_draws')
        .insert({
          name: `Super Loterie ${monthName}`,
          description: `Grand tirage mensuel de ${monthName}. Participez avec vos Kwenda Points !`,
          draw_date: nextMonth.toISOString(),
          entry_cost_points: 100,
          max_entries: 1000,
          prize_pool: { first: 50000, second: 30000, third: 20000 },
          status: 'active',
        })
        .select()
        .single();

      if (error) return jsonResponse({ error: (error as any).message }, 500);

      return jsonResponse({
        success: true,
        draw: { ...newDraw, current_entries: 0 },
        isNew: true,
      });
    }

    // =========== ACTION: Participer à la super loterie (ATOMIC) ===========
    if (action === 'enter_super_lottery') {
      if (!userId || !drawId || !pointsCost) {
        return jsonResponse({ error: 'userId, drawId et pointsCost requis' }, 400);
      }

      // Atomic: read wallet, check balance, deduct, then insert entry
      const { data: wallet } = await supabase
        .from('user_wallets')
        .select('kwenda_points')
        .eq('user_id', userId)
        .maybeSingle();

      const currentPoints = wallet?.kwenda_points || 0;
      if (currentPoints < pointsCost) {
        return jsonResponse({ error: 'Points insuffisants', currentPoints, required: pointsCost }, 400);
      }

      // Deduct points FIRST (atomic — uses equality check to prevent race condition)
      const { data: updatedWallet, error: deductError } = await supabase
        .from('user_wallets')
        .update({ kwenda_points: currentPoints - pointsCost })
        .eq('user_id', userId)
        .eq('kwenda_points', currentPoints) // Optimistic lock: fails if points changed
        .select()
        .single();

      if (deductError || !updatedWallet) {
        return jsonResponse({ error: 'Points modifiés entre-temps, réessayez' }, 409);
      }

      const entryNumber = `SL-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      const { data: entry, error: entryError } = await supabase
        .from('super_lottery_entries')
        .insert({
          draw_id: drawId,
          user_id: userId,
          points_spent: pointsCost,
          entry_number: entryNumber,
        })
        .select()
        .single();

      if (entryError) {
        // Rollback points
        await supabase
          .from('user_wallets')
          .update({ kwenda_points: currentPoints })
          .eq('user_id', userId);
        return jsonResponse({ error: entryError.message }, 500);
      }

      return jsonResponse({ success: true, entry, entryNumber });
    }

    // =========== ACTION: Attribuer des tickets ===========
    if (action === 'award_ticket') {
      if (!userId || !sourceType) return jsonResponse({ error: 'userId et sourceType requis' }, 400);

      const ticketCount = (count || 1) * (multiplier || 1);
      const tickets = [];

      for (let i = 0; i < ticketCount; i++) {
        const ticketNumber = `TK-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        const { data: ticket, error } = await supabase
          .from('lottery_tickets')
          .insert({
            user_id: userId,
            ticket_number: ticketNumber,
            source_type: sourceType,
            source_id: sourceId || null,
            earned_date: new Date().toISOString(),
            status: 'active',
          })
          .select()
          .single();

        if (!error && ticket) tickets.push(ticket);
      }

      console.log(`✅ ${tickets.length} ticket(s) attribué(s) à ${userId}`);
      return jsonResponse({ success: true, tickets });
    }

    // =========== ACTION: Stats admin ===========
    if (action === 'admin_stats') {
      const { data: allWins } = await supabase.from('lottery_wins').select('*');
      const { data: allDraws } = await supabase.from('super_lottery_draws').select('*');
      const { data: allEntries } = await supabase.from('super_lottery_entries').select('*');
      const { data: partnerPrizes } = await supabase.from('partner_prizes').select('*');
      const { data: partnerClaims } = await supabase.from('partner_prize_claims').select('*');

      const today = new Date().toISOString().split('T')[0];
      const rewardStats = {
        nothing: allWins?.filter((w: any) => w.reward_type === 'nothing').length || 0,
        xp_points: allWins?.filter((w: any) => w.reward_type === 'xp_points').length || 0,
        discount_5: allWins?.filter((w: any) => w.reward_type === 'discount_5').length || 0,
        physical_gift: allWins?.filter((w: any) => w.reward_type === 'physical_gift').length || 0,
        partner_gift: allWins?.filter((w: any) => w.reward_type === 'partner_gift').length || 0,
      };

      const partnerStats = {
        total_prizes: partnerPrizes?.length || 0,
        active_prizes: partnerPrizes?.filter((p: any) => p.is_active).length || 0,
        total_stock: partnerPrizes?.reduce((sum: number, p: any) => sum + (p.stock_unlimited ? 999 : (p.stock_quantity || 0)), 0) || 0,
        total_claims: partnerClaims?.length || 0,
        pending_claims: partnerClaims?.filter((c: any) => c.status === 'pending').length || 0,
        delivered_claims: partnerClaims?.filter((c: any) => c.status === 'delivered').length || 0,
      };

      const stats = {
        gratta: {
          total_cards: allWins?.length || 0,
          unscratched: allWins?.filter((w: any) => !w.scratch_revealed_at).length || 0,
          revealed: allWins?.filter((w: any) => w.scratch_revealed_at).length || 0,
          today_generated: allWins?.filter((w: any) => w.created_at?.startsWith(today)).length || 0,
          today_scratched: allWins?.filter((w: any) => w.scratch_revealed_at?.startsWith(today)).length || 0,
          total_xp_distributed: allWins?.reduce((sum: number, w: any) => sum + (w.prize_value || 0), 0) || 0,
          reward_distribution: rewardStats,
          win_rate: allWins?.length
            ? ((allWins.filter((w: any) => w.reward_type !== 'nothing').length / allWins.length) * 100).toFixed(1) + '%'
            : '0%',
        },
        superLottery: {
          total_draws: allDraws?.length || 0,
          active_draws: allDraws?.filter((d: any) => d.status === 'active').length || 0,
          total_entries: allEntries?.length || 0,
          total_points_spent: allEntries?.reduce((sum: number, e: any) => sum + (e.points_spent || 0), 0) || 0,
        },
        partnerPrizes: partnerStats,
      };

      return jsonResponse({ success: true, stats });
    }

    return jsonResponse({ success: false, error: 'Action inconnue' }, 400);
  } catch (error: any) {
    console.error('❌ Lottery system error:', error);
    return new Response(
      JSON.stringify({ error: (error as any).message || 'Erreur inconnue' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
