import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type { DriverRegistrationData } from '@/hooks/useDriverRegistration';

const STORAGE_KEY = 'kwenda_pending_driver_registration';

/**
 * Resume driver registration after email confirmation.
 *
 * When the driver signs up, if the project requires email confirmation the
 * initial `signUp()` returns `session: null`. We persist the full registration
 * payload (minus password) under `kwenda_pending_driver_registration`.
 *
 * On the next authenticated load, this hook detects the pending payload,
 * calls `create_driver_profile_secure` with the stored data, applies the
 * extended profile/vehicle details, and clears the payload.
 */
export const useDriverRegistrationResume = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const inFlightRef = useRef(false);

  useEffect(() => {
    if (!user || inFlightRef.current) return;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    let stored: Partial<DriverRegistrationData>;
    try {
      stored = JSON.parse(raw);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }

    inFlightRef.current = true;
    (async () => {
      try {
        // Skip if a driver profile already exists for this user
        const { data: existing } = await supabase
          .from('chauffeurs')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();
        if (existing) {
          localStorage.removeItem(STORAGE_KEY);
          return;
        }

        console.log('[DriverRegistrationResume] Resuming registration for user:', user.id);

        const { data: rpcResult, error } = await supabase.rpc(
          'create_driver_profile_secure',
          {
            p_user_id: user.id,
            p_email: stored.email ?? user.email ?? '',
            p_display_name: stored.displayName ?? '',
            p_phone_number: stored.phoneNumber ?? '',
            p_license_number: stored.licenseNumber || null,
            p_vehicle_plate: stored.hasOwnVehicle ? stored.vehiclePlate : null,
            p_service_type: stored.serviceCategory ?? 'taxi',
            p_delivery_capacity: stored.deliveryCapacity || null,
            p_vehicle_class: 'standard',
            p_has_own_vehicle: !!stored.hasOwnVehicle,
          }
        );

        if (error) {
          console.error('[DriverRegistrationResume] RPC error:', error);
          return; // keep storage so user can retry on next load
        }

        const resultOk = (rpcResult as any)?.success !== false;
        if (!resultOk) {
          console.error('[DriverRegistrationResume] RPC returned failure:', rpcResult);
          return;
        }

        // Apply extended details that aren't passed through the RPC
        const update: Record<string, unknown> = {
          license_expiry: stored.licenseExpiry,
          bank_account_number: stored.bankAccountNumber,
          emergency_contact_name: stored.emergencyContactName,
          emergency_contact_phone: stored.emergencyContactPhone,
          service_specialization: stored.serviceSpecialization || null,
          ...(stored.profilePhotoUrl && { profile_photo_url: stored.profilePhotoUrl }),
        };
        if (stored.hasOwnVehicle) {
          Object.assign(update, {
            vehicle_type: stored.vehicleType,
            vehicle_make: stored.vehicleMake,
            vehicle_model: stored.vehicleModel,
            vehicle_year: stored.vehicleYear,
            vehicle_color: stored.vehicleColor,
            insurance_number: stored.insuranceNumber,
            insurance_expiry: stored.insuranceExpiry,
          });
        }
        await supabase.from('chauffeurs').update(update).eq('user_id', user.id);

        localStorage.removeItem(STORAGE_KEY);

        toast({
          title: 'Inscription finalisée',
          description: 'Votre profil chauffeur est maintenant complet.',
        });
      } catch (e: any) {
        console.error('[DriverRegistrationResume] Unexpected error:', e);
        // Leave the payload so the user can retry on next mount
      } finally {
        inFlightRef.current = false;
      }
    })();
  }, [user, toast]);
};
