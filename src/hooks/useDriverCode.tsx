import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface DriverCode {
  id: string;
  code: string;
  driver_id: string;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
  partner_id: string | null;
  service_type: string | null;
}

interface PartnerAssignment {
  id: string;
  partner_id: string;
  driver_id: string;
  driver_code: string;
  commission_rate: number;
  status: string;
  added_at: string;
  partner_name?: string;
  partner_company?: string;
  partner_phone?: string;
}

interface PartnerHistory {
  id: string;
  partner_name: string;
  joined_at: string;
  left_at: string | null;
  status: string;
}

export const useDriverCode = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [driverCode, setDriverCode] = useState<DriverCode | null>(null);
  const [partnerAssignment, setPartnerAssignment] = useState<PartnerAssignment | null>(null);
  const [partnerHistory, setPartnerHistory] = useState<PartnerHistory[]>([]);
  const [leavingFleet, setLeavingFleet] = useState(false);

  const fetchDriverCode = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('driver_codes')
        .select('*')
        .eq('driver_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('Error fetching driver code:', error);
        return;
      }

      setDriverCode(data);
    } catch (error) {
      console.error('Error fetching driver code:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchPartnerAssignment = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('partner_drivers')
        .select('*')
        .eq('driver_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (error) {
        console.error('Error fetching partner assignment:', error);
        return;
      }

      if (data) {
        const { data: partnerData } = await supabase
          .from('partenaires')
          .select('company_name, phone_number')
          .eq('id', data.partner_id)
          .maybeSingle();

        setPartnerAssignment({
          ...data,
          partner_name: partnerData?.company_name || 'Partenaire',
          partner_company: partnerData?.company_name || '',
          partner_phone: partnerData?.phone_number || ''
        });
      } else {
        setPartnerAssignment(null);
      }
    } catch (error) {
      console.error('Error fetching partner assignment:', error);
    }
  }, [user]);

  const fetchPartnerHistory = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('partner_drivers')
        .select('id, partner_id, added_at, status')
        .eq('driver_id', user.id)
        .order('added_at', { ascending: false });

      if (error) {
        console.error('Error fetching partner history:', error);
        return;
      }

      if (data && data.length > 0) {
        const partnerIds = [...new Set(data.map(d => d.partner_id))];
        const { data: partenaires } = await supabase
          .from('partenaires')
          .select('id, company_name')
          .in('id', partnerIds);

        const nameMap = new Map((partenaires || []).map((p: any) => [p.id, p.company_name]));

        setPartnerHistory(data.map(item => ({
          id: item.id,
          partner_name: nameMap.get(item.partner_id) || 'Partenaire',
          joined_at: item.added_at,
          left_at: item.status === 'inactive' ? item.added_at : null,
          status: item.status
        })));
      }
    } catch (error) {
      console.error('Error fetching partner history:', error);
    }
  }, [user]);

  const generateCode = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Check if already has an active code
      if (driverCode) {
        toast.info('Vous avez déjà un code actif');
        return;
      }

      // First generate a unique code
      const { data: newCode, error: codeError } = await supabase
        .rpc('generate_driver_code');

      if (codeError) {
        console.error('Error generating code:', codeError);
        toast.error('Erreur lors de la génération du code');
        return;
      }

      // Then create the driver code record
      const { data, error } = await supabase
        .from('driver_codes')
        .insert({
          code: newCode,
          driver_id: user.id,
          is_active: true
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating driver code:', error);
        toast.error('Erreur lors de la création du code');
        return;
      }

      setDriverCode(data);
      toast.success('Code généré avec succès!');
    } catch (error) {
      console.error('Error generating driver code:', error);
      toast.error('Erreur lors de la génération du code');
    } finally {
      setLoading(false);
    }
  };

  const regenerateCode = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Deactivate old codes
      await supabase
        .from('driver_codes')
        .update({ is_active: false })
        .eq('driver_id', user.id);

      // Generate new code
      const { data: newCode, error: codeError } = await supabase
        .rpc('generate_driver_code');

      if (codeError) {
        console.error('Error generating code:', codeError);
        toast.error('Erreur lors de la génération du code');
        return;
      }

      // Create new driver code record
      const { data, error } = await supabase
        .from('driver_codes')
        .insert({
          code: newCode,
          driver_id: user.id,
          is_active: true
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating driver code:', error);
        toast.error('Erreur lors de la création du code');
        return;
      }

      setDriverCode(data);
      toast.success('Nouveau code généré!');
    } catch (error) {
      console.error('Error regenerating driver code:', error);
      toast.error('Erreur lors de la régénération du code');
    } finally {
      setLoading(false);
    }
  };

  const leaveFleet = async () => {
    if (!user || !partnerAssignment) {
      toast.error('Aucun partenaire assigné');
      return false;
    }

    try {
      setLeavingFleet(true);

      // Update partner_drivers status to inactive
      const { error: pdError } = await supabase
        .from('partner_drivers')
        .update({ status: 'inactive' })
        .eq('id', partnerAssignment.id);

      if (pdError) {
        console.error('Error leaving fleet:', pdError);
        toast.error('Erreur lors du retrait de la flotte');
        return false;
      }

      // Update driver_codes partner_id to null
      if (driverCode) {
        await supabase
          .from('driver_codes')
          .update({ partner_id: null })
          .eq('id', driverCode.id);
      }

      // Create notification for partner
      await supabase
        .from('push_notifications')
        .insert({
          user_id: partnerAssignment.partner_id,
          title: 'Chauffeur a quitté votre flotte',
          message: `Un chauffeur a quitté votre flotte.`,
          notification_type: 'fleet_leave',
          is_sent: false
        });

      setPartnerAssignment(null);
      await fetchPartnerHistory();
      
      toast.success('Vous avez quitté la flotte');
      return true;
    } catch (error) {
      console.error('Error leaving fleet:', error);
      toast.error('Erreur lors du retrait de la flotte');
      return false;
    } finally {
      setLeavingFleet(false);
    }
  };

  const shareCode = async () => {
    if (!driverCode) return;

    const shareText = `Mon code chauffeur TAGA: ${driverCode.code}`;
    
    try {
      // Try clipboard first as it's more reliable
      await navigator.clipboard.writeText(shareText);
      toast.success('Code copié! Vous pouvez maintenant le coller dans vos messages.');
      
      // Try native share as bonus if available and in secure context
      if (navigator.share && window.isSecureContext) {
        try {
          await navigator.share({
            title: 'Code Chauffeur TAGA',
            text: shareText
          });
        } catch (shareError) {
          // Ignore share errors since we already copied to clipboard
          console.log('Native share not available or cancelled');
        }
      }
    } catch (error) {
      // Fallback if clipboard also fails
      console.error('Error sharing code:', error);
      toast.error('Impossible de copier automatiquement. Code: ' + driverCode.code);
    }
  };

  const copyCode = async () => {
    if (!driverCode) return;

    try {
      await navigator.clipboard.writeText(driverCode.code);
      toast.success('Code copié dans le presse-papiers!');
    } catch (error) {
      console.error('Error copying code:', error);
      toast.error('Erreur lors de la copie');
    }
  };

  // Setup real-time subscription for partner assignment changes
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`driver-fleet-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'partner_drivers',
          filter: `driver_id=eq.${user.id}`
        },
        (payload) => {
          console.log('🔔 Partner assignment change:', payload);
          
          if (payload.eventType === 'INSERT' && (payload.new as any).status === 'active') {
            toast.success('🎉 Vous avez été ajouté à une flotte!', {
              duration: 5000
            });
            fetchPartnerAssignment();
          } else if (payload.eventType === 'UPDATE') {
            const newStatus = (payload.new as any).status;
            if (newStatus === 'inactive') {
              toast.info('Vous avez été retiré de la flotte', {
                duration: 5000
              });
              setPartnerAssignment(null);
            }
            fetchPartnerAssignment();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchPartnerAssignment]);

  useEffect(() => {
    if (user) {
      fetchDriverCode();
      fetchPartnerAssignment();
      fetchPartnerHistory();
    }
  }, [user, fetchDriverCode, fetchPartnerAssignment, fetchPartnerHistory]);

  return {
    loading,
    driverCode,
    partnerAssignment,
    partnerHistory,
    leavingFleet,
    generateCode,
    regenerateCode,
    leaveFleet,
    shareCode,
    copyCode,
    fetchDriverCode,
    fetchPartnerAssignment,
    refetch: () => {
      fetchDriverCode();
      fetchPartnerAssignment();
      fetchPartnerHistory();
    }
  };
};
