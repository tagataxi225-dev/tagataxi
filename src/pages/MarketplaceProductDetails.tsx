import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@/hooks/useWallet';
import { useChat } from '@/components/chat/ChatProvider';
import { useUniversalChat } from '@/hooks/useUniversalChat';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { FileText, AlertCircle, Package, DollarSign, MapPin } from 'lucide-react';
import { TopUpModal } from '@/components/wallet/TopUpModal';
import { SuccessConfetti } from '@/components/wallet/SuccessConfetti';

// Components
import { MarketplaceProductHeader } from '@/components/marketplace/MarketplaceProductHeader';
import { MarketplaceImageGallery } from '@/components/marketplace/MarketplaceImageGallery';
import { ProductInfoCard } from '@/components/marketplace/ProductInfoCard';
import { SellerInfoCard } from '@/components/marketplace/SellerInfoCard';
import { PurchaseCard } from '@/components/marketplace/PurchaseCard';
import { MobileBottomCTA } from '@/components/marketplace/MobileBottomCTA';
import { ProductReviewsSection } from '@/components/marketplace/ProductReviewsSection';
import { SimilarProductsCarousel } from '@/components/marketplace/SimilarProductsCarousel';
import { ProductSpecifications } from '@/components/marketplace/ProductSpecifications';
import { UnifiedShoppingCart } from '@/components/marketplace/cart/UnifiedShoppingCart';
import { ProductQASection } from '@/components/marketplace/ProductQASection';

// Hooks
import { useMarketplaceProductDetails, useSimilarProducts } from '@/hooks/useMarketplaceProductDetails';
import { productToCartItem } from '@/types/marketplace';

