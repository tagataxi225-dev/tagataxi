import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { Zap, Clock, Package, Shield, Truck, Bike } from 'lucide-react';
import flashIcon from '@/assets/vehicle-icons/d-moto.svg';
import flexIcon from '@/assets/vehicle-icons/d-flex.svg';
import maxiIcon from '@/assets/vehicle-icons/d-maxi.svg';
import { cn } from '@/lib/utils';

interface Perk {
  icon: React.ElementType;
  label: string;
}

interface Slide {
  id: 'flash' | 'flex' | 'maxi';
  name: string;
  tagline: string;
  description: string;
  icon3d: string;
  gradient: string;
  accent: string;
  perks: [Perk, Perk];
}

const SLIDES: Slide[] = [
  {
    id: 'flash',
    name: 'Flash',
    tagline: 'Express 5-15 min',
    description: 'Livraison ultra-rapide en moto pour petits colis urgents.',
    icon3d: flashIcon,
    gradient: 'from-amber-50 via-orange-50 to-rose-50 dark:from-amber-500/10 dark:via-orange-500/5 dark:to-rose-500/10',
    accent: 'text-amber-600 dark:text-amber-400',
    perks: [
      { icon: Bike, label: 'Moto express' },
      { icon: Zap, label: 'Jusqu’à 10 kg' },
    ],
  },
  {
    id: 'flex',
    name: 'Flex',
    tagline: 'Camionnette 30-60 min',
    description: 'Pour colis moyens et courses du quotidien, livrés en confort.',
    icon3d: flexIcon,
    gradient: 'from-rose-50 via-red-50 to-white dark:from-red-500/10 dark:via-rose-500/5 dark:to-background',
    accent: 'text-red-600 dark:text-red-400',
    perks: [
      { icon: Package, label: 'Jusqu’à 200 kg' },
      { icon: Clock, label: 'Créneau flexible' },
    ],
  },
  {
    id: 'maxi',
    name: 'Maxi',
    tagline: 'Gros colis 1-3 h',
    description: 'Camion dédié pour déménagements et charges volumineuses.',
    icon3d: maxiIcon,
    gradient: 'from-violet-50 via-purple-50 to-rose-50 dark:from-violet-500/10 dark:via-purple-500/5 dark:to-rose-500/10',
    accent: 'text-purple-600 dark:text-purple-400',
    perks: [
      { icon: Truck, label: 'Volumineux' },
      { icon: Shield, label: 'Assurance incluse' },
    ],
  },
];

const AUTOPLAY_MS = 4000;
const SWIPE_THRESHOLD = 60;

interface DeliveryServicesCarouselProps {
  onSelect?: (id: Slide['id']) => void;
  className?: string;
}

export const DeliveryServicesCarousel: React.FC<DeliveryServicesCarouselProps> = ({
  onSelect,
  className,
}) => {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (paused) return;
    timerRef.current = setInterval(() => {
      setDirection(1);
      setIndex((i) => (i + 1) % SLIDES.length);
    }, AUTOPLAY_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [paused]);

  const goTo = (next: number) => {
    setDirection(next > index ? 1 : -1);
    setIndex((next + SLIDES.length) % SLIDES.length);
  };

  const onDragEnd = (_: unknown, info: PanInfo) => {
    setPaused(false);
    if (info.offset.x < -SWIPE_THRESHOLD) goTo(index + 1);
    else if (info.offset.x > SWIPE_THRESHOLD) goTo(index - 1);
  };

  const slide = SLIDES[index];

  return (
    <div
      className={cn('w-full select-none', className)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative overflow-hidden rounded-3xl">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={slide.id}
            custom={direction}
            initial={{ x: direction * 80, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: direction * -80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.18}
            onDragStart={() => setPaused(true)}
            onDragEnd={onDragEnd}
            onTouchStart={() => setPaused(true)}
            onTouchEnd={() => setPaused(false)}
            onClick={() => onSelect?.(slide.id)}
            className={cn(
              'relative cursor-pointer bg-gradient-to-br p-6 sm:p-7',
              'border border-white/60 dark:border-white/5',
              'shadow-[0_8px_32px_-12px_rgba(220,38,38,0.18)]',
              slide.gradient
            )}
          >
            <div className="pointer-events-none absolute -top-12 -right-10 h-40 w-40 rounded-full bg-white/40 blur-3xl dark:bg-white/5" />

            <div className="relative flex items-start gap-4">
              <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-white/80 shadow-sm backdrop-blur-sm dark:bg-white/10">
                <img
                  src={slide.icon3d}
                  alt={slide.name}
                  className="h-10 w-10 object-contain"
                  draggable={false}
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl font-bold tracking-tight text-foreground">
                    Tembea <span className={slide.accent}>{slide.name}</span>
                  </h3>
                </div>
                <p className={cn('mt-0.5 text-sm font-medium', slide.accent)}>
                  {slide.tagline}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground line-clamp-2">
                  {slide.description}
                </p>
              </div>
            </div>

            <div className="relative mt-5 flex flex-wrap gap-2">
              {slide.perks.map((perk) => {
                const Icon = perk.icon;
                return (
                  <span
                    key={perk.label}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-xs font-medium text-foreground/80 ring-1 ring-black/5 backdrop-blur-sm dark:bg-white/10 dark:ring-white/10"
                  >
                    <Icon className={cn('h-3.5 w-3.5', slide.accent)} strokeWidth={2.4} />
                    {perk.label}
                  </span>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-4 flex items-center justify-center gap-2" role="tablist" aria-label="Services de livraison">
        {SLIDES.map((s, i) => {
          const active = i === index;
          return (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={active}
              aria-label={`Voir ${s.name}`}
              onClick={() => goTo(i)}
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                active ? 'w-6 bg-red-500' : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
              )}
            />
          );
        })}
      </div>
    </div>
  );
};

export default DeliveryServicesCarousel;
