import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface RentalSubscriptionPlan {
  id: string;
  name: string;
  description?: string;
  monthly_price: number;
  currency: string;
  category_id?: string;
  vehicle_category?: string;
  tier_name?: string;
  max_vehicles?: number;
  max_photos?: number;
  video_allowed?: boolean;
  support_level?: string;
  support_response_time?: string;
  api_access?: boolean;
  custom_branding?: boolean;
  visibility_boost?: number;
  featured_listing?: boolean;
  analytics_level?: string;
  badge_type?: string;
  priority_level?: number;
  features: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useRentalSubscriptionPlans = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all rental subscription plans (admin view)
  const { data: plans = [], isLoading: plansLoading } = useQuery({
    queryKey: ['admin-rental-subscription-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rental_subscription_plans')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });

  // Create new plan
  const createPlan = useMutation({
    mutationFn: async (planData: any) => {
      const { data, error } = await supabase
        .from('rental_subscription_plans')
        .insert({
          name: planData.name,
          description: planData.description,
          monthly_price: planData.monthly_price,
          currency: planData.currency,
          category_id: planData.category_id || '',
          features: planData.features,
          is_active: planData.is_active
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-rental-subscription-plans'] });
      toast({
        title: "Plan créé",
        description: "Le plan d'abonnement a été créé avec succès",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de créer le plan d'abonnement",
        variant: "destructive",
      });
    }
  });

  // Update plan
  const updatePlan = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { data, error } = await supabase
        .from('rental_subscription_plans')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-rental-subscription-plans'] });
      toast({
        title: "Plan modifié",
        description: "Le plan d'abonnement a été modifié avec succès",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de modifier le plan d'abonnement",
        variant: "destructive",
      });
    }
  });

  // Delete plan
  const deletePlan = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('rental_subscription_plans')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-rental-subscription-plans'] });
      toast({
        title: "Plan supprimé",
        description: "Le plan d'abonnement a été supprimé avec succès",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le plan d'abonnement",
        variant: "destructive",
      });
    }
  });

  return {
    plans,
    isLoading: plansLoading,
    createPlan: createPlan.mutate,
    updatePlan: updatePlan.mutate,
    deletePlan: deletePlan.mutate,
    isCreating: createPlan.isPending,
    isUpdating: updatePlan.isPending,
    isDeleting: deletePlan.isPending
  };
};