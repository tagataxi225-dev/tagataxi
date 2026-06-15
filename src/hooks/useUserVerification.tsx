import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface UserVerification {
  id: string;
  user_id: string;
  phone_verified: boolean;
  identity_verified: boolean;
  verification_level: string;
  verification_documents: any[];
  verified_at: string | null;
  created_at: string;
  updated_at: string;
  identity_document_url?: string | null;
  verification_status?: string | null;
}

export const useUserVerification = () => {
  const { user } = useAuth();
  const [verification, setVerification] = useState<UserVerification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    fetchVerificationStatus();
  }, [user?.id]);

  const fetchVerificationStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: verificationError } = await supabase
        .from('user_verification')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (verificationError) {
        console.error('Verification fetch error:', verificationError);
        // Gestion gracieuse - continuer avec des valeurs par défaut
        setVerification({
          id: crypto.randomUUID(),
          user_id: user.id,
          phone_verified: false,
          identity_verified: false,
          verification_level: 'none',
          verification_documents: [],
          verified_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        return;
      }

      // Si aucun enregistrement de vérification n'existe, en créer un
      if (!data) {
        const { data: newVerification, error: createError } = await supabase
          .from('user_verification')
          .insert({
            user_id: user.id,
            verification_level: 'none'
          })
          .select()
          .single();

        if (createError) {
          console.error('Verification creation error:', createError);
          // Utiliser des valeurs par défaut si la création échoue
          setVerification({
            id: crypto.randomUUID(),
            user_id: user.id,
            phone_verified: false,
            identity_verified: false,
            verification_level: 'none',
            verification_documents: [],
            verified_at: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          return;
        }

        setVerification(newVerification as UserVerification);
      } else {
        setVerification(data as UserVerification);
      }
    } catch (err) {
      console.error('Error fetching verification status:', err);
      setError(err instanceof Error ? err.message : 'Erreur de connexion');
      // Utiliser des valeurs par défaut même en cas d'erreur
      setVerification({
        id: crypto.randomUUID(),
        user_id: user.id,
        phone_verified: false,
        identity_verified: false,
        verification_level: 'none',
        verification_documents: [],
        verified_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  const updateVerificationStatus = async (updates: Partial<UserVerification>) => {
    try {
      const { data, error } = await supabase
        .from('user_verification')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setVerification(data as UserVerification);
      return data;
    } catch (err) {
      console.error('Error updating verification:', err);
      throw err;
    }
  };

  const isVerifiedForSelling = () => {
    if (!verification) return false;
    
    // 1. Si approuvé par admin, autorisé à vendre
    if (verification.verification_status === 'approved') return true;
    
    // 2. Sinon, vérification classique : téléphone + niveau basic/full
    return verification.phone_verified && 
           (verification.verification_level === 'basic' || verification.verification_level === 'full');
  };

  const getVerificationProgress = () => {
    if (!verification) return 0;
    
    let progress = 0;
    if (verification.phone_verified) progress += 50;
    if (verification.identity_verified) progress += 50;
    
    return progress;
  };

  return {
    verification,
    loading,
    error,
    fetchVerificationStatus,
    updateVerificationStatus,
    isVerifiedForSelling,
    getVerificationProgress
  };
};