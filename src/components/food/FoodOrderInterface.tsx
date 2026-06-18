import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRestaurantsQuery } from '@/hooks/useRestaurantsQuery';
import { useFoodCart } from '@/hooks/useFoodCart';
import { supabase } from '@/integrations/supabase/client';
import { RestaurantList } from './RestaurantList';
import { RestaurantStoreView } from './RestaurantStoreView';
import { FoodCheckout } from './FoodCheckout';
import { OrderSuccessModal } from './OrderSuccessModal';
import { KwendaFoodHeader } from './KwendaFoodHeader';
import { AllDishesView } from './AllDishesView';
import { AllRestaurantsView } from './AllRestaurantsView';
import { FoodCart } from './FoodCart';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { AnimatePresence, motion } from 'framer-motion';
import type { Restaurant, FoodProduct, FoodCartItem } from '@/types/food';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatCurrency, getCurrencyByCity } from '@/utils/formatCurrency';
import { useSmartGeolocation } from '@/hooks/useSmartGeolocation';
import { MapPin } from 'lucide-react';

type Step = 'restaurants' | 'menu' | 'checkout' | 'all-dishes' | 'all-restaurants';

interface FoodOrderInterfaceProps {
  onOrderComplete?: (orderId: string) => void;
  onBack?: () => void;
  onCartStateChange?: (cartCount: number, openCart: () => void) => void;
}

