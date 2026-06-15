import React from 'react';
import { motion } from 'framer-motion';
import { Star, ChevronRight, ShoppingCart, Verified } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface SupermarketCardProps {
  vendor: {
    user_id: string;
    shop_name: string;
    shop_logo_url?: string;
    shop_banner_url?: string;
    shop_description?: string;
    shop_type?: string;
    average_rating: number;
    total_sales: number;
    product_count: number;
    follower_count?: number;
  };
  onVisit: (vendorId: string) => void;
  index?: number;
  categories?: string[];
}

const DEFAULT_CATEGORIES = ['Alimentation', 'Hygiène', 'Boissons', 'Ménage'];

export const SupermarketCard: React.FC<SupermarketCardProps> = ({ vendor, onVisit, index = 0, categories }) => {
  const isVerified = vendor.total_sales > 10;
  const displayCategories = categories || DEFAULT_CATEGORIES;
  const firstCategory = displayCategories[0] || '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.2 }}
    >
      <Card
        className="p-3 rounded-xl border-l-2 border-l-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/10 border border-border/30 hover:border-border/60 transition-all duration-200 cursor-pointer shadow-none flex items-center gap-3"
        onClick={() => onVisit(vendor.user_id)}
      >
        {/* Logo 40px */}
        <div className="w-10 h-10 rounded-full shrink-0 overflow-hidden ring-1 ring-emerald-200/40 dark:ring-emerald-700/30">
          {vendor.shop_logo_url ? (
            <img
              src={vendor.shop_logo_url}
              alt={vendor.shop_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
              <ShoppingCart className="h-4 w-4" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className="font-semibold text-sm truncate">{vendor.shop_name}</span>
            {isVerified && <Verified className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
          </div>
          <span className="text-xs text-muted-foreground">
            {vendor.product_count} produits · {firstCategory}
          </span>
        </div>

        {/* Rating + Chevron */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-0.5">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span className="text-sm font-medium">{vendor.average_rating.toFixed(1)}</span>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </div>
      </Card>
    </motion.div>
  );
};
