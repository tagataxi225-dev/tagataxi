import { useState, useEffect } from 'react';
import { useRestaurants } from '@/hooks/useRestaurants';
import { FoodProductCard } from './FoodProductCard';
import { FoodCart } from './FoodCart';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShoppingCart } from 'lucide-react';
import type { Restaurant, FoodProduct, FoodCartItem } from '@/types/food';
import { formatCurrency, getCurrencyByCity } from '@/utils/formatCurrency';

interface RestaurantMenuProps {
  restaurant: Restaurant;
  cart: FoodCartItem[];
  onAddToCart: (product: FoodProduct, quantity?: number, notes?: string) => void;
  onUpdateCartItem: (productId: string, quantity: number) => void;
  onRemoveFromCart: (productId: string) => void;
  onProceedToCheckout: () => void;
}

export const RestaurantMenu = ({
  restaurant,
  cart,
  onAddToCart,
  onUpdateCartItem,
  onRemoveFromCart,
  onProceedToCheckout,
}: RestaurantMenuProps) => {
  const { fetchRestaurantMenu } = useRestaurants();
  const [menu, setMenu] = useState<FoodProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCart, setShowCart] = useState(false);

  useEffect(() => {
    const loadMenu = async () => {
      setLoading(true);
      const products = await fetchRestaurantMenu(restaurant.id);
      setMenu(products);
      setLoading(false);
    };

    loadMenu();
  }, [restaurant.id]);

  // Group products by category
  const categories = Array.from(new Set(menu.map(p => p.category)));
  const productsByCategory = categories.reduce((acc, category) => {
    acc[category] = menu.filter(p => p.category === category);
    return acc;
  }, {} as Record<string, FoodProduct[]>);

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const canCheckout = subtotal >= (restaurant.minimum_order_amount || 0);

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-lg" />
        ))}
      </div>
    );
  }

  if (menu.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <p className="text-muted-foreground text-lg">Menu non disponible</p>
        <p className="text-sm text-muted-foreground mt-2">Revenez bientôt !</p>
      </div>
    );
  }

  return (
    <div className="relative pb-24">
      {/* Menu */}
      <Tabs defaultValue={categories[0]} className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto sticky top-0 bg-background z-10 rounded-none border-b">
          {categories.map(category => (
            <TabsTrigger key={category} value={category} className="capitalize">
              {category}
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map(category => (
          <TabsContent key={category} value={category} className="p-4 space-y-3">
            {productsByCategory[category]?.map(product => (
              <FoodProductCard
                key={product.id}
                product={product}
                cartQuantity={cart.find(item => item.id === product.id)?.quantity || 0}
                onAddToCart={onAddToCart}
              />
            ))}
          </TabsContent>
        ))}
      </Tabs>

      {/* Floating Cart Button - z-index supérieur au footer */}
      {cart.length > 0 && (
        <div className="fixed bottom-20 left-4 right-4 z-[115]">
          <Button
            size="lg"
            className="w-full shadow-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
            onClick={() => setShowCart(true)}
          >
            <ShoppingCart className="h-5 w-5 mr-2" />
            Voir le panier ({cart.length})
            <span className="ml-auto font-bold">
              {formatCurrency(subtotal, getCurrencyByCity(restaurant.city || ''))}
            </span>
          </Button>
        </div>
      )}

      {/* Cart Sheet */}
      <FoodCart
        open={showCart}
        onOpenChange={setShowCart}
        cart={cart}
        restaurant={restaurant}
        onUpdateQuantity={onUpdateCartItem}
        onRemove={onRemoveFromCart}
        onCheckout={() => {
          setShowCart(false);
          onProceedToCheckout();
        }}
      />
    </div>
  );
};
