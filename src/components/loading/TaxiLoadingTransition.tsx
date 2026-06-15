import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Car } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { TypewriterDots } from "./TypewriterDots";

interface TaxiLoadingTransitionProps {
  message?: string;
  onComplete?: () => void;
}

/**
 * 🚗 ANIMATION TAXI MODERNE
 * Transition fluide avec voiture + GPS pour remplacer les loaders blancs
 * Design Congo avec animations thématiques
 */
export const TaxiLoadingTransition = ({ 
  message, 
  onComplete 
}: TaxiLoadingTransitionProps) => {
  const { t } = useLanguage();
  const [currentMessage, setCurrentMessage] = useState(0);
  
  const messages = [
    message || t('loading.preparing'),
    t('loading.on_route'),
    t('loading.almost_ready')
  ];
  
  // Rotation des messages toutes les 600ms
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessage(prev => (prev + 1) % messages.length);
    }, 600);
    
    // Auto-dismiss après 2s maximum
    const timeout = setTimeout(() => {
      onComplete?.();
    }, 2000);
    
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [messages.length, onComplete]);
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[60] bg-gradient-to-br from-background via-background to-background/95 backdrop-blur-sm"
      role="status"
      aria-live="polite"
      aria-label={messages[currentMessage]}
    >
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
        {/* Gradient Congo subtil en fond */}
        <div className="absolute inset-0 bg-gradient-to-br from-congo-red/5 via-congo-yellow/5 to-congo-blue/5 opacity-60" />
        
        {/* GPS Pin pulsant */}
        <motion.div
          animate={{ 
            scale: [1, 1.15, 1],
            opacity: [0.8, 1, 0.8]
          }}
          transition={{ 
            duration: 1.5, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-[35%] left-1/2 -translate-x-1/2 z-10"
          style={{ willChange: 'transform, opacity' }}
        >
          <MapPin className="h-12 w-12 sm:h-16 sm:w-16 text-congo-red drop-shadow-[0_0_15px_hsl(var(--congo-red)/0.6)]" />
        </motion.div>
        
        {/* Route pointillée horizontale */}
        <div 
          className="absolute top-1/2 left-0 right-0 h-0.5 border-t-2 border-dashed border-congo-yellow/40"
          style={{ transform: 'translateY(-50%)' }}
        />
        
        {/* Voiture animée - déplacement horizontal avec bounce vertical */}
        <motion.div
          animate={{ 
            x: ['-120%', '220%'],
            y: [0, -8, 0, -5, 0, -3, 0]
          }}
          transition={{ 
            x: { 
              duration: 3.5, 
              repeat: Infinity, 
              ease: "linear",
              repeatDelay: 0
            },
            y: { 
              duration: 0.6, 
              repeat: Infinity,
              ease: "easeInOut"
            }
          }}
          className="absolute top-1/2 left-0 z-20"
          style={{ 
            willChange: 'transform',
            transform: 'translateZ(0)' // Force GPU acceleration
          }}
        >
          <Car className="h-14 w-14 sm:h-20 sm:w-20 text-congo-red drop-shadow-[0_4px_12px_hsl(var(--congo-red)/0.4)]" />
        </motion.div>
        
        {/* Message rotatif avec fade */}
        <div className="absolute bottom-[30%] left-1/2 -translate-x-1/2 w-full max-w-sm px-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentMessage}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="text-center"
            >
              <p className="text-lg sm:text-xl font-semibold text-foreground flex items-center justify-center gap-1">
                {messages[currentMessage]}
                <TypewriterDots />
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};
