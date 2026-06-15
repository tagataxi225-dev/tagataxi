import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Maximize2, X, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ProductVideoPlayer, ProductVideoPlayerHandle } from '@/components/ui/ProductVideoPlayer';
import useEmblaCarousel from 'embla-carousel-react';

interface MarketplaceImageGalleryProps {
  images: string[];
  productTitle: string;
  videoUrl?: string;
}

export const MarketplaceImageGallery: React.FC<MarketplaceImageGalleryProps> = ({
  images,
  productTitle,
  videoUrl
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoPlayerRef = useRef<ProductVideoPlayerHandle>(null);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: 'center' });
  const [emblaThumbsRef, emblaThumbsApi] = useEmblaCarousel({
    containScroll: 'keepSnaps',
    dragFree: true
  });

  const safeImages = images.length > 0 ? images : ['/placeholder.svg'];
  const hasVideo = !!videoUrl;
  const totalSlides = (hasVideo ? 1 : 0) + safeImages.length;

  const scrollPrev = React.useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = React.useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const onThumbClick = React.useCallback((index: number) => {
    if (!emblaApi || !emblaThumbsApi) return;
    emblaApi.scrollTo(index);
  }, [emblaApi, emblaThumbsApi]);

  React.useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => {
      const index = emblaApi.selectedScrollSnap();
      setSelectedIndex(index);
      // Pause video when swiping away, play when coming back
      if (hasVideo && videoPlayerRef.current) {
        if (index === 0) {
          videoPlayerRef.current.play();
        } else {
          videoPlayerRef.current.pause();
        }
      }
    };
    emblaApi.on('select', onSelect);
    onSelect();
    return () => { emblaApi.off('select', onSelect); };
  }, [emblaApi, hasVideo]);

  const isVideoSlide = (index: number) => hasVideo && index === 0;
  const getImageIndex = (slideIndex: number) => hasVideo ? slideIndex - 1 : slideIndex;

  return (
    <div className="space-y-3">
      <div className="relative group">
        <div className="overflow-hidden rounded-2xl bg-muted shadow-lg" ref={emblaRef}>
          <div className="flex touch-pan-y">
            {hasVideo && (
              <div className="flex-[0_0_100%] min-w-0">
                <div className="relative aspect-[3/4] sm:aspect-[4/3] lg:aspect-[16/10]">
                  <ProductVideoPlayer
                    ref={videoPlayerRef}
                    src={videoUrl!}
                    poster={safeImages[0]}
                    className="w-full h-full"
                    aspectRatio=""
                  />
                </div>
              </div>
            )}
            {safeImages.map((image, index) => (
              <div key={index} className="flex-[0_0_100%] min-w-0">
                <div className="relative aspect-[3/4] sm:aspect-[4/3] lg:aspect-[16/10]">
                  <motion.img
                    src={image}
                    alt={`${productTitle} - Image ${index + 1}`}
                    className="w-full h-full object-cover cursor-zoom-in"
                    loading={index === 0 && !hasVideo ? 'eager' : 'lazy'}
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.3 }}
                    onClick={() => setIsFullscreen(true)}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute top-3 right-3 bg-background/90 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all hover:scale-110 shadow-lg"
                    onClick={() => setIsFullscreen(true)}
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {totalSlides > 1 && (
          <>
            <Button
              size="icon"
              variant="secondary"
              className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={scrollPrev}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              size="icon"
              variant="secondary"
              className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={scrollNext}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </>
        )}

        {totalSlides > 1 && (
          <div className="sm:hidden absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {Array.from({ length: totalSlides }).map((_, index) => (
              <button
                key={index}
                className={`h-1.5 rounded-full transition-all ${
                  index === selectedIndex ? 'w-6 bg-primary' : 'w-1.5 bg-white/60'
                }`}
                onClick={() => onThumbClick(index)}
              />
            ))}
          </div>
        )}

        <Badge className="absolute bottom-3 right-3 bg-background/80 backdrop-blur-sm">
          {isVideoSlide(selectedIndex) ? '🎬' : '📷'} {selectedIndex + 1} / {totalSlides}
        </Badge>
      </div>

      {totalSlides > 1 && (
        <div className="hidden sm:block overflow-hidden" ref={emblaThumbsRef}>
          <div className="flex gap-2">
            {hasVideo && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`flex-[0_0_16%] min-w-0 rounded-xl overflow-hidden transition-all shadow-sm relative ${
                  selectedIndex === 0
                    ? 'ring-2 ring-primary ring-offset-2 ring-offset-background opacity-100 shadow-md'
                    : 'opacity-70 hover:opacity-100'
                }`}
                onClick={() => onThumbClick(0)}
              >
                <div className="aspect-square bg-muted flex items-center justify-center">
                  <Play className="w-6 h-6 text-primary" />
                </div>
              </motion.button>
            )}
            {safeImages.map((image, index) => {
              const slideIndex = hasVideo ? index + 1 : index;
              return (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`flex-[0_0_16%] min-w-0 rounded-xl overflow-hidden transition-all shadow-sm ${
                    slideIndex === selectedIndex
                      ? 'ring-2 ring-primary ring-offset-2 ring-offset-background opacity-100 shadow-md'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                  onClick={() => onThumbClick(slideIndex)}
                >
                  <div className="aspect-square">
                    <img src={image} alt={`Thumb ${index + 1}`} className="w-full h-full object-cover" loading="lazy" />
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-[100vw] max-h-[100vh] w-full h-full p-0 bg-black/95">
          <div className="relative w-full h-full flex items-center justify-center">
            <Button
              size="icon"
              variant="ghost"
              className="absolute top-4 right-4 z-50 text-white hover:bg-white/10"
              onClick={() => setIsFullscreen(false)}
            >
              <X className="h-6 w-6" />
            </Button>

            {isVideoSlide(selectedIndex) ? (
              <video src={videoUrl!} controls autoPlay className="max-w-full max-h-full object-contain" />
            ) : (
              <img
                src={safeImages[getImageIndex(selectedIndex)]}
                alt={`${productTitle} - Fullscreen`}
                className="max-w-full max-h-full object-contain"
              />
            )}

            {totalSlides > 1 && (
              <>
                <Button size="icon" variant="ghost" className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/10" onClick={scrollPrev}>
                  <ChevronLeft className="h-8 w-8" />
                </Button>
                <Button size="icon" variant="ghost" className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/10" onClick={scrollNext}>
                  <ChevronRight className="h-8 w-8" />
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
