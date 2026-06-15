import React, { useCallback, useRef, useState } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { RefreshCw, ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  refreshThreshold?: number;
  disabled?: boolean;
  className?: string;
}

type RefreshState = 'idle' | 'pulling' | 'ready' | 'refreshing';

export const PullToRefresh = ({
  children,
  onRefresh,
  refreshThreshold = 80,
  disabled = false,
  className,
}: PullToRefreshProps) => {
  const [state, setState] = useState<RefreshState>('idle');
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  const pullDistance = useMotionValue(0);
  const { triggerHaptic } = useHapticFeedback();
  
  // Animations fluides
  const opacity = useTransform(pullDistance, [0, refreshThreshold * 0.5, refreshThreshold], [0, 0.5, 1]);
  const scale = useTransform(pullDistance, [0, refreshThreshold], [0.6, 1]);
  const arrowRotation = useTransform(pullDistance, [0, refreshThreshold], [0, 180]);
  const progressStroke = useTransform(pullDistance, [0, refreshThreshold], [0, 283]); // 2 * PI * 45 (circle circumference)
  
  // ✅ Hook déplacé au niveau du composant (pas dans le JSX conditionnel)
  const strokeDashoffset = useTransform(progressStroke, v => 283 - v);

  const getScrollTop = useCallback(() => {
    if (!containerRef.current) return 0;
    const parent = containerRef.current.closest('[data-scroll-container]');
    if (parent) {
      return parent.scrollTop;
    }
    return window.scrollY || document.documentElement.scrollTop;
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled || state === 'refreshing') return;
    
    const scrollTop = getScrollTop();
    if (scrollTop <= 0) {
      startY.current = e.touches[0].clientY;
      currentY.current = startY.current;
    }
  }, [disabled, state, getScrollTop]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (disabled || state === 'refreshing') return;
    
    const scrollTop = getScrollTop();
    if (scrollTop > 0) {
      pullDistance.set(0);
      setState('idle');
      return;
    }

    currentY.current = e.touches[0].clientY;
    const diff = currentY.current - startY.current;
    
    // Block native pull-to-refresh on Chrome Android
    if (diff > 10 && scrollTop <= 0) {
      e.preventDefault();
    }
    
    if (diff > 0) {
      // Résistance progressive pour un effet naturel
      const resistance = 0.35;
      const distance = Math.min(diff * resistance, refreshThreshold * 1.5);
      pullDistance.set(distance);
      
      if (distance >= refreshThreshold && state !== 'ready') {
        setState('ready');
        triggerHaptic('medium');
      } else if (distance < refreshThreshold && distance > 0 && state !== 'pulling') {
        setState('pulling');
      }
    }
  }, [disabled, state, refreshThreshold, pullDistance, triggerHaptic, getScrollTop]);

  const handleTouchEnd = useCallback(async () => {
    if (disabled) return;

    if (state === 'ready') {
      setState('refreshing');
      triggerHaptic('heavy');
      pullDistance.set(refreshThreshold * 0.5);
      
      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        pullDistance.set(0);
        setState('idle');
      }
    } else {
      pullDistance.set(0);
      setState('idle');
    }
    
    startY.current = 0;
    currentY.current = 0;
  }, [disabled, state, onRefresh, pullDistance, refreshThreshold, triggerHaptic]);

  const getStateText = () => {
    switch (state) {
      case 'pulling':
        return 'Tirer pour actualiser';
      case 'ready':
        return 'Relâcher pour actualiser';
      case 'refreshing':
        return 'Actualisation...';
      default:
        return '';
    }
  };

  return (
    <div 
      ref={containerRef}
      className={cn('relative touch-pan-y', className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator moderne */}
      <AnimatePresence>
        {state !== 'idle' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ 
              opacity: 1, 
              height: state === 'refreshing' ? 70 : pullDistance.get() 
            }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="absolute top-0 left-0 right-0 z-50 flex flex-col items-center justify-center overflow-hidden"
          >
            {/* Background gradient subtil */}
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-primary/3 to-transparent" />
            
            <motion.div
              style={{ scale, opacity }}
              className="relative flex flex-col items-center gap-2"
            >
              {/* Cercle de progression */}
              <div className="relative">
                {/* Cercle de fond */}
                <svg className="w-12 h-12 -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    className="text-muted/20"
                  />
                  {state !== 'refreshing' && (
                    <motion.circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray="283"
                      style={{ strokeDashoffset }}
                      className="text-primary"
                    />
                  )}
                </svg>
                
                {/* Icône centrale */}
                <div className="absolute inset-0 flex items-center justify-center">
                  {state === 'refreshing' ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ 
                        duration: 0.8, 
                        repeat: Infinity, 
                        ease: 'linear' 
                      }}
                    >
                      <RefreshCw className="h-5 w-5 text-primary" />
                    </motion.div>
                  ) : (
                    <motion.div
                      style={{ rotate: arrowRotation }}
                      transition={{ type: 'spring', stiffness: 300 }}
                    >
                      <ArrowUp className={cn(
                        "h-5 w-5 transition-colors duration-200",
                        state === 'ready' ? 'text-primary' : 'text-muted-foreground'
                      )} />
                    </motion.div>
                  )}
                </div>
              </div>
              
              {/* Texte d'état */}
              <motion.span 
                className={cn(
                  "text-xs font-medium transition-colors duration-200",
                  state === 'ready' ? 'text-primary' : 'text-muted-foreground'
                )}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                {getStateText()}
              </motion.span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content avec animation de déplacement fluide */}
      <motion.div
        style={{ 
          y: state !== 'idle' ? pullDistance : 0 
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 35 }}
      >
        {children}
      </motion.div>
    </div>
  );
};

export default PullToRefresh;
