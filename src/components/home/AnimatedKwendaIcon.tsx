import React from 'react';
import { motion } from 'framer-motion';
import kwendaIcon from '@/assets/LOGO_TAGA.png';

export const AnimatedKwendaIcon: React.FC = () => {
  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Conteneur principal */}
      <motion.div
        className="relative flex items-center justify-center"
        whileHover={{ scale: 1.1, rotate: 5 }}
        transition={{ type: "spring", stiffness: 400, damping: 10 }}
      >
        {/* Glow effect pulsant */}
        <motion.div
          className="absolute inset-0 -inset-2 rounded-full bg-primary/20 dark:bg-primary/25 blur-xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.4, 0.6, 0.4],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{ willChange: 'transform, opacity' }}
        />

        {/* Icône principale avec backdrop élégant */}
        <motion.div
          className="relative z-10 bg-card/95 backdrop-blur-md rounded-full p-3 border border-primary/20 shadow-xl"
          animate={{
            boxShadow: [
              '0 4px 20px hsl(var(--primary) / 0.3)',
              '0 4px 30px hsl(var(--primary) / 0.5)',
              '0 4px 20px hsl(var(--primary) / 0.3)',
            ],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{ willChange: 'box-shadow', transform: 'translateZ(0)' }}
        >
          <motion.img
            src={kwendaIcon}
            alt="TAGA"
            className="h-12 w-12 sm:h-14 sm:w-14 object-contain drop-shadow-lg"
            animate={{
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            style={{ willChange: 'transform' }}
          />

        </motion.div>

        {/* Mini particules scintillantes */}
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 bg-primary/60 rounded-full blur-[1px]"
            style={{
              top: `${20 + i * 25}%`,
              left: `${10 + i * 30}%`,
              willChange: 'transform, opacity'
            }}
            animate={{
              y: [0, -12, 0],
              opacity: [0, 0.8, 0],
              scale: [0.4, 1, 0.4],
            }}
            transition={{
              duration: 2.3 + i * 0.3,
              repeat: Infinity,
              delay: i * 0.35,
              ease: "easeInOut"
            }}
          />
        ))}
      </motion.div>
    </motion.div>
  );
};