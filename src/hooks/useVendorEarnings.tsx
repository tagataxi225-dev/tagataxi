import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface VendorEarning {
  id: string;
  vendor_id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: string;
  earnings_type: string;
  confirmed_at?: string;
  paid_at?: string;
  payment_method?: string;
  created_at: string;
  updated_at: string;
}

interface EarningsSummary {
  pending: {
    amount: number;
    count: number;
  };
  confirmed: {
    amount: number;
    count: number;
  };
  paid: {
    amount: number;
    count: number;
  };
  total: {
    amount: number;
    count: number;
  };
}

interface PeriodEarnings {
  period: string;
  amount: number;
  count: number;
  pending: number;
  confirmed: number;
  paid: number;
}

interface UseVendorEarningsReturn {
  earnings: VendorEarning[];
  summary: EarningsSummary;
  loading: boolean;
  markAsPaid: (earningId: string, paymentMethod: string) => Promise<void>;
  getEarningsByPeriod: (period: 'day' | 'week' | 'month' | 'year', startDate?: Date, endDate?: Date) => Promise<PeriodEarnings[]>;
  refetch: () => Promise<void>;
}

export function useVendorEarnings(): UseVendorEarningsReturn {
  const { user } = useAuth();
  const [earnings, setEarnings] = useState<VendorEarning[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEarnings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('vendor_earnings')
        .select('*')
        .eq('vendor_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching vendor earnings:', error);
        // Si la table vendor_earnings est vide ou n'existe pas, on retourne un tableau vide
        setEarnings([]);
      } else {
        setEarnings(data || []);
      }
    } catch (error) {
      console.error('Error fetching vendor earnings:', error);
      // En cas d'erreur, on retourne un tableau vide pour éviter les crashes
      setEarnings([]);
    } finally {
      setLoading(false);
    }
  };

  const markAsPaid = async (earningId: string, paymentMethod: string) => {
    try {
      const { error } = await supabase
        .from('vendor_earnings')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          payment_method: paymentMethod,
        })
        .eq('id', earningId);

      if (error) throw error;
      
      setEarnings(prev =>
        prev.map(e =>
          e.id === earningId
            ? {
                ...e,
                status: 'paid' as const,
                paid_at: new Date().toISOString(),
                payment_method: paymentMethod,
              }
            : e
        )
      );
    } catch (error) {
      console.error('Error marking earning as paid:', error);
      throw error;
    }
  };

  const getEarningsByPeriod = async (
    period: 'day' | 'week' | 'month' | 'year',
    startDate?: Date,
    endDate?: Date
  ): Promise<PeriodEarnings[]> => {
    if (!user) return [];

    try {
      let dateFormat: string;
      let intervalStep: string;
      
      switch (period) {
        case 'day':
          dateFormat = 'YYYY-MM-DD';
          intervalStep = '1 day';
          break;
        case 'week':
          dateFormat = 'YYYY-"W"WW';
          intervalStep = '1 week';
          break;
        case 'month':
          dateFormat = 'YYYY-MM';
          intervalStep = '1 month';
          break;
        case 'year':
          dateFormat = 'YYYY';
          intervalStep = '1 year';
          break;
      }

      const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default: last 30 days
      const end = endDate || new Date();

      // For now, use client-side calculation since RPC function doesn't exist yet
      return calculatePeriodEarningsClient(period, startDate, endDate);
    } catch (error) {
      console.error('Error in getEarningsByPeriod:', error);
      return calculatePeriodEarningsClient(period, startDate, endDate);
    }
  };

  const calculatePeriodEarningsClient = (
    period: 'day' | 'week' | 'month' | 'year',
    startDate?: Date,
    endDate?: Date
  ): PeriodEarnings[] => {
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate || new Date();
    
    const filteredEarnings = earnings.filter(e => {
      const earningDate = new Date(e.created_at);
      return earningDate >= start && earningDate <= end;
    });

    const grouped = new Map<string, VendorEarning[]>();
    
    filteredEarnings.forEach(earning => {
      const date = new Date(earning.created_at);
      let key: string;
      
      switch (period) {
        case 'day':
          key = date.toISOString().split('T')[0];
          break;
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'year':
          key = date.getFullYear().toString();
          break;
      }
      
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(earning);
    });

    return Array.from(grouped.entries()).map(([period, periodEarnings]) => {
      const pending = periodEarnings.filter(e => e.status === 'pending').reduce((sum, e) => sum + e.amount, 0);
      const confirmed = periodEarnings.filter(e => e.status === 'confirmed').reduce((sum, e) => sum + e.amount, 0);
      const paid = periodEarnings.filter(e => e.status === 'paid').reduce((sum, e) => sum + e.amount, 0);
      
      return {
        period,
        amount: pending + confirmed + paid,
        count: periodEarnings.length,
        pending,
        confirmed,
        paid,
      };
    }).sort((a, b) => a.period.localeCompare(b.period));
  };

  // Set up real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('vendor-earnings')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vendor_earnings',
          filter: `vendor_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Vendor earnings updated:', payload);
          fetchEarnings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Initial fetch
  useEffect(() => {
    fetchEarnings();
  }, [user]);

  // Calculate summary
  const summary: EarningsSummary = {
    pending: {
      amount: earnings.filter(e => e.status === 'pending').reduce((sum, e) => sum + e.amount, 0),
      count: earnings.filter(e => e.status === 'pending').length,
    },
    confirmed: {
      amount: earnings.filter(e => e.status === 'confirmed').reduce((sum, e) => sum + e.amount, 0),
      count: earnings.filter(e => e.status === 'confirmed').length,
    },
    paid: {
      amount: earnings.filter(e => e.status === 'paid').reduce((sum, e) => sum + e.amount, 0),
      count: earnings.filter(e => e.status === 'paid').length,
    },
    total: {
      amount: earnings.reduce((sum, e) => sum + e.amount, 0),
      count: earnings.length,
    },
  };

  return {
    earnings,
    summary,
    loading,
    markAsPaid,
    getEarningsByPeriod,
    refetch: fetchEarnings,
  };
}