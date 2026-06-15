import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { usePOSSession } from '@/hooks/usePOSSession';
import { usePOSTransactions } from '@/hooks/usePOSTransactions';
import { POSProductGrid } from './POSProductGrid';
import { POSCart } from './POSCart';
import { POSSessionManager } from './POSSessionManager';
import { Maximize, Minimize, ArrowLeft, ShoppingCart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

export const ModernPOSLayout = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [cart, setCart] = useState<any[]>([]);
  const [showCart, setShowCart] = useState(false);

  const { currentSession } = usePOSSession();
  const { createTransaction, loading: transactionLoading } = usePOSTransactions();

  useEffect(() => {
    loadRestaurantProfile();
  }, []);

  useEffect(() => {
    if (restaurantId && !currentSession) {
      // Auto-open session manager
    }
  }, [restaurantId, currentSession]);

  const loadRestaurantProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/restaurant/auth');
        return;
      }

      const { data: profile } = await supabase
        .from('restaurant_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        setRestaurantId(profile.id);
      }
    } catch (error) {
      console.error('Error loading restaurant profile:', error);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleAddToCart = (product: any) => {
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }

    // Animation confetti légère
    confetti({
      particleCount: 30,
      spread: 50,
      origin: { y: 0.6 },
      colors: ['#f97316', '#dc2626'],
    });

    toast({
      title: 'Ajouté au panier',
      description: product.name,
      duration: 1000,
    });
  };

  const handleUpdateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCart(cart.filter(item => item.id !== productId));
    } else {
      setCart(cart.map(item =>
        item.id === productId
          ? { ...item, quantity: newQuantity }
          : item
      ));
    }
  };

  const handleCheckout = async (paymentMethod: 'cash' | 'card' | 'mobile_money' | 'kwenda_pay') => {
    if (!currentSession || !restaurantId) {
      toast({
        title: 'Erreur',
        description: 'Session POS invalide',
        variant: 'destructive',
      });
      return;
    }

    try {
      const items = cart.map(item => ({
        product_id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        total: item.price * item.quantity,
      }));

      await createTransaction(currentSession.id, restaurantId, items, paymentMethod);

      // Confetti de succès
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      setCart([]);
      setShowCart(false);
    } catch (error) {
      console.error('Checkout error:', error);
    }
  };

  if (!currentSession) {
    return <POSSessionManager restaurantId={restaurantId || ''} />;
  }

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header moderne avec gradient */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex-shrink-0 bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-3 shadow-lg"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/restaurant?tab=dashboard')}
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold">Point de Vente</h1>
              <p className="text-sm text-white/80">Session #{currentSession.id.slice(0, 8)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-sm">
              {cartItemCount} articles
            </Badge>
            <Button
              variant="secondary"
              size="icon"
              onClick={toggleFullscreen}
            >
              {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </motion.header>

      {/* Main layout - Desktop: 2 colonnes, Mobile: 1 colonne avec panier flottant */}
      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
        {/* Grille de produits */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          <POSProductGrid
            restaurantId={restaurantId || ''}
            onAddToCart={handleAddToCart}
          />
        </div>

        {/* Panier - Desktop: sidebar fixe, Mobile: modal */}
        <div className="hidden lg:block lg:w-96 border-l bg-card overflow-y-auto">
          <POSCart
            cart={cart}
            onUpdateQuantity={handleUpdateQuantity}
            onCheckout={handleCheckout}
            session={currentSession}
          />
        </div>
      </div>

      {/* Bouton panier flottant (mobile uniquement) */}
      <AnimatePresence>
        {cart.length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="lg:hidden fixed bottom-20 left-4 right-4 z-50"
          >
            <Button
              size="lg"
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-2xl"
              onClick={() => setShowCart(true)}
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              Voir le panier ({cartItemCount}) • {cartTotal.toLocaleString()} CDF
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal panier mobile */}
      <AnimatePresence>
        {showCart && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/50 z-50"
              onClick={() => setShowCart(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl shadow-2xl max-h-[80vh] overflow-y-auto"
            >
              <div className="p-4 border-b">
                <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-4" />
                <h2 className="text-xl font-bold">Panier</h2>
              </div>
              <POSCart
                cart={cart}
                onUpdateQuantity={handleUpdateQuantity}
                onCheckout={(method) => {
                  handleCheckout(method);
                  setShowCart(false);
                }}
                session={currentSession}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
