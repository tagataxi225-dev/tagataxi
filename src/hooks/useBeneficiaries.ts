import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './useAuth';

export interface BeneficiaryData {
  id?: string;
  name: string;
  phone: string;
  relationship?: string;
  is_favorite?: boolean;
  usage_count?: number;
  created_at?: string;
}

export interface NewBeneficiaryData {
  name: string;
  phone: string;
  relationship: string;
}

export const useBeneficiaries = () => {
  const { user } = useAuth();
  const [beneficiaries, setBeneficiaries] = useState<BeneficiaryData[]>([]);
  const [loading, setLoading] = useState(false);

  // Récupérer les bénéficiaires de l'utilisateur
  const fetchBeneficiaries = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('booking_beneficiaries')
        .select('*')
        .eq('user_id', user.id)
        .order('is_favorite', { ascending: false })
        .order('usage_count', { ascending: false });
      
      if (error) throw error;
      
      setBeneficiaries(data || []);
    } catch (error) {
      console.error('Erreur chargement bénéficiaires:', error);
    } finally {
      setLoading(false);
    }
  };

  // Ajouter un nouveau bénéficiaire
  const addBeneficiary = async (data: NewBeneficiaryData): Promise<BeneficiaryData | null> => {
    if (!user) {
      toast.error('Vous devez être connecté');
      return null;
    }

    try {
      const { data: newBen, error } = await supabase
        .from('booking_beneficiaries')
        .insert({
          user_id: user.id,
          name: data.name,
          phone: data.phone,
          relationship: data.relationship
        })
        .select()
        .single();
      
      if (error) {
        // Vérifier si c'est une erreur de duplication
        if (error.code === '23505') {
          toast.error('Ce contact existe déjà');
        } else {
          throw error;
        }
        return null;
      }

      toast.success(`${data.name} ajouté aux bénéficiaires`);
      await fetchBeneficiaries();
      return newBen;
    } catch (error) {
      console.error('Erreur ajout bénéficiaire:', error);
      toast.error('Erreur lors de l\'ajout');
      return null;
    }
  };

  // Incrémenter le compteur d'utilisation
  const incrementUsage = async (id: string) => {
    if (!user) return;

    try {
      await supabase.rpc('increment_beneficiary_usage', { beneficiary_id: id });
    } catch (error) {
      console.error('Erreur incrémentation usage:', error);
    }
  };

  // Charger au montage
  useEffect(() => {
    if (user) {
      fetchBeneficiaries();
    }
  }, [user]);

  return {
    beneficiaries,
    loading,
    fetchBeneficiaries,
    addBeneficiary,
    incrementUsage
  };
};
