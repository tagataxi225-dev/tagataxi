import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-health-check',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

type Range = '7d' | '30d' | 'all';

function getFromDate(range: Range): string | null {
  if (range === 'all') return null;
  const days = range === '7d' ? 7 : 30;
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { range = '30d' }: { range?: Range } = await req.json().catch(() => ({ range: '30d' }));
    const fromDate = getFromDate(range);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const authHeader = req.headers.get('Authorization');
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader ?? '' } },
    });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 1) Fetch active partner drivers
    const { data: partnerDrivers, error: pdError } = await supabase
      .from('partner_drivers')
      .select('driver_id, commission_rate, status')
      .eq('partner_id', user.id)
      .eq('status', 'active');

    if (pdError) throw pdError;

    const driverIds = (partnerDrivers || []).map((pd: any) => pd.driver_id);

    // Early return if no drivers
    if (driverIds.length === 0) {
      return new Response(
        JSON.stringify({
          range,
          fromDate,
          totals: {
            totalBookingAmount: 0,
            totalPartnerCommission: 0,
            totalAssignments: 0,
            totalTopups: 0,
            roi: null,
          },
          drivers: [],
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2) Commission tracking for this partner
    let pctQuery = supabase
      .from('partner_commission_tracking')
      .select('driver_id, booking_amount, commission_amount, created_at, service_type')
      .eq('partner_id', user.id);

    if (fromDate) pctQuery = pctQuery.gte('created_at', fromDate);

    const { data: pctRows, error: pctError } = await pctQuery;
    if (pctError) throw pctError;

    // Group by driver
    const byDriver: Record<string, {
      bookingAmount: number;
      commissionAmount: number;
      assignments: number;
      serviceBreakdown: Record<string, { bookingAmount: number; commissionAmount: number; count: number }>;
    }> = {};

    for (const row of pctRows || []) {
      const d = row as any;
      const key = d.driver_id as string;
      if (!byDriver[key]) {
        byDriver[key] = {
          bookingAmount: 0,
          commissionAmount: 0,
          assignments: 0,
          serviceBreakdown: {},
        };
      }
      byDriver[key].bookingAmount += Number(d.booking_amount || 0);
      byDriver[key].commissionAmount += Number(d.commission_amount || 0);
      byDriver[key].assignments += 1;
      const st = d.service_type || 'unknown';
      if (!byDriver[key].serviceBreakdown[st]) {
        byDriver[key].serviceBreakdown[st] = { bookingAmount: 0, commissionAmount: 0, count: 0 };
      }
      byDriver[key].serviceBreakdown[st].bookingAmount += Number(d.booking_amount || 0);
      byDriver[key].serviceBreakdown[st].commissionAmount += Number(d.commission_amount || 0);
      byDriver[key].serviceBreakdown[st].count += 1;
    }

    // 3) Topups funded by partner per driver in period
    let topupQuery = supabase
      .from('credit_transactions')
      .select('driver_id, amount, created_at')
      .in('driver_id', driverIds)
      .eq('reference_type', 'partner_topup')
      .eq('reference_id', user.id)
      .eq('transaction_type', 'credit');

    if (fromDate) topupQuery = topupQuery.gte('created_at', fromDate);

    const { data: topups, error: topupError } = await topupQuery;
    if (topupError) throw topupError;

    const topupsByDriver: Record<string, number> = {};
    for (const t of topups || []) {
      const d = t as any;
      topupsByDriver[d.driver_id] = (topupsByDriver[d.driver_id] || 0) + Number(d.amount || 0);
    }

    // 4) Driver names
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, display_name')
      .in('user_id', driverIds);

    if (profilesError) throw profilesError;
    const nameById: Record<string, string> = {};
    for (const p of profiles || []) {
      const pr = p as any;
      nameById[pr.user_id] = pr.display_name || 'Chauffeur';
    }

    // Build driver summaries
    const driverSummaries = driverIds.map((id) => {
      const agg = byDriver[id] || { bookingAmount: 0, commissionAmount: 0, assignments: 0, serviceBreakdown: {} };
      const funded = topupsByDriver[id] || 0;
      const roi = funded > 0 ? agg.commissionAmount / funded : null;
      return {
        driver_id: id,
        driver_name: nameById[id] || 'Chauffeur',
        total_booking_amount: Math.round(agg.bookingAmount),
        total_partner_commission: Math.round(agg.commissionAmount),
        total_assignments: agg.assignments,
        funded_topups: Math.round(funded),
        roi,
        service_breakdown: agg.serviceBreakdown,
      };
    });

    const totals = driverSummaries.reduce(
      (acc, d) => {
        acc.totalBookingAmount += d.total_booking_amount;
        acc.totalPartnerCommission += d.total_partner_commission;
        acc.totalAssignments += d.total_assignments;
        acc.totalTopups += d.funded_topups;
        return acc;
      },
      { totalBookingAmount: 0, totalPartnerCommission: 0, totalAssignments: 0, totalTopups: 0 }
    );

    const overallRoi = totals.totalTopups > 0 ? totals.totalPartnerCommission / totals.totalTopups : null;

    const response = {
      range,
      fromDate,
      totals: {
        totalBookingAmount: Math.round(totals.totalBookingAmount),
        totalPartnerCommission: Math.round(totals.totalPartnerCommission),
        totalAssignments: totals.totalAssignments,
        totalTopups: Math.round(totals.totalTopups),
        roi: overallRoi,
      },
      drivers: driverSummaries,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error('partner-driver-earnings error:', e);
    return new Response(JSON.stringify({ error: e?.message || 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
