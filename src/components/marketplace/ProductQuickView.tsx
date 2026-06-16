import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, Plus, Minus, ExternalLink, Star, Store, MapPin, MessageCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { MarketplaceProduct } from '@/types/marketplace';
import { formatCurrency } from '@/utils/formatCurrency';
type Product = MarketplaceProduct;

interface ProductQuickViewProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
  onViewFullDetails: (product: Product) => void;
  cartQuantity?: number;
}

export const ProductQuickView = ({
  product,
  isOpen,
  onClose,
  onAddToCart,
  onViewFullDetails,
  cartQuantity = 0
}: ProductQuickViewProps) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  // Log de debug pour vérifier l'ouverture
  useEffect(() => {
    if (isOpen && product) {
      console.log('🔍 [ProductQuickView] Ouverture pour:', product.title);
    }
  }, [isOpen, product]);

  if (!product) return null;

  const formatPrice = (price: number) => formatCurrency(price, 'XOF');

  const handleAddToCart = () => {
    onAddToCart(product, quantity);
    setQuantity(1);
  };

  const totalPrice = product.price * quantity;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden p-0">
        <div className="grid md:grid-cols-2 gap-0 max-h-[90vh]">
          {/* Gauche : Galerie images */}
          <div className="bg-muted/30 p-4 sm:p-6 flex flex-col gap-3">
            {/* Image principale */}
            <motion.div
              key={selectedImage}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="aspect-square rounded-lg overflow-hidden bg-card shadow-md"
            >
              <img
                src={product.images[selectedImage] || product.image}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            </motion.div>

            {/* Miniatures */}
            {product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {product.images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-all ${
                      selectedImage === index 
                        ? 'border-primary scale-105' 
                        : 'border-transparent hover:border-muted-foreground/30'
                    }`}
                  >
                    <img src={img} alt={`${product.title} ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Droite : Informations et actions */}
          <div className="flex flex-col max-h-[90vh] overflow-y-auto">
            <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3">
              <DialogTitle className="text-xl sm:text-2xl font-bold leading-tight pr-8">
                {product.title}
              </DialogTitle>
            </DialogHeader>

            <div className="flex-1 px-4 sm:px-6 space-y-4">
              {/* Rating et Reviews */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
                  <span className="font-semibold text-lg">{product.rating > 0 ? product.rating.toFixed(1) : '0.0'}</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  ({product.reviews} avis)
                </span>
                <Badge variant="outline" className="ml-auto">
                  {product.condition === 'new' ? 'Neuf' : 'Occasion'}
                </Badge>
              </div>

              {/* Prix */}
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Prix unitaire</p>
                <p className="text-3xl font-bold text-primary">
                  {formatPrice(product.price)}
                </p>
              </div>

              {/* Description courte */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Description</p>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {product.description}
                </p>
              </div>

              <Separator />

              {/* Vendeur */}
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <Store className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Vendu par</p>
                    <p className="font-medium text-sm">{product.seller?.display_name || 'Vendeur'}</p>
                  </div>
                </div>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </div>

              {/* Bouton Contacter le vendeur */}
              <Button
                variant="outline"
                className="w-full"
                onClick={async (e) => {
                  e.stopPropagation();
                  try {
                    const { useUniversalChat } = await import('@/hooks/useUniversalChat');
                    const hook = useUniversalChat();
                    const conv = await hook.createOrFindConversation(
                      'marketplace',
                      product.seller_id,
                      product.id,
                      `Discussion sur : ${product.title}`
                    );
                    if (conv) {
                      window.location.href = '/marketplace?tab=messages';
                    }
                  } catch (error) {
                    console.error('Error creating conversation:', error);
                    if ((error as Error).message?.includes('vous-même')) {
                      alert('Vous ne pouvez pas contacter votre propre boutique');
                    } else {
                      alert('Erreur lors de la création de la conversation');
                    }
                  }
                }}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Contacter le vendeur
              </Button>

              {/* Sélecteur de quantité */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Quantité</p>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-muted rounded-lg px-2 py-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="text-base font-semibold min-w-8 text-center">{quantity}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setQuantity(quantity + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Total:</p>
                    <p className="text-lg font-bold text-primary">{formatPrice(totalPrice)}</p>
                  </div>
                </div>
              </div>

              {/* Stock indicator */}
              {!product.inStock && (
                <Badge variant="destructive" className="w-full justify-center py-2">
                  Rupture de stock
                </Badge>
              )}
              {cartQuantity > 0 && (
                <Badge variant="secondary" className="w-full justify-center py-2 bg-green-100 text-green-800">
                  Déjà au panier: {cartQuantity} article{cartQuantity > 1 ? 's' : ''}
                </Badge>
              )}
            </div>

            {/* Actions footer */}
            <div className="border-t p-4 sm:p-6 space-y-3 bg-background/95 backdrop-blur-sm">
              <Button
                size="lg"
                className="w-full h-12 font-semibold text-base"
                onClick={handleAddToCart}
                disabled={!product.inStock}
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                Ajouter au panier
              </Button>
              
              <Button
                size="sm"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  onViewFullDetails(product);
                  onClose();
                }}
              >
                Voir tous les détails
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
