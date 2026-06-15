import React from 'react';
import { motion } from 'framer-motion';

export const FloatingParticles: React.FC = () => {
  const particles = Array.from({ length: 15 }, (_, i) => i);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full"
          style={{
            background: i % 4 === 0 
              ? 'hsl(357, 85%, 50%)' 
              : i % 4 === 1 
                ? 'hsl(42, 100%, 60%)' 
                : i % 4 === 2 
                  ? 'hsl(142, 85%, 45%)'
                  : 'hsl(220, 100%, 50%)',
            opacity: 0.3
          }}
          initial={{
            x: Math.random() * 100 + '%',
            y: Math.random() * 100 + '%',
            scale: Math.random() * 0.5 + 0.5,
          }}
          animate={{
            y: [null, Math.random() * -100 + '%'],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: Math.random() * 3 + 2,
            repeat: Infinity,
            delay: Math.random() * 2,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
};
