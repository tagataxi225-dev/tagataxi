import React from 'react';
import { motion } from 'framer-motion';
import { Store } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';
import { VendorCard } from './VendorCard';
import { useSimilarVendors, getBadgeType } from '@/hooks/useSimilarVendors';

interface SimilarVendorsSliderProps {
  currentVendorId: string;
  currentMainCategory?: string;
  onVisitVendor: (vendorId: string) => void;
}

export const SimilarVendorsSlider: React.FC<SimilarVendorsSliderProps> = ({
  currentVendorId,
  currentMainCategory,
  onVisitVendor,
}) => {
  const { data: vendors = [], isLoading } = useSimilarVendors(currentVendorId, 10);

  const autoplayPlugin = React.useRef(
    Autoplay({ delay: 5000, stopOnInteraction: true, stopOnMouseEnter: true })
  );

  // Don't render if no vendors or loading
  if (isLoading || vendors.length === 0) {
    return null;
  }

  return (
    <section className="py-8 px-4 bg-gradient-to-b from-background to-muted/20 border-t">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6 max-w-7xl mx-auto"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-purple-600">
            <Store className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Boutiques similaires
          </h2>
          <Badge variant="secondary" className="text-sm font-semibold">
            {vendors.length}
          </Badge>
        </div>
      </motion.div>

      {/* Carousel */}
      <div className="max-w-7xl mx-auto">
        <Carousel
          plugins={[autoplayPlugin.current]}
          opts={{
            align: 'start',
            loop: vendors.length > 4,
          }}
          onMouseEnter={() => autoplayPlugin.current.stop()}
          onMouseLeave={() => autoplayPlugin.current.reset()}
          className="w-full"
        >
          <CarouselContent className="-ml-3">
            {vendors.map((vendor, index) => (
              <CarouselItem
                key={vendor.user_id}
                className="pl-3 basis-[80%] sm:basis-1/2 lg:basis-1/3 xl:basis-1/4"
              >
                <VendorCard
                  vendor={vendor}
                  badge={getBadgeType(vendor, currentMainCategory)}
                  onVisit={onVisitVendor}
                  index={index}
                />
              </CarouselItem>
            ))}
          </CarouselContent>

          {/* Navigation arrows - hidden on mobile */}
          <CarouselPrevious className="hidden md:flex -left-4 hover:bg-primary hover:text-primary-foreground" />
          <CarouselNext className="hidden md:flex -right-4 hover:bg-primary hover:text-primary-foreground" />
        </Carousel>

        {/* Mobile swipe hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-xs text-center text-muted-foreground mt-4 md:hidden animate-pulse"
        >
          ← Faites glisser pour découvrir plus de boutiques →
        </motion.p>
      </div>
    </section>
  );
};
