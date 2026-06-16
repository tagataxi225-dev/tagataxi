import { memo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { usePopularDishes } from '@/hooks/usePopularDishes';
import { useMarketplaceProducts } from '@/hooks/useMarketplaceProducts';
import { useGeolocation } from '@/hooks/useGeolocation';
import { formatCurrency } from '@/utils/formatCurrency';
import { Skeleton } from '@/components/ui/skeleton';
import { FoodDishDetailSheet } from '@/components/food/FoodDishDetailSheet';
import { VideoFullscreenDialog } from '@/components/home/VideoFullscreenDialog';
import { useFoodCart } from '@/hooks/useFoodCart';
import { toast } from 'sonner';
import type { FoodCartItem } from '@/types/food';

interface HomeRecentActivityProps {
  onServiceSelect: (service: string) => void;
}

const ItemSkeleton = () => (
  <div className="min-w-[150px] max-w-[150px] flex-shrink-0">
    <Skeleton className="aspect-square w-full rounded-xl" />
    <Skeleton className="h-3 w-[80%] mt-2 rounded" />
    <Skeleton className="h-3 w-[50%] mt-1 rounded" />
  </div>
);

const SectionHeader = ({ title, onSeeAll }: { emoji?: string; title: string; onSeeAll: () => void }) => (
  <div className="flex items-center justify-between">
    <p className="text-base font-extrabold text-foreground">{title}</p>
    <button onClick={onSeeAll} className="inline-flex items-center gap-0.5 text-xs font-semibold text-primary bg-primary/5 rounded-full px-2.5 py-1 hover:bg-primary/10 transition-colors">
      Voir tout <ChevronRight className="h-3 w-3" />
    </button>
  </div>
);

const FallbackCard = ({ emoji, title, description, cta, gradient, border, onClick }: {
  emoji: string; title: string; description: string; cta: string;
  gradient: string; border: string; onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`${gradient} ${border} border rounded-2xl p-4 text-left active:scale-[0.97] transition-all duration-200 flex-1`}
  >
    <span className="text-3xl block mb-2">{emoji}</span>
    <p className="text-sm font-bold text-foreground">{title}</p>
    <p className="text-[11px] text-muted-foreground leading-tight mt-0.5 line-clamp-2">{description}</p>
    <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-primary mt-2">
      {cta} <ChevronRight className="h-3 w-3" />
    </span>
  </button>
);

import { VideoThumbnail } from '@/components/shared/VideoThumbnail';

export const HomeRecentActivity = memo(({ onServiceSelect }: HomeRecentActivityProps) => {
  const navigate = useNavigate();
  const { currentCity } = useGeolocation();
  const cityName = typeof currentCity === 'string'
    ? currentCity
    : ((currentCity as any)?.name ?? '');
  // Timezone as secondary signal — DRC is UTC+1/+2, Côte d'Ivoire is UTC+0 (Africa/Abidjan)
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const isAbidjan = cityName.toLowerCase().includes('abidjan')
    || tz === 'Africa/Abidjan'
    || tz === 'Africa/Dakar'
    || tz === 'Africa/Accra';
  const currency = isAbidjan ? 'XOF' : 'XOF';

  const { data: dishes, isLoading: dishesLoading } = usePopularDishes(cityName);
  const { data: products, isLoading: productsLoading } = useMarketplaceProducts();
  const { cart, setCart } = useFoodCart();

  const topDishes = (dishes || []).slice(0, 8);
  const topProducts = (products || []).slice(0, 8);

  const [selectedDish, setSelectedDish] = useState<any>(null);
  const [showDishDetail, setShowDishDetail] = useState(false);

  // Video fullscreen state
  const [videoDialog, setVideoDialog] = useState<{ url: string; title: string; price: number; id?: string; images?: string[]; type?: 'product' | 'dish'; dishData?: any; shopName?: string; shopLogoUrl?: string; vendorId?: string } | null>(null);

  const handleDishClick = (dish: any) => {
    if (dish.video_url) {
      setVideoDialog({ url: dish.video_url, title: dish.name, price: dish.price, id: dish.id, images: dish.main_image_url ? [dish.main_image_url] : [], type: 'dish', dishData: dish, shopName: dish.restaurant_name, shopLogoUrl: dish.restaurant_logo_url, vendorId: dish.restaurant_id });
    } else {
      setSelectedDish(dish);
      setShowDishDetail(true);
    }
  };

  const handleProductClick = (product: any) => {
    if (product.videoUrl) {
      setVideoDialog({ url: product.videoUrl, title: product.name, price: product.price, id: product.id, images: product.images || [], type: 'product', shopName: product.seller, shopLogoUrl: product.sellerLogo, vendorId: product.sellerId });
    } else {
      navigate(`/marketplace/product/${product.id}`);
    }
  };

  const handleAddToCart = (quantity: number, notes?: string) => {
    if (!selectedDish) return;

    const existingIndex = cart.findIndex(item => item.id === selectedDish.id);
    let newCart: FoodCartItem[];

    if (existingIndex >= 0) {
      newCart = cart.map((item, i) =>
        i === existingIndex
          ? { ...item, quantity: item.quantity + quantity, notes: notes || item.notes }
          : item
      );
    } else {
      const cartItem: FoodCartItem = {
        id: selectedDish.id,
        restaurant_id: selectedDish.restaurant_id,
        name: selectedDish.name,
        description: selectedDish.description || '',
        price: selectedDish.price,
        main_image_url: selectedDish.main_image_url,
        category: selectedDish.category || '',
        is_available: selectedDish.is_available ?? true,
        moderation_status: selectedDish.moderation_status || 'approved',
        quantity,
        notes,
        restaurant_name: selectedDish.restaurant_name || 'Restaurant',
      };
      newCart = [...cart, cartItem];
    }

    setCart(newCart);
    toast.success(`${selectedDish.name} ajouté au panier (×${quantity})`);
  };

  const hasDishes = topDishes.length > 0;
  const hasProducts = topProducts.length > 0;

  return (
    <div className="space-y-5">
      {/* Food Section */}
      {dishesLoading ? (
        <div className="space-y-2.5">
          <SectionHeader emoji="🍔" title="Plats en vedette" onSeeAll={() => navigate('/food/vedette')} />
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
            {Array.from({ length: 4 }).map((_, i) => <ItemSkeleton key={i} />)}
          </div>
        </div>
      ) : hasDishes ? (
        <div className="space-y-2.5">
          <SectionHeader emoji="🍔" title="Plats en vedette" onSeeAll={() => navigate('/food/vedette')} />
          <div className="flex gap-3 overflow-x-auto pb-1 px-1 scrollbar-hide">
            {topDishes.map((dish) => (
              <button
                key={dish.id}
                onClick={() => handleDishClick(dish)}
                className="min-w-[150px] max-w-[150px] flex-shrink-0 text-left active:scale-[0.97] transition-transform"
              >
                <div className="aspect-square w-full rounded-xl overflow-hidden bg-muted/30 shadow-sm relative">
                  {dish.video_url ? (
                    <VideoThumbnail src={dish.video_url} />
                  ) : dish.main_image_url ? (
                    <img src={dish.main_image_url} alt={dish.name} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">🍽️</div>
                  )}
                </div>
                <p className="text-xs font-semibold text-foreground mt-1.5 truncate">{dish.name}</p>
                <p className="text-xs font-bold text-primary bg-primary/5 rounded-md px-1.5 py-0.5 inline-block mt-0.5">{formatCurrency(dish.price, currency)}</p>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <FallbackCard
            emoji="🍔" title="Tembea Food" description="Découvrez les meilleurs plats près de vous" cta="Explorer"
            gradient="bg-gradient-to-br from-orange-50/80 to-amber-50/80 dark:from-orange-950/30 dark:to-amber-900/20"
            border="border-orange-200/40 dark:border-orange-800/20"
            onClick={() => onServiceSelect('food')}
          />
        </div>
      )}

      {/* Marketplace Section */}
      {productsLoading ? (
        <div className="space-y-2.5">
          <SectionHeader emoji="🛍️" title="Shopping tendance" onSeeAll={() => navigate('/marketplace/tendance')} />
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
            {Array.from({ length: 4 }).map((_, i) => <ItemSkeleton key={i} />)}
          </div>
        </div>
      ) : hasProducts ? (
        <div className="space-y-2.5">
          <SectionHeader emoji="🛍️" title="Shopping tendance" onSeeAll={() => navigate('/marketplace/tendance')} />
          <div className="flex gap-3 overflow-x-auto pb-1 px-1 scrollbar-hide">
            {topProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => handleProductClick(product)}
                className="min-w-[150px] max-w-[150px] flex-shrink-0 text-left active:scale-[0.97] transition-transform"
              >
                <div className="aspect-square w-full rounded-xl overflow-hidden bg-muted/30 shadow-sm relative">
                  {product.videoUrl ? (
                    <VideoThumbnail src={product.videoUrl} />
                  ) : product.image ? (
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">🛒</div>
                  )}
                </div>
                <p className="text-xs font-semibold text-foreground mt-1.5 truncate">{product.name}</p>
                <p className="text-xs font-bold text-primary bg-primary/5 rounded-md px-1.5 py-0.5 inline-block mt-0.5">{formatCurrency(product.price, currency)}</p>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <FallbackCard
            emoji="🛍️" title="Tembea Shop" description="Trouvez tout ce qu'il vous faut" cta="Voir"
            gradient="bg-gradient-to-br from-blue-50/80 to-indigo-50/80 dark:from-blue-950/30 dark:to-indigo-900/20"
            border="border-blue-200/40 dark:border-blue-800/20"
            onClick={() => onServiceSelect('marketplace')}
          />
        </div>
      )}

      {selectedDish && (
        <FoodDishDetailSheet
          open={showDishDetail}
          onOpenChange={(open) => {
            setShowDishDetail(open);
            if (!open) setTimeout(() => setSelectedDish(null), 300);
          }}
          dish={{
            id: selectedDish.id,
            restaurant_id: selectedDish.restaurant_id,
            name: selectedDish.name,
            description: selectedDish.description || '',
            price: selectedDish.price,
            main_image_url: selectedDish.main_image_url,
            category: selectedDish.category || '',
            is_available: selectedDish.is_available ?? true,
            moderation_status: selectedDish.moderation_status || 'approved',
            restaurant_name: selectedDish.restaurant_name,
            restaurant_logo_url: selectedDish.restaurant_logo_url,
          }}
          onAddToCart={handleAddToCart}
          onRestaurantClick={() => {
            if (selectedDish.restaurant_id) {
              navigate(`/food/restaurant/${selectedDish.restaurant_id}`);
            }
          }}
        />
      )}

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
          productType={videoDialog.type}
          images={videoDialog.images}
          shopName={videoDialog.shopName}
          shopLogoUrl={videoDialog.shopLogoUrl}
          vendorId={videoDialog.vendorId}
          onBuy={videoDialog.type === 'dish' && videoDialog.dishData ? () => {
            setVideoDialog(null);
            setSelectedDish(videoDialog.dishData);
            setShowDishDetail(true);
          } : undefined}
        />
      )}
    </div>
  );
});

HomeRecentActivity.displayName = 'HomeRecentActivity';
