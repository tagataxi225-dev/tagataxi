/**
 * Hook pour récupérer les informations complètes du service du chauffeur
 * Remplace useDriverServiceType avec support de service_specialization
 */

import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

export interface DriverServiceInfo {
  serviceType: 'taxi' | 'delivery' | 'unknown';
  serviceSpecialization: string | null;
}

export const useDriverServiceInfo = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [serviceInfo, setServiceInfo] = useState<DriverServiceInfo>({
    serviceType: 'unknown',
    serviceSpecialization: null
  });

  useEffect(() => {
    const fetchServiceInfo = async () => {
      if (!user) {
        setServiceInfo({ serviceType: 'unknown', serviceSpecialization: null });
        setLoading(false);
        return;
      }

      try {
        // ✅ Utiliser la fonction RPC get_driver_service_info
        const { data, error } = await (supabase as any)
          .rpc('get_driver_service_info', { driver_user_id: user.id });

        if (error) {
          console.warn('⚠️ RPC error, using direct query fallback:', error.message);
          
          // FALLBACK: Requête directe à la table chauffeurs
          const { data: directData, error: directError } = await supabase
            .from('chauffeurs')
            .select('service_type, service_specialization')
            .eq('user_id', user.id)
            .single();
          
          if (!directError && directData) {
            setServiceInfo({
              serviceType: directData.service_type as any || 'unknown',
              serviceSpecialization: directData.service_specialization || null
            });
            console.log('✅ Fallback successful:', directData);
            setLoading(false);
            return;
          }
          
          console.error('❌ Fallback also failed:', directError);
          setServiceInfo({ serviceType: 'unknown', serviceSpecialization: null });
          setLoading(false);
          return;
        }

        // RPC réussie - traiter les données
        if (Array.isArray(data) && data.length > 0) {
          const info = data[0];
          setServiceInfo({
            serviceType: info.service_type || 'unknown',
            serviceSpecialization: info.service_specialization || null
          });
          console.log('✅ Driver service info (RPC):', info);
        } else if (data && typeof data === 'object') {
          setServiceInfo({
            serviceType: (data as any).service_type || 'unknown',
            serviceSpecialization: (data as any).service_specialization || null
          });
          console.log('✅ Driver service info (RPC object):', data);
        } else {
          console.warn('⚠️ RPC returned empty data, using fallback');
          
          // FALLBACK si RPC retourne des données vides
          const { data: directData, error: directError } = await supabase
            .from('chauffeurs')
            .select('service_type, service_specialization')
            .eq('user_id', user.id)
            .single();
          
          if (!directError && directData) {
            setServiceInfo({
              serviceType: directData.service_type as any || 'unknown',
              serviceSpecialization: directData.service_specialization || null
            });
            console.log('✅ Fallback successful (empty RPC):', directData);
          } else {
            setServiceInfo({ serviceType: 'unknown', serviceSpecialization: null });
          }
        }

      } catch (err) {
        console.error('💥 Exception in fetchServiceInfo:', err);
        
        // FALLBACK final en cas d'exception
        try {
          const { data: directData, error: directError } = await supabase
            .from('chauffeurs')
            .select('service_type, service_specialization')
            .eq('user_id', user.id)
            .single();
          
          if (!directError && directData) {
            setServiceInfo({
              serviceType: directData.service_type as any || 'unknown',
              serviceSpecialization: directData.service_specialization || null
            });
            console.log('✅ Emergency fallback successful:', directData);
          } else {
            setServiceInfo({ serviceType: 'unknown', serviceSpecialization: null });
          }
        } catch (fallbackErr) {
          console.error('💥 Emergency fallback also failed:', fallbackErr);
          setServiceInfo({ serviceType: 'unknown', serviceSpecialization: null });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchServiceInfo();
  }, [user]);

  return { loading, ...serviceInfo };
};
