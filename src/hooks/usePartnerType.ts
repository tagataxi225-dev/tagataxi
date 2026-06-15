import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type PartnerType = 'delivery' | 'auto' | null;

interface UsePartnerTypeReturn {
  partnerType: PartnerType;
  loading: boolean;
  updatePartnerType: (type: 'delivery' | 'auto') => Promise<void>;
}

export const usePartnerType = (): UsePartnerTypeReturn => {
  const { user } = useAuth();
  const [partnerType, setPartnerType] = useState<PartnerType>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPartnerType = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('partenaires')
          .select('partner_type, business_type')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          // Use partner_type if set, otherwise infer from business_type
          if (data.partner_type === 'delivery' || data.partner_type === 'auto') {
            setPartnerType(data.partner_type as PartnerType);
          } else if (data.business_type === 'transport' || data.business_type === 'rental_agency') {
            setPartnerType('auto');
          } else {
            setPartnerType(null);
          }
        }
      } catch (error) {
        console.error('Error fetching partner type:', error);
        setPartnerType(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPartnerType();
  }, [user]);

  const updatePartnerType = async (type: 'delivery' | 'auto') => {
    if (!user) return;

    await supabase
      .from('partenaires')
      .update({ partner_type: type })
      .eq('user_id', user.id);

    setPartnerType(type);
  };

  return { partnerType, loading, updatePartnerType };
};
