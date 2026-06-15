import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TopVendor {
  user_id: string;
  shop_name: string;
  shop_logo_url?: string;
  shop_banner_url?: string;
  shop_description?: string;
  shop_type?: string;
  average_rating: number;
  total_sales: number;
  product_count: number;
  videoUrl?: string;
}

export const useTopVendors = (limit: number = 10, city?: string) => {
  const [vendors, setVendors] = useState<TopVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    loadTopVendors();
  }, [limit, city]);

  const loadTopVendors = async () => {
    try {
      setLoading(true);
      
      // ✅ Filtrer par ville (comme Food) avec fallback
      let query = supabase
        .from('vendor_profiles')
        .select('user_id, shop_name, shop_logo_url, shop_banner_url, shop_description, shop_type, average_rating, total_sales, city, video_url')
        .order('average_rating', { ascending: false })
        .order('total_sales', { ascending: false });

      if (city) {
        query = query.eq('city', city);
      }

      const { data: vendorProfiles, error: vendorError } = await query;
      if (vendorError) throw vendorError;

      // ✅ Fallback: si 0 résultat dans la ville, relancer sans filtre
      let profiles = vendorProfiles || [];
      if (profiles.length === 0 && city) {
        console.log(`[useTopVendors] 0 vendeurs à ${city}, fallback toutes villes`);
        const { data: allProfiles, error: allError } = await supabase
          .from('vendor_profiles')
          .select('user_id, shop_name, shop_logo_url, shop_banner_url, shop_description, shop_type, average_rating, total_sales, city, video_url')
          .order('average_rating', { ascending: false })
          .order('total_sales', { ascending: false });
        if (allError) throw allError;
        profiles = allProfiles || [];
      }

      // ✅ Compter les produits pour chaque vendeur
      const vendorsWithProductCount = await Promise.all(
        profiles.map(async (vendor) => {
          const { count, error: countError } = await supabase
            .from('marketplace_products')
            .select('id', { count: 'exact', head: true })
            .eq('seller_id', vendor.user_id)
            .eq('moderation_status', 'approved');

          if (countError) {
            console.error('Error counting products for vendor:', vendor.user_id, countError);
          }

          return {
            ...vendor,
            product_count: count || 0,
            videoUrl: (vendor as any).video_url ?? undefined,
          };
        })
      );

      // ✅ Filtrer les vendeurs sans produits et trier par score
      const activeVendors = vendorsWithProductCount
        .filter(v => v.product_count > 0)
        .sort((a, b) => {
          const scoreA = (a.average_rating * 10) + (a.total_sales * 2) + a.product_count;
          const scoreB = (b.average_rating * 10) + (b.total_sales * 2) + b.product_count;
          return scoreB - scoreA;
        })
        .slice(0, limit);

      setVendors(activeVendors);
    } catch (err) {
      console.error('Error loading top vendors:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  return {
    vendors,
    loading,
    error,
    refetch: loadTopVendors,
  };
};
