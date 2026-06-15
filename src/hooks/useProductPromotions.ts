import { useMemo } from 'react';
import { differenceInDays } from 'date-fns';
import { MarketplaceProduct } from '@/types/marketplace';

/**
 * Hook pour calculer les promotions dynamiques basées sur :
 * - Stock faible = grosse promo (50-80%)
 * - Produits anciens = promo moyenne (10-30%)
 * - Produits récents = pas de promo
 */
export const useProductPromotions = () => {
  const calculateDiscount = (product: MarketplaceProduct): number => {
    // Promo sur stock faible (1-5 unités)
    if (product.stockCount > 0 && product.stockCount <= 5) {
      // Plus le stock est bas, plus la promo est forte
      const baseDiscount = 50;
      const stockBonus = (6 - product.stockCount) * 6; // 6, 12, 18, 24, 30
      return Math.min(baseDiscount + stockBonus, 80);
    }
    
    // Promo sur produits anciens (>30 jours)
    if (product.created_at) {
      const daysSinceCreation = differenceInDays(new Date(), new Date(product.created_at));
      if (daysSinceCreation > 30) {
        // Plus le produit est ancien, plus la promo est forte
        const weeksSinceCreation = Math.floor(daysSinceCreation / 7);
        const discount = Math.min(10 + weeksSinceCreation * 2, 30);
        return discount;
      }
    }
    
    // Pas de promo pour les produits récents avec bon stock
    return 0;
  };

  const getOriginalPrice = (currentPrice: number, discount: number): number => {
    if (discount <= 0) return currentPrice;
    // Prix original = prix actuel / (1 - discount%)
    return Math.round(currentPrice / (1 - discount / 100));
  };

  const getPromotionLabel = (discount: number): string => {
    if (discount >= 50) return '🔥 Méga Promo';
    if (discount >= 30) return '⚡ Super Deal';
    if (discount >= 10) return '💰 Bonne affaire';
    return '';
  };

  return {
    calculateDiscount,
    getOriginalPrice,
    getPromotionLabel
  };
};
