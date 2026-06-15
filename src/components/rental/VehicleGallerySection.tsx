import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Images, ChevronRight } from 'lucide-react';
import { VehicleGalleryLightbox } from './VehicleGalleryLightbox';
import type { Json } from '@/integrations/supabase/types';

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  images?: Json | null;
}

interface Props {
  vehicles: Vehicle[];
}

export const VehicleGallerySection: React.FC<Props> = ({ vehicles }) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Collect all vehicle images with captions
  const allImages = vehicles.flatMap(vehicle => {
    const images = Array.isArray(vehicle.images) ? vehicle.images : [];
    return images.filter((url): url is string => typeof url === 'string').map((url, idx) => ({
      url,
      caption: `${vehicle.brand} ${vehicle.model}${idx > 0 ? ` (${idx + 1})` : ''}`,
    }));
  });

  // Display up to 8 images in grid
  const displayImages = allImages.slice(0, 8);
  const hasMore = allImages.length > 8;

  if (allImages.length === 0) {
    return null;
  }

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  return (
    <>
      <Card className="border-emerald-500/20 overflow-hidden mb-8">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-green-500" />
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Images className="h-5 w-5 text-emerald-500" />
              <h3 className="font-semibold">Galerie photos</h3>
            </div>
            {hasMore && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-emerald-600 hover:text-emerald-700"
                onClick={() => openLightbox(0)}
              >
                Voir tout ({allImages.length})
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {displayImages.map((image, idx) => (
              <button
                key={idx}
                onClick={() => openLightbox(idx)}
                className="relative aspect-[4/3] rounded-lg overflow-hidden group"
              >
                <img
                  src={image.url}
                  alt={image.caption}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                
                {/* Show "+X" on last image if there are more */}
                {idx === displayImages.length - 1 && hasMore && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white text-xl font-bold">
                      +{allImages.length - displayImages.length}
                    </span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <VehicleGalleryLightbox
        images={allImages}
        initialIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  );
};

export default VehicleGallerySection;
