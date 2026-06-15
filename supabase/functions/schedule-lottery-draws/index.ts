import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🎲 Démarrage de la planification des tirages...');

    // Créer les tirages pour les prochains jours
    await createDailyDraws(supabaseClient);
    await createWeeklyDraws(supabaseClient);
    await createMonthlyDraws(supabaseClient);
    
    // Exécuter les tirages programmés
    await executePendingDraws(supabaseClient);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Tirages planifiés et exécutés avec succès'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Erreur dans schedule-lottery-draws:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

// Créer les tirages quotidiens
async function createDailyDraws(supabase: any) {
  const today = new Date();
  
  for (let i = 1; i <= 7; i++) { // Créer pour les 7 prochains jours
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + i);
    targetDate.setHours(20, 0, 0, 0); // 20h00

    // Vérifier si le tirage existe déjà
    const { data: existing } = await supabase
      .from('lottery_draws')
      .select('id')
      .eq('draw_type', 'daily')
      .eq('status', 'scheduled')
      .gte('scheduled_date', targetDate.toISOString())
      .lt('scheduled_date', new Date(targetDate.getTime() + 24 * 60 * 60 * 1000).toISOString())
      .single();

    if (existing) {
      console.log(`Tirage quotidien déjà existant pour ${targetDate.toDateString()}`);
      continue;
    }

    // Créer le nouveau tirage quotidien
    const { data: newDraw, error } = await supabase
      .from('lottery_draws')
      .insert({
        name: `Tirage Flash ${targetDate.toLocaleDateString('fr-FR')}`,
        draw_type: 'daily',
        scheduled_date: targetDate.toISOString(),
        min_tickets_required: 1,
        max_winners: 10,
        prize_pool: [
          { prize_name: "Crédit Kwenda 1K", value: 1000, quantity: 6, probability: 0.6 },
          { prize_name: "Crédit Kwenda 5K", value: 5000, quantity: 3, probability: 0.3 },
          { prize_name: "Course Gratuite", value: 5000, quantity: 1, probability: 0.1 }
        ]
      })
      .select()
      .single();

    if (error) {
      console.error(`Erreur création tirage quotidien:`, error);
    } else {
      console.log(`✅ Tirage quotidien créé pour ${targetDate.toDateString()}`);
    }
  }
}

// Créer les tirages hebdomadaires (dimanche)
async function createWeeklyDraws(supabase: any) {
  const today = new Date();
  const nextSunday = new Date(today);
  const daysToSunday = (7 - today.getDay()) % 7;
  nextSunday.setDate(today.getDate() + (daysToSunday === 0 ? 7 : daysToSunday));
  nextSunday.setHours(21, 0, 0, 0); // 21h00

  // Vérifier si le tirage existe déjà
  const { data: existing } = await supabase
    .from('lottery_draws')
    .select('id')
    .eq('draw_type', 'weekly')
    .eq('status', 'scheduled')
    .gte('scheduled_date', nextSunday.toISOString())
    .lt('scheduled_date', new Date(nextSunday.getTime() + 24 * 60 * 60 * 1000).toISOString())
    .single();

  if (!existing) {
    const { error } = await supabase
      .from('lottery_draws')
      .insert({
        name: `Super Kwenda ${nextSunday.toLocaleDateString('fr-FR')}`,
        draw_type: 'weekly',
        scheduled_date: nextSunday.toISOString(),
        min_tickets_required: 5,
        max_winners: 5,
        prize_pool: [
          { prize_name: "Crédit Kwenda 10K", value: 10000, quantity: 3, probability: 0.6 },
          { prize_name: "Mega Prize 50K", value: 50000, quantity: 2, probability: 0.4 }
        ]
      });

    if (!error) {
      console.log(`✅ Tirage hebdomadaire créé pour ${nextSunday.toDateString()}`);
    }
  }
}

// Créer les tirages mensuels (dernier dimanche du mois)
async function createMonthlyDraws(supabase: any) {
  const today = new Date();
  const lastSundayOfMonth = getLastSundayOfMonth(today.getFullYear(), today.getMonth());
  
  // Si on a raté le dernier dimanche, prendre celui du mois prochain
  if (lastSundayOfMonth < today) {
    const nextMonth = today.getMonth() === 11 ? 0 : today.getMonth() + 1;
    const nextYear = today.getMonth() === 11 ? today.getFullYear() + 1 : today.getFullYear();
    lastSundayOfMonth.setTime(getLastSundayOfMonth(nextYear, nextMonth).getTime());
  }
  
  lastSundayOfMonth.setHours(22, 0, 0, 0); // 22h00

  // Vérifier si le tirage existe déjà
  const { data: existing } = await supabase
    .from('lottery_draws')
    .select('id')
    .eq('draw_type', 'monthly')
    .eq('status', 'scheduled')
    .gte('scheduled_date', lastSundayOfMonth.toISOString())
    .lt('scheduled_date', new Date(lastSundayOfMonth.getTime() + 24 * 60 * 60 * 1000).toISOString())
    .single();

  if (!existing) {
    const { error } = await supabase
      .from('lottery_draws')
      .insert({
        name: `Méga Jackpot ${lastSundayOfMonth.toLocaleDateString('fr-FR')}`,
        draw_type: 'monthly',
        scheduled_date: lastSundayOfMonth.toISOString(),
        min_tickets_required: 10,
        max_winners: 3,
        prize_pool: [
          { prize_name: "Jackpot 100K", value: 100000, quantity: 1, probability: 0.3 },
          { prize_name: "Mega Prize 50K", value: 50000, quantity: 2, probability: 0.7 }
        ]
      });

    if (!error) {
      console.log(`✅ Tirage mensuel créé pour ${lastSundayOfMonth.toDateString()}`);
    }
  }
}

// Exécuter les tirages programmés
async function executePendingDraws(supabase: any) {
  const now = new Date();
  
  // Récupérer les tirages à exécuter (schedulés et dont l'heure est passée)
  const { data: pendingDraws, error } = await supabase
    .from('lottery_draws')
    .select('*')
    .eq('status', 'scheduled')
    .lte('scheduled_date', now.toISOString())
    .order('scheduled_date', { ascending: true });

  if (error) {
    console.error('Erreur récupération tirages:', error);
    return;
  }

  for (const draw of pendingDraws || []) {
    console.log(`🎯 Exécution du tirage: ${draw.name}`);
    
    try {
      // Appeler la fonction de tirage
      const { data, error: drawError } = await supabase.functions.invoke('lottery-system', {
        body: { drawId: draw.id },
        method: 'POST'
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (drawError) {
        console.error(`Erreur tirage ${draw.name}:`, drawError);
      } else {
        console.log(`✅ Tirage ${draw.name} exécuté:`, data);
      }
    } catch (error: unknown) {
      console.error(`Erreur lors de l'exécution du tirage ${draw.name}:`, error);
    }
  }
}

// Utilitaire pour trouver le dernier dimanche du mois
function getLastSundayOfMonth(year: number, month: number): Date {
  const lastDay = new Date(year, month + 1, 0); // Dernier jour du mois
  const lastSunday = new Date(lastDay);
  lastSunday.setDate(lastDay.getDate() - lastDay.getDay());
  return lastSunday;
}