import { useState, useEffect } from 'react';
import type { FoodCartItem } from '@/types/food';

const STORAGE_KEY = 'kwenda_food_cart';
const CART_EXPIRY_HOURS = 24;

interface StoredCart {
  items: FoodCartItem[];
  restaurantId: string;
  restaurantName?: string;
  expiresAt: number;
}

export const useFoodCart = (restaurantId?: string) => {
  const [cart, setCart] = useState<FoodCartItem[]>([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    const loadCart = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return;

        const parsedCart: StoredCart = JSON.parse(stored);
        
        // Check if cart is expired
        if (Date.now() > parsedCart.expiresAt) {
          localStorage.removeItem(STORAGE_KEY);
          return;
        }

        // Mode restaurant unique : vérifier la cohérence
        if (restaurantId && parsedCart.restaurantId !== restaurantId) {
          return; // Ne pas charger si restaurant différent
        }
        
        // Mode multi-restaurant (pas de restaurantId) ou restaurant correspondant
        if (!restaurantId || parsedCart.restaurantId === restaurantId) {
          setCart(parsedCart.items);
        }
      } catch (error) {
        console.error('Error loading cart:', error);
        localStorage.removeItem(STORAGE_KEY);
      }
    };

    loadCart();
  }, [restaurantId]);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    try {
      if (cart.length === 0) {
        localStorage.removeItem(STORAGE_KEY);
        return;
      }

      // Déterminer le restaurantId à sauvegarder
      const cartRestaurantId = restaurantId || cart[0]?.restaurant_id;
      
      if (!cartRestaurantId) {
        console.warn('Cannot save cart: no restaurant ID');
        return;
      }

      const expiresAt = Date.now() + (CART_EXPIRY_HOURS * 60 * 60 * 1000);
      const storedCart: StoredCart = {
        items: cart,
        restaurantId: cartRestaurantId,
        expiresAt
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(storedCart));
    } catch (error) {
      console.error('Error saving cart:', error);
    }
  }, [cart, restaurantId]);

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return {
    cart,
    setCart,
    clearCart
  };
};
