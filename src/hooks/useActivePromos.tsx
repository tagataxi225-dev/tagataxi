import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PromoCode {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  min_order_amount?: number;
  max_discount?: number;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
  is_published: boolean;
  usage_limit?: number;
  used_count?: number;
  service_type?: string;
  description?: string;
  applicable_services?: string[];
  created_at?: string;
  created_by?: string;
  currency?: string;
}

export const useActivePromos = () => {
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivePromos();
  }, []);

  const fetchActivePromos = async () => {
    try {
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('is_published', true)
        .eq('is_active', true)
        .gte('valid_until', now)
        .order('discount_value', { ascending: false })
        .limit(6);

      if (error) throw error;
      
      setPromos(data || []);
    } catch (error) {
      console.error('Erreur chargement promos:', error);
      setPromos([]);
    } finally {
      setLoading(false);
    }
  };

  return { promos, loading, refetch: fetchActivePromos };
};
