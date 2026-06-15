import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Share2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { usePopularDishes } from '@/hooks/usePopularDishes';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useFoodCart } from '@/hooks/useFoodCart';
import { formatCurrency, getCurrencyByCity } from '@/utils/formatCurrency';
import { shareProduct } from '@/utils/shareProduct';
import { Skeleton } from '@/components/ui/skeleton';
import { FoodDishDetailSheet } from '@/components/food/FoodDishDetailSheet';
import { VideoThumbnail } from '@/components/shared/VideoThumbnail';
import { VideoFullscreenDialog } from '@/components/home/VideoFullscreenDialog';
import { toast } from 'sonner';
import type { FoodCartItem } from '@/types/food';

const FeaturedDishes = () => {
  const navigate = useNavigate();
  const { currentCity } = useGeolocation();
  const city = typeof currentCity === 'string' ? currentCity : 'Kinshasa';
  const currency = getCurrencyByCity(city);

  const { data: dishes, isLoading } = usePopularDishes(city, 50);
  const { cart, setCart } = useFoodCart();

  const [selectedDish, setSelectedDish] = useState<any>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [videoDialog, setVideoDialog] = useState<{ url: string; title: string; price: number; id: string; images: string[]; dishData: any; shopName?: string; shopLogoUrl?: string; vendorId?: string } | null>(null);

  const handleDishClick = (dish: any) => {
    if (dish.video_url) {
      setVideoDialog({ url: dish.video_url, title: dish.name, price: dish.price, id: dish.id, images: dish.main_image_url ? [dish.main_image_url] : [], dishData: dish, shopName: dish.restaurant_name, shopLogoUrl: dish.restaurant_logo_url, vendorId: dish.restaurant_id });
    } else {
      setSelectedDish(dish);
      setShowDetail(true);
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
      newCart = [...cart, {
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
      }];
    }
    setCart(newCart);
    toast.success(`${selectedDish.name} ajouté au panier (×${quantity})`);
  };

  const handleShare = (e: React.MouseEvent, dish: any) => {
    e.stopPropagation();
    shareProduct({
      title: dish.name,
      price: dish.price,
      currency,
      productId: dish.id,
      productType: 'dish',
      vendorId: dish.restaurant_id,
    });
  };

  const totalCount = (dishes || []).length;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header iOS-optimisé */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border/50 pt-[env(safe-area-inset-top)]">
        <div className="flex items-center gap-3 px-4 h-14">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-full hover:bg-muted/60 active:scale-95 transition-all">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-foreground truncate">🍔 Plats en vedette</h1>
            <p className="text-[11px] text-muted-foreground">Les plus commandés à {city}</p>
          </div>
          {!isLoading && totalCount > 0 && (
            <span className="text-[11px] text-muted-foreground font-medium whitespace-nowrap">
              {totalCount} plat{totalCount > 1 ? 's' : ''}
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
            <p className="text-4xl mb-3">🍽️</p>
            <p className="text-sm text-muted-foreground">Aucun plat en vedette pour le moment</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {(dishes || []).map((dish, index) => (
              <motion.button
                key={dish.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => handleDishClick(dish)}
                className="text-left rounded-2xl overflow-hidden bg-card border border-border/40 shadow-sm active:scale-[0.97] transition-transform"
              >
                <div className="aspect-square w-full bg-muted/30 overflow-hidden relative">
                  {dish.video_url ? (
                    <VideoThumbnail src={dish.video_url} />
                  ) : dish.main_image_url ? (
                    <img src={dish.main_image_url} alt={dish.name} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">🍽️</div>
                  )}
                  {index < 3 && (
                    <span className="absolute top-2 left-2 bg-primary text-primary-foreground text-[10px] font-bold rounded-full w-6 h-6 flex items-center justify-center shadow">
                      #{index + 1}
                    </span>
                  )}
                  {/* Share button */}
                  <button
                    onClick={(e) => handleShare(e, dish)}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white active:scale-90 transition-transform"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="p-2.5">
                  <p className="text-xs font-semibold text-foreground truncate">{dish.name}</p>
                  {dish.restaurant_name && (
                    <p className="text-[10px] text-muted-foreground truncate mt-0.5">{dish.restaurant_name}</p>
                  )}
                  <p className="text-xs font-bold text-primary mt-1">{formatCurrency(dish.price, currency)}</p>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>

      {/* Detail Sheet */}
      {selectedDish && (
        <FoodDishDetailSheet
          open={showDetail}
          onOpenChange={(open) => {
            setShowDetail(open);
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
            if (selectedDish.restaurant_id) navigate(`/food/restaurant/${selectedDish.restaurant_id}`);
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
          productType="dish"
          images={videoDialog.images}
          shopName={videoDialog.shopName}
          shopLogoUrl={videoDialog.shopLogoUrl}
          vendorId={videoDialog.vendorId}
          onBuy={() => {
            const dish = videoDialog.dishData;
            setVideoDialog(null);
            setSelectedDish(dish);
            setShowDetail(true);
          }}
        />
      )}
    </div>
  );
};

export default FeaturedDishes;
