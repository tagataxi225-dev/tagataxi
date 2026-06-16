import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ArrowLeft, 
  Star, 
  MapPin, 
  Calendar,
  Search,
  Package,
  TrendingUp,
  Users,
  Shield,
  ShoppingCart,
  Sparkles,
  Award,
  MessageCircle
} from 'lucide-react';
import { useVendorFollowers } from '@/hooks/useVendorFollowers';
import { CompactProductCard } from './CompactProductCard';
import { ProductGrid } from './ProductGrid';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useChat } from '@/components/chat/ChatProvider';
import { SimilarVendorsSlider } from './SimilarVendorsSlider';
import { FloatingCartIndicator } from './FloatingCartIndicator';
import { VendorCheckoutBar } from './VendorCheckoutBar';
import { VendorRatingDialog } from './VendorRatingDialog';
import { VendorReviewsSection } from './VendorReviewsSection';
import { CartItem } from '@/types/marketplace';
import { triggerAddToCartEffect } from '@/lib/animations/cartEffects';
import confetti from 'canvas-confetti';
import { ToastAction } from '@/components/ui/toast';
import { useCart } from '@/context/CartContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating: number;
  reviewCount: number;
  category: string;
  seller: string;
  sellerId: string;
  isAvailable: boolean;
  location?: { lat: number; lng: number };
  video_url?: string;
}

interface VendorStoreViewProps {
  vendorId: string;
  onClose?: () => void;
  onAddToCart: (product: Product) => void;
  onViewDetails: (product: Product) => void;
  userLocation?: { lat: number; lng: number } | null;
}

