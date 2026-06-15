import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Share2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useGeolocation } from '@/hooks/useGeolocation';
import { formatCurrency, getCurrencyByCity } from '@/utils/formatCurrency';
import { shareProduct } from '@/utils/shareProduct';
import { Skeleton } from '@/components/ui/skeleton';
import { VideoThumbnail } from '@/components/shared/VideoThumbnail';
import { VideoFullscreenDialog } from '@/components/home/VideoFullscreenDialog';

const TrendingProducts = () => {
  const navigate = useNavigate();
  const { currentCity } = useGeolocation();
  const city = typeof currentCity === 'string' ? currentCity : 'Kinshasa';
  const currency = getCurrencyByCity(city);

  const [videoDialog, setVideoDialog] = useState<{ url: string; title: string; price: number; id: string; images: string[]; shopName?: string; shopLogoUrl?: string; vendorId?: string } | null>(null);

  const { data: products, isLoading } = useQuery({
    queryKey: ['trending-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketplace_products')
        .select(`
          id, title, description, price, images, category, video_url, seller_id,
          popularity_score, sales_count, rating_average,
          vendor_profiles!inner(shop_name, shop_logo_url)
        `)
        .eq('status', 'active')
        .eq('moderation_status', 'approved')
        .order('popularity_score', { ascending: false, nullsFirst: false })
        .order('sales_count', { ascending: false, nullsFirst: false })
        .limit(50);

      if (error) throw error;

      return (data || []).map((p: any) => {
        const imgs = Array.isArray(p.images) ? p.images : [];
        return {
          id: p.id,
          title: p.title,
          price: p.price,
          image: imgs[0] || '',
          videoUrl: p.video_url || null,
          shopName: p.vendor_profiles?.shop_name || 'Boutique',
          shopLogoUrl: p.vendor_profiles?.shop_logo_url || null,
          sellerId: p.seller_id || null,
          salesCount: p.sales_count || 0,
          rating: p.rating_average || 0,
        };
      });
    },
    staleTime: 5 * 60 * 1000,
  });

  const handleProductClick = (product: any) => {
    if (product.videoUrl) {
      setVideoDialog({ url: product.videoUrl, title: product.title, price: product.price, id: product.id, images: product.image ? [product.image] : [], shopName: product.shopName, shopLogoUrl: product.shopLogoUrl, vendorId: product.sellerId });
    } else {
      navigate(`/marketplace/product/${product.id}`);
    }
  };

  const handleShare = (e: React.MouseEvent, product: any) => {
    e.stopPropagation();
    shareProduct({
      title: product.title,
      price: product.price,
      currency,
      productId: product.id,
      productType: 'product',
      vendorId: product.sellerId,
    });
  };

  const totalCount = (products || []).length;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header iOS-optimisé */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border/50 pt-[env(safe-area-inset-top)]">
        <div className="flex items-center gap-3 px-4 h-14">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-full hover:bg-muted/60 active:scale-95 transition-all">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-foreground truncate">🛍️ Shopping tendance</h1>
            <p className="text-[11px] text-muted-foreground">Les produits les plus populaires</p>
          </div>
          {!isLoading && totalCount > 0 && (
            <span className="text-[11px] text-muted-foreground font-medium whitespace-nowrap">
              {totalCount} produit{totalCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />
            ))}
          </div>
        ) : totalCount === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🛒</p>
            <p className="text-sm text-muted-foreground">Aucun produit tendance pour le moment</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {(products || []).map((product, index) => (
              <motion.button
                key={product.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => handleProductClick(product)}
                className="text-left rounded-2xl overflow-hidden bg-card border border-border/40 shadow-sm active:scale-[0.97] transition-transform"
              >
                <div className="aspect-square w-full bg-muted/30 overflow-hidden relative">
                  {product.videoUrl ? (
                    <VideoThumbnail src={product.videoUrl} />
                  ) : product.image ? (
                    <img src={product.image} alt={product.title} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">🛒</div>
                  )}
                  {index < 3 && (
                    <span className="absolute top-2 left-2 bg-primary text-primary-foreground text-[10px] font-bold rounded-full w-6 h-6 flex items-center justify-center shadow">
                      #{index + 1}
                    </span>
                  )}
                  {/* Share button */}
                  <button
                    onClick={(e) => handleShare(e, product)}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white active:scale-90 transition-transform"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="p-2.5">
                  <p className="text-xs font-semibold text-foreground truncate">{product.title}</p>
                  <p className="text-[10px] text-muted-foreground truncate mt-0.5">{product.shopName}</p>
                  <p className="text-xs font-bold text-primary mt-1">{formatCurrency(product.price, currency)}</p>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>

      {/* Video Fullscreen Dialog */}
      {videoDialog && (
        <VideoFullscreenDialog
          open={!!videoDialog}
          onOpenChange={(open) => { if (!open) setVideoDialog(null); }}
          videoUrl={videoDialog.url}
          title={videoDialog.title}
          price={videoDialog.price}
          currency={currency}
          productId={videoDialog.id}
          productType="product"
          images={videoDialog.images}
          shopName={videoDialog.shopName}
          shopLogoUrl={videoDialog.shopLogoUrl}
          vendorId={videoDialog.vendorId}
        />
      )}
    </div>
  );
};

export default TrendingProducts;
