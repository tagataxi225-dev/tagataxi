import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronRight, Sparkles, Clock, Percent, Gift, Flame } from 'lucide-react';

interface PromoSlide {
  id: string;
  title: string;
  subtitle: string;
  cta: string;
  gradient: string;
  icon: React.ReactNode;
  emoji: string;
}

const promoSlides: PromoSlide[] = [
  {
    id: 'delivery',
    title: 'Livraison Express',
    subtitle: 'Vos plats préférés en 30 min',
    cta: 'Commander maintenant',
    gradient: 'from-orange-500 via-red-500 to-pink-500',
    icon: <Clock className="w-6 h-6" />,
    emoji: '🚀',
  },
  {
    id: 'promo',
    title: '-20% sur tout',
    subtitle: 'Code: KWENDA20 - Offre limitée',
    cta: 'En profiter',
    gradient: 'from-emerald-500 via-teal-500 to-cyan-500',
    icon: <Percent className="w-6 h-6" />,
    emoji: '💰',
  },
  {
    id: 'new',
    title: 'Nouveaux Restos',
    subtitle: 'Découvrez les dernières adresses',
    cta: 'Explorer',
    gradient: 'from-violet-500 via-purple-500 to-fuchsia-500',
    icon: <Sparkles className="w-6 h-6" />,
    emoji: '✨',
  },
  {
    id: 'rewards',
    title: 'Programme Fidélité',
    subtitle: '1 commande = 10 points bonus',
    cta: 'Découvrir',
    gradient: 'from-amber-500 via-yellow-500 to-orange-500',
    icon: <Gift className="w-6 h-6" />,
    emoji: '🎁',
  },
];

export const PremiumFoodBanner = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % promoSlides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [isPaused]);

  const slide = promoSlides[currentSlide];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative mx-4 rounded-3xl overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background gradient animé */}
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.id}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.5 }}
          className={`absolute inset-0 bg-gradient-to-br ${slide.gradient}`}
        />
      </AnimatePresence>

      {/* Overlay pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 20% 50%, rgba(255,255,255,0.3) 0%, transparent 50%),
                           radial-gradient(circle at 80% 50%, rgba(255,255,255,0.2) 0%, transparent 50%)`,
        }} />
      </div>

      {/* Floating elements */}
      <motion.div
        animate={{
          y: [0, -10, 0],
          rotate: [0, 5, 0],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-4 right-4 text-4xl opacity-80"
      >
        {slide.emoji}
      </motion.div>

      {/* Glow effect */}
      <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-white/20 rounded-full blur-3xl" />
      <div className="absolute -top-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />

      {/* Content */}
      <div className="relative z-10 p-6 min-h-[160px] flex flex-col justify-between">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4 }}
            className="space-y-2"
          >
            {/* Badge icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-white text-sm font-medium"
            >
              {slide.icon}
              <span>Offre spéciale</span>
            </motion.div>

            {/* Title */}
            <h2 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-lg">
              {slide.title}
            </h2>

            {/* Subtitle */}
            <p className="text-white/90 text-sm sm:text-base font-medium">
              {slide.subtitle}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-4"
        >
          <Button
            size="sm"
            className="bg-white text-foreground hover:bg-white/90 shadow-xl font-semibold group"
          >
            {slide.cta}
            <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </Button>
        </motion.div>
      </div>

      {/* Slide indicators */}
      <div className="absolute bottom-3 right-4 flex gap-1.5 z-20">
        {promoSlides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              index === currentSlide 
                ? 'w-6 bg-white' 
                : 'w-1.5 bg-white/50 hover:bg-white/70'
            }`}
          />
        ))}
      </div>

      {/* Hot badge */}
      <motion.div
        initial={{ scale: 0, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.5, type: 'spring' }}
        className="absolute top-3 left-3 flex items-center gap-1 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg"
      >
        <Flame className="w-3 h-3" />
        HOT
      </motion.div>
    </motion.div>
  );
};
