import { ArrowLeft, ShoppingCart, MapPin, Search } from 'lucide-react';
import { CityDropdown } from './CityDropdown';
import { cn } from '@/lib/utils';

interface KwendaFoodHeaderProps {
  step: 'restaurants' | 'menu' | 'checkout' | 'all-dishes' | 'all-restaurants';
  selectedCity: string;
  onCityChange: (city: string) => void;
  selectedRestaurant?: { restaurant_name: string } | null;
  cartItemsCount: number;
  onBack: () => void;
  onBackToHome?: () => void;
  onCartClick?: () => void;
  onSearchClick?: () => void;
}

export const KwendaFoodHeader = ({
  step,
  selectedCity,
  onCityChange,
  selectedRestaurant,
  cartItemsCount,
  onBack,
  onBackToHome,
  onCartClick,
  onSearchClick,
}: KwendaFoodHeaderProps) => {
  const getTitle = () => {
    switch (step) {
      case 'menu': return selectedRestaurant?.restaurant_name || 'Menu';
      case 'checkout': return 'Commande';
      case 'all-dishes': return 'Tous les plats';
      case 'all-restaurants': return 'Restaurants';
      default: return null;
    }
  };

  const title = getTitle();
  const showBackButton = step !== 'restaurants' || !!onBackToHome;
  const showSubtitle = step === 'checkout' && selectedRestaurant?.restaurant_name;

  return (
    <header
      className="sticky top-0 z-50 w-full bg-white border-b border-neutral-100"
      id="food-header"
    >
      <div style={{ height: 'env(safe-area-inset-top, 0px)', background: 'white' }} />
      <div className="max-w-2xl mx-auto h-14 px-3 flex items-center justify-between gap-2">

        {/* Left: Back + Title */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {showBackButton && (
            <button
              type="button"
              onClick={step !== 'restaurants' ? onBack : onBackToHome}
              className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center shrink-0 active:scale-90 transition-transform"
              style={{ touchAction: 'manipulation' }}
            >
              <ArrowLeft className="h-5 w-5 text-neutral-700" />
            </button>
          )}

          {step === 'restaurants' ? (
            <div className="flex-1 min-w-0">
              <p className="text-lg font-bold text-gray-900 leading-tight">Tembea Food</p>
              <div className="flex items-center gap-0.5 -mt-0.5">
                <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                <CityDropdown
                  selectedCity={selectedCity}
                  onCityChange={onCityChange}
                  className="text-xs text-neutral-500 h-5 px-0 font-normal"
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col min-w-0">
              <h1 className="text-base font-semibold text-gray-900 truncate leading-tight">
                {title}
              </h1>
              {showSubtitle && (
                <span className="text-[11px] text-neutral-400 truncate leading-tight">
                  {selectedRestaurant!.restaurant_name}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right: Cart */}
        {step !== 'checkout' && (
          <button
            type="button"
            onClick={onCartClick}
            className={cn(
              'relative w-10 h-10 rounded-full flex items-center justify-center shrink-0 active:scale-90 transition-transform',
              cartItemsCount > 0 ? 'bg-red-50' : 'bg-neutral-100',
            )}
            style={{ touchAction: 'manipulation' }}
          >
            <ShoppingCart className={cn('h-5 w-5', cartItemsCount > 0 ? 'text-red-500' : 'text-neutral-700')} />
            {cartItemsCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-0.5">
                {cartItemsCount}
              </span>
            )}
          </button>
        )}
      </div>

      {onSearchClick && (
        <div className="px-3 pb-2">
          <button
            type="button"
            onClick={onSearchClick}
            aria-label="Rechercher plats ou restaurants"
            className="w-full h-11 rounded-full bg-neutral-100 flex items-center gap-2.5"
            style={{ padding: '0 16px', touchAction: 'manipulation' }}
          >
            <Search className="w-4 h-4 text-neutral-400 shrink-0" />
            <span className="text-sm text-neutral-400 font-normal">
              Rechercher plats ou restaurants…
            </span>
          </button>
        </div>
      )}
    </header>
  );
};
