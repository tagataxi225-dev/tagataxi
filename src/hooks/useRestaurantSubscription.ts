import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Json } from '@/integrations/supabase/types';
import { notificationSoundService } from '@/services/notificationSound';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  monthly_price: number;
  currency: string;
  max_products: number | null;
  max_photos_per_product: number;
  commission_rate: number;
  features: Json;
  can_feature_products: boolean;
  can_run_promotions: boolean;
  priority_level: number;
  is_popular: boolean;
}

interface ActiveSubscription {
  id: string;
  restaurant_id: string;
  plan_id: string;
  status: string;
  start_date: string;
  end_date: string;
  auto_renew: boolean;
  plan: SubscriptionPlan;
}

export const useRestaurantSubscription = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [activeSubscription, setActiveSubscription] = useState<ActiveSubscription | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<'idle' | 'checking_balance' | 'processing' | 'success' | 'error'>('idle');

  // Récupérer les plans disponibles
  const fetchPlans = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('restaurant_subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('priority_level', { ascending: true });

      if (error) throw error;
      setPlans(data || []);
    } catch (error: any) {
      console.error('Error fetching plans:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les plans d\'abonnement',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Récupérer l'abonnement actif du restaurant
  const fetchActiveSubscription = async (restaurantId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('restaurant_subscriptions')
        .select(`
          *,
          plan:restaurant_subscription_plans(*)
        `)
        .eq('restaurant_id', restaurantId)
        .eq('status', 'active')
        .gte('end_date', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setActiveSubscription(data || null);
      return data;
    } catch (error: any) {
      console.error('Error fetching active subscription:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Vérifier le solde TAGAPay
  const checkWalletBalance = async (): Promise<{ balance: number; wallet_id: string } | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data, error } = await supabase
        .from('user_wallets')
        .select('id, balance')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return { balance: data.balance, wallet_id: data.id };
    } catch (error: any) {
      console.error('Error checking wallet balance:', error);
      return null;
    }
  };

  // Souscrire à un plan
  const subscribe = async (
    planId: string,
    restaurantId: string,
    paymentMethod: 'kwenda_pay' | 'mobile_money' = 'kwenda_pay',
    autoRenew: boolean = true
  ) => {
    try {
      setLoading(true);
      setSubscriptionStatus('checking_balance');
      console.log('🔄 Starting subscription process...', { planId, restaurantId, paymentMethod });

      // Vérifier le solde si paiement TAGAPay
      if (paymentMethod === 'kwenda_pay') {
        const plan = plans.find(p => p.id === planId);
        if (!plan) throw new Error('Plan non trouvé');

        const wallet = await checkWalletBalance();
        if (!wallet) {
          toast({
            title: 'Erreur',
            description: 'Portefeuille TAGAPay non trouvé',
            variant: 'destructive',
          });
          return { success: false, needsTopUp: true };
        }

        if (wallet.balance < plan.monthly_price) {
          toast({
            title: 'Solde insuffisant',
            description: `Vous avez besoin de ${plan.monthly_price} CDF. Rechargez votre compte.`,
            variant: 'destructive',
          });
          return { success: false, needsTopUp: true, required: plan.monthly_price };
        }
      }

      // Appeler l'Edge Function pour traiter l'abonnement
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: 'Erreur', description: 'Session expirée, reconnectez-vous', variant: 'destructive' });
        return { success: false };
      }

      const { data, error } = await supabase.functions.invoke('restaurant-subscription-manager', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: { plan_id: planId, restaurant_id: restaurantId, payment_method: paymentMethod, auto_renew: autoRenew },
      });

      if (error) throw error;

      if (data.success) {
        // 🔊 SON PAIEMENT RÉUSSI
        await notificationSoundService.playNotificationSound('paymentReceived');
        
        toast({
          title: '🎉 Abonnement activé !',
          description: data.message,
        });
        
        // Rafraîchir l'abonnement actif
        await fetchActiveSubscription(restaurantId);
        
        return { success: true, subscription: data.subscription };
      } else {
        throw new Error(data.error || 'Échec de l\'abonnement');
      }
    } catch (error: any) {
      console.error('Subscription error:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Échec de l\'abonnement',
        variant: 'destructive',
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Annuler le renouvellement automatique
  const cancelAutoRenew = async (subscriptionId: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('restaurant_subscriptions')
        .update({ auto_renew: false })
        .eq('id', subscriptionId);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Renouvellement automatique désactivé',
      });

      return true;
    } catch (error: any) {
      console.error('Error canceling auto-renew:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de désactiver le renouvellement',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Vérifier si l'abonnement expire bientôt
  const checkExpirationWarning = (subscription: ActiveSubscription | null): { 
    isExpiring: boolean; 
    daysRemaining: number;
  } => {
    if (!subscription) return { isExpiring: false, daysRemaining: 0 };

    const endDate = new Date(subscription.end_date);
    const now = new Date();
    const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return {
      isExpiring: daysRemaining <= 7 && daysRemaining > 0,
      daysRemaining,
    };
  };

  return {
    loading,
    plans,
    activeSubscription,
    subscriptionStatus,
    fetchPlans,
    fetchActiveSubscription,
    checkWalletBalance,
    subscribe,
    cancelAutoRenew,
    checkExpirationWarning,
  };
};
