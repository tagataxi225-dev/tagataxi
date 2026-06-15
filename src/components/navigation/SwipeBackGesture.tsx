import { useSwipeBack } from '@/hooks/useSwipeBack';
import { ChevronLeft } from 'lucide-react';

/**
 * 🔙 iOS-style swipe-from-edge gesture overlay
 * Shows a chevron + edge shadow when user swipes from the left edge
 */
export const SwipeBackGesture = () => {
  const { active, progress } = useSwipeBack();

  if (!active) return null;

  const chevronScale = 0.6 + progress * 0.4;
  const chevronOpacity = Math.min(progress * 1.5, 1);
  const shadowOpacity = progress * 0.25;
  const chevronX = -20 + progress * 40; // slides in from -20 to +20

  return (
    <div
      className="fixed inset-0 z-[9999] pointer-events-none"
      aria-hidden="true"
    >
      {/* Edge shadow */}
      <div
        className="absolute inset-y-0 left-0 w-16"
        style={{
          background: `linear-gradient(to right, hsl(var(--foreground) / ${shadowOpacity}), transparent)`,
          transition: active ? 'none' : 'opacity 200ms ease-out',
        }}
      />

      {/* Chevron indicator */}
      <div
        className="absolute top-1/2 -translate-y-1/2 flex items-center justify-center w-9 h-9 rounded-full bg-background/90 shadow-lg border border-border/50 backdrop-blur-sm"
        style={{
          left: `${chevronX}px`,
          opacity: chevronOpacity,
          transform: `translateY(-50%) scale(${chevronScale})`,
          transition: active ? 'none' : 'all 200ms ease-out',
        }}
      >
        <ChevronLeft
          className="w-5 h-5 text-foreground"
          strokeWidth={2.5}
        />
      </div>
    </div>
  );
};
