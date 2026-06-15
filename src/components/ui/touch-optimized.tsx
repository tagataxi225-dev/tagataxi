import React from 'react';
import { cn } from '@/lib/utils';
import { Button, ButtonProps } from '@/components/ui/button';
import { useSwipeable } from 'react-swipeable';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

interface TouchOptimizedButtonProps extends ButtonProps {
  hapticFeedback?: 'light' | 'medium' | 'heavy';
  minTouchTarget?: boolean;
}

export const TouchOptimizedButton: React.FC<TouchOptimizedButtonProps> = ({
  children,
  className,
  hapticFeedback: hapticIntensity = 'light',
  minTouchTarget = true,
  onClick,
  ...props
}) => {
  const { triggerHaptic } = useHapticFeedback();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    triggerHaptic(hapticIntensity);
    onClick?.(e);
  };

  return (
    <Button
      className={cn(
        'touch-manipulation',
        minTouchTarget && 'min-touch-target',
        'active:scale-95 transition-transform duration-75',
        className
      )}
      onClick={handleClick}
      {...props}
    >
      {children}
    </Button>
  );
};

interface TouchOptimizedCardProps {
  children: React.ReactNode;
  className?: string;
  onTap?: () => void;
  pressScale?: number;
}

export const TouchOptimizedCard: React.FC<TouchOptimizedCardProps> = ({
  children,
  className,
  onTap,
  pressScale = 0.98
}) => {
  const { triggerHaptic } = useHapticFeedback();

  const handleClick = () => {
    triggerHaptic('light');
    onTap?.();
  };

  return (
    <div
      className={cn(
        'touch-manipulation cursor-pointer',
        'transition-transform duration-150 ease-out',
        'active:scale-[0.98] hover:scale-[1.02]',
        'min-touch-target',
        className
      )}
      onClick={handleClick}
      style={{
        '--press-scale': pressScale
      } as React.CSSProperties}
    >
      {children}
    </div>
  );
};

interface SwipeableProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
  className?: string;
}

export const SwipeableContainer: React.FC<SwipeableProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 50,
  className
}) => {
  const { triggerHaptic } = useHapticFeedback();

  const handlers = useSwipeable({
    onSwipedLeft: () => { triggerHaptic('light'); onSwipeLeft?.(); },
    onSwipedRight: () => { triggerHaptic('light'); onSwipeRight?.(); },
    onSwipedUp: () => { triggerHaptic('light'); onSwipeUp?.(); },
    onSwipedDown: () => { triggerHaptic('light'); onSwipeDown?.(); },
    trackMouse: false,
    trackTouch: true,
    delta: threshold,
    preventScrollOnSwipe: false,
  });

  return (
    <div
      {...handlers}
      className={cn('touch-manipulation', className)}
    >
      {children}
    </div>
  );
};

export { TouchOptimizedButton as Button };
export default TouchOptimizedButton;
