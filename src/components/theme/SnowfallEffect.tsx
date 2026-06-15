import React, { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useSeasonalThemeSafe } from '@/contexts/SeasonalThemeContext';

interface Snowflake {
  id: number;
  x: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
}

const SnowfallEffect = memo(() => {
  const { currentSeason, effectsEnabled } = useSeasonalThemeSafe();

  // Générer les flocons une seule fois
  const snowflakes = useMemo<Snowflake[]>(() => {
    return Array.from({ length: 25 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      size: Math.random() * 6 + 4,
      duration: Math.random() * 8 + 10,
      delay: Math.random() * 5,
      opacity: Math.random() * 0.4 + 0.3,
    }));
  }, []);

  // Ne pas afficher si ce n'est pas Noël ou si les effets sont désactivés
  if (currentSeason !== 'christmas' || !effectsEnabled) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 pointer-events-none z-[5] overflow-hidden"
      aria-hidden="true"
    >
      {snowflakes.map((flake) => (
        <motion.div
          key={flake.id}
          className="absolute text-white"
          style={{
            left: `${flake.x}%`,
            top: -20,
            fontSize: flake.size,
            opacity: flake.opacity,
            textShadow: '0 0 5px rgba(255,255,255,0.5)',
          }}
          animate={{
            y: ['0vh', '105vh'],
            x: [0, Math.sin(flake.id) * 30, 0],
            rotate: [0, 360],
          }}
          transition={{
            y: {
              duration: flake.duration,
              repeat: Infinity,
              ease: 'linear',
              delay: flake.delay,
            },
            x: {
              duration: flake.duration / 2,
              repeat: Infinity,
              repeatType: 'reverse',
              ease: 'easeInOut',
              delay: flake.delay,
            },
            rotate: {
              duration: flake.duration,
              repeat: Infinity,
              ease: 'linear',
              delay: flake.delay,
            },
          }}
        >
          ❄
        </motion.div>
      ))}
      
      {/* Overlay subtil de lueur dorée */}
      <div className="absolute inset-0 bg-gradient-to-b from-amber-500/[0.02] via-transparent to-green-500/[0.02]" />
    </div>
  );
});

SnowfallEffect.displayName = 'SnowfallEffect';

export default SnowfallEffect;
