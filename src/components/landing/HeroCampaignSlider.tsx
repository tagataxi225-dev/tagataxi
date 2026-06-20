import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { ChevronLeft, ChevronRight, Car, Package, Gavel } from 'lucide-react';

type Slide = {
  id: number;
  eyebrow: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  gradient: string;
};

const slides: Slide[] = [
  {
    id: 1,
    eyebrow: 'Transport VTC',
    title: 'Votre course à Abidjan, en un geste',
    subtitle: 'Moto-taxi, Éco, Confort, Premium — dès 300 XOF',
    icon: Car,
    gradient: 'from-primary via-primary-glow to-emerald-900',
  },
  {
    id: 2,
    eyebrow: 'Livraison Express',
    title: 'Vos colis livrés en un éclair',
    subtitle: 'Flash 30 min partout à Abidjan — dès 600 XOF',
    icon: Package,
    gradient: 'from-emerald-700 via-primary to-slate-900',
  },
  {
    id: 3,
    eyebrow: 'Enchères transparentes',
    title: 'Le chauffeur propose, vous choisissez',
    subtitle: 'Comparez les tarifs et payez le juste prix',
    icon: Gavel,
    gradient: 'from-slate-900 via-emerald-800 to-primary',
  },
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
    <div className="relative w-full max-w-6xl mx-auto min-w-0">
      {/* Carrousel Container */}
      <div className="overflow-hidden rounded-3xl w-full" ref={emblaRef}>
        <div className="flex touch-pan-y min-w-0">
          {slides.map((slide) => {
            const Icon = slide.icon;
            return (
              <div
                key={slide.id}
                className="flex-[0_0_100%] min-w-0 relative"
              >
                <div className="relative w-full aspect-[16/9] overflow-hidden rounded-3xl">
                  <div className={`relative h-full w-full overflow-hidden rounded-3xl border border-border/30 bg-gradient-to-br ${slide.gradient} shadow-[0_4px_24px_rgba(0,0,0,0.12)]`}>
                    {/* Décor : grand icône en filigrane */}
                    <Icon className="absolute -right-6 -bottom-6 w-48 h-48 text-white/10" strokeWidth={1.5} />
                    <div className="absolute top-6 right-8 w-24 h-24 rounded-full bg-white/10 blur-2xl" />

                    {/* Contenu texte */}
                    <div className="relative z-10 flex h-full flex-col justify-center gap-3 p-7 sm:p-10 text-white">
                      <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold tracking-wide backdrop-blur-sm">
                        <Icon className="w-3.5 h-3.5" strokeWidth={2.5} />
                        {slide.eyebrow}
                      </span>
                      <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold leading-tight max-w-md">
                        {slide.title}
                      </h3>
                      <p className="text-sm sm:text-base text-white/85 max-w-sm">
                        {slide.subtitle}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
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
