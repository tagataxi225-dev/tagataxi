import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';

interface PromoSlide {
  id: string;
  title: string;
  description: string;
  cta: string;
  gradient: string;
  icon: string;
}

const promoSlides: PromoSlide[] = [
  {
    id: '0',
    title: 'TAGA Food 🍽️',
    description: 'Tes restaurants préférés, livrés rapidement.',
    cta: '🔍 Explorer les restaurants',
    gradient: 'from-orange-600 via-red-600 to-orange-700',
    icon: '🍽️'
  },
  {
    id: '1',
    title: '-30% sur votre 1ère commande',
    description: 'Code: BIENVENUE30',
    cta: 'Commander',
    gradient: 'from-orange-500 via-orange-600 to-red-500',
    icon: '🎉'
  },
  {
    id: '2',
    title: 'Livraison gratuite',
    description: 'Pour toute commande > 50 000 CDF',
    cta: 'Découvrir',
    gradient: 'from-green-500 via-emerald-600 to-teal-500',
    icon: '🚚'
  },
  {
    id: '3',
    title: 'Nouveau : Poulet Braisé Spécial',
    description: 'Découvrez notre plat signature',
    cta: 'Essayer',
    gradient: 'from-amber-500 via-yellow-600 to-orange-500',
    icon: '🔥'
  },
  {
    id: '4',
    title: 'Menu du jour',
    description: 'Plats africains authentiques',
    cta: 'Voir le menu',
    gradient: 'from-purple-500 via-pink-600 to-red-500',
    icon: '🍽️'
  }
];

export const FoodPromoBanner = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % promoSlides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const slide = promoSlides[currentSlide];

  return (
    <div className="px-4 py-6">
      <div className="relative h-40 rounded-2xl overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.5 }}
            className={`absolute inset-0 bg-gradient-to-br ${slide.gradient} p-6 flex flex-col justify-between`}
          >
            {/* Overlay pour améliorer contraste */}
            <div className={`absolute inset-0 ${isDark ? 'bg-black/20' : 'bg-black/10'}`} />

            {/* Contenu */}
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-3xl">{slide.icon}</span>
                <motion.h3 
                  className="text-white text-xl font-bold drop-shadow-lg"
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  {slide.title}
                </motion.h3>
              </div>
              <motion.p 
                className="text-white/90 text-sm drop-shadow-md"
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {slide.description}
              </motion.p>
            </div>

            {/* CTA + Indicateurs */}
            <div className="relative z-10 flex items-center justify-between">
              <Button 
                size="sm" 
                className="bg-white text-foreground hover:bg-white/90 shadow-lg font-semibold"
              >
                {slide.cta}
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>

              {/* Indicateurs de position */}
              <div className="flex gap-1.5">
                {promoSlides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      index === currentSlide 
                        ? 'w-6 bg-white' 
                        : 'w-1.5 bg-white/50 hover:bg-white/70'
                    }`}
                    aria-label={`Aller au slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Particules décoratives */}
            <div className="absolute top-4 right-4 text-6xl opacity-10 pointer-events-none">
              {slide.icon}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
