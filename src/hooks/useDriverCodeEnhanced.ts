import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface DriverCodeEnhanced {
  id: string;
  code: string;
  driver_id: string;
  partner_id?: string;
  code_type: 'recruitment' | 'temporary' | 'permanent';
  usage_limit: number;
  usage_count: number;
  is_active: boolean;
  expires_at?: string;
  created_at: string;
}

export interface PartnerAssignmentEnhanced {
  id: string;
  partner_id: string;
  driver_id: string;
  commission_rate: number;
  is_active: boolean;
  assigned_at: string;
  partner_name: string;
  partner_company: string;
}

export const useDriverCodeEnhanced = () => {
  const [loading, setLoading] = useState(false);
  const [driverCode, setDriverCode] = useState<DriverCodeEnhanced | null>(null);
  const [partnerAssignment, setPartnerAssignment] = useState<PartnerAssignmentEnhanced | null>(null);

  const fetchDriverCode = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Essayer d'abord la nouvelle table
      let { data: codeData } = await supabase
        .from('driver_codes_enhanced')
        .select('*')
        .eq('driver_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1);

      // Fallback vers l'ancienne table si pas de données
      if (!codeData || codeData.length === 0) {
        const { data: oldCodeData } = await supabase
          .from('driver_codes')
          .select('*')
          .eq('driver_id', user.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1);

        if (oldCodeData && oldCodeData.length > 0) {
          const oldCode = oldCodeData[0];
          // Migrer vers la nouvelle table
          const { data: newCode } = await supabase
            .from('driver_codes_enhanced')
            .insert({
              driver_id: oldCode.driver_id,
              code: oldCode.code,
              code_type: 'recruitment',
              usage_limit: 1,
              usage_count: 0,
              is_active: oldCode.is_active,
              expires_at: oldCode.expires_at
            })
            .select()
            .single();

          if (newCode) {
            codeData = [newCode];
          }
        }
      }

      if (codeData && codeData.length > 0) {
        setDriverCode(codeData[0] as DriverCodeEnhanced);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du code chauffeur:', error);
    }
  };

  const generateCode = async (codeType: 'recruitment' | 'temporary' | 'permanent' = 'recruitment') => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Désactiver les anciens codes
      await supabase
        .from('driver_codes_enhanced')
        .update({ is_active: false })
        .eq('driver_id', user.id);

      // Générer nouveau code
      const { data: newCodeText } = await supabase
        .rpc('generate_driver_code_secure');

      if (!newCodeText) throw new Error('Impossible de générer le code');

      const { data: newCode, error } = await supabase
        .from('driver_codes_enhanced')
        .insert({
          driver_id: user.id,
          code: newCodeText,
          code_type: codeType,
          usage_limit: codeType === 'permanent' ? 999999 : 1,
          usage_count: 0,
          is_active: true,
          expires_at: codeType === 'temporary' ? 
            new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() : 
            null
        })
        .select()
        .single();

      if (error) throw error;

      setDriverCode(newCode as DriverCodeEnhanced);
      toast.success('Nouveau code généré avec succès!');
      
      return newCode;
    } catch (error: any) {
      console.error('Erreur génération code:', error);
      toast.error(error.message || 'Erreur lors de la génération du code');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const shareCode = async () => {
    if (!driverCode) return;

    const shareText = `Code Chauffeur Tembea: ${driverCode.code}`;
    const shareUrl = `https://tembea.app/driver/join/${driverCode.code}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Code Chauffeur Tembea',
          text: shareText,
          url: shareUrl
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          await copyCode();
        }
      }
    } else {
      await copyCode();
    }
  };

  const copyCode = async () => {
    if (!driverCode) return;

    try {
      await navigator.clipboard.writeText(driverCode.code);
      toast.success('Code copié!');
    } catch (error) {
      console.error('Erreur copie:', error);
      toast.error('Impossible de copier le code');
    }
  };

  const validateCode = async (code: string) => {
    try {
      const { data: codeData } = await supabase
        .from('driver_codes_enhanced')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('is_active', true)
        .single();

      if (!codeData) {
        return { valid: false, error: 'Code invalide ou expiré' };
      }

      if (codeData.expires_at && new Date(codeData.expires_at) < new Date()) {
        return { valid: false, error: 'Code expiré' };
      }

      if (codeData.usage_count >= codeData.usage_limit) {
        return { valid: false, error: 'Code déjà utilisé' };
      }

      return { valid: true, code: codeData };
    } catch (error) {
      console.error('Erreur validation code:', error);
      return { valid: false, error: 'Erreur lors de la validation' };
    }
  };

  useEffect(() => {
    const loadUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        fetchDriverCode();
      }
    };
    
    loadUserData();
  }, []);

  return {
    loading,
    driverCode,
    partnerAssignment,
    generateCode,
    shareCode,
    copyCode,
    validateCode,
    refetch: () => {
      fetchDriverCode();
    }
  };
};