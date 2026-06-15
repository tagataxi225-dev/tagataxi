import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { PartnerPrize, PartnerPrizeClaim } from '@/types/partner-prize';

export const usePartnerPrizes = () => {
  const queryClient = useQueryClient();

  // Liste des prix partenaires
  const { data: prizes = [], isLoading, refetch } = useQuery({
    queryKey: ['partner-prizes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partner_prizes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as PartnerPrize[];
    }
  });

  // Prix actifs uniquement
  const activePrizes = prizes.filter(p => p.is_active);

  // Ajouter un prix
  const addPrize = useMutation({
    mutationFn: async (prize: Omit<PartnerPrize, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('partner_prizes')
        .insert(prize)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-prizes'] });
      toast.success('Prix partenaire ajouté');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erreur lors de l\'ajout');
    }
  });

  // Mettre à jour un prix
  const updatePrize = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PartnerPrize> & { id: string }) => {
      const { data, error } = await supabase
        .from('partner_prizes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-prizes'] });
      toast.success('Prix mis à jour');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erreur lors de la mise à jour');
    }
  });

  // Supprimer un prix (soft delete via is_active)
  const deletePrize = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('partner_prizes')
        .update({ is_active: false })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-prizes'] });
      toast.success('Prix désactivé');
    }
  });

  // Mettre à jour le stock
  const updateStock = useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      const { error } = await supabase
        .from('partner_prizes')
        .update({ stock_quantity: quantity })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-prizes'] });
    }
  });

  return {
    prizes,
    activePrizes,
    isLoading,
    refetch,
    addPrize,
    updatePrize,
    deletePrize,
    updateStock
  };
};

// Hook pour les réclamations admin
export const usePartnerPrizeClaims = () => {
  const queryClient = useQueryClient();

  const { data: claims = [], isLoading } = useQuery({
    queryKey: ['partner-prize-claims'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partner_prize_claims')
        .select(`
          *,
          partner_prize:partner_prizes(*)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as PartnerPrizeClaim[];
    }
  });

  // Mettre à jour le statut d'une réclamation
  const updateClaimStatus = useMutation({
    mutationFn: async ({ 
      id, 
      status, 
      ...updates 
    }: { 
      id: string; 
      status: PartnerPrizeClaim['status']; 
      tracking_number?: string;
      admin_notes?: string;
    }) => {
      const updateData: any = { status, ...updates };
      
      // Ajouter les timestamps appropriés
      if (status === 'processing') updateData.processed_at = new Date().toISOString();
      if (status === 'shipped') updateData.shipped_at = new Date().toISOString();
      if (status === 'delivered') updateData.delivered_at = new Date().toISOString();

      const { error } = await supabase
        .from('partner_prize_claims')
        .update(updateData)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-prize-claims'] });
      toast.success('Réclamation mise à jour');
    }
  });

  // Statistiques
  const stats = {
    pending: claims.filter(c => c.status === 'pending').length,
    processing: claims.filter(c => c.status === 'processing').length,
    shipped: claims.filter(c => c.status === 'shipped').length,
    delivered: claims.filter(c => c.status === 'delivered').length,
    total: claims.length
  };

  return {
    claims,
    isLoading,
    updateClaimStatus,
    stats
  };
};
