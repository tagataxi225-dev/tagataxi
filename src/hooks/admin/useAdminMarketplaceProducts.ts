import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useAdminMarketplaceProducts = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: pendingProducts = [], isLoading } = useQuery({
    queryKey: ['admin-marketplace-products-pending'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketplace_products')
        .select(`
          *,
          vendor_profiles(shop_name)
        `)
        .eq('moderation_status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data.map((p: any) => ({
        ...p,
        seller_name: p.vendor_profiles?.shop_name
      }));
    }
  });

  const approveMutation = useMutation({
    mutationFn: async (productId: string) => {
      // 1️⃣ Récupérer le vendor_id avant l'approbation
      const { data: product } = await supabase
        .from('marketplace_products')
        .select('seller_id, title')
        .eq('id', productId)
        .single();

      if (!product) throw new Error('Product not found');

      // 2️⃣ Approuver le produit
      const { error } = await supabase
        .from('marketplace_products')
        .update({ 
          moderation_status: 'approved',
          moderated_at: new Date().toISOString()
        })
        .eq('id', productId);

      if (error) throw error;

      // 3️⃣ Notifier le vendeur via edge function
      try {
        await supabase.functions.invoke('notify-vendor-moderation', {
          body: {
            product_id: productId,
            vendor_id: product.seller_id,
            status: 'approved'
          }
        });
        console.log('✅ Vendor notified of approval');
      } catch (notifError) {
        console.error('⚠️ Vendor notification failed:', notifError);
        // Ne pas bloquer l'approbation
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-marketplace-products-pending'] });
      toast({ title: '✅ Produit approuvé + Vendeur notifié' });
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ productId, reason }: { productId: string; reason: string }) => {
      // 1️⃣ Récupérer le vendor_id avant le rejet
      const { data: product } = await supabase
        .from('marketplace_products')
        .select('seller_id, title')
        .eq('id', productId)
        .single();

      if (!product) throw new Error('Product not found');

      // 2️⃣ Rejeter le produit
      const { error } = await supabase
        .from('marketplace_products')
        .update({ 
          moderation_status: 'rejected',
          rejection_reason: reason,
          moderated_at: new Date().toISOString()
        })
        .eq('id', productId);

      if (error) throw error;

      // 3️⃣ Notifier le vendeur via edge function
      try {
        await supabase.functions.invoke('notify-vendor-moderation', {
          body: {
            product_id: productId,
            vendor_id: product.seller_id,
            status: 'rejected',
            rejection_reason: reason
          }
        });
        console.log('✅ Vendor notified of rejection');
      } catch (notifError) {
        console.error('⚠️ Vendor notification failed:', notifError);
        // Ne pas bloquer le rejet
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-marketplace-products-pending'] });
      toast({ title: '✅ Produit rejeté + Vendeur notifié' });
    }
  });

  return {
    pendingProducts,
    loading: isLoading,
    approveProduct: (id: string) => approveMutation.mutate(id),
    rejectProduct: (id: string, reason: string) => rejectMutation.mutate({ productId: id, reason })
  };
};
