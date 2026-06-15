import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { CartItem } from '@/types/marketplace';

interface CartContextType {
  cartItems: CartItem[];
  cartCount: number;
  cartTotal: number;
  addToCart: (product: any) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  isInCart: (id: string) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const { toast } = useToast();

  // Load cart from localStorage on mount with robust validation
  useEffect(() => {
    const loadCart = () => {
      try {
        const saved = localStorage.getItem('kwenda_cart');
        if (!saved) return;

        const parsed = JSON.parse(saved);
        
        // Vérifier l'intégrité des données
        if (!Array.isArray(parsed)) {
          console.error('[CartContext] Invalid cart data - not an array');
          localStorage.removeItem('kwenda_cart');
          return;
        }

        // Valider chaque item
        const validItems = parsed.filter(item => 
          item.id && item.name && typeof item.price === 'number' && item.quantity > 0
        );

        if (validItems.length !== parsed.length) {
          console.warn('[CartContext] Some cart items were invalid:', parsed.length - validItems.length, 'removed');
          toast({
            title: "Panier nettoyé",
            description: `${parsed.length - validItems.length} article(s) invalide(s) retiré(s)`,
            duration: 3000
          });
        }

        setCartItems(validItems);
        console.log('[CartContext] Cart loaded:', validItems.length, 'valid items');
      } catch (error) {
        console.error('[CartContext] Error loading cart:', error);
        localStorage.removeItem('kwenda_cart');
        toast({
          title: "Erreur de chargement",
          description: "Le panier a été réinitialisé",
          variant: "destructive",
          duration: 3000
        });
      }
    };

    loadCart();
  }, []);

  // Save cart to localStorage with optimized debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      try {
        if (cartItems.length === 0) {
          localStorage.removeItem('kwenda_cart');
          console.log('[CartContext] Cart cleared from localStorage');
        } else {
          localStorage.setItem('kwenda_cart', JSON.stringify(cartItems));
          console.log('[CartContext] Cart saved:', cartItems.length, 'items');
        }
      } catch (error) {
        console.error('[CartContext] Error saving cart:', error);
      }
    }, 500); // Debounce optimisé à 500ms

    return () => clearTimeout(timeoutId);
  }, [cartItems]);

  const addToCart = (product: any) => {
    // Gérer à la fois inStock (MarketplaceProduct) et isAvailable (ancien format)
    const isProductAvailable = product.inStock ?? product.isAvailable ?? true;
    
    if (!isProductAvailable) {
      toast({
        title: "Produit indisponible",
        description: "Ce produit n'est plus en stock",
        variant: "destructive",
      });
      return;
    }

    const existingItem = cartItems.find(item => item.id === product.id);
    
    if (existingItem) {
      updateQuantity(product.id, existingItem.quantity + 1);
      // Pas de toast ici, géré par le composant appelant
    } else {
      // Validation stricte des données
      const cartItem: CartItem = {
        id: product.id || `temp_${Date.now()}`,
        product_id: product.id,
        name: (product.title || product.name || 'Produit').substring(0, 100),
        price: Math.max(0, product.price || 0),
        originalPrice: product.originalPrice,
        image: product.image || (product.images?.[0]) || '/placeholder-product.png',
        quantity: 1,
        seller: (product.seller?.display_name || product.seller || 'Vendeur').substring(0, 50),
        seller_id: product.seller_id || product.sellerId || 'unknown',
        category: product.category || 'general',
        isAvailable: product.inStock ?? product.isAvailable ?? true,
        coordinates: product.coordinates,
      };

      // Validation finale avant ajout
      if (!cartItem.id || !cartItem.name || cartItem.price < 0) {
        console.error('[CartContext] Invalid cart item:', cartItem);
        toast({
          title: "Erreur",
          description: "Impossible d'ajouter ce produit au panier",
          variant: "destructive"
        });
        return;
      }
      
      setCartItems(prev => [...prev, cartItem]);
      
      // Analytics tracking
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'add_to_cart', {
          event_category: 'Cart',
          product_id: product.id,
          product_name: cartItem.name,
          price: product.price,
          quantity: 1
        });
      }
    }
  };

  const removeFromCart = (id: string) => {
    console.log('[CartContext] Removing item with ID:', id);
    const item = cartItems.find(item => item.id === id || item.product_id === id);
    
    setCartItems(prev => {
      const newCart = prev.filter(item => item.id !== id && item.product_id !== id);
      console.log('[CartContext] Cart after removal:', newCart.length, 'items');
      return newCart;
    });
    
    if (item) {
      toast({
        title: "Retiré du panier",
        description: `${item.name} a été retiré de votre panier`,
      });

      // Analytics tracking
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'remove_from_cart', {
          event_category: 'Cart',
          product_id: id,
          product_name: item.name,
          cart_value: cartTotal
        });
      }
    }
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }

    setCartItems(prev => 
      prev.map(item => 
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    const itemCount = cartItems.length;
    const totalValue = cartTotal;
    
    setCartItems([]);
    toast({
      title: "Panier vidé",
      description: `${itemCount} article(s) retiré(s) de votre panier`,
    });

    // Analytics tracking
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'clear_cart', {
        event_category: 'Cart',
        items_count: itemCount,
        cart_value: totalValue
      });
    }
  };

  const isInCart = (id: string) => {
    return cartItems.some(item => item.id === id);
  };

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);

  const value: CartContextType = {
    cartItems,
    cartCount,
    cartTotal,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    isInCart,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};