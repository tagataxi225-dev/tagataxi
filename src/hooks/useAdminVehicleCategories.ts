import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface VehicleCategory {
  id: string;
  name: string;
  description: string;
  icon?: string;
  icon_name?: string;
  color_class?: string;
  base_price?: number;
  recommended_price_range?: {
    min: number;
    max: number;
  } | any;
  is_active: boolean;
  sort_order?: number;
  priority?: number;
  city?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCategoryData {
  name: string;
  description: string;
  icon_name: string;
  color_class: string;
  base_price: number;
  recommended_price_range: {
    min: number;
    max: number;
  };
  is_active: boolean;
  sort_order: number;
}

export const useAdminVehicleCategories = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Récupérer toutes les catégories
  const categoriesQuery = useQuery({
    queryKey: ['admin-vehicle-categories'],
    queryFn: async (): Promise<VehicleCategory[]> => {
      const { data, error } = await supabase
        .from('rental_vehicle_categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  // Créer une nouvelle catégorie
  const createCategory = useMutation({
    mutationFn: async (categoryData: CreateCategoryData) => {
      const { data, error } = await supabase
        .from('rental_vehicle_categories')
        .insert([categoryData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Catégorie créée',
        description: 'La nouvelle catégorie a été créée avec succès.',
      });
      queryClient.invalidateQueries({ queryKey: ['admin-vehicle-categories'] });
    },
    onError: (error) => {
      console.error('Create category error:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la création de la catégorie.',
        variant: 'destructive',
      });
    }
  });

  // Mettre à jour une catégorie
  const updateCategory = useMutation({
    mutationFn: async ({ id, ...categoryData }: Partial<VehicleCategory> & { id: string }) => {
      const { data, error } = await supabase
        .from('rental_vehicle_categories')
        .update(categoryData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Catégorie modifiée',
        description: 'La catégorie a été modifiée avec succès.',
      });
      queryClient.invalidateQueries({ queryKey: ['admin-vehicle-categories'] });
    },
    onError: (error) => {
      console.error('Update category error:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la modification de la catégorie.',
        variant: 'destructive',
      });
    }
  });

  // Supprimer une catégorie
  const deleteCategory = useMutation({
    mutationFn: async (categoryId: string) => {
      // Vérifier s'il y a des véhicules associés
      const { count: vehiclesCount } = await supabase
        .from('rental_vehicles')
        .select('id', { count: 'exact', head: true })
        .eq('category_id', categoryId);

      if (vehiclesCount && vehiclesCount > 0) {
        throw new Error(`Impossible de supprimer la catégorie. ${vehiclesCount} véhicule(s) associé(s).`);
      }

      const { error } = await supabase
        .from('rental_vehicle_categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Catégorie supprimée',
        description: 'La catégorie a été supprimée avec succès.',
      });
      queryClient.invalidateQueries({ queryKey: ['admin-vehicle-categories'] });
    },
    onError: (error) => {
      console.error('Delete category error:', error);
      toast({
        title: 'Erreur de suppression',
        description: error.message || 'Une erreur est survenue lors de la suppression.',
        variant: 'destructive',
      });
    }
  });

  // Basculer le statut actif/inactif
  const toggleCategoryStatus = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data, error } = await supabase
        .from('rental_vehicle_categories')
        .update({ is_active })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: 'Statut modifié',
        description: `La catégorie a été ${data.is_active ? 'activée' : 'désactivée'}.`,
      });
      queryClient.invalidateQueries({ queryKey: ['admin-vehicle-categories'] });
    },
    onError: (error) => {
      console.error('Toggle category status error:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors du changement de statut.',
        variant: 'destructive',
      });
    }
  });

  return {
    categories: categoriesQuery.data || [],
    isLoading: categoriesQuery.isLoading,
    error: categoriesQuery.error,
    createCategory,
    updateCategory,
    deleteCategory,
    toggleCategoryStatus,
    isCreating: createCategory.isPending,
    isUpdating: updateCategory.isPending,
    isDeleting: deleteCategory.isPending,
    isToggling: toggleCategoryStatus.isPending,
  };
};