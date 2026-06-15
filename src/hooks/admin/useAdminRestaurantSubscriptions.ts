import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface RestaurantSubscription {
  id: string;
  restaurant_id: string;
  plan_id: string;
  status: string;
  start_date: string;
  end_date: string;
  payment_method: string;
  amount: number;
  currency: string;
  restaurant_name?: string;
  plan_name?: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  monthly_price: number;
  currency: string;
  max_products: number | null;
  max_photos_per_product: number | null;
  commission_rate: number | null;
  features: any;
  can_feature_products: boolean;
  can_run_promotions: boolean;
  priority_level: number | null;
  is_popular: boolean;
  is_active: boolean;
}

export const useAdminRestaurantSubscriptions = () => {
  const [subscriptions, setSubscriptions] = useState<RestaurantSubscription[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);

      // Use LEFT JOIN (no !inner) to avoid errors when relations don't exist
      const { data: subs, error } = await supabase
        .from('restaurant_subscriptions')
        .select(`
          *,
          restaurant_profiles(restaurant_name),
          restaurant_subscription_plans(name, monthly_price, currency)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formatted = (subs || []).map((sub: any) => ({
        id: sub.id,
        restaurant_id: sub.restaurant_id,
        plan_id: sub.plan_id,
        status: sub.status,
        start_date: sub.start_date,
        end_date: sub.end_date,
        payment_method: sub.payment_method || 'kwenda_pay',
        // Get amount and currency from the plan
        amount: sub.restaurant_subscription_plans?.monthly_price || 0,
        currency: sub.restaurant_subscription_plans?.currency || 'CDF',
        restaurant_name: sub.restaurant_profiles?.restaurant_name,
        plan_name: sub.restaurant_subscription_plans?.name,
      }));

      setSubscriptions(formatted);
    } catch (error: any) {
      console.error('Error fetching subscriptions:', error);
      toast.error('Erreur lors du chargement des abonnements');
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('restaurant_subscription_plans')
        .select('*')
        .order('monthly_price', { ascending: true });

      if (error) throw error;
      setPlans((data || []) as SubscriptionPlan[]);
    } catch (error: any) {
      console.error('Error fetching plans:', error);
      toast.error('Erreur lors du chargement des plans');
    }
  };

  const extendSubscription = async (subscriptionId: string, days: number) => {
    try {
      const subscription = subscriptions.find(s => s.id === subscriptionId);
      if (!subscription) {
        toast.error('Abonnement introuvable');
        return false;
      }

      const currentEndDate = new Date(subscription.end_date);
      const newEndDate = new Date(currentEndDate);
      newEndDate.setDate(newEndDate.getDate() + days);

      const { error } = await supabase
        .from('restaurant_subscriptions')
        .update({ 
          end_date: newEndDate.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionId);

      if (error) throw error;

      toast.success(`Abonnement prolongé de ${days} jours`);
      await fetchSubscriptions();
      return true;
    } catch (error: any) {
      console.error('Error extending subscription:', error);
      toast.error('Erreur lors de la prolongation');
      return false;
    }
  };

  const cancelSubscription = async (subscriptionId: string, reason: string) => {
    try {
      const { error } = await supabase
        .from('restaurant_subscriptions')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionId);

      if (error) throw error;

      // Log cancellation
      await supabase.from('activity_logs').insert({
        user_id: (await supabase.auth.getUser()).data.user?.id,
        activity_type: 'subscription_cancelled',
        description: `Abonnement restaurant annulé: ${reason}`,
        metadata: { subscription_id: subscriptionId, reason }
      });

      toast.success('Abonnement annulé avec succès');
      await fetchSubscriptions();
      return true;
    } catch (error: any) {
      console.error('Error cancelling subscription:', error);
      toast.error('Erreur lors de l\'annulation');
      return false;
    }
  };

  const updatePlanPricing = async (planId: string, newPrice: number) => {
    try {
      const { error } = await supabase
        .from('restaurant_subscription_plans')
        .update({ 
          monthly_price: newPrice,
          updated_at: new Date().toISOString()
        })
        .eq('id', planId);

      if (error) throw error;

      toast.success('Tarif du plan mis à jour');
      await fetchPlans();
      return true;
    } catch (error: any) {
      console.error('Error updating plan pricing:', error);
      toast.error('Erreur lors de la mise à jour du tarif');
      return false;
    }
  };

  useEffect(() => {
    fetchSubscriptions();
    fetchPlans();
  }, []);

  return {
    subscriptions,
    plans,
    loading,
    extendSubscription,
    cancelSubscription,
    updatePlanPricing,
    refetch: fetchSubscriptions,
  };
};
