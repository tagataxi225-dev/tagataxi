import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

interface SubscriptionPlan {
  id: string
  name: string
  description: string | null
  price: number
  currency: string
  service_type: string
  rides_included: number | null
  price_per_extra_ride: number | null
  is_trial: boolean
  trial_duration_days: number | null
  is_active: boolean
  duration_type: string
  features: any
  priority_level: number
  created_at: string
  updated_at: string
}

export const useDriverSubscriptionPlans = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Fetch all plans
  const { data: plans = [], isLoading: plansLoading } = useQuery({
    queryKey: ['driver-subscription-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as SubscriptionPlan[]
    }
  })

  // Create plan
  const createPlan = useMutation({
    mutationFn: async (planData: Partial<SubscriptionPlan> & { name: string; price: number }) => {
      // Add required fields with defaults
      const completeData = {
        name: planData.name,
        price: planData.price,
        description: planData.description || null,
        currency: planData.currency || 'CDF',
        service_type: planData.service_type || 'transport',
        duration_type: 'monthly',
        features: {},
        priority_level: 0,
        rides_included: planData.rides_included || 0,
        price_per_extra_ride: planData.price_per_extra_ride || null,
        is_trial: planData.is_trial || false,
        trial_duration_days: planData.trial_duration_days || null,
        is_active: planData.is_active ?? true
      }
      
      const { data, error } = await supabase
        .from('subscription_plans')
        .insert([completeData])
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-subscription-plans'] })
      toast({
        title: "Plan créé",
        description: "Le plan d'abonnement a été créé avec succès"
      })
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer le plan",
        variant: "destructive"
      })
    }
  })

  // Update plan
  const updatePlan = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<SubscriptionPlan> }) => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-subscription-plans'] })
      toast({
        title: "Plan mis à jour",
        description: "Le plan d'abonnement a été modifié avec succès"
      })
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de modifier le plan",
        variant: "destructive"
      })
    }
  })

  // Delete plan
  const deletePlan = useMutation({
    mutationFn: async (id: string) => {
      // Check for active subscriptions first
      const { data: activeSubscriptions } = await supabase
        .from('driver_subscriptions')
        .select('id')
        .eq('plan_id', id)
        .eq('status', 'active')
        .limit(1)

      if (activeSubscriptions && activeSubscriptions.length > 0) {
        throw new Error('Impossible de supprimer un plan avec des abonnements actifs')
      }

      const { error } = await supabase
        .from('subscription_plans')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-subscription-plans'] })
      toast({
        title: "Plan supprimé",
        description: "Le plan d'abonnement a été supprimé avec succès"
      })
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer le plan",
        variant: "destructive"
      })
    }
  })

  // Toggle active status
  const toggleActive = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('subscription_plans')
        .update({ is_active: isActive })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-subscription-plans'] })
      toast({
        title: "Statut modifié",
        description: "Le statut du plan a été mis à jour"
      })
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de modifier le statut",
        variant: "destructive"
      })
    }
  })

  return {
    plans,
    isLoading: plansLoading,
    createPlan: createPlan.mutate,
    isCreating: createPlan.isPending,
    updatePlan: updatePlan.mutate,
    isUpdating: updatePlan.isPending,
    deletePlan: deletePlan.mutate,
    isDeleting: deletePlan.isPending,
    toggleActive: toggleActive.mutate
  }
}
