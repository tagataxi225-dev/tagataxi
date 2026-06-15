import { motion } from 'framer-motion';
import { useEffect } from 'react';

export type StampType = 'win' | 'bonus';

interface StampRevealProps {
  type: StampType;
  value: number;
  currency?: string;
  onAnimationComplete?: () => void;
}

export const StampReveal = ({ 
  type, 
  value, 
  currency = 'CDF',
  onAnimationComplete 
}: StampRevealProps) => {
  
  // Haptic feedback on mount
  useEffect(() => {
    if ('vibrate' in navigator) {
      // Pattern: impact - pause - confirmation
      navigator.vibrate([100, 50, 100]);
    }
  }, []);

  const isWin = type === 'win';
  
  // Colors based on type
  const colors = {
    win: {
      primary: 'hsl(142 76% 36%)', // Green
      secondary: 'hsl(142 76% 26%)',
      bg: 'hsl(142 76% 95%)',
      text: 'GAGNÉ'
    },
    bonus: {
      primary: 'hsl(38 92% 50%)', // Orange/Gold
      secondary: 'hsl(38 92% 40%)',
      bg: 'hsl(38 92% 95%)',
      text: 'BONUS'
    }
  };

  const config = colors[type];

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none"
      initial="hidden"
      animate="visible"
    >
      {/* Ink splatter background effect */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.15 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="absolute w-40 h-40 rounded-full"
        style={{
          background: `radial-gradient(circle, ${config.primary}40 0%, transparent 70%)`,
          filter: 'blur(8px)'
        }}
      />

      {/* Main stamp container */}
      <motion.div
        initial={{ 
          y: -120, 
          scale: 1.8, 
          opacity: 0, 
          rotate: -20,
        }}
        animate={{ 
          y: 0, 
          scale: 1, 
          opacity: 1, 
          rotate: 0,
        }}
        transition={{ 
          type: 'spring' as const, 
          stiffness: 400, 
          damping: 12,
          mass: 1.2,
        }}
        onAnimationComplete={onAnimationComplete}
        style={{
          filter: 'drop-shadow(0 6px 20px rgba(0,0,0,0.35))'
        }}
      >
        {/* Secondary rotation animation */}
        <motion.div
          initial={{ rotate: -8 }}
          animate={{ rotate: [-8, 4, -2, 0] }}
          transition={{ 
            duration: 0.5,
            times: [0, 0.4, 0.7, 1],
            ease: 'easeOut'
          }}
        >
          {/* Stamp body */}
          <div 
            className="relative w-32 h-32 rounded-full flex items-center justify-center"
            style={{
              background: config.bg,
              border: `4px solid ${config.primary}`,
              boxShadow: `
                inset 0 0 0 3px ${config.bg},
                inset 0 0 0 6px ${config.primary},
                inset 0 0 0 9px ${config.bg},
                inset 0 0 0 10px ${config.secondary}30
              `,
              transform: 'rotate(-3deg)'
            }}
          >
            {/* Circular text around edge */}
            <svg 
              className="absolute inset-0 w-full h-full" 
              viewBox="0 0 120 120"
            >
              <defs>
                <path
                  id="circlePath"
                  d="M 60, 60 m -48, 0 a 48,48 0 1,1 96,0 a 48,48 0 1,1 -96,0"
                />
              </defs>
              <text 
                fill={config.primary}
                fontSize="7"
                fontWeight="600"
                letterSpacing="2"
              >
                <textPath href="#circlePath" startOffset="0%">
                  KWENDA GRATTA • KINSHASA • {new Date().getFullYear()} •
                </textPath>
              </text>
            </svg>

            {/* Center content */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ 
                delay: 0.15,
                type: 'spring' as const,
                stiffness: 300,
                damping: 15
              }}
              className="flex flex-col items-center justify-center text-center z-10"
            >
              {/* Main stamp text */}
              <span 
                className="text-2xl font-black tracking-wider"
                style={{ 
                  color: config.primary,
                  textShadow: `1px 1px 0 ${config.secondary}30`
                }}
              >
                {config.text}
              </span>
              
              {/* Value display */}
              <span 
                className="text-xs font-bold mt-0.5 opacity-80"
                style={{ color: config.secondary }}
              >
                {value.toLocaleString('fr-FR')} {currency}
              </span>

              {/* Decorative stars */}
              <div className="flex gap-1 mt-1" style={{ color: config.primary }}>
                <span className="text-[8px]">★</span>
                <span className="text-[10px]">★</span>
                <span className="text-[8px]">★</span>
              </div>
            </motion.div>

            {/* Ink texture overlay */}
            <div 
              className="absolute inset-0 rounded-full opacity-20 pointer-events-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                mixBlendMode: 'multiply'
              }}
            />

            {/* Irregular edge effect (ink bleeding) */}
            <div 
              className="absolute -inset-1 rounded-full opacity-30 pointer-events-none"
              style={{
                border: `2px dashed ${config.primary}`,
                borderRadius: '50%',
                transform: 'rotate(15deg)'
              }}
            />
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default StampReveal;