export const FoodOrderInterface = ({ onOrderComplete, onBack, onCartStateChange }: FoodOrderInterfaceProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { currentCity } = useSmartGeolocation();
  const [selectedCity, setSelectedCity] = useState('Kinshasa');

  useEffect(() => {
    const foodCities = ['Kinshasa', 'Lubumbashi', 'Kolwezi'];
    if (currentCity?.name && foodCities.includes(currentCity.name)) {
      setSelectedCity(currentCity.name);
    } else {
      setSelectedCity('');
    }
  }, [currentCity?.name]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [step, setStep] = useState<Step>('restaurants');
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [lastOrderNumber, setLastOrderNumber] = useState('');
  const [showCartSheet, setShowCartSheet] = useState(false);
  const [searchParams] = useSearchParams();
  const { restaurants, loading, error, refetch, isShowingAllCities } = useRestaurantsQuery(selectedCity);
  const { cart, setCart, clearCart } = useFoodCart(selectedRestaurant?.id);

  useEffect(() => {
    const rid = searchParams.get('restaurant');
    if (!rid || rid === 'undefined') return;
    const found = restaurants?.find((r: any) => r.id === rid);
    if (found) { setSelectedRestaurant(found); setStep('menu'); return; }
    (async () => {
      const { data } = await supabase.from('restaurant_profiles').select('*').eq('id', rid).maybeSingle();
      if (data) { setSelectedRestaurant(data); setStep('menu'); }
    })();
  }, [searchParams, restaurants]);

  // Vider l'affichage du panier seulement si on retourne à la liste ET qu'il est vide
  useEffect(() => {
    if (!selectedRestaurant && step === 'restaurants' && cart.length === 0) {
      // Ne rien faire - le panier est déjà vide
    }
    // Ne pas vider le panier automatiquement quand on change de vue
  }, [selectedRestaurant, step, cart.length]);

  // Notifier le parent du changement de panier pour le footer
  useEffect(() => {
    if (onCartStateChange) {
      onCartStateChange(cart.length, () => setShowCartSheet(true));
    }
  }, [cart.length, onCartStateChange]);

  const handleSelectRestaurant = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    setStep('menu');
  };

  const handleAddToCart = (product: FoodProduct, quantity: number = 1, notes?: string) => {
    // Vérifier si panier non vide et restaurant différent
    if (cart.length > 0 && cart[0].restaurant_id !== product.restaurant_id) {
      toast.error('Vous avez déjà des articles d\'un autre restaurant', {
        description: 'Videz votre panier ou terminez votre commande avant d\'ajouter des plats d\'un autre restaurant',
        action: {
          label: 'Vider le panier',
          onClick: () => {
            clearCart();
            toast.success('Panier vidé', {
              description: 'Vous pouvez maintenant ajouter ce plat'
            });
          }
        }
      });
      return;
    }

    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity, notes }
            : item
        );
      }
      
      const restaurantName = selectedRestaurant?.restaurant_name 
        || restaurants.find(r => r.id === product.restaurant_id)?.restaurant_name 
        || 'Restaurant';
      return [...prevCart, { ...product, quantity, notes, restaurant_name: restaurantName }];
    });

    // Confetti animation
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#FFA500', '#FF6347', '#FFD700']
    });

    toast.success(t('food.added_to_cart', { product: product.name }));

    // Si on est dans "Tous les plats", naviguer vers le restaurant après ajout
    if (!selectedRestaurant && step === 'all-dishes') {
      const restaurant = restaurants.find(r => r.id === product.restaurant_id);
      if (restaurant) {
        setTimeout(() => {
          setSelectedRestaurant(restaurant);
          setStep('menu');
          toast.success('Redirection vers le restaurant', {
            description: `Vous pouvez continuer à commander chez ${restaurant.restaurant_name}`
          });
        }, 1000);
      }
    }
  };

  const handleUpdateCartItem = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(prevCart => prevCart.filter(item => item.id !== productId));
    } else {
      setCart(prevCart =>
        prevCart.map(item =>
          item.id === productId ? { ...item, quantity } : item
        )
      );
    }
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  const handlePlaceOrder = async (deliveryAddress: string, paymentMethod: 'kwenda_pay' | 'cash', coordinates?: { lat: number; lng: number }) => {
    if (!selectedRestaurant || !user) return;

    try {
      // Récupérer le téléphone depuis le profil (user.phone est souvent vide)
      const { data: profile } = await supabase
        .from('profiles')
        .select('phone_number')
        .eq('user_id', user.id)
        .single();

      const orderData = {
        restaurant_id: selectedRestaurant.id,
        items: cart.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          unit_price: item.price,
          special_instructions: item.notes || ''
        })),
        delivery_address: deliveryAddress,
        delivery_coordinates: coordinates || null,
        delivery_phone: profile?.phone_number || user.phone || '',
        payment_method: paymentMethod,
        currency: getCurrencyByCity(selectedCity)
      };

      const { data, error } = await supabase.functions.invoke('food-order-processor', {
        body: orderData
      });

      if (error) {
        // Parse error pour afficher les détails du solde
        const errorData = error.context?.body;
        
        if (errorData?.error === 'insufficient_funds') {
          const currency = getCurrencyByCity(selectedCity);
          toast.error('Solde insuffisant', {
            description: `Requis: ${formatCurrency(errorData.required, currency)} | Disponible: ${formatCurrency(errorData.available, currency)} (Bonus: ${formatCurrency(errorData.bonus, currency)} | Principal: ${formatCurrency(errorData.main, currency)})`
          });
        } else {
          toast.error('Erreur de paiement', {
            description: error.message || 'Veuillez réessayer'
          });
        }
        throw error;
      }

      toast.success(t('food.order_success'), {
        description: t('food.order_number', { number: data.order_number })
      });

      setLastOrderNumber(data.order_number);
      setSuccessModalOpen(true);
      clearCart();
      
      if (onOrderComplete && data.order_id) {
        onOrderComplete(data.order_id);
      }
    } catch (error: any) {
      console.error('Error placing order:', error);
      toast.error(t('food.order_error'), {
        description: error.message || t('food.please_retry')
      });
    }
  };

  const handleBack = () => {
    if (step === 'checkout') {
      setStep('menu');
    } else if (step === 'menu') {
      setStep('restaurants');
      setSelectedRestaurant(null);
    } else if (step === 'all-dishes' || step === 'all-restaurants') {
      setStep('restaurants');
    } else if (onBack) {
      onBack();
    }
  };

  const handleBackToHome = () => {
    if (onBack) {
      onBack(); // Utilise le callback parent pour reset currentView
    } else {
      navigate('/app/client'); // Fallback
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const serviceFee = subtotal * 0.05; // 5% service fee
  const total = subtotal + serviceFee; // Sans frais de livraison (calculé après validation)

  const renderCityPicker = () => (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
        <MapPin className="w-8 h-8 text-red-500" />
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-1">Choisissez votre ville</h3>
      <p className="text-sm text-gray-500 mb-6">TAGA Food disponible dans ces villes</p>
      <div className="flex flex-col gap-3 w-full max-w-xs">
        {['Kinshasa', 'Lubumbashi', 'Kolwezi'].map(c => (
          <button key={c} onClick={() => setSelectedCity(c)}
            className="w-full flex items-center gap-3 p-4 rounded-2xl bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] active:scale-[0.98] transition-all">
            <MapPin className="w-5 h-5 text-red-500" />
            <span className="font-semibold text-gray-900">{c}</span>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <motion.div 
      className="flex flex-col flex-1 bg-background pb-24"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header — AllDishesView has its own (back + title + Filtres) */}
      {step !== 'all-dishes' && (
        <KwendaFoodHeader
          step={step}
          selectedCity={selectedCity}
          onCityChange={setSelectedCity}
          selectedRestaurant={selectedRestaurant}
          cartItemsCount={cart.length}
          onBack={handleBack}
          onBackToHome={handleBackToHome}
          onCartClick={() => setShowCartSheet(true)}
          onSearchClick={() => setStep('all-dishes')}
        />
      )}

      {/* Content with Animations */}
      <div className="flex-1 overflow-auto">
        <AnimatePresence mode="sync">
          {step === 'restaurants' && (
            <motion.div
              key="restaurants"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            >
              {!selectedCity ? renderCityPicker() : (
              <RestaurantList
                restaurants={restaurants}
                loading={loading}
                error={error}
                isShowingAllCities={isShowingAllCities}
                onSelectRestaurant={handleSelectRestaurant}
                onForceRefresh={refetch}
                selectedCity={selectedCity}
                onAddToCart={(product) => handleAddToCart(product, 1)}
                onViewAllDishes={() => setStep('all-dishes')}
                onViewAllRestaurants={() => setStep('all-restaurants')}
                onRestaurantClick={(restaurantId) => {
                  const restaurant = restaurants.find(r => r.id === restaurantId);
                  if (restaurant) {
                    handleSelectRestaurant(restaurant);
                  }
                }}
                cart={cart}
              />
              )}
            </motion.div>
          )}

          {step === 'all-dishes' && (
            <motion.div
              key="all-dishes"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            >
              <AllDishesView
                city={selectedCity}
                onBack={() => setStep('restaurants')}
                onAddToCart={(product) => handleAddToCart(product, 1)}
                cart={cart}
              />
            </motion.div>
          )}

          {step === 'all-restaurants' && (
            <motion.div
              key="all-restaurants"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            >
              <AllRestaurantsView
              city={selectedCity}
              onBack={() => setStep('restaurants')}
              onSelectRestaurant={handleSelectRestaurant}
            />
            </motion.div>
          )}

          {step === 'menu' && selectedRestaurant && (
            <motion.div
              key="menu"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            >
              <RestaurantStoreView
              restaurant={selectedRestaurant}
              cart={cart}
              onAddToCart={handleAddToCart}
              onUpdateCartItem={handleUpdateCartItem}
              onRemoveFromCart={handleRemoveFromCart}
              onProceedToCheckout={() => setStep('checkout')}
              onBack={() => setStep('restaurants')}
            />
            </motion.div>
          )}

          {step === 'checkout' && selectedRestaurant && (
            <motion.div
              key="checkout"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            >
              <FoodCheckout
              cart={cart}
              restaurant={selectedRestaurant}
              subtotal={subtotal}
              serviceFee={serviceFee}
              total={total}
              onPlaceOrder={handlePlaceOrder}
              onBack={() => setStep('menu')}
            />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Global Cart Sheet - toujours accessible */}
      <FoodCart
        open={showCartSheet}
        onOpenChange={setShowCartSheet}
        cart={cart}
        restaurant={selectedRestaurant 
          || (cart.length > 0 && restaurants.find(r => r.id === cart[0]?.restaurant_id))
          || (cart.length > 0 ? {
            id: cart[0]?.restaurant_id || '',
            restaurant_name: cart[0]?.restaurant_name || 'Restaurant',
            city: selectedCity,
            address: '',
            is_active: true,
            verification_status: 'approved',
            minimum_order_amount: 0
          } : {
            id: '',
            restaurant_name: 'TAGA Food',
            city: selectedCity,
            address: '',
            is_active: true,
            verification_status: 'approved',
            minimum_order_amount: 0
          })}
        onUpdateQuantity={handleUpdateCartItem}
        onRemove={handleRemoveFromCart}
        onCheckout={() => {
          if (cart.length === 0) {
            setShowCartSheet(false);
            return;
          }
          // Si pas de restaurant sélectionné, naviguer vers celui du panier
          if (!selectedRestaurant && cart.length > 0) {
            const restaurant = restaurants.find(r => r.id === cart[0].restaurant_id);
            if (restaurant) {
              setSelectedRestaurant(restaurant);
              setStep('menu');
            }
          }
          setShowCartSheet(false);
          setStep('checkout');
        }}
      />

      {/* Success Modal */}
      {selectedRestaurant && (
        <OrderSuccessModal
          open={successModalOpen}
          onOpenChange={(open) => {
            setSuccessModalOpen(open);
            if (!open) {
              setStep('restaurants');
              setSelectedRestaurant(null);
            }
          }}
          orderNumber={lastOrderNumber}
          restaurant={selectedRestaurant}
          deliveryAddress={selectedRestaurant.address || selectedCity}
          estimatedTime={selectedRestaurant.average_preparation_time || 30}
          onTrackOrder={() => {
            setSuccessModalOpen(false);
            navigate('/food/orders');
          }}
        />
      )}
    </motion.div>
  );
};

export default FoodOrderInterface;