export const VendorStoreView: React.FC<VendorStoreViewProps> = ({
  vendorId,
  onClose,
  onAddToCart,
  onViewDetails,
  userLocation
}) => {
  const [vendor, setVendor] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [activeProductsCount, setActiveProductsCount] = useState(0);
  const [localCart, setLocalCart] = useState<CartItem[]>([]);
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [canRateVendor, setCanRateVendor] = useState(false);
  const [hasRatedVendor, setHasRatedVendor] = useState(false);
  const { followerCount } = useVendorFollowers(vendorId);
  const { user } = useAuth();
  const { openChat } = useChat();
  const { toast } = useToast();
  const shouldReduceMotion = useReducedMotion();
  const {
    cartItems: globalCartItems,
    removeFromCart: removeFromCartGlobal,
    updateQuantity: updateQuantityGlobal,
  } = useCart();

  useEffect(() => {
    loadVendorData();
  }, [vendorId]);

  useEffect(() => {
    if (user) {
      checkRatingEligibility();
    }
  }, [user, vendorId]);

  const checkRatingEligibility = async () => {
    if (!user) {
      setCanRateVendor(false);
      setHasRatedVendor(false);
      return;
    }

    try {
      // Check if user has completed orders from this vendor
      const { data: orders } = await supabase
        .from('marketplace_orders')
        .select('id, status')
        .eq('buyer_id', user.id)
        .eq('seller_id', vendorId)
        .eq('status', 'delivered');

      const hasCompletedOrders = orders && orders.length > 0;

      // Check if user has already rated this vendor
      const { data: existingRating } = await supabase
        .from('user_ratings')
        .select('id')
        .eq('rater_user_id', user.id)
        .eq('rated_user_id', vendorId)
        .maybeSingle();

      setCanRateVendor(hasCompletedOrders);
      setHasRatedVendor(!!existingRating);
    } catch (error) {
      console.error('Error checking rating eligibility:', error);
      setCanRateVendor(false);
      setHasRatedVendor(false);
    }
  };

  const loadVendorData = async () => {
    try {
      setLoading(true);
      
      // Load vendor profile with real stats
      const { data: vendorData, error: vendorError } = await supabase
        .from('vendor_profiles')
        .select('*')
        .eq('user_id', vendorId)
        .single();

      if (vendorError) throw vendorError;

      // Load vendor's bio from profiles (keep profiles for bio only)
      const { data: profileData } = await supabase
        .from('profiles')
        .select('bio')
        .eq('id', vendorId)
        .single();

      // Use shop_name and shop_logo_url from vendor_profiles
      setVendor({
        ...vendorData,
        bio: profileData?.bio,
        display_name: vendorData?.shop_name || 'Boutique',
        avatar_url: vendorData?.shop_logo_url || null
      });

      // ✅ CORRECTION : Utiliser vendor_subscriptions au lieu de vendor_followers
      if (user) {
        const { data: subData } = await supabase
          .from('vendor_subscriptions')
          .select('is_active')
          .eq('subscriber_id', user.id)
          .eq('vendor_id', vendorId)
          .maybeSingle();
        
        setIsSubscribed(subData?.is_active || false);
      }

      // Load vendor products (only approved)
      const { data: productsData, error: productsError } = await supabase
        .from('marketplace_products')
        .select('*')
        .eq('seller_id', vendorId)
        .eq('status', 'active')
        .eq('moderation_status', 'approved')
        .order('created_at', { ascending: false });

      if (productsError) throw productsError;

      const transformedProducts = productsData?.map(product => ({
        id: product.id,
        name: product.title,
        price: product.price,
        image: Array.isArray(product.images) && product.images.length > 0 
          ? String(product.images[0])
          : 'https://images.unsplash.com/photo-1581090464777-f3220bbe1b8b?w=300&h=300&fit=crop',
        rating: 4.5,
        reviewCount: Math.floor(Math.random() * 50) + 5,
        category: product.category,
        seller: vendorData?.shop_name || 'Vendeur',
        sellerId: product.seller_id,
        isAvailable: product.status === 'active',
        location: product.coordinates && typeof product.coordinates === 'object' 
          ? product.coordinates as { lat: number; lng: number }
          : undefined,
        video_url: product.video_url || undefined,
      })) || [];

      setProducts(transformedProducts);
      setActiveProductsCount(transformedProducts.length);
    } catch (error) {
      console.error('Error loading vendor data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product: Product, element?: HTMLElement) => {
    // Snapshots pour "Annuler"
    const localSnapshot = localCart;
    const prevGlobalQty = globalCartItems.find(i => i.id === product.id)?.quantity ?? 0;

    // Appeler le callback parent
    onAddToCart(product);

    // Tracker localement pour le FloatingCartIndicator
    const existingItem = localCart.find(item => item.id === product.id);

    if (existingItem) {
      setLocalCart(localCart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setLocalCart([...localCart, {
        id: product.id,
        product_id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: 1,
        seller: product.seller,
        seller_id: product.sellerId,
        coordinates: product.location
      }]);
    }

    // Animation particules si l'élément est fourni
    if (element && !shouldReduceMotion) {
      triggerAddToCartEffect(element);
    }

    // Animation confetti (skippée si reduced-motion)
    if (!shouldReduceMotion) {
      confetti({
        particleCount: 20,
        angle: 60,
        spread: 55,
        origin: { x: 0.9, y: 0.9 },
        colors: ['#FF6B35', '#F7931E', '#FDC830']
      });
    }

    // Toast de confirmation avec action "Annuler"
    const truncatedName = product.name.length > 40
      ? product.name.substring(0, 40) + '…'
      : product.name;
    toast({
      title: 'Ajouté au panier',
      description: truncatedName,
      duration: 4000,
      action: (
        <ToastAction
          altText="Annuler l'ajout au panier"
          onClick={() => {
            // Revert local
            setLocalCart(localSnapshot);
            // Revert global cart
            if (prevGlobalQty === 0) {
              removeFromCartGlobal(product.id);
            } else {
              updateQuantityGlobal(product.id, prevGlobalQty);
            }
          }}
        >
          Annuler
        </ToastAction>
      ),
    });
  };

  const handleCheckout = () => {
    if (localCart.length === 0) return;
    
    // Confetti de célébration
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FF6B35', '#F7931E', '#FDC830', '#9333EA']
    });
    
    // Toast de confirmation
    toast({
      title: '🎉 Commande créée !',
      description: `${localCart.length} produit(s) ajouté(s) à vos commandes`,
    });
    
    // Vider le panier local
    setLocalCart([]);
    
    // Fermer la vue vendeur après 2 secondes
    setTimeout(() => {
      if (onClose) onClose();
    }, 2000);
  };

  const handleSubscribe = async () => {
    if (!user) {
      toast({
        title: '🔒 Connectez-vous',
        description: 'Créez un compte pour vous abonner à cette boutique.',
      });
      return;
    }

    try {
      const newState = !isSubscribed;
      
      // ✅ CORRECTION : Migrer vers vendor_subscriptions
      const { error } = await supabase
        .from('vendor_subscriptions')
        .upsert({
          customer_id: user.id,
          subscriber_id: user.id,
          vendor_id: vendorId,
          is_active: newState
        }, {
          onConflict: 'customer_id,vendor_id'
        });
      
      if (error) {
        console.error('[VendorStoreView] Subscribe error:', {
          error,
          code: error?.code,
          message: error?.message,
          details: error?.details,
          hint: error?.hint
        });
        throw error;
      }
      
      setIsSubscribed(newState);
      
      toast({
        title: newState ? '🎉 Abonné !' : 'Désabonné',
        description: newState 
          ? 'Vous recevrez des notifications des nouveautés de cette boutique.'
          : 'Vous ne recevrez plus de notifications.',
      });
      
      loadVendorData();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error?.message || 'Impossible de modifier l\'abonnement.'
      });
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex flex-col">
        <div className="flex items-center gap-4 p-4 border-b">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="animate-pulse">
            <div className="h-6 bg-muted rounded w-32 mb-2" />
            <div className="h-4 bg-muted rounded w-24" />
          </div>
        </div>
        <div className="p-4 grid grid-cols-3 gap-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-square bg-muted rounded-lg mb-2" />
              <div className="h-3 bg-muted rounded mb-1" />
              <div className="h-3 bg-muted rounded w-3/4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* 1) Top bar épuré ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white">
        <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="font-bold text-base text-gray-900 truncate px-2">
          {vendor?.shop_name || vendor?.display_name || 'Boutique'}
        </h1>
        <button
          type="button"
          onClick={() => {
            document.querySelector('[data-vendor-cart]')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
          className="relative w-10 h-10 rounded-full flex items-center justify-center text-gray-700 active:scale-95 transition-transform shrink-0"
          style={{ touchAction: 'manipulation' }}
        >
          <ShoppingCart className="w-5 h-5" />
          {localCart.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
              {localCart.reduce((s, i) => s + i.quantity, 0)}
            </span>
          )}
        </button>
      </div>

      {/* Zone scrollable unifiée ───────────────────────────────── */}
      <div
        className="flex-1 overflow-y-auto overflow-x-hidden"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >

      {/* 2) Hero centré ────────────────────────────────────────────── */}
      <div className="bg-white flex flex-col items-center px-4 pt-6 pb-4">
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-100 shadow-md">
            {vendor?.shop_logo_url ? (
              <img
                src={vendor.shop_logo_url}
                className="w-full h-full object-cover"
                alt="Logo boutique"
              />
            ) : vendor?.avatar_url ? (
              <img
                src={vendor.avatar_url}
                className="w-full h-full object-cover"
                alt="Avatar"
              />
            ) : (
              <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold">
                {vendor?.shop_name?.[0] || vendor?.display_name?.[0] || 'V'}
              </div>
            )}
          </div>
          {/* Badge vérifié bottom-right */}
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center shadow-sm">
            <Shield className="h-3.5 w-3.5 text-white" />
          </div>
        </div>

        <h2 className="text-xl font-black text-gray-900 mt-3 text-center">
          {vendor?.shop_name || vendor?.display_name || 'Boutique'}
        </h2>
        {(vendor as any)?.shop_type === 'supermarket' && (
          <Badge variant="secondary" className="mt-1 text-[10px] px-2 py-0 h-5 bg-emerald-500/10 text-emerald-600 border-0">
            🛒 Supermarché
          </Badge>
        )}
        <p className="text-sm text-gray-500 mt-1 text-center line-clamp-2 max-w-sm">
          {vendor?.shop_description || vendor?.bio || 'Vendeur certifié Tembea'}
        </p>

        {/* 3) Stats pills ────────────────────────────────────────── */}
        <div className="flex gap-3 justify-center mt-4 flex-wrap">
          <span className="bg-gray-100 rounded-full px-3 py-1 text-xs font-medium text-gray-700">
            📦 {activeProductsCount} produits
          </span>
          <button
            type="button"
            onClick={() => {
              document.getElementById('vendor-reviews-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="bg-gray-100 rounded-full px-3 py-1 text-xs font-medium text-gray-700 active:scale-95 transition-transform"
          >
            ⭐ {vendor?.average_rating?.toFixed(1) || '0.0'}
          </button>
          <span className="bg-gray-100 rounded-full px-3 py-1 text-xs font-medium text-gray-700">
            🔥 {vendor?.total_sales || 0} ventes
          </span>
        </div>

        {/* 4) Action buttons ─────────────────────────────────────── */}
        <div className="flex gap-3 justify-center mt-5 w-full max-w-xs">
          <Button
            onClick={() => openChat({
              contextType: 'marketplace',
              participantId: vendor?.user_id || vendorId,
              title: vendor?.shop_name || 'Boutique'
            })}
            variant="outline"
            className="flex-1 h-10 text-sm rounded-full border-gray-300 text-gray-900 bg-white hover:bg-gray-50 gap-1.5"
          >
            <MessageCircle className="h-4 w-4" />
            Contacter
          </Button>
          <Button
            onClick={handleSubscribe}
            className={cn(
              'flex-1 h-10 text-sm rounded-full gap-1.5',
              isSubscribed
                ? 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                : 'bg-red-600 text-white hover:bg-red-700'
            )}
          >
            <Users className="h-4 w-4" />
            {isSubscribed ? 'Abonné' : "S'abonner"}
          </Button>
        </div>
      </div>

      {/* Mini Cart Summary - Simplifié */}
      <AnimatePresence>
        {localCart.length > 0 && (
          <motion.div
            data-vendor-cart
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b overflow-hidden"
          >
            <div className="px-4 py-3 bg-card">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <ShoppingCart className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <span className="text-sm font-medium">
                      {localCart.reduce((sum, item) => sum + item.quantity, 0)} article(s)
                    </span>
                    <p className="text-xs text-muted-foreground">
                      {new Intl.NumberFormat('fr-CD', {
                        style: 'currency',
                        currency: 'XOF',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                      }).format(localCart.reduce((sum, item) => sum + (item.price * item.quantity), 0))}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setLocalCart([])}
                    className="text-xs min-h-[44px]"
                  >
                    Vider
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      document.getElementById('vendor-checkout-button')?.scrollIntoView({
                        behavior: 'smooth',
                        block: 'end'
                      });
                    }}
                    className="min-h-[44px]"
                  >
                    Commander
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recherche — sticky en haut de la zone scrollable */}
      <div className="sticky top-0 z-20 bg-background border-b border-border px-4 py-3 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher dans cette boutique..."
            aria-label="Rechercher dans la boutique"
            className="pl-10 h-11 bg-muted/50 border-border/50"
          />
        </div>
      </div>


      {/* Products Grid */}
      <div>
        <div className="p-4">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-medium mb-2">Aucun produit trouvé</h3>
              <p className="text-sm text-muted-foreground">
                Essayez un autre terme de recherche
              </p>
            </div>
          ) : (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: {
                    staggerChildren: shouldReduceMotion ? 0 : 0.05
                  }
                }
              }}
              className="grid grid-cols-2 gap-3"
            >
              {filteredProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  variants={
                    shouldReduceMotion
                      ? { hidden: { opacity: 0 }, visible: { opacity: 1 } }
                      : {
                          hidden: { opacity: 0, y: 20, scale: 0.9 },
                          visible: {
                            opacity: 1,
                            y: 0,
                            scale: 1,
                            transition: {
                              type: 'spring',
                              stiffness: 300,
                              damping: 20
                            }
                          }
                        }
                  }
                  whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
                >
                  <CompactProductCard
                    product={product}
                    onAddToCart={() => handleAddToCart(product)}
                    onViewDetails={() => onViewDetails(product)}
                    userLocation={userLocation}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      {/* Reviews Section */}
      {!loading && (
        <VendorReviewsSection
          vendorId={vendorId}
          averageRating={vendor?.average_rating || 0}
          totalRatings={vendor?.rating_count || 0}
        />
      )}

      {/* Similar Vendors Section */}
      {!loading && products.length > 0 && (
        <SimilarVendorsSlider
          currentVendorId={vendorId}
          currentMainCategory={vendor?.main_category}
          onVisitVendor={(id) => {
            window.location.href = `/marketplace/vendor/${id}`;
          }}
        />
      )}

      </div>
      {/* /Zone scrollable unifiée ────────────────────────────── */}

      {/* Floating Cart Indicator */}
      <FloatingCartIndicator
        cartItems={localCart}
        onOpenCart={() => {
          document.getElementById('vendor-checkout-button')?.scrollIntoView({
            behavior: 'smooth',
            block: 'end'
          });
        }}
        className="bottom-24"
      />

      {/* Checkout Bar */}
      <VendorCheckoutBar
        cartItems={localCart}
        onCheckout={handleCheckout}
        vendorName={vendor?.shop_name || vendor?.display_name || 'cette boutique'}
      />

      {/* Rating Dialog */}
      <VendorRatingDialog
        open={ratingDialogOpen}
        onOpenChange={setRatingDialogOpen}
        vendorId={vendorId}
        vendorName={vendor?.shop_name || vendor?.display_name || 'Boutique'}
        vendorLogo={vendor?.shop_logo_url || vendor?.avatar_url}
        onSuccess={() => {
          loadVendorData();
          checkRatingEligibility();
        }}
      />
    </div>
  );
};