import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Minus, Store, ChevronRight, ArrowLeft, Star, Clock } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ProductVideoPlayer } from '@/components/ui/ProductVideoPlayer';
import type { FoodProduct } from '@/types/food';
import { formatCurrency } from '@/utils/formatCurrency';
import { cn } from '@/lib/utils';

interface FoodDishDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dish: FoodProduct & {
    restaurant_name?: string;
    restaurant_logo_url?: string;
    preparation_time?: number;
    rating?: number;
    video_url?: string;
  };
  onAddToCart: (quantity: number, notes?: string) => void;
  onRestaurantClick?: () => void;
}

export const FoodDishDetailSheet = ({
  open,
  onOpenChange,
  dish,
  onAddToCart,
  onRestaurantClick,
}: FoodDishDetailSheetProps) => {
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [imageLoaded, setImageLoaded] = useState(false);

  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const currency = (tz === 'Africa/Abidjan' || tz === 'Africa/Dakar' || tz === 'Africa/Accra')
    ? 'XOF' : 'CDF';

  const handleAddToCart = () => {
    onAddToCart(quantity, notes.trim() || undefined);
    onOpenChange(false);
    setTimeout(() => { setQuantity(1); setNotes(''); }, 300);
  };

  const handleRestaurantClick = () => {
    onOpenChange(false);
    onRestaurantClick?.();
  };

  const totalPrice = dish.price * quantity;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[92vw] sm:max-w-md p-0 gap-0 overflow-hidden rounded-2xl border-0 shadow-2xl max-h-[90vh] flex flex-col bg-black [&>button]:hidden">

        {/* ── Hero image / vidéo ─────────────────────────────────────── */}
        <div className="relative shrink-0 h-64 bg-gray-900 overflow-hidden rounded-b-[28px]">
          {/* Bouton retour */}
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-4 left-4 z-20 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm shadow-md flex items-center justify-center text-gray-800 active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {dish.video_url ? (
            <ProductVideoPlayer
              src={dish.video_url}
              poster={dish.main_image_url || '/placeholder.svg'}
              className="w-full h-full overflow-hidden"
              aspectRatio="aspect-auto"
            />
          ) : (
            <>
              {!imageLoaded && (
                <div className="absolute inset-0 bg-gray-800 animate-pulse" />
              )}
              <img
                src={dish.main_image_url || '/placeholder.svg'}
                alt={dish.name}
                onLoad={() => setImageLoaded(true)}
                className={cn(
                  'w-full h-full object-cover transition-opacity duration-300',
                  imageLoaded ? 'opacity-100' : 'opacity-0',
                )}
              />
            </>
          )}

          {/* Dark gradient overlay (bottom) */}
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
        </div>

        {/* ── Sheet contenu — remonte par-dessus l'image ─────────────── */}
        <div className="relative -mt-6 z-10 rounded-t-3xl bg-white flex-1 min-h-0 overflow-y-auto">
          {/* Indicateur de glissement */}
          <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mt-3 mb-4" />

          {/* Nom + prix + méta */}
          <div className="px-5">
            <h2 className="text-2xl font-black text-gray-900 leading-tight">{dish.name}</h2>
            <p className="text-2xl font-bold text-red-500 mt-1">
              {formatCurrency(dish.price, currency)}
            </p>

            {/* Rating + prep time */}
            {(dish.rating || dish.preparation_time) && (
              <div className="flex items-center gap-3 mt-2">
                {dish.rating && (
                  <span className="flex items-center gap-1 text-sm text-gray-500">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    {dish.rating.toFixed(1)}
                  </span>
                )}
                {dish.preparation_time && (
                  <span className="flex items-center gap-1 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    {dish.preparation_time} min
                  </span>
                )}
              </div>
            )}

            {/* Description */}
            {dish.description && (
              <p className="text-gray-500 text-sm mt-3 leading-relaxed">{dish.description}</p>
            )}
          </div>

          {/* Restaurant row */}
          {dish.restaurant_name && onRestaurantClick && (
            <button
              onClick={handleRestaurantClick}
              className="mx-5 mt-4 flex items-center gap-3 p-3 rounded-2xl bg-amber-50 border border-amber-100 active:bg-amber-100 transition-colors w-[calc(100%-2.5rem)]"
              style={{ touchAction: 'manipulation' }}
            >
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 overflow-hidden">
                {dish.restaurant_logo_url ? (
                  <img
                    src={dish.restaurant_logo_url}
                    alt={dish.restaurant_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Store className="w-5 h-5 text-amber-500" />
                )}
              </div>
              <span className="flex-1 text-left text-sm font-semibold text-gray-900 truncate">
                {dish.restaurant_name}
              </span>
              <span className="text-sm font-semibold text-amber-600 shrink-0">
                Voir le menu →
              </span>
            </button>
          )}

          {/* Instructions spéciales */}
          <div className="px-5 mt-4 space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Instructions spéciales
            </label>
            <Textarea
              placeholder="Ex : sans piment, bien cuit…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-gray-50 border-gray-200 rounded-2xl resize-none focus:ring-1 focus:ring-primary/30"
              rows={2}
            />
          </div>

          {/* Spacer to ensure sticky footer doesn't overlap last content */}
          <div className="h-32" />

          {/* Sticky footer: quantity + add-to-cart */}
          <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-5 pt-3 pb-5">
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-gray-100 rounded-2xl h-14 shrink-0">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  className="w-10 h-14 flex items-center justify-center active:scale-90 transition-transform disabled:opacity-40"
                  style={{ touchAction: 'manipulation' }}
                >
                  <Minus className="h-4 w-4 text-gray-700" />
                </button>
                <AnimatePresence mode="wait">
                  <motion.span
                    key={quantity}
                    initial={{ scale: 0.75, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.75, opacity: 0 }}
                    transition={{ duration: 0.12 }}
                    className="text-base font-bold tabular-nums w-6 text-center text-gray-900"
                  >
                    {quantity}
                  </motion.span>
                </AnimatePresence>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-14 flex items-center justify-center active:scale-90 transition-transform"
                  style={{ touchAction: 'manipulation' }}
                >
                  <Plus className="h-4 w-4 text-gray-700" />
                </button>
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                className="flex-1 h-14 rounded-2xl bg-red-500 active:bg-red-600 text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-sm"
                style={{ touchAction: 'manipulation' }}
              >
                <span>Ajouter au panier · {formatCurrency(totalPrice, currency)}</span>
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
