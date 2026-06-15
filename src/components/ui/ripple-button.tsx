/**
 * RIPPLE BUTTON COMPONENT
 * Bouton avec effet ripple Material Design et feedback haptique
 */

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

const rippleButtonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium overflow-hidden ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-elegant hover:shadow-glow rounded-xl",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-md rounded-xl",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground shadow-sm rounded-xl",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-md rounded-xl",
        ghost: "hover:bg-accent hover:text-accent-foreground rounded-xl",
        link: "text-primary underline-offset-4 hover:underline",
        hero: "bg-gradient-hero text-white shadow-glow font-semibold rounded-xl",
        success: "bg-gradient-success text-white shadow-md rounded-xl",
        soft: "bg-card border border-border shadow-lg rounded-xl",
        congo: "btn-congo rounded-xl shadow-elegant",
        glass: "glass-button text-foreground rounded-xl shadow-md",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
        touch: "h-12 px-6 min-w-[44px]", // Touch-friendly
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

interface RippleType {
  id: number;
  x: number;
  y: number;
  size: number;
}

export interface RippleButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof rippleButtonVariants> {
  asChild?: boolean;
  loading?: boolean;
  haptic?: boolean;
  hapticStyle?: 'light' | 'medium' | 'heavy';
}

const RippleButton = React.forwardRef<HTMLButtonElement, RippleButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    asChild = false, 
    loading = false,
    haptic = true,
    hapticStyle = 'light',
    children,
    onClick,
    disabled,
    ...props 
  }, ref) => {
    const [ripples, setRipples] = React.useState<RippleType[]>([]);
    const rippleIdRef = React.useRef(0);

    // Trigger haptic feedback
    const triggerHaptic = React.useCallback(async () => {
      if (!haptic || !Capacitor.isNativePlatform()) return;
      
      try {
        const style = {
          light: ImpactStyle.Light,
          medium: ImpactStyle.Medium,
          heavy: ImpactStyle.Heavy
        }[hapticStyle];
        
        await Haptics.impact({ style });
      } catch {
        // Ignore errors
      }
    }, [haptic, hapticStyle]);

    // Create ripple effect
    const createRipple = React.useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
      const button = event.currentTarget;
      const rect = button.getBoundingClientRect();
      
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const size = Math.max(rect.width, rect.height) * 2;
      
      const newRipple: RippleType = {
        id: rippleIdRef.current++,
        x: x - size / 2,
        y: y - size / 2,
        size
      };

      setRipples(prev => [...prev, newRipple]);

      // Remove ripple after animation
      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== newRipple.id));
      }, 600);
    }, []);

    // Handle click
    const handleClick = React.useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled || loading) return;
      
      createRipple(event);
      triggerHaptic();
      onClick?.(event);
    }, [disabled, loading, createRipple, triggerHaptic, onClick]);

    if (asChild) {
      return (
        <Slot
          className={cn(rippleButtonVariants({ variant, size, className }))}
          ref={ref}
          {...props}
        />
      );
    }

    return (
      <button
        className={cn(
          rippleButtonVariants({ variant, size, className }),
          'relative overflow-hidden active:scale-[0.98] hover:scale-[1.02] transition-transform duration-150'
        )}
        ref={ref}
        onClick={handleClick}
        disabled={disabled || loading}
        {...props}
      >
        {/* Ripple effects */}
        <AnimatePresence>
          {ripples.map(ripple => (
            <motion.span
              key={ripple.id}
              className="absolute rounded-full bg-white/30 pointer-events-none"
              style={{
                left: ripple.x,
                top: ripple.y,
                width: ripple.size,
                height: ripple.size,
              }}
              initial={{ scale: 0, opacity: 0.8 }}
              animate={{ scale: 1, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          ))}
        </AnimatePresence>

        {/* Loading spinner */}
        {loading && (
          <span className="absolute inset-0 flex items-center justify-center bg-inherit rounded-inherit">
            <Loader2 className="h-4 w-4 animate-spin" />
          </span>
        )}

        {/* Content */}
        <span className={cn(loading && 'opacity-0')}>
          {children}
        </span>
      </button>
    );
  }
);

RippleButton.displayName = 'RippleButton';

export { RippleButton, rippleButtonVariants };
