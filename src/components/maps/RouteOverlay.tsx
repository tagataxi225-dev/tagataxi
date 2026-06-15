import React from 'react';
import { Clock, Navigation, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RouteOverlayProps {
  distance: string;
  duration: string;
  price?: string;
  className?: string;
}

export default function RouteOverlay({
  distance,
  duration,
  price,
  className
}: RouteOverlayProps) {
  return (
    <div className={cn(
      "absolute bottom-6 left-1/2 -translate-x-1/2 z-10",
      "bg-background/95 backdrop-blur-xl rounded-2xl border border-border/50 shadow-2xl",
      "px-6 py-4 min-w-[300px]",
      "animate-fade-in",
      className
    )}>
      <div className="flex items-center justify-between gap-6">
        {/* Distance */}
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Navigation className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Distance</p>
            <p className="text-sm font-semibold">{distance}</p>
          </div>
        </div>

        {/* Separator */}
        <div className="h-8 w-px bg-border" />

        {/* Duration */}
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
            <Clock className="h-5 w-5 text-secondary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Durée</p>
            <p className="text-sm font-semibold">{duration}</p>
          </div>
        </div>

        {/* Price (optional) */}
        {price && (
          <>
            <div className="h-8 w-px bg-border" />
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Prix</p>
                <p className="text-sm font-semibold text-primary">{price}</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
