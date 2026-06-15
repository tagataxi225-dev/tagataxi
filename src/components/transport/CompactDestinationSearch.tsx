import { Search, MapPin, Home, Building, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlaces } from "@/hooks/usePlaces";

interface CompactDestinationSearchProps {
  destination: string | null;
  onOpenSearch: () => void;
  onSelectQuick?: (location: { address: string; lat: number; lng: number; name: string }) => void;
  city?: string;
  className?: string;
}

export default function CompactDestinationSearch({
  destination,
  onOpenSearch,
  onSelectQuick,
  city = "Kinshasa",
  className,
}: CompactDestinationSearchProps) {
  const { homePlace, workPlace, loading } = usePlaces();

  const triggerHaptic = () => {
    try {
      if ("vibrate" in navigator) navigator.vibrate(10);
    } catch {}
  };

  const hasValidCoords = (
    coords: { lat?: number; lng?: number } | undefined | null,
  ): coords is { lat: number; lng: number } => {
    if (!coords) return false;
    return (
      typeof coords.lat === "number" &&
      typeof coords.lng === "number" &&
      !(coords.lat === 0 && coords.lng === 0) &&
      !isNaN(coords.lat) &&
      !isNaN(coords.lng)
    );
  };

  return (
    <div className={cn("pb-2", className)} onClick={(e) => e.stopPropagation()}>
      {/* Search bar — native button */}
      <button
        type="button"
        onClick={() => {
          console.log('🔴 CompactDest: search bar tapped');
          onOpenSearch();
          triggerHaptic();
        }}
        onTouchEnd={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onOpenSearch();
        }}
        className="w-full bg-card border border-border rounded-xl overflow-hidden shadow-sm cursor-pointer active:bg-accent/30 transition-colors text-left"
        style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent" } as React.CSSProperties}
      >
        <div className="w-full h-12 px-4 flex items-center gap-3">
          <div>
            {destination ? (
              <MapPin className="w-5 h-5 text-primary" />
            ) : (
              <Search className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1">
            {destination ? (
              <div>
                <p className="text-[10px] text-muted-foreground">Destination</p>
                <p className="text-sm font-semibold text-foreground truncate">{destination.split(",")[0]}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Où allez-vous ?</p>
            )}
          </div>
          {destination && (
            <div className="w-5 h-5 rounded-full bg-green-500/15 flex items-center justify-center">
              <span className="text-green-600 text-xs">✓</span>
            </div>
          )}
        </div>
      </button>

      {/* Quick chips — maison + travail */}
      {!destination && !loading && (homePlace || workPlace) && (
        <div className="flex gap-2 mt-2 overflow-x-auto no-scrollbar pb-1">
          {homePlace && (
            <button
              type="button"
              onClick={() => {
                if (!hasValidCoords(homePlace.coordinates)) {
                  onOpenSearch();
                  return;
                }
                onSelectQuick?.({
                  address: homePlace.address,
                  lat: homePlace.coordinates.lat,
                  lng: homePlace.coordinates.lng,
                  name: homePlace.name,
                });
                triggerHaptic();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium whitespace-nowrap bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-200 flex-shrink-0"
              style={{ touchAction: "manipulation" } as React.CSSProperties}
            >
              <Home className="w-3 h-3" />
              <span>Maison</span>
            </button>
          )}
          {workPlace && (
            <button
              type="button"
              onClick={() => {
                if (!hasValidCoords(workPlace.coordinates)) {
                  onOpenSearch();
                  return;
                }
                onSelectQuick?.({
                  address: workPlace.address,
                  lat: workPlace.coordinates.lat,
                  lng: workPlace.coordinates.lng,
                  name: workPlace.name,
                });
                triggerHaptic();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium whitespace-nowrap bg-muted/60 text-foreground border-border/30 flex-shrink-0"
              style={{ touchAction: "manipulation" } as React.CSSProperties}
            >
              <Building className="w-3 h-3 text-muted-foreground" />
              <span>Travail</span>
            </button>
          )}
          <button
            type="button"
            onClick={onOpenSearch}
            className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-dashed border-muted-foreground/30 text-muted-foreground/50 flex-shrink-0 self-center"
            style={{ touchAction: "manipulation" } as React.CSSProperties}
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
