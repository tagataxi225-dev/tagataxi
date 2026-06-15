import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const MAX_PARTNER_COMMISSION_RATE = 3.0;

/**
 * Hook pour mettre à jour le taux de commission d'un chauffeur par un partenaire
 * Le taux maximum autorisé est de 3%
 */
export const useUpdateDriverCommissionRate = () => {
  const { user } = useAuth();
  const [updating, setUpdating] = useState(false);

  const updateCommissionRate = async (
    assignmentId: string,
    driverId: string,
    newRate: number
  ): Promise<boolean> => {
    if (!user) {
      toast.error('Vous devez être connecté');
      return false;
    }

    // Valider le taux
    if (newRate < 0 || newRate > MAX_PARTNER_COMMISSION_RATE) {
      toast.error(`Le taux doit être entre 0% et ${MAX_PARTNER_COMMISSION_RATE}%`);
      return false;
    }

    try {
      setUpdating(true);

      // Vérifier que l'assignment appartient bien à ce partenaire
      const { data: assignment, error: checkError } = await supabase
        .from('partner_drivers')
        .select('id, partner_id')
        .eq('id', assignmentId)
        .eq('partner_id', user.id)
        .single();

      if (checkError || !assignment) {
        toast.error('Chauffeur non trouvé dans votre flotte');
        return false;
      }

      // Mettre à jour le taux
      const { error: updateError } = await supabase
        .from('partner_drivers')
        .update({ commission_rate: newRate })
        .eq('id', assignmentId)
        .eq('partner_id', user.id);

      if (updateError) {
        console.error('Error updating commission rate:', updateError);
        toast.error('Erreur lors de la mise à jour du taux');
        return false;
      }

      toast.success(`Taux de commission mis à jour à ${newRate}%`);
      return true;
    } catch (error) {
      console.error('Error updating commission rate:', error);
      toast.error('Erreur inattendue');
      return false;
    } finally {
      setUpdating(false);
    }
  };

  return {
    updateCommissionRate,
    updating,
    maxRate: MAX_PARTNER_COMMISSION_RATE
  };
};
