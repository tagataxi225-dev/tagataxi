import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import { motion } from 'framer-motion';
import Autoplay from 'embla-carousel-autoplay';
import { Car, User, Clock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const RentalPromoSlider = () => {
  const slides = [
    {
      id: '1',
      title: '🚗 Location Flexible',
      subtitle: 'Dès 35 000 CDF/jour',
      gradient: 'from-blue-500 via-cyan-500 to-blue-600',
      icon: Car,
      cta: 'Voir'
    },
    {
      id: '2',
      title: '👤 Avec chauffeur',
      subtitle: 'Vous choisissez !',
      gradient: 'from-green-500 via-emerald-500 to-green-600',
      icon: User,
      cta: 'Découvrir'
    },
    {
      id: '3',
      title: '⏰ Disponible 24/7',
      subtitle: 'Réservez maintenant',
      gradient: 'from-purple-500 via-pink-500 to-purple-600',
      icon: Clock,
      cta: 'Réserver'
    }
  ];

  return (
    <Carousel
      opts={{ loop: true }}
      plugins={[Autoplay({ delay: 4000, stopOnInteraction: false })]}
      className="w-full"
    >
      <CarouselContent>
        {slides.map((slide) => {
          const IconComponent = slide.icon;
          return (
            <CarouselItem key={slide.id}>
              <div className={`relative h-40 md:h-48 rounded-2xl overflow-hidden bg-gradient-to-br ${slide.gradient} shadow-xl`}>
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/40" />
                
                {/* Contenu */}
                <div className="relative h-full flex items-center justify-between px-4 md:px-6">
                  <div className="flex-1 space-y-2 md:space-y-3 max-w-[60%] md:max-w-[65%]">
                    <motion.h3 
                      className="text-xl md:text-3xl font-extrabold text-white drop-shadow-2xl tracking-tight line-clamp-1"
                      initial={{ y: 30, opacity: 0, scale: 0.9 }}
                      animate={{ y: 0, opacity: 1, scale: 1 }}
                      transition={{ 
                        delay: 0.15,
                        type: "spring",
                        stiffness: 150
                      }}
                    >
                      {slide.title}
                    </motion.h3>
                    <motion.p 
                      className="text-sm md:text-base font-medium text-white/95 drop-shadow-lg line-clamp-2"
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ 
                        delay: 0.25,
                        type: "spring",
                        stiffness: 100
                      }}
                    >
                      {slide.subtitle}
                    </motion.p>
                    
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.35 }}
                    >
                      <Button
                        className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white border-white/30 shadow-xl hover:scale-110 transition-all duration-300"
                        size="sm"
                      >
                        <Sparkles className="h-4 w-4 mr-2 animate-pulse" />
                        {slide.cta}
                      </Button>
                    </motion.div>
                  </div>
                  
                  {/* Icône décorative */}
                  <div className="relative z-10 hidden sm:block">
                    <IconComponent className="h-20 w-20 text-white/30" />
                  </div>
                </div>
              </div>
            </CarouselItem>
          );
        })}
      </CarouselContent>
    </Carousel>
  );
};
