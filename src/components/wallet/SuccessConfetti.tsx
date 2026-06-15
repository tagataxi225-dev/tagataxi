import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SuccessConfettiProps {
  show: boolean;
  onComplete?: () => void;
}

export const SuccessConfetti: React.FC<SuccessConfettiProps> = ({
  show,
  onComplete
}) => {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; rotation: number; color: string }>>([]);

  useEffect(() => {
    if (show) {
      // Congo flag colors
      const colors = [
        'hsl(357, 85%, 50%)',  // Congo red
        'hsl(42, 100%, 60%)',  // Congo yellow
        'hsl(142, 85%, 45%)',  // Congo green
        'hsl(220, 100%, 50%)'  // Congo blue
      ];
      const newParticles = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        rotation: Math.random() * 360,
        color: colors[Math.floor(Math.random() * colors.length)]
      }));
      setParticles(newParticles);

      const timer = setTimeout(() => {
        onComplete?.();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 pointer-events-none z-[100]">
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              initial={{
                x: `${particle.x}%`,
                y: '-10%',
                rotate: particle.rotation,
                scale: 1,
                opacity: 1
              }}
              animate={{
                y: '120%',
                rotate: particle.rotation + 720,
                scale: 0,
                opacity: 0
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 2 + Math.random(),
                ease: 'easeOut'
              }}
              className="absolute w-3 h-3 rounded-sm"
              style={{ backgroundColor: particle.color }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
};
