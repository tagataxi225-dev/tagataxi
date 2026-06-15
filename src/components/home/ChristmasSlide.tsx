import React, { memo } from 'react';
import { motion } from 'framer-motion';

interface ChristmasSlideProps {
  onAction: () => void;
}

const ChristmasSlide = memo(({ onAction }: ChristmasSlideProps) => {
  return (
    <motion.div 
      className="absolute inset-0 p-4 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between text-white gap-3 overflow-hidden"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* Flocons animés dans le slide */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <motion.span
            key={i}
            className="absolute text-white/40 text-lg"
            style={{
              left: `${10 + i * 12}%`,
              top: -20,
            }}
            animate={{
              y: [0, 200],
              opacity: [0, 0.6, 0],
              rotate: [0, 180],
            }}
            transition={{
              duration: 4 + i * 0.5,
              repeat: Infinity,
              delay: i * 0.3,
              ease: "linear",
            }}
          >
            ❄
          </motion.span>
        ))}
      </div>

      {/* Étoiles scintillantes */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(5)].map((_, i) => (
          <motion.span
            key={`star-${i}`}
            className="absolute text-yellow-300 text-xs"
            style={{
              left: `${20 + i * 15}%`,
              top: `${20 + (i % 3) * 25}%`,
            }}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.4, 1, 0.4],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          >
            ✦
          </motion.span>
        ))}
      </div>

      <div className="flex items-center gap-4 sm:gap-6 relative z-10">
        {/* Sapin animé */}
        <motion.div 
          className="text-4xl sm:text-5xl"
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 3, -3, 0],
          }}
          transition={{ 
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          🎄
        </motion.div>
        
        <div>
          <motion.h3 
            className="text-2xl sm:text-4xl font-black tracking-tight mb-0.5 sm:mb-1"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            <span className="text-yellow-300">Joyeux</span> Noël !
          </motion.h3>
          <motion.p 
            className="text-white/90 text-xs sm:text-sm font-bold"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <span className="text-yellow-200">-20%</span> sur vos courses pendant les fêtes
          </motion.p>
        </div>
      </div>

      {/* Cadeaux décoratifs */}
      <motion.div
        className="absolute bottom-2 left-4 text-2xl opacity-70"
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        🎁
      </motion.div>

      <motion.button 
        onClick={onAction}
        className="self-end sm:self-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-yellow-400/30 hover:bg-yellow-400/50 backdrop-blur-sm rounded-full text-xs sm:text-sm font-bold transition-colors duration-200 border border-yellow-400/50 text-yellow-100 relative z-10"
        whileHover={{ scale: 1.05, x: 5 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        <span className="mr-1">🎅</span> Célébrer →
      </motion.button>
    </motion.div>
  );
});

ChristmasSlide.displayName = 'ChristmasSlide';

export { ChristmasSlide };
