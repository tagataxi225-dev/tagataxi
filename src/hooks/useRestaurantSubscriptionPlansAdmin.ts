import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface RestaurantPlan {
  id: string;
  name: string;
  description: string | null;
  monthly_price: number;
  currency: string;
  max_products: number | null;
  max_photos_per_product: number | null;
  commission_rate: number | null;
  can_feature_products: boolean | null;
  can_run_promotions: boolean | null;
  priority_level: number | null;
  is_popular: boolean | null;
  is_active: boolean | null;
  features: any;
  created_at: string;
}

export type RestaurantPlanForm = Omit<RestaurantPlan, 'id' | 'created_at'>;

const DEFAULT_FORM: RestaurantPlanForm = {
  name: '',
  description: '',
  monthly_price: 0,
  currency: 'CDF',
  max_products: 50,
  max_photos_per_product: 5,
  commission_rate: 10,
  can_feature_products: false,
  can_run_promotions: false,
  priority_level: 0,
  is_popular: false,
  is_active: true,
  features: null,
};

export const useRestaurantSubscriptionPlansAdmin = () => {
  const [plans, setPlans] = useState<RestaurantPlan[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('restaurant_subscription_plans')
        .select('*')
        .order('monthly_price', { ascending: true });
      if (error) throw error;
      setPlans((data || []) as RestaurantPlan[]);
    } catch (e: any) {
      console.error('Error fetching restaurant plans:', e);
      toast.error('Erreur chargement plans restaurant');
    } finally {
      setLoading(false);
    }
  }, []);

  const createPlan = async (form: RestaurantPlanForm) => {
    try {
      const { error } = await supabase.from('restaurant_subscription_plans').insert({
        name: form.name,
        description: form.description,
        monthly_price: form.monthly_price,
        currency: form.currency,
        max_products: form.max_products,
        max_photos_per_product: form.max_photos_per_product,
        commission_rate: form.commission_rate,
        can_feature_products: form.can_feature_products,
        can_run_promotions: form.can_run_promotions,
        priority_level: form.priority_level,
        is_popular: form.is_popular,
        is_active: form.is_active,
        features: form.features,
      });
      if (error) throw error;
      toast.success('Plan restaurant créé');
      await fetchPlans();
      return true;
    } catch (e: any) {
      console.error('Error creating restaurant plan:', e);
      toast.error('Erreur création plan');
      return false;
    }
  };

  const updatePlan = async (id: string, form: Partial<RestaurantPlanForm>) => {
    try {
      const { error } = await supabase
        .from('restaurant_subscription_plans')
        .update({ ...form, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      toast.success('Plan restaurant mis à jour');
      await fetchPlans();
      return true;
    } catch (e: any) {
      console.error('Error updating restaurant plan:', e);
      toast.error('Erreur mise à jour plan');
      return false;
    }
  };

  const deletePlan = async (id: string) => {
    try {
      const { error } = await supabase
        .from('restaurant_subscription_plans')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success('Plan restaurant supprimé');
      await fetchPlans();
      return true;
    } catch (e: any) {
      console.error('Error deleting restaurant plan:', e);
      toast.error('Erreur suppression plan');
      return false;
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    return updatePlan(id, { is_active: isActive });
  };

  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  return { plans, loading, createPlan, updatePlan, deletePlan, toggleActive, refetch: fetchPlans, DEFAULT_FORM };
};
