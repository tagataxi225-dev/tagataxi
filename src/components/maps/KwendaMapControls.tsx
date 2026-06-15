import React, { useCallback } from 'react';
import { Plus, Minus, Crosshair, Navigation, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KwendaMapControlsProps {
  onLocate: () => void;
  isLocating?: boolean;
  isLocated?: boolean;
  bottomSheetHeight?: number;
  className?: string;
  mapInstance?: google.maps.Map | null;
}

function animateZoom(map: google.maps.Map, targetZoom: number) {
  const startZoom = map.getZoom() || 13;
  const startTilt = map.getTilt() || 0;
  const targetTilt = targetZoom > 15 ? Math.min((targetZoom - 15) * 9, 45) : 0;
  const startTime = performance.now();
  const duration = 300;

  const step = (now: number) => {
    const p = Math.min((now - startTime) / duration, 1);
    const e = 1 - Math.pow(1 - p, 3);
    map.setZoom(startZoom + (targetZoom - startZoom) * e);
    map.setTilt(startTilt + (targetTilt - startTilt) * e);
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

const KwendaMapControls = React.memo(({
  onLocate,
  isLocating = false,
  isLocated = false,
  bottomSheetHeight = 450,
  className,
  mapInstance
}: KwendaMapControlsProps) => {
  const buttonBottom = Math.min(bottomSheetHeight, window.innerHeight * 0.55) + 16;

  const handleZoomIn = useCallback(() => {
    if (!mapInstance) return;
    const current = mapInstance.getZoom() || 13;
    if (current < (mapInstance.get('maxZoom') ?? 20)) {
      animateZoom(mapInstance, current + 1);
    }
  }, [mapInstance]);

  const handleZoomOut = useCallback(() => {
    if (!mapInstance) return;
    const current = mapInstance.getZoom() || 13;
    if (current > (mapInstance.get('minZoom') ?? 3)) {
      animateZoom(mapInstance, current - 1);
    }
  }, [mapInstance]);

  const LocateIcon = isLocating ? Loader2 : isLocated ? Navigation : Crosshair;

  const btnClass = cn(
    "w-10 h-10 flex items-center justify-center",
    "text-foreground/70 hover:text-foreground",
    "hover:bg-muted/50 active:scale-95",
    "transition-all duration-150",
    "disabled:opacity-40 disabled:pointer-events-none",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
  );

  return (
    <div
      className={cn("absolute right-3 z-[150]", className)}
      style={{ bottom: `${buttonBottom}px` }}
    >
      <div
        className={cn(
          "flex flex-col",
          "bg-background rounded-xl shadow-md",
          "border border-black/[0.08] dark:border-white/[0.12]",
          "overflow-hidden"
        )}
      >
        {mapInstance && (
          <>
            <button onClick={handleZoomIn} aria-label="Zoom avant" className={btnClass}>
              <Plus className="h-4 w-4" strokeWidth={2} />
            </button>
            <div className="h-px bg-black/[0.06] dark:bg-white/[0.08]" />
            <button onClick={handleZoomOut} aria-label="Zoom arrière" className={btnClass}>
              <Minus className="h-4 w-4" strokeWidth={2} />
            </button>
            <div className="h-px bg-black/[0.06] dark:bg-white/[0.08]" />
          </>
        )}
        <button onClick={onLocate} disabled={isLocating} aria-label="Ma position" className={btnClass}>
          <LocateIcon
            className={cn(
              "h-4 w-4",
              isLocating && "text-primary animate-spin",
              isLocated && !isLocating && "text-primary -rotate-45"
            )}
            strokeWidth={2}
          />
        </button>
      </div>
    </div>
  );
});

KwendaMapControls.displayName = 'KwendaMapControls';

export default KwendaMapControls;
