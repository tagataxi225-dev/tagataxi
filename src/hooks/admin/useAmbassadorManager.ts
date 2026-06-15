import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Ambassador {
  id: string;
  code: string;
  user_id: string;
  ambassador_name: string | null;
  ambassador_note: string | null;
  max_referrals: number;
  bonus_per_referral: number;
  referred_bonus: number;
  is_active: boolean;
  usage_count: number;
  successful_referrals: number;
  total_earnings: number;
  created_at: string;
}

export interface CreateAmbassadorData {
  ambassador_name: string;
  code?: string;
  max_referrals: number;
  bonus_per_referral: number;
  referred_bonus: number;
  ambassador_note?: string;
  user_id: string;
}

const generateCode = (name: string): string => {
  const clean = name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 10);
  const suffix = Math.random().toString(36).substring(2, 4).toUpperCase();
  return `${clean}${suffix}`;
};

export const useAmbassadorManager = () => {
  const [ambassadors, setAmbassadors] = useState<Ambassador[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchAmbassadors = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await (supabase
        .from('referral_codes')
        .select('*') as any)
        .eq('is_ambassador', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAmbassadors((data as Ambassador[]) || []);
    } catch (err: any) {
      console.error('Erreur fetchAmbassadors:', err);
      toast({ title: 'Erreur', description: 'Impossible de charger les ambassadeurs', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAmbassadors();
  }, [fetchAmbassadors]);

  const createAmbassador = async (data: CreateAmbassadorData) => {
    try {
      const code = data.code?.trim().toUpperCase() || generateCode(data.ambassador_name);

      // Check uniqueness
      const { data: existing } = await supabase
        .from('referral_codes')
        .select('id')
        .eq('code', code)
        .maybeSingle();

      if (existing) {
        toast({ title: 'Erreur', description: `Le code "${code}" existe déjà`, variant: 'destructive' });
        return false;
      }

      const { error } = await supabase
        .from('referral_codes')
        .insert({
          code,
          user_id: data.user_id,
          max_referrals: data.max_referrals,
          bonus_per_referral: data.bonus_per_referral,
          referred_bonus: data.referred_bonus,
          is_ambassador: true,
          ambassador_name: data.ambassador_name,
          ambassador_note: data.ambassador_note || null,
          is_active: true,
          usage_count: 0,
          successful_referrals: 0,
          total_earnings: 0,
        } as any);

      if (error) throw error;

      toast({ title: 'Succès', description: `Ambassadeur "${data.ambassador_name}" créé avec le code ${code}` });
      await fetchAmbassadors();
      return true;
    } catch (err: any) {
      console.error('Erreur createAmbassador:', err);
      toast({ title: 'Erreur', description: err.message || 'Échec de la création', variant: 'destructive' });
      return false;
    }
  };

  const updateAmbassador = async (id: string, data: Partial<CreateAmbassadorData>) => {
    try {
      const updatePayload: any = {};
      if (data.ambassador_name !== undefined) updatePayload.ambassador_name = data.ambassador_name;
      if (data.ambassador_note !== undefined) updatePayload.ambassador_note = data.ambassador_note;
      if (data.max_referrals !== undefined) updatePayload.max_referrals = data.max_referrals;
      if (data.bonus_per_referral !== undefined) updatePayload.bonus_per_referral = data.bonus_per_referral;
      if (data.referred_bonus !== undefined) updatePayload.referred_bonus = data.referred_bonus;

      const { error } = await supabase
        .from('referral_codes')
        .update(updatePayload)
        .eq('id', id);

      if (error) throw error;

      toast({ title: 'Succès', description: 'Ambassadeur mis à jour' });
      await fetchAmbassadors();
      return true;
    } catch (err: any) {
      console.error('Erreur updateAmbassador:', err);
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
      return false;
    }
  };

  const toggleActive = async (id: string, currentActive: boolean) => {
    try {
      const { error } = await supabase
        .from('referral_codes')
        .update({ is_active: !currentActive })
        .eq('id', id);

      if (error) throw error;

      toast({ title: currentActive ? 'Désactivé' : 'Activé', description: `Code ambassadeur ${currentActive ? 'désactivé' : 'activé'}` });
      await fetchAmbassadors();
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    }
  };

  const stats = {
    total: ambassadors.length,
    totalReferrals: ambassadors.reduce((s, a) => s + (a.successful_referrals || 0), 0),
    totalEarnings: ambassadors.reduce((s, a) => s + (a.total_earnings || 0), 0),
  };

  return { ambassadors, isLoading, stats, createAmbassador, updateAmbassador, toggleActive, refetch: fetchAmbassadors };
};
