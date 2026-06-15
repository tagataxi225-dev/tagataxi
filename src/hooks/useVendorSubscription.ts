import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export const useVendorSubscription = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch active subscription
  const { data: subscription, isLoading } = useQuery({
    queryKey: ['vendor-subscription', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('vendor_active_subscriptions' as any)
        .select(`
          id,
          vendor_id,
          plan_id,
          status,
          payment_method,
          start_date,
          end_date,
          auto_renew,
          vendor_subscription_plans (
            id,
            name,
            description,
            price,
            currency,
            max_products,
            commission_rate,
            priority_support,
            analytics_enabled,
            verified_badge,
            features
          )
        `)
        .eq('vendor_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (error) {
        console.error('❌ Subscription query error:', error);
        throw error;
      }
      
      return data;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  // Upgrade/change subscription
  const upgradeMutation = useMutation({
    mutationFn: async (planId: string) => {
      if (!user) throw new Error('Non authentifié');

      const { data, error } = await supabase.functions.invoke('vendor-subscription-manager', {
        body: { 
          plan_id: planId, 
          vendor_id: user.id, 
          payment_method: 'wallet' 
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['vendor-subscription'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-stats'] });
      toast({
        title: "✅ Succès",
        description: data.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de changer d'abonnement",
        variant: "destructive",
      });
    }
  });

  return {
    subscription,
    currentPlan: (subscription as any)?.vendor_subscription_plans,
    isLoading,
    upgradePlan: upgradeMutation.mutate,
    isUpgrading: upgradeMutation.isPending,
  };
};
