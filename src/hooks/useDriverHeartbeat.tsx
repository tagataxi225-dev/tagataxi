import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { nativeGeolocationService } from '@/services/nativeGeolocationService';

/**
 * Hook léger pour maintenir le heartbeat du chauffeur
 * ✅ PHASE 3: Ne modifie PAS is_online/is_available — useDriverStatus est la source de vérité
 * Ce hook ne fait que mettre à jour la position GPS et last_ping
 */
export const useDriverHeartbeat = () => {
  const { user } = useAuth();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastPositionRef = useRef<{ lat: number; lng: number } | null>(null);

  const updateHeartbeat = async () => {
    if (!user) return;

    try {
      const position = await nativeGeolocationService.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      });

      if (position.lat === 0 && position.lng === 0) {
        console.warn('⚠️ Heartbeat: position (0,0) ignorée');
        return;
      }

      const newPosition = { lat: position.lat, lng: position.lng };
      const shouldUpdatePosition = !lastPositionRef.current ||
        Math.abs(lastPositionRef.current.lat - newPosition.lat) > 0.0001 ||
        Math.abs(lastPositionRef.current.lng - newPosition.lng) > 0.0001;

      const now = new Date().toISOString();

      // ✅ PHASE 3: Only update position + last_ping — NOT is_online/is_available
      // useDriverStatus is the single source of truth for availability state
      const { error } = await supabase
        .from('driver_locations')
        .update({
          latitude: newPosition.lat,
          longitude: newPosition.lng,
          last_ping: now,
          accuracy: position.accuracy,
          updated_at: now
        })
        .eq('driver_id', user.id);

      if (error) {
        // If row doesn't exist yet, upsert with minimal defaults
        if (error.code === 'PGRST116' || error.details?.includes('0 rows')) {
          // ⚠️ is_online/is_available retirés — gérés par useDriverStatus.goOnline/goOffline
          await supabase.from('driver_locations').upsert({
            driver_id: user.id,
            latitude: newPosition.lat,
            longitude: newPosition.lng,
            last_ping: now,
            accuracy: position.accuracy,
            updated_at: now
          }, { onConflict: 'driver_id' });
        } else {
          console.warn('❌ Heartbeat update failed:', error);
        }
      } else {
        if (shouldUpdatePosition) {
          console.log('✅ Heartbeat position updated:', {
            lat: newPosition.lat, lng: newPosition.lng,
            accuracy: position.accuracy
          });
          lastPositionRef.current = newPosition;
        }
      }
    } catch (error) {
      console.warn('⚠️ Heartbeat error:', error);
    }
  };

  useEffect(() => {
    if (!user) return;

    updateHeartbeat();
    intervalRef.current = setInterval(updateHeartbeat, 2 * 60 * 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [user]);

  return { updateHeartbeat };
};
