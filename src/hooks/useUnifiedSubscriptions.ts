import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useMemo } from 'react';

interface UnifiedSubscriptionStats {
  totalActiveSubscriptions: number;
  monthlyRevenue: number;
  driverSubscriptions: number;
  rentalSubscriptions: number;
  expiringInWeek: number;
  failedPayments: number;
  currency: string;
}

interface UseUnifiedSubscriptionsReturn {
  driverSubscriptions: any[];
  rentalSubscriptions: any[];
  stats: UnifiedSubscriptionStats | null;
  loading: boolean;
  extendSubscription: (subscriptionId: string, type: 'driver' | 'rental', days: number) => Promise<{ success: boolean; error?: string }>;
  cancelSubscriptionAdmin: (subscriptionId: string, type: 'driver' | 'rental') => Promise<{ success: boolean; error?: string }>;
  renewSubscription: (subscriptionId: string, type: 'driver' | 'rental') => Promise<{ success: boolean; error?: string }>;
}

export const useUnifiedSubscriptions = (): UseUnifiedSubscriptionsReturn => {
  const { toast } = useToast();

  // PHASE 4: Fetch avec RPC optimisée et retry intelligent
  const { data: subscriptionsData, isLoading, error: queryError } = useQuery({
    queryKey: ['admin-unified-subscriptions'],
    queryFn: async () => {
      console.log('🔍 [UNIFIED SUBSCRIPTIONS] Fetching via RPC get_admin_subscriptions_unified()');
      
      const { data, error } = await supabase.rpc('get_admin_subscriptions_unified');

      if (error) {
        console.error('❌ [UNIFIED SUBSCRIPTIONS] RPC Error:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }
      
      console.log('✅ [UNIFIED SUBSCRIPTIONS] JSONB response:', data);
      
      // La RPC retourne maintenant un JSONB avec stats et subscriptions
      return data;
    },
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    staleTime: 30000, // Cache 30s
    gcTime: 300000, // Keep in cache 5min
  });

  // Extract subscriptions from the new JSONB response structure
  const driverSubscriptions = useMemo(() => {
    const data = subscriptionsData as any
    if (!data?.driver_subscriptions) return [];
    return data.driver_subscriptions;
  }, [subscriptionsData]);

  const rentalSubscriptions = useMemo(() => {
    const data = subscriptionsData as any
    if (!data?.rental_subscriptions) return [];
    return data.rental_subscriptions;
  }, [subscriptionsData]);

  // PHASE 4: Utiliser les stats pré-calculées par la RPC
  const stats = useMemo((): UnifiedSubscriptionStats | null => {
    const data = subscriptionsData as any
    if (isLoading || !data?.stats) return null;

    const rpcStats = data.stats as any;
    
    return {
      totalActiveSubscriptions: rpcStats.total_active || 0,
      monthlyRevenue: rpcStats.total_revenue || 0,
      driverSubscriptions: rpcStats.driver_count || 0,
      rentalSubscriptions: rpcStats.rental_count || 0,
      expiringInWeek: rpcStats.total_expiring || 0,
      failedPayments: 0,
      currency: 'CDF'
    };
  }, [subscriptionsData, isLoading]);

  // Admin actions
  // Admin : Prolonger un abonnement
  const extendSubscription = async (
    subscriptionId: string, 
    type: 'driver' | 'rental', 
    days: number
  ) => {
    try {
      const table = type === 'driver' ? 'driver_subscriptions' : 'partner_rental_subscriptions';
      
      // Get current subscription
      const { data: current, error: fetchError } = await supabase
        .from(table)
        .select('end_date')
        .eq('id', subscriptionId)
        .single();

      if (fetchError) throw fetchError;

      // Calculate new end date
      const currentEndDate = new Date(current.end_date);
      const newEndDate = new Date(currentEndDate.getTime() + days * 24 * 60 * 60 * 1000);

      // Update subscription
      const { error } = await supabase
        .from(table)
        .update({ end_date: newEndDate.toISOString() })
        .eq('id', subscriptionId);

      if (error) throw error;

      toast({
        title: "Abonnement prolongé",
        description: `Abonnement prolongé de ${days} jours`,
      });

      return { success: true };
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la prolongation",
        variant: "destructive"
      });
      return { success: false, error: error.message };
    }
  };

  // Admin : Annuler un abonnement
  const cancelSubscriptionAdmin = async (
    subscriptionId: string, 
    type: 'driver' | 'rental'
  ) => {
    try {
      const table = type === 'driver' ? 'driver_subscriptions' : 'partner_rental_subscriptions';
      
      const { error } = await supabase
        .from(table)
        .update({ 
          status: 'cancelled',
          auto_renew: false
        })
        .eq('id', subscriptionId);

      if (error) throw error;

      toast({
        title: "Abonnement annulé",
        description: "L'abonnement a été annulé par l'administrateur",
      });

      return { success: true };
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de l'annulation",
        variant: "destructive"
      });
      return { success: false, error: error.message };
    }
  };

  // Show error toast if query fails
  if (queryError) {
    console.error('❌ Query Error:', queryError);
    toast({
      title: "Erreur de chargement",
      description: `Impossible de charger les abonnements: ${(queryError as any).message || 'Erreur inconnue'}`,
      variant: "destructive"
    });
  }

  // Admin : Renouveler un abonnement
  const renewSubscription = async (
    subscriptionId: string, 
    type: 'driver' | 'rental'
  ) => {
    try {
      const table = type === 'driver' ? 'driver_subscriptions' : 'partner_rental_subscriptions';
      
      // Get current subscription
      const { data: current, error: fetchError } = await supabase
        .from(table)
        .select('*')
        .eq('id', subscriptionId)
        .single();

      if (fetchError) throw fetchError;

      // Calculate new dates
      const now = new Date();
      const planDuration = 30; // Default 30 days
      const newEndDate = new Date(now.getTime() + planDuration * 24 * 60 * 60 * 1000);

      // Create new subscription with correct fields per type
      const newSubscriptionData: any = {
        plan_id: current.plan_id,
        start_date: now.toISOString(),
        end_date: newEndDate.toISOString(),
        status: 'active',
        auto_renew: current.auto_renew,
        payment_method: current.payment_method || 'cash'
      };

      // Add type-specific fields
      if (type === 'driver') {
        newSubscriptionData.driver_id = (current as any).driver_id;
        newSubscriptionData.rides_remaining = (current as any).rides_remaining || 0;
        newSubscriptionData.service_type = (current as any).service_type || 'transport';
      } else {
        newSubscriptionData.partner_id = (current as any).partner_id;
        newSubscriptionData.vehicle_id = (current as any).vehicle_id;
      }

      const { data: newSub, error: createError } = await supabase
        .from(table)
        .insert(newSubscriptionData)
        .select()
        .single();

      if (createError) throw createError;

      // Mark old subscription as expired
      const { error: updateError } = await supabase
        .from(table)
        .update({ status: 'expired' })
        .eq('id', subscriptionId);

      if (updateError) throw updateError;

      toast({
        title: "Abonnement renouvelé",
        description: "Un nouvel abonnement a été créé avec succès",
      });

      return { success: true };
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors du renouvellement",
        variant: "destructive"
      });
      return { success: false, error: error.message };
    }
  };

  return {
    driverSubscriptions,
    rentalSubscriptions,
    stats,
    loading: isLoading,
    extendSubscription,
    cancelSubscriptionAdmin,
    renewSubscription,
  };
};
