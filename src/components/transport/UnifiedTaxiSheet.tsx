import { useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Loader2, LogIn, MapPin, AlertTriangle, Navigation } from "lucide-react";
import { cn } from "@/lib/utils";
import CompactDestinationSearch from "./CompactDestinationSearch";
import PremiumVehicleCarousel from "./PremiumVehicleCarousel";
import ModernBiddingInterface from "./ModernBiddingInterface";
import { LocationData } from "@/types/location";
import { VehicleType } from "@/types/vehicle";

interface UnifiedTaxiSheetProps {
  pickup: LocationData | null;
  destination: LocationData | null;
  selectedVehicle: string;
  onVehicleSelect: (id: string) => void;
  onDestinationSelect: () => void;
  onQuickDestinationSelect: (location: { address: string; lat: number; lng: number; name: string }) => void;
  onBook: () => void;
  isSearching: boolean;
  distance: number;
  city: string;
  currency: string;
  biddingMode?: boolean;
  onBiddingModeChange?: (enabled: boolean) => void;
  clientProposedPrice?: number | null;
  onClientProposedPriceChange?: (price: number | null) => void;
  onMinimize?: () => void;
  vehicles: VehicleType[];
  vehiclesLoading: boolean;
  isAuthenticated?: boolean;
  hasPickup?: boolean;
  pickupAccuracy?: number | null;
  onActivateGps?: () => void;
}

