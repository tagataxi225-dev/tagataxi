import { useEffect, useState, useRef } from 'react';
import Autoplay from 'embla-carousel-autoplay';
import { motion } from 'framer-motion';
import { Carousel, CarouselContent, CarouselItem, CarouselApi } from '@/components/ui/carousel';
import { usePromos } from '@/hooks/usePromos';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { usePromoCodeValidation } from '@/hooks/usePromoCodeValidation';
import { CompactRentalSlide } from '@/components/rental/CompactRentalSlide';
import { useLanguage } from '@/contexts/LanguageContext';

interface PromoSliderProps {
  onServiceSelect: (service: string) => void;
}

export const PromoSlider = ({ onServiceSelect }: PromoSliderProps) => {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const { user } = useAuth();
  const { checkPromoUsage } = usePromoCodeValidation();
  const { t } = useLanguage();
  
  const autoplayRef = useRef(
    Autoplay({
      delay: 4000,
      stopOnInteraction: false,
      stopOnMouseEnter: false,
      stopOnFocusIn: false,
      playOnInit: true,
      rootNode: (emblaRoot) => emblaRoot.parentElement,
    })
  );

  useEffect(() => {
    if (!api) return;

    setCurrent(api.selectedScrollSnap());

    // Forcer le démarrage de l'autoplay
    const autoplay = autoplayRef.current;
    if (autoplay) {
      autoplay.play();
    }

    api.on('select', () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  // Watchdog pour garantir que l'autoplay ne s'arrête jamais
  useEffect(() => {
    if (!api) return;

    const autoplay = autoplayRef.current;
    
    // Fonction de surveillance
    const checkAutoplay = () => {
      if (autoplay && !autoplay.isPlaying()) {
        console.log('🔄 [PromoSlider] Autoplay arrêté, relance...');
        autoplay.play();
      }
    };

    // Vérifier toutes les 5 secondes
    const watchdogInterval = setInterval(checkAutoplay, 5000);

    // Relancer l'autoplay après chaque changement de slide
    api.on('select', () => {
      if (autoplay && !autoplay.isPlaying()) {
        autoplay.play();
      }
    });

    // Relancer l'autoplay si l'utilisateur revient sur l'onglet
    const handleVisibilityChange = () => {
      if (!document.hidden && autoplay) {
        autoplay.play();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      clearInterval(watchdogInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [api]);

  const promos = usePromos();
  
  // 🆕 PHASE 1: Logs de debug pour vérifier l'affichage
  useEffect(() => {
    console.log('🎨 [PromoSlider] Nombre de promos chargées:', promos.length);
    console.log('🎨 [PromoSlider] Carousel API:', api ? 'Initialisé' : 'En attente');
    console.log('🎨 [PromoSlider] Slide actuel:', current);
  }, [promos, api, current]);
  
  const handlePromoClick = async (promo: typeof promos[0]) => {
    // Gestion code promo BIENVENUE30
    if (promo.id === '1') {
      // Vérifier si l'utilisateur est connecté
      if (!user) {
        toast.error(t('promo.login_required'));
        return;
      }

      // Vérifier si le code a déjà été utilisé
      const result = await checkPromoUsage(user.id, 'BIENVENUE30');

      if (!result.canUse) {
        toast.error(result.reason || t('promo.code_already_used'));
        return;
      }

    // Si OK, stocker le code et son ID
    localStorage.setItem('activePromoCode', 'BIENVENUE30');
    localStorage.setItem('promoDiscount', '30');
    localStorage.setItem('activePromoId', result.promoId || '');
    toast.success(t('promo.code_applied'));
    }

    // Redirection vers le service
    if (promo.service) {
      onServiceSelect(promo.service);
    }
  };

  return (
    <div className="w-full relative mb-12 mx-auto max-w-7xl z-10">
      <Carousel
        setApi={setApi}
        opts={{ loop: true, align: 'center', skipSnaps: false, duration: 30 }}
        plugins={[autoplayRef.current]}
        className="w-full"
        style={{ minHeight: '160px', height: '160px' }}
      >
        <CarouselContent style={{ height: '160px' }}>
          {promos.map((promo) => (
            <CarouselItem key={promo.id} className="h-[160px]">
              <motion.div
                onClick={() => handlePromoClick(promo)}
                className={cn(
                  'relative h-[160px] rounded-2xl cursor-pointer',
                  'bg-gradient-to-br',
                  promo.gradient,
                  'shadow-lg hover:shadow-xl',
                  'transition-shadow duration-300'
                )}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
              >
                
                {/* SLIDE 1: 30% Discount - Minimaliste */}
                {promo.id === '1' && (
                  <motion.div 
                    className="absolute inset-0 p-4 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between text-white gap-3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  >
                    <div className="flex items-center gap-4 sm:gap-6">
                      <motion.div 
                        className="text-4xl sm:text-5xl opacity-90"
                        animate={{ 
                          scale: [1, 1.05, 1],
                          rotate: [0, 2, 0, -2, 0]
                        }}
                        transition={{ 
                          duration: 4,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        🎉
                      </motion.div>
                      
                      <div>
                        <motion.h3 
                          className="text-2xl sm:text-4xl font-black tracking-tight mb-0.5 sm:mb-1"
                          initial={{ y: 10, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.1, duration: 0.3 }}
                        >
                          30% de réduction
                        </motion.h3>
                        <motion.p 
                          className="text-white/80 text-xs sm:text-sm font-bold"
                          initial={{ y: 10, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.2, duration: 0.3 }}
                        >
                          Sur votre première course
                        </motion.p>
                      </div>
                    </div>

                    <motion.button 
                      className="self-end sm:self-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full text-xs sm:text-sm font-bold transition-colors duration-200 border border-white/30"
                      whileHover={{ scale: 1.05, x: 5 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                      Commander →
                    </motion.button>
                  </motion.div>
                )}

                {/* SLIDE 2: Flash Express - Minimaliste */}
                {promo.id === '2' && (
                  <motion.div 
                    className="absolute inset-0 p-4 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between text-white gap-3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  >
                    <div className="flex items-center gap-4 sm:gap-6">
                      <motion.div 
                        className="text-4xl sm:text-5xl opacity-90"
                        animate={{ 
                          scale: [1, 1.05, 1],
                          rotate: [0, 2, 0, -2, 0]
                        }}
                        transition={{ 
                          duration: 4,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        ⚡
                      </motion.div>
                      
                      <div>
                        <motion.h3 
                          className="text-2xl sm:text-4xl font-black tracking-tight mb-0.5 sm:mb-1"
                          initial={{ y: 10, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.1, duration: 0.3 }}
                        >
                          Livraison Express
                        </motion.h3>
                        <motion.p 
                          className="text-white/80 text-xs sm:text-sm font-bold"
                          initial={{ y: 10, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.2, duration: 0.3 }}
                        >
                          En 30 minutes chrono
                        </motion.p>
                      </div>
                    </div>

                    <motion.button 
                      className="self-end sm:self-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full text-xs sm:text-sm font-bold transition-colors duration-200 border border-white/30"
                      whileHover={{ scale: 1.05, x: 5 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                      Livrer →
                    </motion.button>
                  </motion.div>
                )}

                {/* SLIDE 3: Tombola - Élégant */}
                {promo.id === '3' && (
                  <motion.div 
                    className="absolute inset-0 p-4 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between text-white gap-3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  >
                    <div className="flex items-center gap-4 sm:gap-6">
                      <motion.div 
                        className="text-4xl sm:text-5xl opacity-90"
                        animate={{ 
                          scale: [1, 1.05, 1],
                          rotate: [0, 2, 0, -2, 0]
                        }}
                        transition={{ 
                          duration: 4,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        🎰
                      </motion.div>
                      
                      <div>
                        <motion.h3 
                          className="text-2xl sm:text-4xl font-black tracking-tight mb-0.5 sm:mb-1"
                          initial={{ y: 10, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.1, duration: 0.3 }}
                        >
                          Tombola TembeaPay
                        </motion.h3>
                        <motion.p 
                          className="text-yellow-300/90 text-xs sm:text-sm font-bold"
                          initial={{ y: 10, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.2, duration: 0.3 }}
                        >
                          Gagnez jusqu'à 100 000 CDF
                        </motion.p>
                      </div>
                    </div>

                    <motion.button 
                      className="self-end sm:self-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-yellow-400/20 hover:bg-yellow-400/30 backdrop-blur-sm rounded-full text-xs sm:text-sm font-bold transition-colors duration-200 border border-yellow-400/40"
                      whileHover={{ scale: 1.05, x: 5 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                      Participer →
                    </motion.button>
                  </motion.div>
                )}

                {/* Slide 4: Car Rental - Modern Compact Version */}
                {promo.id === '4' && (
                  <CompactRentalSlide 
                    onReserve={() => onServiceSelect('rental')}
                    vehicleCount={25}
                    startingPrice={50000}
                  />
                )}

                {/* SLIDE 5: Marketplace - Clean */}
                {promo.id === '5' && (
                  <motion.div 
                    className="absolute inset-0 p-4 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between text-white gap-3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  >
                    <div className="flex items-center gap-4 sm:gap-6">
                      <motion.div 
                        className="text-4xl sm:text-5xl opacity-90"
                        animate={{ 
                          scale: [1, 1.05, 1],
                          rotate: [0, 2, 0, -2, 0]
                        }}
                        transition={{ 
                          duration: 4,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        🛒
                      </motion.div>
                      
                      <div>
                        <motion.h3 
                          className="text-2xl sm:text-4xl font-black tracking-tight mb-0.5 sm:mb-1"
                          initial={{ y: 10, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.1, duration: 0.3 }}
                        >
                          Marketplace Tembea
                        </motion.h3>
                        <motion.p 
                          className="text-white/80 text-xs sm:text-sm font-bold"
                          initial={{ y: 10, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.2, duration: 0.3 }}
                        >
                          Achetez, vendez, on livre
                        </motion.p>
                      </div>
                    </div>

                    <motion.button 
                      className="self-end sm:self-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full text-xs sm:text-sm font-bold transition-colors duration-200 border border-white/30"
                      whileHover={{ scale: 1.05, x: 5 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                      Découvrir →
                    </motion.button>
                  </motion.div>
                )}

                {/* SLIDE 6: Food - Simple */}
                {promo.id === '6' && (
                  <motion.div 
                    className="absolute inset-0 p-4 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between text-white gap-3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  >
                    <div className="flex items-center gap-4 sm:gap-6">
                      <motion.div 
                        className="text-4xl sm:text-5xl opacity-90"
                        animate={{ 
                          scale: [1, 1.05, 1],
                          rotate: [0, 2, 0, -2, 0]
                        }}
                        transition={{ 
                          duration: 4,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        🍔
                      </motion.div>
                      
                      <div>
                        <motion.h3 
                          className="text-2xl sm:text-4xl font-black tracking-tight mb-0.5 sm:mb-1"
                          initial={{ y: 10, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.1, duration: 0.3 }}
                        >
                          Tembea Food
                        </motion.h3>
                        <motion.p 
                          className="text-white/80 text-xs sm:text-sm font-bold"
                          initial={{ y: 10, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.2, duration: 0.3 }}
                        >
                          Vos restaurants préférés livrés
                        </motion.p>
                      </div>
                    </div>

                    <motion.button 
                      className="self-end sm:self-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full text-xs sm:text-sm font-bold transition-colors duration-200 border border-white/30"
                      whileHover={{ scale: 1.05, x: 5 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                      Commander →
                    </motion.button>
                  </motion.div>
                )}
              </motion.div>
            </CarouselItem>
          ))}
        </CarouselContent>
        
        {/* Dots indicator - minimaliste */}
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {promos.map((_, index) => (
            <motion.button
              key={index}
              onClick={() => api?.scrollTo(index)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                current === index 
                  ? "w-8 bg-white" 
                  : "w-1.5 bg-white/40 hover:bg-white/60"
              )}
              whileHover={{ scale: 1.5 }}
              whileTap={{ scale: 0.9 }}
              aria-label={`Slide ${index + 1}`}
            />
          ))}
        </div>
      </Carousel>
    </div>
  );
};
