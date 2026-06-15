
import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

/**
 * Returns the driver's service type to help default the Chauffeur UI tab.
 * serviceType: 'taxi' | 'delivery' | 'unknown'
 */
export const useDriverServiceType = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [serviceType, setServiceType] = useState<'taxi' | 'delivery' | 'unknown'>('unknown');

  useEffect(() => {
    const fetchServiceType = async () => {
      if (!user) {
        setServiceType('unknown');
        setLoading(false);
        return;
      }

      try {
        // ✅ PHASE 1: Utiliser la fonction RPC sécurisée pour récupérer le service_type
        const { data: serviceTypeData, error: rpcError } = await (supabase as any)
          .rpc('get_driver_service_type', { driver_user_id: user.id });

        if (rpcError) {
          console.error('❌ RPC Error fetching service type:', rpcError);
          setServiceType('unknown');
          setLoading(false);
          return;
        }

        // Le résultat est directement 'taxi' ou 'delivery'
        setServiceType(serviceTypeData as 'taxi' | 'delivery');
        console.log(`✅ Driver service type: ${serviceTypeData}`);

      } catch (err) {
        console.error('💥 Failed to load driver service type:', err);
        setServiceType('unknown');
      } finally {
        setLoading(false);
      }
    };

    fetchServiceType();
  }, [user]);

  return { loading, serviceType };
};
