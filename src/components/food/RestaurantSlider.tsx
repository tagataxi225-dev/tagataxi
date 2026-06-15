import { useState } from 'react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { RestaurantCard } from './RestaurantCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
import Autoplay from 'embla-carousel-autoplay';
import type { Restaurant } from '@/types/food';

interface RestaurantSliderProps {
  restaurants: Restaurant[];
  loading: boolean;
  onSelectRestaurant: (restaurant: Restaurant) => void;
  title?: string;
  onViewAll?: () => void;
}

export const RestaurantSlider = ({ 
  restaurants, 
  loading, 
  onSelectRestaurant,
  title = "Restaurants populaires",
  onViewAll
}: RestaurantSliderProps) => {
  const [autoplay] = useState(() => 
    Autoplay({ delay: 4000, stopOnInteraction: true })
  );

  if (loading) {
    return (
      <div className="space-y-3 px-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="flex gap-3 overflow-hidden">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-44 w-72 rounded-xl flex-shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  if (restaurants.length === 0) return null;

  return (
    <div className="space-y-3 px-4 py-4">
      {/* Header épuré */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-foreground">
            {title}
          </h2>
          <span className="px-2 py-0.5 bg-muted text-muted-foreground rounded-full text-xs font-medium">
            {restaurants.length}
          </span>
        </div>
        {onViewAll && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onViewAll}
            className="text-xs text-primary h-8 px-2"
          >
            Voir tout
            <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
          </Button>
        )}
      </div>

      {/* Slider */}
      <Carousel
        plugins={[autoplay]}
        className="w-full"
        opts={{
          align: "start",
          loop: true,
        }}
      >
        <CarouselContent className="-ml-3">
          {restaurants.map((restaurant) => (
            <CarouselItem key={restaurant.id} className="pl-3 basis-[82%] sm:basis-1/2 lg:basis-1/3">
              <RestaurantCard
                restaurant={restaurant}
                onClick={() => onSelectRestaurant(restaurant)}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
        
        {/* Contrôles desktop uniquement */}
        <div className="hidden md:block">
          <CarouselPrevious className="absolute -left-3 top-1/2 -translate-y-1/2 h-8 w-8" />
          <CarouselNext className="absolute -right-3 top-1/2 -translate-y-1/2 h-8 w-8" />
        </div>
      </Carousel>
    </div>
  );
};
