import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PricingConfig {
  id: string;
  service_type: string;
  base_price: number;
  price_per_km: number;
  minimum_fare: number;
  maximum_fare?: number | null;
  city: string;
  surge_multiplier: number;
  currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
}

interface PriceCalculation {
  base_price: number;
  price_per_km: number;
  distance_km: number;
  surge_multiplier: number;
  calculated_price: number;
  minimum_fare: number;
  maximum_fare?: number;
  service_type: string;
  city: string;
  currency: string;
}

export const useDynamicDeliveryPricing = () => {
  const [loading, setLoading] = useState(false);
  const [pricingConfigs, setPricingConfigs] = useState<PricingConfig[]>([]);

  // Load pricing configurations
  const loadPricingConfigs = async (city = 'Kinshasa') => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('delivery_pricing_config')
        .select('*')
        .eq('city', city)
        .eq('is_active', true)
        .order('service_type');

      if (error) throw error;
      setPricingConfigs(data || []);
    } catch (error: any) {
      console.error('Error loading pricing configs:', error);
      toast.error('Erreur lors du chargement des tarifs');
    } finally {
      setLoading(false);
    }
  };

  // Calculate dynamic price
  const calculatePrice = async (
    serviceType: 'flash' | 'flex' | 'maxicharge',
    distanceKm: number,
    city = 'Kinshasa'
  ): Promise<PriceCalculation | null> => {
    try {
      const { data, error } = await supabase.rpc('calculate_delivery_price', {
        delivery_type_param: serviceType,
        distance_km_param: distanceKm,
        city_param: city
      });

      if (error) throw error;
      return data as unknown as PriceCalculation;
    } catch (error: any) {
      console.error('Error calculating price:', error);
      toast.error('Erreur lors du calcul du prix');
      return null;
    }
  };

  // Update pricing configuration (admin only)
  const updatePricingConfig = async (
    id: string,
    updates: Partial<PricingConfig>
  ): Promise<boolean> => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('delivery_pricing_config')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Configuration mise à jour');
      return true;
    } catch (error: any) {
      console.error('Error updating pricing config:', error);
      toast.error('Erreur lors de la mise à jour');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Create new pricing configuration (admin only)
  const createPricingConfig = async (config: Omit<PricingConfig, 'id'>): Promise<boolean> => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('delivery_pricing_config')
        .insert(config);

      if (error) throw error;
      
      toast.success('Configuration créée');
      return true;
    } catch (error: any) {
      console.error('Error creating pricing config:', error);
      toast.error('Erreur lors de la création');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Get price for a specific service
  const getServicePrice = (serviceType: 'flash' | 'flex' | 'maxicharge'): PricingConfig | null => {
    return pricingConfigs.find(config => config.service_type === serviceType) || null;
  };

  // Format price for display
  const formatPrice = (price: number, currency = 'CDF'): string => {
    return new Intl.NumberFormat('fr-CD', {
      style: 'currency',
      currency: currency === 'CDF' ? 'CDF' : 'USD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  useEffect(() => {
    loadPricingConfigs();
  }, []);

  return {
    loading,
    pricingConfigs,
    loadPricingConfigs,
    calculatePrice,
    updatePricingConfig,
    createPricingConfig,
    getServicePrice,
    formatPrice
  };
};