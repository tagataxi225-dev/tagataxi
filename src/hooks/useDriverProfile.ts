import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface DriverProfileData {
  displayName: string | null;
  photoUrl: string | null;
  vehicleMake: string | null;
  vehicleModel: string | null;
  vehiclePlate: string | null;
  vehicleClass: string | null;
  totalRides: number;
  ratingAverage: number;
}

const toTitleCase = (s: string) =>
  s.split(' ').filter(Boolean).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

export const useDriverProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<DriverProfileData>({
    displayName: null,
    photoUrl: null,
    vehicleMake: null,
    vehicleModel: null,
    vehiclePlate: null,
    vehicleClass: null,
    totalRides: 0,
    ratingAverage: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    const fetchProfile = async () => {
      const [{ data: chauffeurData }, { data: profileData }] = await Promise.all([
        supabase
          .from('chauffeurs')
          .select('display_name, profile_photo_url, vehicle_make, vehicle_model, vehicle_plate, vehicle_class, total_rides, rating_average')
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase
          .from('profiles')
          .select('display_name')
          .eq('id', user.id)
          .maybeSingle(),
      ]);

      console.warn('[DriverProfile] chauffeurs.display_name:', chauffeurData?.display_name);
      console.warn('[DriverProfile] profiles.display_name:', profileData?.display_name);
      console.warn('[DriverProfile] auth user_metadata:', (user as any).user_metadata);

      // Prefer profiles.display_name (set at signup), fall back to chauffeurs, then auth metadata
      const rawName =
        profileData?.display_name ||
        chauffeurData?.display_name ||
        (user as any).user_metadata?.full_name ||
        null;

      setProfile({
        displayName: rawName ? toTitleCase(rawName) : null,
        photoUrl: chauffeurData?.profile_photo_url ?? null,
        vehicleMake: chauffeurData?.vehicle_make ?? null,
        vehicleModel: chauffeurData?.vehicle_model ?? null,
        vehiclePlate: chauffeurData?.vehicle_plate ?? null,
        vehicleClass: chauffeurData?.vehicle_class ?? null,
        totalRides: chauffeurData?.total_rides ?? 0,
        ratingAverage: chauffeurData?.rating_average ?? 0,
      });
      setLoading(false);
    };

    fetchProfile();
  }, [user?.id]);

  // Derived first/last name helpers
  const parts = profile.displayName?.split(' ') ?? [];
  const firstName = parts[0] ?? null;
  const lastName = parts.slice(1).join(' ') || null;

  return { profile, loading, firstName, lastName };
};
