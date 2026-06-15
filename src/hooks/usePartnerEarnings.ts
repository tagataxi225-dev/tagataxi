import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type PartnerRange = '7d' | '30d' | 'all';

export interface PartnerDriverEarning {
  driver_id: string;
  driver_name: string;
  total_booking_amount: number;
  total_partner_commission: number;
  total_assignments: number;
  funded_topups: number;
  roi: number | null;
  service_breakdown: Record<string, { bookingAmount: number; commissionAmount: number; count: number }>;
}

export interface PartnerEarningsSummary {
  range: PartnerRange;
  fromDate: string | null;
  totals: {
    totalBookingAmount: number;
    totalPartnerCommission: number;
    totalAssignments: number;
    totalTopups: number;
    roi: number | null;
  };
  drivers: PartnerDriverEarning[];
}

export const usePartnerEarnings = (initialRange: PartnerRange = '30d') => {
  const [range, setRange] = useState<PartnerRange>(initialRange);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PartnerEarningsSummary | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data: response, error } = await supabase.functions.invoke('partner-driver-earnings', {
        body: { range },
      });
      
      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      if (response && typeof response === 'object') {
        setData(response as PartnerEarningsSummary);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (e) {
      console.error('usePartnerEarnings error:', e);
      
      // Fallback: return empty data instead of crashing
      const fallbackData: PartnerEarningsSummary = {
        range,
        fromDate: range === '7d' ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() :
                  range === '30d' ? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() :
                  '2020-01-01',
        totals: {
          totalBookingAmount: 0,
          totalPartnerCommission: 0,
          totalAssignments: 0,
          totalTopups: 0,
          roi: null
        },
        drivers: []
      };
      setData(fallbackData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  const fromDate = useMemo(() => data?.fromDate ?? null, [data]);

  return { loading, data, range, setRange, fromDate, refresh: load };
};
