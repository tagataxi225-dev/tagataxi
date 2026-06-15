import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { CompactProductCard } from './CompactProductCard';
import { Skeleton } from '../ui/skeleton';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';

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
}

interface HorizontalProductScrollProps {
  title: string;
  products: Product[];
  onAddToCart: (product: Product) => void;
  onViewDetails: (product: Product) => void;
  onViewSeller?: (sellerId: string) => void;
  userLocation?: { lat: number; lng: number } | null;
  loading?: boolean;
  autoScroll?: boolean;
}

export const HorizontalProductScroll: React.FC<HorizontalProductScrollProps> = ({ 
  title, 
  products, 
  onAddToCart, 
  onViewDetails, 
  onViewSeller,
  userLocation, 
  loading = false,
  autoScroll = false
}) => {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!autoScroll || !scrollRef.current) return;

    const interval = setInterval(() => {
      scrollRef.current?.scrollBy({ 
        left: 300, 
        behavior: 'smooth' 
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [autoScroll]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 180; // Width of compact card + gap
      const currentScroll = scrollRef.current.scrollLeft;
      const targetScroll = direction === 'left' 
        ? currentScroll - scrollAmount 
        : currentScroll + scrollAmount;
      
      scrollRef.current.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-[160px]">
              <Skeleton className="aspect-square w-full rounded-lg mb-2" />
              <Skeleton className="h-3 w-full mb-1" />
              <Skeleton className="h-3 w-3/4 mb-1" />
              <Skeleton className="h-6 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* Header with navigation */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 rounded-full"
            onClick={() => scroll('left')}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 rounded-full"
            onClick={() => scroll('right')}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Horizontal scroll container */}
      <div 
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 smooth-scroll"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {products.map((product, i) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex-shrink-0"
            style={{ scrollSnapAlign: 'start' }}
          >
            <CompactProductCard
              product={product}
              onAddToCart={() => onAddToCart(product)}
              onViewDetails={() => onViewDetails(product)}
              onViewSeller={onViewSeller}
              userLocation={userLocation}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
};