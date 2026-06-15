import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSwipeable } from 'react-swipeable';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

interface TouchOptimizedInterfaceProps {
  children: React.ReactNode;
  className?: string;
  enableSwipeGestures?: boolean;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

export const TouchOptimizedInterface: React.FC<TouchOptimizedInterfaceProps> = ({
  children,
  className,
  enableSwipeGestures = false,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown
}) => {
  const isMobile = useIsMobile();
  const { triggerHaptic } = useHapticFeedback();

  const handlers = useSwipeable({
    onSwipedLeft: () => { if (enableSwipeGestures && onSwipeLeft) { triggerHaptic('light'); onSwipeLeft(); } },
    onSwipedRight: () => { if (enableSwipeGestures && onSwipeRight) { triggerHaptic('light'); onSwipeRight(); } },
    onSwipedUp: () => { if (enableSwipeGestures && onSwipeUp) { triggerHaptic('light'); onSwipeUp(); } },
    onSwipedDown: () => { if (enableSwipeGestures && onSwipeDown) { triggerHaptic('light'); onSwipeDown(); } },
    trackMouse: false,
    trackTouch: true,
    delta: 50,
    preventScrollOnSwipe: false,
  });

  return (
    <div
      {...(enableSwipeGestures ? handlers : {})}
      className={cn(
        'touch-pan-y touch-manipulation',
        isMobile && 'select-none',
        className
      )}
    >
      {children}
    </div>
  );
};

interface TouchOptimizedButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  hapticFeedback?: 'light' | 'medium' | 'heavy';
}

export const TouchOptimizedButton: React.FC<TouchOptimizedButtonProps> = ({
  children,
  onClick,
  variant = 'default',
  size = 'md',
  disabled = false,
  className,
  hapticFeedback: hapticIntensity = 'light'
}) => {
  const isMobile = useIsMobile();
  const { triggerHaptic } = useHapticFeedback();
  const [isPressed, setIsPressed] = useState(false);

  const handleClick = () => {
    if (disabled) return;
    triggerHaptic(hapticIntensity);
    onClick?.();
  };

  const sizeStyles = {
    sm: 'min-h-[40px] min-w-[40px] px-3 py-2 text-sm',
    md: 'min-h-[44px] min-w-[44px] px-4 py-2.5 text-base',
    lg: 'min-h-[48px] min-w-[48px] px-6 py-3 text-lg'
  };

  return (
    <Button
      variant={variant}
      disabled={disabled}
      className={cn(
        sizeStyles[size],
        'transition-all duration-150 touch-manipulation',
        isPressed && 'scale-95 opacity-90',
        isMobile && 'active:scale-95 active:opacity-90',
        className
      )}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      onTouchCancel={() => setIsPressed(false)}
      onClick={handleClick}
    >
      {children}
    </Button>
  );
};

interface SwipeableCardProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  className?: string;
  swipeThreshold?: number;
}

export const SwipeableCard: React.FC<SwipeableCardProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  className,
  swipeThreshold = 100
}) => {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const startX = useRef(0);
  const isDragging = useRef(false);
  const { triggerHaptic } = useHapticFeedback();

  const handlers = useSwipeable({
    onSwiping: (eventData) => {
      const clampedX = Math.max(-swipeThreshold, Math.min(swipeThreshold, eventData.deltaX));
      setSwipeOffset(clampedX);
    },
    onSwipedLeft: () => {
      if (Math.abs(swipeOffset) > swipeThreshold * 0.6 && onSwipeLeft) {
        triggerHaptic('medium');
        onSwipeLeft();
      }
      setSwipeOffset(0);
    },
    onSwipedRight: () => {
      if (swipeOffset > swipeThreshold * 0.6 && onSwipeRight) {
        triggerHaptic('medium');
        onSwipeRight();
      }
      setSwipeOffset(0);
    },
    onTouchEndOrOnMouseUp: () => setSwipeOffset(0),
    trackMouse: false,
    trackTouch: true,
    delta: 10,
    preventScrollOnSwipe: true,
  });

  return (
    <Card
      {...handlers}
      className={cn(
        'transition-transform duration-200 touch-manipulation',
        className
      )}
      style={{
        transform: `translateX(${swipeOffset}px)`,
      }}
    >
      {children}
    </Card>
  );
};

export default TouchOptimizedInterface;
