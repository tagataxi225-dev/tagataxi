import { useState, useEffect, memo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSwipeable } from 'react-swipeable';
import { ChevronLeft, ChevronRight, Truck, Store, Zap, Gift, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { usePromoBanners } from '@/hooks/usePromoBanners';

// Fallback gradient promos when no dynamic banners exist
interface GradientPromo {
  id: string;
  title: string;
  subtitle: string;
  gradient: string;
  cta: string;
  action: string;
  icon: LucideIcon;
}

const gradientPromos: GradientPromo[] = [
  { id: '1', title: 'Livraison express en 1h', subtitle: 'Sur Kinshasa, Lubumbashi et Kolwezi', gradient: 'from-emerald-600 via-emerald-500 to-teal-500', cta: 'Commander', action: 'free_delivery', icon: Truck },
  { id: '2', title: 'Nouveaux vendeurs chaque jour', subtitle: 'Découvrez les dernières boutiques', gradient: 'from-violet-600 via-purple-500 to-fuchsia-500', cta: 'Explorer', action: 'vendors', icon: Store },
  { id: '3', title: 'Payez avec Mobile Money', subtitle: 'Orange Money, M-Pesa, Airtel Money', gradient: 'from-blue-600 via-blue-500 to-cyan-500', cta: 'En savoir plus', action: 'mobile_money', icon: Zap },
  { id: '4', title: 'Vendez sur Tembea', subtitle: 'Ouvrez votre boutique gratuitement', gradient: 'from-amber-600 via-orange-500 to-yellow-500', cta: 'Démarrer', action: 'become_vendor', icon: Gift },
];

interface PromoSliderProps {
  onPromoClick?: (action: string) => void;
  onServiceSelect?: (service: string) => void;
  autoplayDelay?: number;
  className?: string;
}

const AUTOPLAY_DURATION = 5000;

export const PromoSlider = memo(({
  onPromoClick,
  onServiceSelect,
  autoplayDelay = AUTOPLAY_DURATION,
  className,
}: PromoSliderProps) => {
  const { data: dynamicBanners = [] } = usePromoBanners('marketplace');
  const hasDynamic = dynamicBanners.length > 0;
  const totalSlides = hasDynamic ? dynamicBanners.length : gradientPromos.length;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressRef = useRef(0);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef(0);

  useEffect(() => {
    if (currentIndex >= totalSlides && totalSlides > 0) setCurrentIndex(0);
  }, [totalSlides, currentIndex]);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
    setProgress(0);
    progressRef.current = 0;
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
    setProgress(0);
    progressRef.current = 0;
  }, [totalSlides]);

  const goToSlide = useCallback((i: number) => {
    setCurrentIndex(i);
    setProgress(0);
    progressRef.current = 0;
  }, []);

  const swipeHandlers = useSwipeable({
    onSwipedLeft: nextSlide,
    onSwipedRight: prevSlide,
    trackMouse: false,
    trackTouch: true,
    delta: 50,
    preventScrollOnSwipe: true,
  });

  // Autoplay
  useEffect(() => {
    if (isPaused || totalSlides <= 1) {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      return;
    }
    lastTimeRef.current = performance.now();
    const animate = (t: number) => {
      const dt = t - lastTimeRef.current;
      lastTimeRef.current = t;
      progressRef.current += (dt / autoplayDelay) * 100;
      if (progressRef.current >= 100) {
        nextSlide();
      } else {
        setProgress(progressRef.current);
        animationRef.current = requestAnimationFrame(animate);
      }
    };
    animationRef.current = requestAnimationFrame(animate);
    return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current); };
  }, [isPaused, currentIndex, nextSlide, totalSlides, autoplayDelay]);

  const safeIndex = currentIndex < totalSlides ? currentIndex : 0;

  // ── Dynamic image-based slider ──
  if (hasDynamic) {
    const slide = dynamicBanners[safeIndex];
    return (
      <div
        {...swipeHandlers}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        className={cn("relative overflow-hidden rounded-3xl z-10 shadow-2xl", className)}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={safeIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="relative h-44 md:h-52 rounded-3xl overflow-hidden"
          >
            <img
              src={slide.image}
              alt={slide.alt}
              className="absolute inset-0 w-full h-full object-cover"
              loading="eager"
            />
            {/* Overlay gradient for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            {/* Content overlay */}
            <div className="relative h-full flex items-end px-5 pb-8 md:px-8">
              <div className="space-y-1">
                <motion.h3
                  className="text-xl md:text-2xl font-bold text-white tracking-tight leading-tight"
                  initial={{ y: 12, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.15 }}
                >
                  {slide.title}
                </motion.h3>
                {slide.description && (
                  <motion.p
                    className="text-sm md:text-base text-white/85 font-medium"
                    initial={{ y: 8, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.25 }}
                  >
                    {slide.description}
                  </motion.p>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Nav arrows desktop */}
        <div className="hidden md:block">
          <Button variant="ghost" size="icon" onClick={prevSlide} className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur-md text-white rounded-full shadow-lg">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={nextSlide} className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur-md text-white rounded-full shadow-lg">
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Progress dots */}
        {totalSlides > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2">
            {dynamicBanners.map((_, i) => (
              <button key={i} onClick={() => goToSlide(i)} className="relative h-1.5 rounded-full overflow-hidden transition-all duration-300" style={{ width: i === safeIndex ? '32px' : '8px' }} aria-label={`Slide ${i + 1}`}>
                <div className="absolute inset-0 bg-white/40" />
                {i === safeIndex && (
                  <motion.div className="absolute inset-0 bg-white rounded-full" initial={{ scaleX: 0 }} animate={{ scaleX: progress / 100 }} style={{ transformOrigin: 'left' }} />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Fallback: gradient-based slides ──
  const currentPromo = gradientPromos[safeIndex];
  const IconComponent = currentPromo.icon;

  return (
    <div
      {...swipeHandlers}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={cn("relative overflow-hidden rounded-3xl z-10 shadow-2xl", className)}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={safeIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="relative h-40 md:h-48 rounded-3xl overflow-hidden"
        >
          <div className={cn("absolute inset-0 bg-gradient-to-br", currentPromo.gradient)} />
          <div className="relative h-full flex items-center justify-between p-5 md:px-8 overflow-hidden">
            <div className="flex-1 min-w-0 space-y-2 max-w-[60%]">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.15, type: 'spring', stiffness: 200 }} className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <IconComponent className="h-5 w-5 text-white" strokeWidth={2} />
              </motion.div>
              <motion.h3 className="text-lg md:text-xl font-bold text-white tracking-tight leading-snug line-clamp-2" initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2, duration: 0.3 }}>
                {currentPromo.title}
              </motion.h3>
              <motion.p className="text-xs md:text-sm font-medium text-white/80 line-clamp-1" initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3, duration: 0.3 }}>
                {currentPromo.subtitle}
              </motion.p>
            </div>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.35, type: 'spring', stiffness: 200 }} className="shrink-0 ml-3">
              <Button onClick={() => { onPromoClick?.(currentPromo.action); onServiceSelect?.('marketplace'); }} className="bg-white hover:bg-white/90 text-gray-900 font-semibold shadow-md hover:scale-105 transition-all duration-200 px-5 py-2.5 rounded-full text-sm" size="default">
                {currentPromo.cta}
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="hidden md:block">
        <Button variant="ghost" size="icon" onClick={prevSlide} className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur-md text-white rounded-full shadow-lg"><ChevronLeft className="h-5 w-5" /></Button>
        <Button variant="ghost" size="icon" onClick={nextSlide} className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur-md text-white rounded-full shadow-lg"><ChevronRight className="h-5 w-5" /></Button>
      </div>

      {totalSlides > 1 && (
        <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
          {gradientPromos.map((_, i) => (
            <button key={i} onClick={() => goToSlide(i)} className="relative rounded-full overflow-hidden transition-all duration-300" style={{ width: i === safeIndex ? '24px' : '6px', height: '6px' }} aria-label={`Slide ${i + 1}`}>
              <div className="absolute inset-0 bg-white/30 rounded-full" />
              {i === safeIndex && (
                <motion.div className="absolute inset-0 bg-white rounded-full" initial={{ scaleX: 0 }} animate={{ scaleX: progress / 100 }} style={{ transformOrigin: 'left' }} />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

PromoSlider.displayName = 'PromoSlider';
