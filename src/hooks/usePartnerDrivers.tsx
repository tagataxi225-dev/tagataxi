import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface PartnerDriver {
  id: string;
  partner_id: string;
  driver_id: string;
  driver_code: string;
  status: string;
  added_at: string;
  commission_rate: number;
  driver_name?: string;
  driver_phone?: string;
  driver_email?: string;
  driver_rating?: number;
  driver_total_rides?: number;
  vehicle_type?: string;
  vehicle_plate?: string;
  profile_photo_url?: string | null;
}

interface DriverPreview {
  id: string;
  display_name: string;
  phone_number: string;
  email: string;
  rating_average: number;
  total_rides: number;
  vehicle_type: string;
  vehicle_plate: string;
  profile_photo_url: string | null;
}

export const usePartnerDrivers = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [drivers, setDrivers] = useState<PartnerDriver[]>([]);
  const [addingDriver, setAddingDriver] = useState(false);
  const [driverPreview, setDriverPreview] = useState<DriverPreview | null>(null);
  const [validatingCode, setValidatingCode] = useState(false);
  const [partenaireId, setPartenaireId] = useState<string | null>(null);

  const fetchPartnerDrivers = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);

      const { data: p } = await supabase
        .from('partenaires')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!p) {
        setLoading(false);
        return;
      }
      setPartenaireId(p.id);

      const { data, error } = await supabase
        .from('partner_drivers')
        .select('id, partner_id, driver_id, driver_code, status, added_at, commission_rate')
        .eq('partner_id', p.id)
        .eq('status', 'active')
        .order('added_at', { ascending: false });

      if (error) {
        console.error('Error fetching partner drivers:', error);
        return;
      }

      const driverIds = (data || []).map(d => d.driver_id);

      const [profilesRes, chauffeursRes] = await Promise.all([
        driverIds.length
          ? supabase
              .from('profiles')
              .select('user_id, display_name, phone_number, avatar_url')
              .in('user_id', driverIds)
          : Promise.resolve({ data: [] }),
        driverIds.length
          ? supabase
              .from('chauffeurs')
              .select('user_id, display_name, phone_number, email, rating_average, total_rides, vehicle_type, vehicle_plate, profile_photo_url')
              .in('user_id', driverIds)
          : Promise.resolve({ data: [] }),
      ]);

      const profileMap = new Map((profilesRes.data || []).map((p: any) => [p.user_id, p]));
      const chauffeurMap = new Map((chauffeursRes.data || []).map((c: any) => [c.user_id, c]));

      const driversWithProfiles = (data || []).map(driver => {
        const profile  = profileMap.get(driver.driver_id);
        const chauffeur = chauffeurMap.get(driver.driver_id);
        return {
          ...driver,
          commission_rate: driver.commission_rate ?? 2.5,
          driver_name:        profile?.display_name   || chauffeur?.display_name   || 'Chauffeur',
          driver_phone:       profile?.phone_number   || chauffeur?.phone_number   || '',
          driver_email:       chauffeur?.email        || '',
          driver_rating:      chauffeur?.rating_average || 0,
          driver_total_rides: chauffeur?.total_rides  || 0,
          vehicle_type:       chauffeur?.vehicle_type || '',
          vehicle_plate:      chauffeur?.vehicle_plate || '',
          profile_photo_url:  chauffeur?.profile_photo_url || profile?.avatar_url || null,
        };
      });

      setDrivers(driversWithProfiles);
    } catch (error) {
      console.error('Error fetching partner drivers:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Validate a driver code and get driver preview
  const validateDriverCode = async (driverCode: string): Promise<boolean> => {
    if (!user || !driverCode.trim()) return false;

    try {
      setValidatingCode(true);
      setDriverPreview(null);

      const { data: codeData, error: codeError } = await supabase
        .from('driver_codes')
        .select('driver_id, is_active, partner_id')
        .eq('code', driverCode.toUpperCase())
        .eq('is_active', true)
        .maybeSingle();

      if (codeError) {
        console.error('Error verifying driver code:', codeError);
        toast.error('Erreur lors de la vérification du code');
        return false;
      }

      if (!codeData) {
        toast.error('Code Driver invalide ou expiré');
        return false;
      }

      const { data: chauffeur } = await supabase
        .from('chauffeurs')
        .select('display_name, phone_number, email, rating_average, total_rides, vehicle_type, vehicle_plate, profile_photo_url')
        .eq('user_id', codeData.driver_id)
        .maybeSingle();

      // Check if already assigned to another active partner
      const { data: activeAssignment } = await supabase
        .from('partner_drivers')
        .select('id, partner_id')
        .eq('driver_id', codeData.driver_id)
        .eq('status', 'active')
        .maybeSingle();

      if (activeAssignment) {
        if (partenaireId && activeAssignment.partner_id === partenaireId) {
          toast.error('Ce chauffeur est déjà dans votre flotte');
        } else {
          toast.error('Ce chauffeur est déjà assigné à un autre partenaire. Il doit quitter sa flotte actuelle.');
        }
        return false;
      }

      // Fetch driver profile for preview
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, phone_number, avatar_url')
        .eq('user_id', codeData.driver_id)
        .maybeSingle();

      setDriverPreview({
        id: codeData.driver_id,
        display_name: profile?.display_name || chauffeur?.display_name || 'Chauffeur',
        phone_number: profile?.phone_number || chauffeur?.phone_number || '',
        email: chauffeur?.email || '',
        rating_average: chauffeur?.rating_average || 0,
        total_rides: chauffeur?.total_rides || 0,
        vehicle_type: chauffeur?.vehicle_type || '',
        vehicle_plate: chauffeur?.vehicle_plate || '',
        profile_photo_url: chauffeur?.profile_photo_url || profile?.avatar_url || null
      });

      return true;
    } catch (error) {
      console.error('Error validating driver code:', error);
      toast.error('Erreur lors de la validation');
      return false;
    } finally {
      setValidatingCode(false);
    }
  };

  const clearDriverPreview = () => {
    setDriverPreview(null);
  };

  const addDriverByCode = async (driverCode: string) => {
    if (!user || !driverCode.trim()) return false;

    try {
      setAddingDriver(true);

      const { data: partenaireData } = await supabase
        .from('partenaires')
        .select('id, company_name')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!partenaireData) {
        toast.error('Profil partenaire introuvable');
        return false;
      }

      const { data: codeData, error: codeError } = await supabase
        .from('driver_codes')
        .select('id, driver_id, partner_id')
        .eq('code', driverCode.toUpperCase())
        .eq('is_active', true)
        .maybeSingle();

      if (codeError) {
        console.error('Error verifying driver code:', codeError);
        toast.error('Erreur lors de la vérification du code');
        return false;
      }

      if (!codeData) {
        toast.error('Code Driver invalide ou expiré');
        return false;
      }

      // Check if driver is already assigned to this partner
      const { data: existingAssignment, error: checkError } = await supabase
        .from('partner_drivers')
        .select('id')
        .eq('partner_id', partenaireData.id)
        .eq('driver_id', codeData.driver_id)
        .eq('status', 'active')
        .maybeSingle();

      if (checkError) {
        console.error('Error checking existing assignment:', checkError);
        toast.error('Erreur lors de la vérification');
        return false;
      }

      if (existingAssignment) {
        toast.error('Ce chauffeur est déjà dans votre flotte');
        return false;
      }

      // Check if driver is assigned to another partner
      const { data: otherAssignment, error: otherError } = await supabase
        .from('partner_drivers')
        .select('id')
        .eq('driver_id', codeData.driver_id)
        .eq('status', 'active')
        .maybeSingle();

      if (otherError) {
        console.error('Error checking other assignments:', otherError);
        toast.error('Erreur lors de la vérification');
        return false;
      }

      if (otherAssignment) {
        toast.error('Ce chauffeur doit d\'abord quitter sa flotte actuelle avant de rejoindre la vôtre');
        return false;
      }

      // Add the driver to the partner's fleet
      const { error: insertError } = await supabase
        .from('partner_drivers')
        .insert({
          partner_id: partenaireData.id,
          driver_id: codeData.driver_id,
          driver_code: driverCode.toUpperCase(),
          status: 'active'
        });

      if (insertError) {
        console.error('Error adding driver:', insertError);
        toast.error('Erreur lors de l\'ajout du chauffeur');
        return false;
      }

      // Update driver_codes.partner_id
      await supabase
        .from('driver_codes')
        .update({ partner_id: partenaireData.id })
        .eq('id', codeData.id);

      const partnerName = partenaireData.company_name || 'Un partenaire';

      // Send notification to driver
      await supabase
        .from('push_notifications')
        .insert({
          user_id: codeData.driver_id,
          title: '🎉 Bienvenue dans la flotte!',
          message: `Vous avez été ajouté à la flotte de ${partnerName}. Vous pouvez maintenant recevoir des commandes.`,
          notification_type: 'fleet_join',
          is_sent: false,
          metadata: {
            partner_id: partenaireData.id,
            partner_name: partnerName
          }
        });

      toast.success('Chauffeur ajouté avec succès!');
      setDriverPreview(null);
      await fetchPartnerDrivers();
      return true;
    } catch (error) {
      console.error('Error adding driver by code:', error);
      toast.error('Erreur lors de l\'ajout du chauffeur');
      return false;
    } finally {
      setAddingDriver(false);
    }
  };

  const removeDriver = async (assignmentId: string, driverId: string) => {
    if (!user) return false;

    try {
      let pid = partenaireId;
      if (!pid) {
        const { data: p } = await supabase
          .from('partenaires')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();
        if (!p) {
          toast.error('Profil partenaire introuvable');
          return false;
        }
        pid = p.id;
        setPartenaireId(pid);
      }

      const { error } = await supabase
        .from('partner_drivers')
        .update({ status: 'inactive' })
        .eq('partner_id', pid)
        .eq('id', assignmentId);

      if (error) {
        console.error('Error removing driver:', error);
        toast.error('Erreur lors de la suppression');
        return false;
      }

      await supabase
        .from('driver_codes')
        .update({ partner_id: null })
        .eq('driver_id', driverId)
        .eq('partner_id', pid);

      await supabase
        .from('push_notifications')
        .insert({
          user_id: driverId,
          title: 'Retrait de la flotte',
          message: 'Vous avez été retiré de la flotte du partenaire.',
          notification_type: 'fleet_leave',
          is_sent: false
        });

      toast.success('Chauffeur retiré de votre flotte');
      await fetchPartnerDrivers();
      return true;
    } catch (error) {
      console.error('Error removing driver:', error);
      toast.error('Erreur lors de la suppression');
      return false;
    }
  };

  useEffect(() => {
    if (!user || !partenaireId) return;

    const channel = supabase
      .channel(`partner-drivers-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'partner_drivers',
          filter: `partner_id=eq.${partenaireId}`
        },
        () => {
          fetchPartnerDrivers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, partenaireId, fetchPartnerDrivers]);

  useEffect(() => {
    if (user) {
      fetchPartnerDrivers();
    }
  }, [user, fetchPartnerDrivers]);

  return {
    loading,
    drivers,
    addingDriver,
    driverPreview,
    validatingCode,
    validateDriverCode,
    clearDriverPreview,
    addDriverByCode,
    removeDriver,
    fetchPartnerDrivers
  };
};