const MarketplaceProductDetails = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { wallet } = useWallet();
  const { openChat } = useChat();
  const { createOrFindConversation } = useUniversalChat();
  
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Fetch product data
  const { data: product, isLoading, error } = useMarketplaceProductDetails(productId || '');
  const { data: similarProducts = [] } = useSimilarProducts(
    productId || '',
    product?.category || '',
    product?.seller_id || ''
  );

  // Error state rendu directement (pas de redirect automatique)
  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen flex items-center justify-center bg-background p-4"
      >
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
            <h2 className="text-xl font-bold">Produit introuvable</h2>
            <p className="text-muted-foreground">
              Ce produit n'existe plus ou a été supprimé.
            </p>
            <Button onClick={() => navigate('/marketplace')} className="w-full">
              Retour à la marketplace
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  const handleAddToCart = (quantity: number = 1) => {
    if (!product) return;

    const existingItem = cartItems.find(item => item.id === product.id);
    
    if (existingItem) {
      setCartItems(cartItems.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + quantity }
          : item
      ));
    } else {
      const cartItem = productToCartItem(product, quantity);
      setCartItems([...cartItems, cartItem]);
    }

    toast.success(`${quantity} article(s) ajouté(s) au panier`);
  };

  const handleBuyNow = (quantity: number = 1) => {
    if (!user) {
      toast.error('Veuillez vous connecter');
      navigate('/auth/login');
      return;
    }

    handleAddToCart(quantity);
    setIsCartOpen(true);
  };

  const handleTopUp = () => {
    setShowTopUpModal(true);
  };

  const handleContactSeller = async () => {
    if (!user) {
      toast.error('Veuillez vous connecter pour contacter le vendeur');
      navigate('/auth/login');
      return;
    }

    if (!product) return;

    try {
      const conversation = await createOrFindConversation(
        'marketplace',
        product.seller_id,
        product.id,
        `Discussion sur : ${product.title}`
      );

      if (conversation) {
        openChat({
          contextType: 'marketplace',
          contextId: product.id,
          participantId: product.seller_id,
          title: `Chat avec ${(product as any).vendor?.shop_name || 'le vendeur'}`,
          quickActions: [
            { 
              label: "📦 Disponibilité ?", 
              action: () => {},
              icon: Package
            },
            { 
              label: "💰 Prix négociable ?", 
              action: () => {},
              icon: DollarSign
            },
            { 
              label: "📍 Lieu de retrait ?", 
              action: () => {},
              icon: MapPin
            }
          ]
        });
        
        toast.success('Chat ouvert avec le vendeur');
      }
    } catch (error) {
      console.error('Erreur ouverture chat:', error);
      toast.error('Impossible d\'ouvrir le chat');
    }
  };

  const handleRemoveFromCart = (productId: string) => {
    setCartItems(cartItems.filter(item => item.id !== productId));
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveFromCart(productId);
      return;
    }
    setCartItems(cartItems.map(item =>
      item.id === productId ? { ...item, quantity } : item
    ));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-lg border-b">
          <div className="container mx-auto px-4 h-16">
            <Skeleton className="h-full w-full" />
          </div>
        </div>
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-[1.5fr,1fr] gap-6">
            <Skeleton className="aspect-square" />
            <Skeleton className="h-96" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  const walletBalance = wallet?.balance || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-background pb-safe"
    >
      {/* Header */}
      <MarketplaceProductHeader
        title={product.title}
        cartCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)}
        onCartClick={() => setIsCartOpen(true)}
      />
      
      {/* Main Content */}
      <div className="container mx-auto px-4 py-2 sm:py-4">
        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr,1fr] gap-3 lg:gap-6">
          
          {/* Colonne Gauche - Galerie & Détails */}
          <div className="space-y-3">
            {/* Galerie */}
            <MarketplaceImageGallery
              images={product.images}
              productTitle={product.title}
              videoUrl={product.video_url}
            />
            
            {/* Description complète (desktop seulement) */}
            <Card className="hidden lg:block">
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Description
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {product.description}
                </p>
              </CardContent>
            </Card>
            
            {/* Spécifications techniques */}
            {product.specifications && Object.keys(product.specifications).length > 0 && (
              <ProductSpecifications specifications={product.specifications as Record<string, string>} />
            )}
            
            {/* Reviews section */}
            <ProductReviewsSection
              avgRating={product.rating}
              reviews={[]}
            />
            
            {/* Q&A Section */}
            <ProductQASection
              productId={product.id}
              sellerId={product.seller_id}
            />
            
            {/* Produits similaires */}
            <SimilarProductsCarousel
              products={similarProducts}
              onAddToCart={(productId) => handleAddToCart(1)}
            />
          </div>
          
          {/* Colonne Droite - Infos & Actions */}
          <div className="space-y-3">
            {/* Card Infos Produit */}
            <ProductInfoCard
              title={product.title}
              category={product.category}
              condition={product.condition}
              description={product.description}
              price={product.price}
              rating={product.rating}
              reviewCount={product.reviews}
              stockCount={product.stockCount}
              brand={product.brand}
            />
            
            {/* Card Vendeur */}
            <SellerInfoCard
              sellerId={product.seller_id}
              sellerName={(product as any).vendor?.shop_name || 'Vendeur'}
              sellerAvatar={(product as any).vendor?.shop_logo_url}
              sellerRating={(product as any).vendor?.average_rating || 0}
              totalSales={(product as any).vendor?.total_sales || 0}
              productCount={(product as any).vendor?.product_count || 0}
              responseRate={95}
            />
            
            {/* Desktop CTA fixe */}
            <div className="hidden lg:block">
              <PurchaseCard
                productId={product.id}
                productPrice={product.price}
                stockCount={product.stockCount}
                walletBalance={walletBalance}
                onAddToCart={handleAddToCart}
                onBuyNow={handleBuyNow}
                onTopUp={handleTopUp}
                onContactSeller={handleContactSeller}
                sellerName={(product as any).vendor?.shop_name || 'le vendeur'}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile Bottom CTA */}
      <MobileBottomCTA
        productPrice={product.price}
        stockCount={product.stockCount}
        walletBalance={walletBalance}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
        onTopUp={handleTopUp}
        onContactSeller={handleContactSeller}
      />

      {/* Shopping Cart */}
      <UnifiedShoppingCart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onRemoveItem={handleRemoveFromCart}
        onUpdateQuantity={handleUpdateQuantity}
      />

      {/* Top Up Modal */}
      <TopUpModal
        open={showTopUpModal}
        onClose={() => setShowTopUpModal(false)}
        onSuccess={() => {
          setShowConfetti(true);
          toast.success('Rechargement effectué avec succès !');
        }}
        currency={wallet?.currency || 'XOF'}
        quickAmounts={[5000, 10000, 25000, 50000, 100000]}
      />

      {/* Confetti de succès */}
      <SuccessConfetti 
        show={showConfetti} 
        onComplete={() => setShowConfetti(false)} 
      />
    </motion.div>
  );
};

export default MarketplaceProductDetails;
