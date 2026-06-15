import { useState, useEffect, memo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSwipeable } from 'react-swipeable';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { usePromoBanners } from '@/hooks/usePromoBanners';

interface PromoSliderProps {
  onServiceSelect?: (service: string) => void;
}

const AUTOPLAY_DURATION = 5000;

const PromoSliderOptimized = memo(({ onServiceSelect }: PromoSliderProps) => {
  const { data: slides = [] } = usePromoBanners('home');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressRef = useRef<number>(0);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    if (currentIndex >= slides.length && slides.length > 0) {
      setCurrentIndex(0);
    }
  }, [slides.length, currentIndex]);

  // Preload images
  useEffect(() => {
    if (slides.length === 0) return;
    slides.forEach((slide) => {
      const img = new Image();
      img.src = slide.image;
    });
  }, [slides]);

  const goToSlide = useCallback(async (index: number) => {
    try { await Haptics.impact({ style: ImpactStyle.Light }); } catch {}
    setCurrentIndex(index);
    setProgress(0);
    progressRef.current = 0;
  }, []);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % (slides.length || 1));
    setProgress(0);
    progressRef.current = 0;
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + (slides.length || 1)) % (slides.length || 1));
    setProgress(0);
    progressRef.current = 0;
  }, [slides.length]);

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => { nextSlide(); Haptics.impact({ style: ImpactStyle.Light }).catch(() => {}); },
    onSwipedRight: () => { prevSlide(); Haptics.impact({ style: ImpactStyle.Light }).catch(() => {}); },
    trackMouse: false,
    trackTouch: true,
    delta: 50,
    preventScrollOnSwipe: true,
  });

  // Autoplay with requestAnimationFrame
  useEffect(() => {
    if (isPaused || slides.length <= 1) {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      return;
    }

    lastTimeRef.current = performance.now();

    const animate = (currentTime: number) => {
      const deltaTime = currentTime - lastTimeRef.current;
      lastTimeRef.current = currentTime;
      progressRef.current += (deltaTime / AUTOPLAY_DURATION) * 100;

      if (progressRef.current >= 100) {
        nextSlide();
      } else {
        setProgress(progressRef.current);
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current); };
  }, [isPaused, currentIndex, nextSlide, slides.length]);

  if (slides.length === 0) return null;

  const safeIndex = currentIndex < slides.length ? currentIndex : 0;
  const currentSlide = slides[safeIndex];

  return (
    <div className="w-full relative mb-0 px-4 z-10">
      <div
        {...swipeHandlers}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setTimeout(() => setIsPaused(false), 2000)}
        className="relative w-full aspect-[16/9] overflow-hidden rounded-2xl bg-muted shadow-lg"
      >
        {/* Crossfade + Ken Burns */}
        <AnimatePresence mode="sync">
          <motion.img
            key={safeIndex}
            src={currentSlide.image}
            alt={currentSlide.alt}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="absolute inset-0 w-full h-full object-cover"
            loading="eager"
          />
        </AnimatePresence>

        {/* Segmented progress bars — top */}
        {slides.length > 1 && (
          <div className="absolute bottom-2.5 left-0 right-0 flex justify-center gap-1.5 z-20">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => goToSlide(i)}
                aria-label={`Slide ${i + 1}`}
                className={`h-2 rounded-full transition-all duration-300 shadow-sm ${
                  i === safeIndex
                    ? 'w-5 bg-white/95'
                    : 'w-2 bg-white/40'
                }`}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  );
});

PromoSliderOptimized.displayName = 'PromoSliderOptimized';

export { PromoSliderOptimized as PromoSlider };
