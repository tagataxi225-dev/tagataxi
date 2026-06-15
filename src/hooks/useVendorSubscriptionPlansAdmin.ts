import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface VendorPlan {
  id: string;
  name: string;
  name_en: string | null;
  description: string | null;
  price: number;
  currency: string;
  duration_days: number;
  duration_type: string;
  max_products: number;
  max_photos_per_product: number | null;
  commission_rate: number | null;
  priority_support: boolean | null;
  analytics_enabled: boolean | null;
  verified_badge: boolean | null;
  display_order: number | null;
  is_popular: boolean | null;
  is_active: boolean;
  features: any;
  created_at: string;
}

export type VendorPlanForm = Omit<VendorPlan, 'id' | 'created_at'>;

const DEFAULT_FORM: VendorPlanForm = {
  name: '',
  name_en: '',
  description: '',
  price: 0,
  currency: 'CDF',
  duration_days: 30,
  duration_type: 'monthly',
  max_products: 20,
  max_photos_per_product: 5,
  commission_rate: 10,
  priority_support: false,
  analytics_enabled: false,
  verified_badge: false,
  display_order: 0,
  is_popular: false,
  is_active: true,
  features: null,
};

export const useVendorSubscriptionPlansAdmin = () => {
  const [plans, setPlans] = useState<VendorPlan[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('vendor_subscription_plans')
        .select('*')
        .order('price', { ascending: true });
      if (error) throw error;
      setPlans((data || []) as VendorPlan[]);
    } catch (e: any) {
      console.error('Error fetching vendor plans:', e);
      toast.error('Erreur chargement plans vendeur');
    } finally {
      setLoading(false);
    }
  }, []);

  const createPlan = async (form: VendorPlanForm) => {
    try {
      const { error } = await supabase.from('vendor_subscription_plans').insert({
        name: form.name,
        name_en: form.name_en,
        description: form.description,
        price: form.price,
        currency: form.currency,
        duration_days: form.duration_days,
        duration_type: form.duration_type,
        max_products: form.max_products,
        max_photos_per_product: form.max_photos_per_product,
        commission_rate: form.commission_rate,
        priority_support: form.priority_support,
        analytics_enabled: form.analytics_enabled,
        verified_badge: form.verified_badge,
        display_order: form.display_order,
        is_popular: form.is_popular,
        is_active: form.is_active,
        features: form.features,
      });
      if (error) throw error;
      toast.success('Plan vendeur créé');
      await fetchPlans();
      return true;
    } catch (e: any) {
      console.error('Error creating vendor plan:', e);
      toast.error('Erreur création plan vendeur');
      return false;
    }
  };

  const updatePlan = async (id: string, form: Partial<VendorPlanForm>) => {
    try {
      const { error } = await supabase
        .from('vendor_subscription_plans')
        .update({ ...form, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      toast.success('Plan vendeur mis à jour');
      await fetchPlans();
      return true;
    } catch (e: any) {
      console.error('Error updating vendor plan:', e);
      toast.error('Erreur mise à jour plan vendeur');
      return false;
    }
  };

  const deletePlan = async (id: string) => {
    try {
      const { error } = await supabase
        .from('vendor_subscription_plans')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success('Plan vendeur supprimé');
      await fetchPlans();
      return true;
    } catch (e: any) {
      console.error('Error deleting vendor plan:', e);
      toast.error('Erreur suppression plan vendeur');
      return false;
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    return updatePlan(id, { is_active: isActive });
  };

  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  return { plans, loading, createPlan, updatePlan, deletePlan, toggleActive, refetch: fetchPlans, DEFAULT_FORM };
};
