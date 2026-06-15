import { ArrowLeft, ShoppingCart, MapPin } from 'lucide-react';
import { useUniversalChat } from '@/hooks/useUniversalChat';
import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { CityDropdown } from '@/components/food/CityDropdown';

interface KwendaShopHeaderProps {
  cartItemsCount: number;
  onBack: () => void;
  onCartClick: () => void;
  selectedCity?: string;
  onCityChange?: (city: string) => void;
}

export const KwendaShopHeader = ({
  cartItemsCount,
  onBack,
  onCartClick,
  selectedCity = 'Kinshasa',
  onCityChange,
}: KwendaShopHeaderProps) => {
  const { conversations } = useUniversalChat();

  const marketplaceUnreadCount = useMemo(() => {
    return conversations
      .filter(conv => conv.context_type === 'marketplace')
      .reduce((sum, conv) => sum + (conv.unread_count || 0), 0);
  }, [conversations]);

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border/40 pt-safe-top">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between gap-3">

          {/* Back button — rond bg-neutral-100 */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={onBack}
              aria-label="Retour"
              className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center active:scale-90 transition-transform"
              style={{ touchAction: 'manipulation' }}
            >
              <ArrowLeft className="h-5 w-5 text-neutral-700" />
            </button>
            {marketplaceUnreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-primary text-primary-foreground text-[10px] font-semibold flex items-center justify-center px-1 pointer-events-none">
                {marketplaceUnreadCount > 9 ? '9+' : marketplaceUnreadCount}
              </span>
            )}
          </div>

          {/* Titre + ville */}
          <div className="flex-1 min-w-0">
            <p className="text-lg font-bold text-gray-900 leading-tight truncate">Tembea Shop</p>
            <div className="flex items-center gap-0.5 -mt-0.5">
              <MapPin className="w-3 h-3 text-primary shrink-0" />
              {onCityChange ? (
                <CityDropdown
                  selectedCity={selectedCity}
                  onCityChange={onCityChange}
                  className="text-xs text-neutral-500 h-5 px-0 font-normal"
                />
              ) : (
                <span className="text-xs text-neutral-500 truncate">{selectedCity}</span>
              )}
            </div>
          </div>

          {/* Panier avec badge */}
          <button
            type="button"
            data-cart-button
            onClick={onCartClick}
            style={{ touchAction: 'manipulation' }}
            className={cn(
              'relative w-10 h-10 rounded-full flex items-center justify-center active:scale-90 transition-transform shrink-0',
              cartItemsCount > 0 ? 'bg-primary/10' : 'bg-neutral-100',
            )}
          >
            <ShoppingCart className="h-5 w-5 text-neutral-700" />
            {cartItemsCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-primary text-primary-foreground text-[10px] font-semibold flex items-center justify-center px-1 pointer-events-none">
                {cartItemsCount > 99 ? '99+' : cartItemsCount}
              </span>
            )}
          </button>

        </div>
      </div>
    </header>
  );
};
