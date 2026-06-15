import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface VehicleSubscription {
  id: string;
  vehicle_id: string | null;
  plan_id: string;
  partner_id: string;
  status: 'active' | 'expired' | 'cancelled' | 'pending';
  start_date: string;
  end_date: string;
  plan_name?: string;
  tier_name?: string;
  vehicle_name?: string;
  category_name?: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  vehicle_category: string;
  tier_name: string;
  monthly_price: number;
  currency: string;
  max_vehicles: number;
  max_photos: number;
  priority_support: boolean;
  featured_listing: boolean;
  analytics_access: boolean;
  video_allowed: boolean;
  api_access: boolean;
  custom_branding: boolean;
  visibility_boost: number;
  badge_type: string;
}

export function useRentalVehicleSubscription() {
  const queryClient = useQueryClient();

  // Get current user's partner ID
  const { data: partnerId } = useQuery({
    queryKey: ['current-partner-id'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data } = await supabase
        .from('partenaires')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      return data?.id || null;
    }
  });

  // Get all subscriptions for the partner
  const subscriptionsQuery = useQuery({
    queryKey: ['partner-vehicle-subscriptions', partnerId],
    queryFn: async () => {
      if (!partnerId) return [];
      
      const { data, error } = await (supabase as any)
        .from('partner_rental_subscriptions')
        .select(`
          *,
          rental_subscription_plans(name, tier_name, vehicle_category),
          rental_vehicles(name, brand, model)
        `)
        .eq('partner_id', partnerId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map((sub: any) => ({
        ...sub,
        plan_name: sub.rental_subscription_plans?.name,
        tier_name: sub.rental_subscription_plans?.tier_name,
        category_name: sub.rental_subscription_plans?.vehicle_category,
        vehicle_name: sub.rental_vehicles ? 
          `${sub.rental_vehicles.brand} ${sub.rental_vehicles.model}` : null
      })) as VehicleSubscription[];
    },
    enabled: !!partnerId
  });

  // Get available subscription plans by category
  const plansQuery = useQuery({
    queryKey: ['rental-subscription-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rental_subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('monthly_price', { ascending: true });
      
      if (error) throw error;
      return (data || []) as SubscriptionPlan[];
    }
  });

  // Get plans for a specific category
  const getPlansByCategory = (categoryName: string) => {
    return (plansQuery.data || []).filter(
      plan => plan.vehicle_category === categoryName
    );
  };

  // Check if a vehicle has active subscription
  const checkVehicleSubscription = async (vehicleId: string): Promise<boolean> => {
    const { data, error } = await (supabase as any)
      .from('partner_rental_subscriptions')
      .select('id')
      .eq('vehicle_id', vehicleId)
      .eq('status', 'active')
      .gt('end_date', new Date().toISOString())
      .single();
    
    return !error && !!data;
  };

  // Subscribe a vehicle to a plan
  const subscribeVehicle = useMutation({
    mutationFn: async ({ 
      vehicleId, 
      planId, 
      paymentMethod = 'wallet' 
    }: { 
      vehicleId: string; 
      planId: string;
      paymentMethod?: 'wallet' | 'mobile_money';
    }) => {
      if (!partnerId) throw new Error('Partner not found');

      // Get plan details
      const { data: plan, error: planError } = await supabase
        .from('rental_subscription_plans')
        .select('*')
        .eq('id', planId)
        .single();
      
      if (planError || !plan) throw new Error('Plan not found');

      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);

      const { data, error } = await (supabase as any)
        .from('partner_rental_subscriptions')
        .insert({
          partner_id: partnerId,
          plan_id: planId,
          vehicle_id: vehicleId,
          status: 'active',
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          payment_method: paymentMethod
        })
        .select()
        .single();

      if (error) throw error;

      // Activate the vehicle
      await supabase
        .from('rental_vehicles')
        .update({ is_active: true })
        .eq('id', vehicleId);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-vehicle-subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['partner-rental-vehicles'] });
      toast.success('Abonnement activé avec succès !');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erreur lors de l\'activation');
    }
  });

  // Renew subscription
  const renewSubscription = useMutation({
    mutationFn: async (subscriptionId: string) => {
      const { data: sub, error: subError } = await (supabase as any)
        .from('partner_rental_subscriptions')
        .select('*, rental_subscription_plans(*)')
        .eq('id', subscriptionId)
        .single();
      
      if (subError || !sub) throw new Error('Subscription not found');

      const newEndDate = new Date(sub.end_date);
      newEndDate.setMonth(newEndDate.getMonth() + 1);

      const { error } = await (supabase as any)
        .from('partner_rental_subscriptions')
        .update({
          end_date: newEndDate.toISOString(),
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionId);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-vehicle-subscriptions'] });
      toast.success('Abonnement renouvelé !');
    }
  });

  // Cancel subscription
  const cancelSubscription = useMutation({
    mutationFn: async (subscriptionId: string) => {
      const { error } = await (supabase as any)
        .from('partner_rental_subscriptions')
        .update({ status: 'cancelled' })
        .eq('id', subscriptionId);
      
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-vehicle-subscriptions'] });
      toast.info('Abonnement annulé');
    }
  });

  // Get expiring subscriptions (within 7 days)
  const getExpiringSubscriptions = () => {
    const now = new Date();
    const weekFromNow = new Date();
    weekFromNow.setDate(weekFromNow.getDate() + 7);
    
    return (subscriptionsQuery.data || []).filter(sub => {
      const endDate = new Date(sub.end_date);
      return sub.status === 'active' && endDate <= weekFromNow && endDate > now;
    });
  };

  return {
    subscriptions: subscriptionsQuery.data || [],
    plans: plansQuery.data || [],
    isLoading: subscriptionsQuery.isLoading || plansQuery.isLoading,
    getPlansByCategory,
    checkVehicleSubscription,
    subscribeVehicle,
    renewSubscription,
    cancelSubscription,
    getExpiringSubscriptions,
    expiringCount: getExpiringSubscriptions().length
  };
}
