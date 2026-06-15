import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useProductView = () => {
  const { toast } = useToast();

  const trackView = async (productId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('User not authenticated, skipping view tracking');
        return;
      }

      const { error } = await supabase
        .from('product_views_log')
        .insert({ 
          product_id: productId,
          user_id: user.id,
          viewed_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error tracking product view:', error);
        return;
      }

      console.log('Product view tracked successfully:', productId);
    } catch (error) {
      console.error('Error in trackView:', error);
    }
  };

  return { trackView };
};
