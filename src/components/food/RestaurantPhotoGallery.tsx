import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, ZoomIn, Images } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface RestaurantPhotoGalleryProps {
  bannerUrl?: string;
  logoUrl?: string;
  productImages: string[];
  restaurantName: string;
}

export const RestaurantPhotoGallery: React.FC<RestaurantPhotoGalleryProps> = ({
  bannerUrl,
  logoUrl,
  productImages,
  restaurantName,
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Combine banner with product images
  const allImages = [
    bannerUrl,
    ...productImages.filter(Boolean),
  ].filter(Boolean) as string[];

  const hasMultipleImages = allImages.length > 1;

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % allImages.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  if (allImages.length === 0) {
    return (
      <div className="relative h-56 bg-gradient-to-br from-primary/20 via-orange-500/10 to-amber-500/20">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center mx-auto mb-3">
              <span className="text-4xl">🍽️</span>
            </div>
            <p className="text-muted-foreground text-sm">{restaurantName}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Main Gallery */}
      <div className="relative h-56 overflow-hidden group">
        {/* Current Slide */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0"
          >
            <img
              src={allImages[currentSlide]}
              alt={`${restaurantName} - Photo ${currentSlide + 1}`}
              className="w-full h-full object-cover"
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
          </motion.div>
        </AnimatePresence>

        {/* Navigation Arrows */}
        {hasMultipleImages && (
          <>
            <Button
              variant="secondary"
              size="icon"
              className="absolute left-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm shadow-lg"
              onClick={prevSlide}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm shadow-lg"
              onClick={nextSlide}
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </>
        )}

        {/* Zoom Button */}
        <Button
          variant="secondary"
          size="icon"
          className="absolute bottom-4 right-4 bg-background/80 backdrop-blur-sm shadow-lg"
          onClick={() => openLightbox(currentSlide)}
        >
          <ZoomIn className="w-5 h-5" />
        </Button>

        {/* Image Counter */}
        {hasMultipleImages && (
          <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-background/80 backdrop-blur-sm rounded-full px-3 py-1.5 text-sm">
            <Images className="w-4 h-4" />
            <span>{currentSlide + 1} / {allImages.length}</span>
          </div>
        )}

        {/* Dot Indicators */}
        {hasMultipleImages && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
            {allImages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentSlide
                    ? 'bg-white w-6'
                    : 'bg-white/50 hover:bg-white/75'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnail Grid */}
      {allImages.length > 1 && (
        <div className="px-4 py-3 -mt-8 relative z-10">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {allImages.slice(0, 6).map((image, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setCurrentSlide(index);
                  openLightbox(index);
                }}
                className={`relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 ring-2 transition-all ${
                  index === currentSlide
                    ? 'ring-primary ring-offset-2 ring-offset-background'
                    : 'ring-transparent hover:ring-primary/50'
                }`}
              >
                <img
                  src={image}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                {index === 5 && allImages.length > 6 && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <span className="text-white font-bold">+{allImages.length - 6}</span>
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-4xl p-0 bg-black/95 border-0">
          <div className="relative aspect-video">
            <AnimatePresence mode="wait">
              <motion.img
                key={lightboxIndex}
                src={allImages[lightboxIndex]}
                alt={`${restaurantName} - Photo ${lightboxIndex + 1}`}
                className="w-full h-full object-contain"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                transition={{ duration: 0.3 }}
              />
            </AnimatePresence>

            {/* Lightbox Navigation */}
            {hasMultipleImages && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                  onClick={() => setLightboxIndex((prev) => (prev - 1 + allImages.length) % allImages.length)}
                >
                  <ChevronLeft className="w-8 h-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                  onClick={() => setLightboxIndex((prev) => (prev + 1) % allImages.length)}
                >
                  <ChevronRight className="w-8 h-8" />
                </Button>
              </>
            )}

            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 text-white hover:bg-white/20"
              onClick={() => setLightboxOpen(false)}
            >
              <X className="w-6 h-6" />
            </Button>

            {/* Counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/80 text-sm">
              {lightboxIndex + 1} / {allImages.length}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