export default function UnifiedTaxiSheet({
  pickup,
  destination,
  selectedVehicle,
  onVehicleSelect,
  onDestinationSelect,
  onQuickDestinationSelect,
  onBook,
  isSearching,
  distance,
  city,
  currency,
  biddingMode = false,
  onBiddingModeChange,
  clientProposedPrice,
  onClientProposedPriceChange,
  vehicles,
  vehiclesLoading,
  isAuthenticated = true,
  hasPickup = true,
  pickupAccuracy,
  onActivateGps,
}: UnifiedTaxiSheetProps) {
  const lastCtaTapRef = useRef(0);

  const vehicleOptions = vehicles.map((v) => ({
    id: v.id,
    name: v.name,
    icon: v.icon,
    driverEta: v.driverEta,
    tripDuration: v.tripDuration,
    price: v.calculatedPrice,
    pricePerKm: `${v.pricePerKm} ${currency}`,
    available: v.available,
    recommended: v.isPopular,
    currency,
  }));

  const selectedVehiclePrice = vehicles.find((v) => v.id === selectedVehicle)?.calculatedPrice || 0;
  const displayPrice = biddingMode && clientProposedPrice ? clientProposedPrice : selectedVehiclePrice;
  const isGpsImprecise = pickupAccuracy != null && pickupAccuracy > 2000;
  const expanded = !!destination;

  const handleCtaClick = useCallback(() => {
    if (isSearching) return;
    const now = Date.now();
    if (now - lastCtaTapRef.current < 300) return;
    lastCtaTapRef.current = now;
    console.log('🔴 CTA tapped, hasPickup:', !!pickup, 'hasDest:', !!destination);
    try {
      if ("vibrate" in navigator) navigator.vibrate(20);
    } catch {}
    try {
      onBook();
    } catch (err) {
      console.error('[UnifiedTaxiSheet] onBook error:', err);
    }
  }, [isSearching, onBook]);

  const renderCtaContent = () => {
    if (isSearching)
      return (
        <span className="flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Recherche...
        </span>
      );
    if (!hasPickup)
      return (
        <span className="flex items-center justify-center gap-2">
          <MapPin className="w-4 h-4" />
          Choisir un point de départ
        </span>
      );
    if (!destination) return <span className="text-muted-foreground">📍 Où allez-vous ?</span>;
    if (!selectedVehicle) return <span>🚗 Sélectionnez un véhicule</span>;
    if (!isAuthenticated)
      return (
        <span className="flex items-center justify-center gap-2">
          <LogIn className="w-4 h-4" />
          Se connecter pour réserver
        </span>
      );
    return (
      <span className="flex items-center justify-center gap-2">
        <Zap className="w-4 h-4" />
        Continuer
        {displayPrice > 0 && (
          <span className="ml-1 px-2.5 py-0.5 bg-white/20 rounded-full text-xs font-bold">
            {displayPrice.toLocaleString()} {currency}
          </span>
        )}
      </span>
    );
  };

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[200] flex flex-col rounded-t-[1.5rem] border-t-2 border-border bg-background shadow-[0_-8px_30px_-5px_rgba(0,0,0,0.15)]"
      style={{
        height: expanded ? "85vh" : "45vh",
        transition: "height 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
        paddingBottom: "max(calc(env(safe-area-inset-bottom, 0px) + 12px), 16px)",
        // Explicite : le sheet capte toujours les événements pointer,
        // quelle que soit la valeur de pointer-events sur les éléments parents.
        pointerEvents: "auto",
      }}
    >
      {/* Handle */}
      <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
        <div className="mx-auto h-2 w-[100px] rounded-full bg-muted" />
      </div>

      {/* Scrollable content */}
      <div
        className="flex-1 min-h-0 px-4 space-y-3 pb-2 overflow-y-auto"
        style={{ overscrollBehavior: "contain", WebkitOverflowScrolling: "touch" } as React.CSSProperties}
      >
        {isGpsImprecise && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20"
          >
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <p className="text-xs text-amber-700 dark:text-amber-400 flex-1">
              Position approximative (~{Math.round(pickupAccuracy!)}m).
            </p>
            {onActivateGps && (
              <button
                type="button"
                onClick={onActivateGps}
                onTouchEnd={(e) => { e.preventDefault(); onActivateGps(); }}
                className="flex items-center gap-1 px-2 py-1 rounded-md bg-amber-500 text-white text-xs font-medium flex-shrink-0 active:opacity-80"
                style={{ touchAction: 'manipulation' }}
              >
                <Navigation className="w-3 h-3" />
                Activer GPS
              </button>
            )}
          </motion.div>
        )}

        <div className="flex-shrink-0">
          <CompactDestinationSearch
            destination={destination?.address || null}
            onOpenSearch={onDestinationSelect}
            onSelectQuick={onQuickDestinationSelect}
            city={city}
          />
        </div>

        <div className="flex-shrink-0">
          <AnimatePresence mode="wait">
            {vehiclesLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex gap-2"
              >
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex-shrink-0 w-[5.5rem] h-[7.5rem] bg-muted/30 rounded-xl animate-pulse" />
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="vehicles"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <PremiumVehicleCarousel
                  vehicles={vehicleOptions}
                  selectedVehicleId={selectedVehicle}
                  onVehicleSelect={onVehicleSelect}
                  city={city}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {destination && selectedVehicle && selectedVehiclePrice > 0 && (
            <motion.div
              className="flex-shrink-0"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            >
              <ModernBiddingInterface
                enabled={biddingMode}
                onEnabledChange={(checked) => {
                  onBiddingModeChange?.(checked);
                  if (checked && !clientProposedPrice) onClientProposedPriceChange?.(selectedVehiclePrice);
                }}
                basePrice={selectedVehiclePrice}
                proposedPrice={clientProposedPrice ?? null}
                onProposedPriceChange={(price) => onClientProposedPriceChange?.(price)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* CTA */}
      <div className="flex-shrink-0 bg-background pt-2 pb-1 px-4 border-t border-border">
        <button
          type="button"
          onClick={handleCtaClick}
          onTouchEnd={(e) => {
            e.stopPropagation();
            e.preventDefault();
            handleCtaClick();
          }}
          disabled={isSearching}
          className={cn(
            "w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 text-center select-none border-0 outline-none",
            isSearching
              ? "bg-muted text-muted-foreground cursor-not-allowed"
              : "bg-primary text-primary-foreground shadow-lg shadow-primary/25 active:scale-[0.98] cursor-pointer",
          )}
          style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent" } as React.CSSProperties}
        >
          {renderCtaContent()}
        </button>
      </div>
    </div>
  );
}
