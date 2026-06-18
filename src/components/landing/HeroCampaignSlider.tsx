import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ResponsiveImage } from '@/components/common/ResponsiveImage';

// Images des campagnes publicitaires
import campaignClient from '@/assets/campaign-client.png';
import campaignDelivery from '@/assets/campaign-delivery.png';

const slides = [
  {
    id: 1,
    image: campaignClient,
    alt: 'TAGA - Simplifiez vos trajets, profitez de chaque instant',
  },
  {
    id: 2,
    image: campaignDelivery,
    alt: 'Devenez livreur TAGA et gagnez plus rapidement',
  }
];

export const HeroCampaignSlider = () => {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { 
      loop: true,
      align: 'center',
      skipSnaps: false,
      duration: 30,
    },
    [Autoplay({ 
      delay: 5000,
      stopOnInteraction: false,
      stopOnMouseEnter: true,
    })]
  );

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    
    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);

  return (
    <div className="relative w-full max-w-6xl mx-auto">
      {/* Carrousel Container */}
      <div className="overflow-hidden rounded-3xl" ref={emblaRef}>
        <div className="flex touch-pan-y">
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className="flex-[0_0_100%] min-w-0 relative"
            >
              {/* Soft glow effect */}
              <div className="absolute -inset-1 bg-gradient-radial from-primary/8 via-transparent to-transparent blur-xl opacity-30"></div>
              
              {/* Image Container avec aspect ratio 16:9 natif */}
              <div className="relative w-full aspect-[16/9] overflow-hidden rounded-3xl">
                {/* Bordure soft */}
                <div className="relative h-full w-full overflow-hidden rounded-3xl border border-border/30 bg-gradient-to-br from-card/20 to-card/10 backdrop-blur-sm shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
                  <ResponsiveImage
                    src={slide.image}
                    alt={slide.alt}
                    className="absolute inset-0 w-full h-full object-cover transition-all duration-500 ease-out hover:scale-[1.02]"
                    loading={index === 0 ? "eager" : "lazy"}
                    // @ts-ignore - fetchPriority is valid HTML attribute
                    fetchPriority={index === 0 ? "high" : "low"}
                    decoding={index === 0 ? "sync" : "async"}
                    width={1280}
                    height={720}
                    widths={[640, 800, 1024, 1280]}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 800px"
                    useWebP={true}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Arrows - Design soft et moderne */}
      <button
        className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 z-20 bg-white/95 dark:bg-card/95 backdrop-blur-lg hover:bg-white dark:hover:bg-card text-foreground p-2.5 sm:p-3 rounded-full shadow-lg border border-white/50 dark:border-border/30 transition-all duration-300 ease-out disabled:opacity-0 disabled:cursor-not-allowed hover:scale-110 active:scale-95"
        onClick={scrollPrev}
        disabled={!canScrollPrev}
        aria-label="Slide précédent"
      >
        <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2.5} />
      </button>
      
      <button
        className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 z-20 bg-white/95 dark:bg-card/95 backdrop-blur-lg hover:bg-white dark:hover:bg-card text-foreground p-2.5 sm:p-3 rounded-full shadow-lg border border-white/50 dark:border-border/30 transition-all duration-300 ease-out disabled:opacity-0 disabled:cursor-not-allowed hover:scale-110 active:scale-95"
        onClick={scrollNext}
        disabled={!canScrollNext}
        aria-label="Slide suivant"
      >
        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2.5} />
      </button>

      {/* Dots Indicators - Design soft */}
      <div className="flex justify-center gap-2.5 mt-5">
        {slides.map((_, index) => (
          <button
            key={index}
            className={`h-2 rounded-full transition-all duration-500 ease-out ${
              index === selectedIndex
                ? 'w-8 bg-primary shadow-md shadow-primary/40'
                : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50 hover:w-4'
            }`}
            onClick={() => emblaApi?.scrollTo(index)}
            aria-label={`Aller au slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};
