import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AdminFoodProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  main_image_url: string | null;
  preparation_time: number;
  moderation_status: string;
  created_at: string;
  restaurant_id: string;
  restaurant: {
    restaurant_name: string;
    city: string;
    user_id: string;
  };
  [key: string]: any;
}

export const useAdminFoodProducts = () => {
  const { toast } = useToast();
  const [products, setProducts] = useState<AdminFoodProduct[]>([]);
  const [moderating, setModerating] = useState(false);

  const fetchPendingProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('food_products')
        .select(`
          *,
          restaurant:restaurant_profiles!inner(
            restaurant_name,
            city,
            user_id
          )
        `)
        .eq('moderation_status', 'pending')
        .order('created_at', { ascending: true });

      if (error) throw error;

      const formattedData = data?.map(p => ({
        ...p,
        restaurant: Array.isArray(p.restaurant) ? p.restaurant[0] : p.restaurant,
      })) || [];

      setProducts(formattedData);
      return formattedData;
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
      return [];
    }
  };

  const approveProduct = async (productId: string) => {
    try {
      setModerating(true);
      const product = products.find(p => p.id === productId);

      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('food_products')
        .update({
          moderation_status: 'approved',
          moderated_at: new Date().toISOString(),
          moderated_by: user?.id,
        })
        .eq('id', productId);

      if (error) throw error;

      // Notification au restaurant
      if (product) {
        await supabase.from('delivery_notifications').insert({
          user_id: product.restaurant.user_id,
          title: '✅ Produit approuvé',
          message: `Votre plat "${product.name}" est maintenant visible sur Tembea Food`,
          notification_type: 'product_approved',
        });
      }

      toast({
        title: 'Produit approuvé',
        description: 'Le produit est maintenant visible sur la plateforme',
      });

      await fetchPendingProducts();
      return true;
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    } finally {
      setModerating(false);
    }
  };

  const rejectProduct = async (productId: string, reason: string, comment?: string) => {
    try {
      setModerating(true);
      const product = products.find(p => p.id === productId);

      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('food_products')
        .update({
          moderation_status: 'rejected',
          rejection_reason: reason,
          rejection_comment: comment,
          moderated_at: new Date().toISOString(),
          moderated_by: user?.id,
        })
        .eq('id', productId);

      if (error) throw error;

      // Notification au restaurant
      if (product) {
        await supabase.from('delivery_notifications').insert({
          user_id: product.restaurant.user_id,
          title: '❌ Produit rejeté',
          message: `Votre plat "${product.name}" a été rejeté : ${reason}`,
          notification_type: 'product_rejected',
        });
      }

      toast({
        title: 'Produit rejeté',
        description: 'Le restaurant a été notifié',
      });

      await fetchPendingProducts();
      return true;
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    } finally {
      setModerating(false);
    }
  };

  return {
    products,
    moderating,
    fetchPendingProducts,
    approveProduct,
    rejectProduct,
  };
};
