import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

interface RentalSubscriptionPlan {
  id: string;
  name: string;
  description: string;
  monthly_price: number;
  currency: string;
  features: string[];
  is_active: boolean;
  category_id: string;
  rental_vehicle_categories?: {
    id: string;
    name: string;
  };
}

interface PartnerRentalSubscription {
  id: string;
  partner_id: string;
  plan_id: string;
  vehicle_id: string;
  status: string;
  start_date: string;
  end_date: string;
  last_payment_date?: string;
  next_payment_date?: string;
  auto_renew: boolean;
  rental_subscription_plans?: RentalSubscriptionPlan;
  rental_vehicles?: {
    id: string;
    name: string;
    brand: string;
    model: string;
  };
}

interface RentalSubscriptionPayment {
  id: string;
  subscription_id?: string;
  partner_id: string;
  amount: number;
  currency: string;
  payment_method: string;
  provider?: string;
  phone_number?: string;
  transaction_id?: string;
  status: string;
  payment_date?: string;
  created_at: string;
  metadata?: any;
}

export const useRentalSubscriptions = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  // Fetch subscription plans
  const { data: plans = [], isLoading: plansLoading } = useQuery({
    queryKey: ['rental-subscription-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rental_subscription_plans')
        .select(`
          *,
          rental_vehicle_categories (
            id,
            name
          )
        `)
        .eq('is_active', true)
        .order('monthly_price');

      if (error) throw error;
      return data as RentalSubscriptionPlan[];
    },
  });

  // Fetch partner's active subscriptions
  const { data: subscriptions = [], isLoading: subscriptionsLoading } = useQuery({
    queryKey: ['partner-rental-subscriptions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('partner_rental_subscriptions')
        .select(`
          *,
          rental_subscription_plans (*),
          rental_vehicles (id, name, brand, model)
        `)
        .eq('partner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as PartnerRentalSubscription[];
    },
    enabled: !!user?.id,
  });

  // Fetch payment history
  const { data: payments = [], isLoading: paymentsLoading } = useQuery({
    queryKey: ['rental-subscription-payments', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('rental_subscription_payments')
        .select('*')
        .eq('partner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as RentalSubscriptionPayment[];
    },
    enabled: !!user?.id,
  });

  // Subscribe to a plan
  const subscribeToPlan = useMutation({
    mutationFn: async ({
      planId,
      vehicleId,
      provider,
      phoneNumber,
      autoRenew = false
    }: {
      planId: string;
      vehicleId: string;
      provider: string;
      phoneNumber: string;
      autoRenew?: boolean;
    }) => {
      const { data, error } = await supabase.functions.invoke(
        'rental-subscription-payment',
        {
          body: {
            planId,
            vehicleId,
            provider,
            phoneNumber,
            autoRenew
          }
        }
      );

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Abonnement activé",
          description: data.message,
        });
        
        // Refresh queries
        queryClient.invalidateQueries({ queryKey: ['partner-rental-subscriptions'] });
        queryClient.invalidateQueries({ queryKey: ['rental-subscription-payments'] });
      } else {
        throw new Error(data.error);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors du paiement de l'abonnement",
        variant: "destructive"
      });
    }
  });

  // Cancel subscription
  const cancelSubscription = useMutation({
    mutationFn: async (subscriptionId: string) => {
      const { error } = await supabase
        .from('partner_rental_subscriptions')
        .update({ 
          status: 'cancelled',
          auto_renew: false
        })
        .eq('id', subscriptionId)
        .eq('partner_id', user?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Abonnement annulé",
        description: "L'abonnement a été annulé avec succès",
      });
      queryClient.invalidateQueries({ queryKey: ['partner-rental-subscriptions'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de l'annulation",
        variant: "destructive"
      });
    }
  });

  // Get subscription status for a vehicle
  const getVehicleSubscriptionStatus = (vehicleId: string) => {
    const vehicleSubscription = subscriptions.find(
      sub => sub.vehicle_id === vehicleId && 
             sub.status === 'active' && 
             new Date(sub.end_date) > new Date()
    );

    return {
      isActive: !!vehicleSubscription,
      subscription: vehicleSubscription,
      expiresAt: vehicleSubscription?.end_date,
      daysRemaining: vehicleSubscription 
        ? Math.ceil((new Date(vehicleSubscription.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        : 0
    };
  };

  // Get plan for category
  const getPlanForCategory = (categoryId: string) => {
    return plans.find(plan => plan.category_id === categoryId);
  };

  return {
    plans,
    subscriptions,
    payments,
    loading: plansLoading || subscriptionsLoading || paymentsLoading || loading,
    subscribeToPlan: subscribeToPlan.mutate,
    isSubscribing: subscribeToPlan.isPending,
    cancelSubscription: cancelSubscription.mutate,
    isCancelling: cancelSubscription.isPending,
    getVehicleSubscriptionStatus,
    getPlanForCategory
  };
};