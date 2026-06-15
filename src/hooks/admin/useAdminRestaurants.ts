import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface RestaurantFilters {
  status?: 'pending' | 'approved' | 'rejected';
  city?: string;
  search?: string;
}

export interface AdminRestaurant {
  id: string;
  restaurant_name: string;
  cuisine_type?: string;
  city: string;
  verification_status: string;
  is_active: boolean;
  logo_url: string | null;
  rating_average: number;
  created_at: string;
  user_id: string;
  owner_name?: string;
  owner_phone?: string;
  owner_email?: string;
  active_subscription?: any;
  revenue_30d?: number;
  [key: string]: any;
}

export const useAdminRestaurants = () => {
  const { toast } = useToast();
  const [restaurants, setRestaurants] = useState<AdminRestaurant[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRestaurants = async (filters?: RestaurantFilters) => {
    try {
      setLoading(true);
      // Query restaurant_profiles directly - no join with clients table
      let query = supabase
        .from('restaurant_profiles')
        .select('*');

      if (filters?.status) {
        query = query.eq('verification_status', filters.status);
      }
      if (filters?.city) {
        query = query.eq('city', filters.city);
      }
      if (filters?.search) {
        query = query.ilike('restaurant_name', `%${filters.search}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;

      // Use data directly from restaurant_profiles
      const formattedData = data?.map(r => ({
        ...r,
        owner_name: r.business_name || r.restaurant_name,
        owner_phone: r.phone_number,
        owner_email: r.email,
      })) || [];

      setRestaurants(formattedData);
      return formattedData;
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  const approveRestaurant = async (restaurantId: string) => {
    try {
      const restaurant = restaurants.find(r => r.id === restaurantId);
      if (!restaurant) throw new Error('Restaurant not found');

      const { error } = await supabase
        .from('restaurant_profiles')
        .update({
          verification_status: 'approved',
          is_active: true,
          verified_at: new Date().toISOString(),
        })
        .eq('id', restaurantId);

      if (error) throw error;

      // Notification au propriétaire
      await supabase.from('delivery_notifications').insert({
        user_id: restaurant.user_id,
        title: '🎉 Restaurant approuvé !',
        message: 'Votre restaurant est maintenant actif sur Tembea Food',
        notification_type: 'restaurant_approved',
      });

      toast({
        title: 'Restaurant approuvé',
        description: 'Le restaurant a été approuvé avec succès',
      });

      await fetchRestaurants();
      return true;
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  };

  const suspendRestaurant = async (restaurantId: string, reason: string) => {
    try {
      const { error } = await supabase
        .from('restaurant_profiles')
        .update({
          is_active: false,
          suspension_reason: reason,
          suspended_at: new Date().toISOString(),
        })
        .eq('id', restaurantId);

      if (error) throw error;

      toast({
        title: 'Restaurant suspendu',
        description: 'Le restaurant a été suspendu',
      });

      await fetchRestaurants();
      return true;
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    restaurants,
    loading,
    fetchRestaurants,
    approveRestaurant,
    suspendRestaurant,
  };
};
