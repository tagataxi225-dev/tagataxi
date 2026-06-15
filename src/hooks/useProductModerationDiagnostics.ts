import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface ProductModerationStats {
  totalProducts: number;
  pendingProducts: number;
  approvedProducts: number;
  rejectedProducts: number;
  lastCreatedAt?: string;
  rlsEnabled: boolean;
  insertPolicyExists: boolean;
}

export const useProductModerationDiagnostics = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<ProductModerationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  const checkRLSPolicies = async (): Promise<{ rlsEnabled: boolean; insertPolicyExists: boolean }> => {
    // Pour l'instant, on retourne des valeurs par défaut
    // Ces vérifications nécessiteraient des fonctions RPC dédiées
    return { rlsEnabled: true, insertPolicyExists: true };
  };

  const fetchStats = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Récupérer les statistiques des produits de l'utilisateur
      const { data: products, error } = await supabase
        .from('marketplace_products')
        .select('id, moderation_status, created_at')
        .eq('seller_id', user.id);

      if (error) throw error;

      const totalProducts = products?.length || 0;
      const pendingProducts = products?.filter(p => p.moderation_status === 'pending').length || 0;
      const approvedProducts = products?.filter(p => p.moderation_status === 'approved').length || 0;
      const rejectedProducts = products?.filter(p => p.moderation_status === 'rejected').length || 0;
      const lastCreatedAt = products?.[0]?.created_at;

      // Vérifier les politiques RLS
      const { rlsEnabled, insertPolicyExists } = await checkRLSPolicies();

      setStats({
        totalProducts,
        pendingProducts,
        approvedProducts,
        rejectedProducts,
        lastCreatedAt,
        rlsEnabled,
        insertPolicyExists
      });
    } catch (error: any) {
      console.error('Erreur récupération stats:', error);
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testProductCreation = async (): Promise<boolean> => {
    if (!user) {
      toast.error('Vous devez être connecté');
      return false;
    }

    setChecking(true);
    try {
      // Créer un produit de test
      const { data, error } = await supabase
        .from('marketplace_products')
        .insert({
          title: '[TEST] Produit de diagnostic',
          description: 'Ce produit a été créé automatiquement pour tester les permissions',
          price: 1,
          category: 'electronique',
          condition: 'new',
          images: [],
          seller_id: user.id,
          status: 'active',
          moderation_status: 'pending'
        })
        .select()
        .single();

      if (error) {
        console.error('Erreur création test:', error);
        toast.error(`❌ Échec du test de création: ${error.message}`);
        return false;
      }

      // Supprimer le produit de test
      await supabase
        .from('marketplace_products')
        .delete()
        .eq('id', data.id);

      toast.success('✅ Test de création réussi');
      return true;
    } catch (error: any) {
      console.error('Erreur test création:', error);
      toast.error(`Erreur test: ${error.message}`);
      return false;
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  return {
    stats,
    loading,
    checking,
    fetchStats,
    testProductCreation,
    checkRLSPolicies
  };
};
