import React from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ModernVehicleCard } from './ModernVehicleCard';
import { useModernRentals } from '@/hooks/useModernRentals';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface SimilarVehiclesProps {
  currentVehicleId: string;
  categoryId: string;
  city: string;
}

export const SimilarVehicles: React.FC<SimilarVehiclesProps> = ({ 
  currentVehicleId, 
  categoryId,
  city 
}) => {
  const { vehicles } = useModernRentals();

  // Filtrer véhicules similaires (même catégorie, même ville, différent ID)
  const similarVehicles = vehicles
    .filter(v => 
      v.id !== currentVehicleId && 
      v.category_id === categoryId &&
      v.city === city
    )
    .slice(0, 6);

  if (similarVehicles.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-4 sm:px-0">
        <h3 className="font-bold text-base sm:text-lg flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Véhicules similaires
        </h3>
        <Button variant="link" size="sm" className="text-xs sm:text-sm">
          Voir plus
        </Button>
      </div>

      {/* Mobile: carousel simple */}
      <div className="sm:hidden">
        <div className="flex gap-3 overflow-x-auto pb-4 px-4 -mx-4 snap-x snap-mandatory scrollbar-hide">
          {similarVehicles.map((vehicle, index) => (
            <div key={vehicle.id} className="w-[85vw] shrink-0 snap-center">
              <ModernVehicleCard vehicle={vehicle} index={index} />
            </div>
          ))}
        </div>
      </div>

      {/* Desktop: carousel avec contrôles */}
      <div className="hidden sm:block">
        <Carousel className="w-full">
          <CarouselContent className="-ml-4">
            {similarVehicles.map((vehicle, index) => (
              <CarouselItem key={vehicle.id} className="pl-4 md:basis-1/2 lg:basis-1/3">
                <ModernVehicleCard vehicle={vehicle} index={index} />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-0" />
          <CarouselNext className="right-0" />
        </Carousel>
      </div>
    </div>
  );
};
