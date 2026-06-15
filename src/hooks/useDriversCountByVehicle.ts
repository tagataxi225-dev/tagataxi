/**
 * 🚗 Hook pour compter les chauffeurs disponibles par type de véhicule
 * Connexion directe à la DB pour données temps réel
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { VEHICLE_CLASS_TO_SERVICE_TYPE } from '@/utils/pricingMapper';
import { scheduleIdle, cancelIdle } from '@/utils/safeTap';

interface DriversCount {
  [vehicleType: string]: number;
}

export const useDriversCountByVehicle = (city: string = 'Kinshasa') => {
  const [counts, setCounts] = useState<DriversCount>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ✅ FIX: Short-circuit when disabled
    if (city === '__disabled__') {
      setCounts({});
      setLoading(false);
      return;
    }
    
    const fetchDriversCounts = async () => {
      try {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

        const { data: locations, error } = await supabase
          .from('driver_locations')
          .select('driver_id, vehicle_class')
          .eq('is_online', true)
          .eq('is_available', true)
          .gte('last_ping', fiveMinutesAgo);

        if (error) throw error;

        const mappedCounts: DriversCount = {};
        
        locations?.forEach((loc: any) => {
          const vehicleClass = loc.vehicle_class;
          const serviceType = VEHICLE_CLASS_TO_SERVICE_TYPE[vehicleClass];
          
          if (serviceType) {
            mappedCounts[serviceType] = (mappedCounts[serviceType] || 0) + 1;
          }
        });

        setCounts(mappedCounts);
      } catch (error) {
        // Valeurs par défaut en cas d'erreur
        setCounts({ 'taxi_moto': 8, 'taxi_eco': 12, 'taxi_confort': 5 });
      } finally {
        setLoading(false);
      }
    };

    // ✅ FIX: Use idle scheduling instead of fixed setTimeout to avoid boot burst
    const idleId = scheduleIdle(fetchDriversCounts, 4000);

    // Rafraîchir toutes les 120 secondes (skip si app en arrière-plan)
    const interval = setInterval(() => {
      if (!document.hidden) fetchDriversCounts();
    }, 120000);

    return () => {
      cancelIdle(idleId);
      clearInterval(interval);
    };
  }, [city]);

  return { counts, loading };
};
