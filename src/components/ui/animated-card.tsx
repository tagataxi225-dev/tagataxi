/**
 * ANIMATED CARD COMPONENT - Premium UX
 * Card avec animations fluides et micro-interactions
 */

import * as React from 'react';
import { motion, type Variants } from 'framer-motion';
import { cn } from '@/lib/utils';

// Presets d'animation optimisés pour 60fps
export const cardAnimationPresets = {
  // Fade up - apparition standard
  fadeUp: {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
  },
  
  // Soft - effet subtil
  soft: {
    initial: { opacity: 0, scale: 0.98 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.98 },
  },
  
  // Slide - pour les listes
  slideIn: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
  }
};

// Scale pour hover/tap
const interactiveAnimation = {
  whileHover: { scale: 1.02, y: -2 },
  whileTap: { scale: 0.98 },
};

// Variants pour stagger animations (listes)
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.02
    }
  }
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.25, 
      ease: [0.25, 0.1, 0.25, 1] 
    }
  }
};

interface AnimatedCardProps {
  variant?: 'fadeUp' | 'soft' | 'slideIn';
  interactive?: boolean;
  delay?: number;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const AnimatedCard = React.forwardRef<HTMLDivElement, AnimatedCardProps>(
  ({ className, variant = 'fadeUp', interactive = true, delay = 0, children, onClick }, ref) => {
    const animation = cardAnimationPresets[variant];
    
    return (
      <motion.div
        ref={ref}
        className={cn(
          'rounded-xl border bg-card text-card-foreground shadow-elegant',
          'transition-shadow duration-300',
          interactive && 'hover:shadow-glow cursor-pointer',
          className
        )}
        initial={animation.initial}
        animate={animation.animate}
        exit={animation.exit}
        whileHover={interactive ? interactiveAnimation.whileHover : undefined}
        whileTap={interactive ? interactiveAnimation.whileTap : undefined}
        transition={{ 
          duration: 0.25, 
          ease: [0.25, 0.1, 0.25, 1],
          delay,
        }}
        style={{
          willChange: 'transform, opacity',
          transform: 'translateZ(0)'
        }}
        onClick={onClick}
      >
        {children}
      </motion.div>
    );
  }
);

AnimatedCard.displayName = 'AnimatedCard';

// Wrapper pour listes animées avec stagger
interface AnimatedListProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export const AnimatedList: React.FC<AnimatedListProps> = ({ 
  children, 
  className,
  delay = 0 
}) => {
  return (
    <motion.div
      className={className}
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
};

// Item pour les listes animées
export const AnimatedListItem: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  return (
    <motion.div 
      className={className} 
      variants={staggerItem}
      style={{ willChange: 'transform, opacity' }}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedCard;
