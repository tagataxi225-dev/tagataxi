import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const usePartnerTeam = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['partner-team', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Récupérer l'ID du partenaire
      const { data: partnerData } = await supabase
        .from('partenaires')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!partnerData) return [];

      // Récupérer les chauffeurs liés au partenaire
      const { data: partnerDrivers } = await supabase
        .from('partner_drivers')
        .select(`
          *,
          driver:driver_id (
            display_name,
            email,
            phone_number,
            rating_average,
            total_rides
          )
        `)
        .eq('partner_id', partnerData.id);

      return partnerDrivers?.map(pd => ({
        id: pd.id,
        driverId: pd.driver_id,
        name: (pd.driver as any)?.display_name || 'Chauffeur',
        email: (pd.driver as any)?.email || '',
        phoneNumber: (pd.driver as any)?.phone_number || '',
        status: pd.status,
        rating: (pd.driver as any)?.rating_average || 0,
        totalRides: (pd.driver as any)?.total_rides || 0,
        joinedAt: pd.created_at,
      })) || [];
    },
    enabled: !!user?.id,
  });
};
