import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionAccess {
  canAccessPOS: boolean;
  isPro: boolean;
  isPremium: boolean;
  isInTrial: boolean;
  trialDaysRemaining: number;
  isLoading: boolean;
  subscription: any | null;
  planName: string | null;
}

const TRIAL_DAYS = 15;

export const useSubscriptionAccess = (restaurantId: string | null) => {
  const [access, setAccess] = useState<SubscriptionAccess>({
    canAccessPOS: false,
    isPro: false,
    isPremium: false,
    isInTrial: false,
    trialDaysRemaining: 0,
    isLoading: true,
    subscription: null,
    planName: null,
  });

  useEffect(() => {
    if (!restaurantId) {
      setAccess(prev => ({ ...prev, isLoading: false }));
      return;
    }

    checkSubscription();
  }, [restaurantId]);

  const checkSubscription = async () => {
    try {
      // Get restaurant creation date for trial calculation
      const { data: restaurant } = await supabase
        .from('restaurant_profiles')
        .select('created_at')
        .eq('id', restaurantId)
        .single();

      // Calculate trial status
      let isInTrial = false;
      let trialDaysRemaining = 0;
      
      if (restaurant?.created_at) {
        const createdAt = new Date(restaurant.created_at);
        const now = new Date();
        const daysSinceCreation = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
        isInTrial = daysSinceCreation <= TRIAL_DAYS;
        trialDaysRemaining = Math.max(0, TRIAL_DAYS - daysSinceCreation);
      }

      // Get active subscription with plan details
      const { data: subscription, error } = await supabase
        .from('restaurant_subscriptions')
        .select(`
          *,
          plan:restaurant_subscription_plans(*)
        `)
        .eq('restaurant_id', restaurantId)
        .eq('status', 'active')
        .maybeSingle();

      if (error) throw error;

      if (subscription?.plan) {
        const priorityLevel = subscription.plan.priority_level || 0;
        const isPro = priorityLevel >= 1;
        const isPremium = priorityLevel >= 2;

        setAccess({
          canAccessPOS: isPro || isPremium || isInTrial,
          isPro,
          isPremium,
          isInTrial: !isPro && !isPremium && isInTrial,
          trialDaysRemaining: isPro || isPremium ? 0 : trialDaysRemaining,
          isLoading: false,
          subscription,
          planName: subscription.plan.name,
        });
      } else {
        // No subscription - check trial
        setAccess({
          canAccessPOS: isInTrial,
          isPro: false,
          isPremium: false,
          isInTrial,
          trialDaysRemaining,
          isLoading: false,
          subscription: null,
          planName: null,
        });
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
      setAccess(prev => ({ ...prev, isLoading: false }));
    }
  };

  return access;
};
