import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowLeft, Search, MapPin, Star, Clock, ChevronRight, Home, Plus, Navigation, LocateFixed } from 'lucide-react';
import motoSvg from '@/assets/vehicle-icons/moto.svg';
import carSvg from '@/assets/vehicle-icons/car.svg';
import carConfortSvg from '@/assets/vehicle-icons/car-confort.svg';
import carPremiumSvg from '@/assets/vehicle-icons/car-premium.svg';

// ============================================================================
// Types
// ============================================================================

interface VehicleOption {
  id: string;
  label: string;
  description: string;
  basePrice: number | null;   // null = pas encore de destination
  etaMinutes: number;
  capacity: string;
  popular?: boolean;
}

interface TaxiBookingHomeProps {
  cityLabel: string;           // "Abidjan" | "Kinshasa" etc
  currency: 'XOF' | 'XOF';
  pickupLabel: string;         // "Position actuelle" ou adresse
  destinationLabel?: string;   // null si pas encore choisi
  vehicleOptions: VehicleOption[];
  selectedVehicleId: string | null;
  savedPlaces?: { label: string; icon: 'home' | 'work' | 'other' }[];
  mapSlot?: React.ReactNode;
  onBack: () => void;
  onSelectVehicle: (id: string) => void;
  onSearchDestination: () => void;
  onUseGPS: () => void;
  onBook: () => void;
  isMapCentered?: boolean;
  onRecenterMap?: () => void;
}

// ============================================================================
// Vehicle icons (imported from src/assets so Vite bundles & hashes them)
// ============================================================================

const VEHICLE_SVG: Record<string, string> = {
  'taxi_moto': motoSvg,
  'taxi_eco': carSvg,
  'taxi_confort': carConfortSvg,
  'taxi_comfort': carConfortSvg,
  'taxi_premium': carPremiumSvg,
  'moto': motoSvg,
  'eco': carSvg,
  'confort': carConfortSvg,
  'standard': carConfortSvg,
  'premium': carPremiumSvg,
};

// ============================================================================
// Bottom Sheet
// ============================================================================

type SnapPoint = 'peek' | 'half' | 'full';
const SNAP_HEIGHTS: Record<SnapPoint, number> = { peek: 200, half: 440, full: 640 };

// ============================================================================
// Composant principal
// ============================================================================

export default function TaxiBookingHome({
  cityLabel,
  currency,
  pickupLabel,
  destinationLabel,
  vehicleOptions,
  selectedVehicleId,
  savedPlaces = [],
  mapSlot,
  onBack,
  onSelectVehicle,
  onSearchDestination,
  onUseGPS,
  onBook,
  isMapCentered = true,
  onRecenterMap,
}: TaxiBookingHomeProps) {
  const [snap, setSnap] = useState<SnapPoint>('half');
  const [recenterPulsing, setRecenterPulsing] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef<number | null>(null);
  const dragStartH = useRef(0);
  const [dragH, setDragH] = useState<number | null>(null);

  const onDragStart = useCallback((y: number) => {
    dragStartY.current = y;
    dragStartH.current = SNAP_HEIGHTS[snap];
    setDragH(SNAP_HEIGHTS[snap]);
  }, [snap]);

  const onDragMove = useCallback((y: number) => {
    if (dragStartY.current === null) return;
    const d = dragStartY.current - y;
    setDragH(Math.max(SNAP_HEIGHTS.peek, Math.min(SNAP_HEIGHTS.full, dragStartH.current + d)));
  }, []);

  const onDragEnd = useCallback(() => {
    if (dragH === null) return;
    const best = (Object.entries(SNAP_HEIGHTS) as [SnapPoint, number][])
      .sort((a, b) => Math.abs(a[1] - dragH) - Math.abs(b[1] - dragH))[0][0];
    setSnap(best);
    setDragH(null);
    dragStartY.current = null;
  }, [dragH]);

  useEffect(() => {
    const el = sheetRef.current?.querySelector<HTMLDivElement>('[data-drag]');
    if (!el) return;
    const ts = (e: TouchEvent) => { e.preventDefault(); onDragStart(e.touches[0].clientY); };
    const tm = (e: TouchEvent) => { if (dragStartY.current !== null) { e.preventDefault(); onDragMove(e.touches[0].clientY); } };
    const te = (e: TouchEvent) => { e.preventDefault(); onDragEnd(); };
    el.addEventListener('touchstart', ts, { passive: false });
    el.addEventListener('touchmove', tm, { passive: false });
    el.addEventListener('touchend', te, { passive: false });
    return () => { el.removeEventListener('touchstart', ts); el.removeEventListener('touchmove', tm); el.removeEventListener('touchend', te); };
  }, [onDragStart, onDragMove, onDragEnd]);

  const h = dragH ?? SNAP_HEIGHTS[snap];
  const dragging = dragH !== null;
  const selected = vehicleOptions.find(v => v.id === selectedVehicleId);
  const hasDestination = !!destinationLabel;
  const formatPrice = (p: number) => p.toLocaleString('fr-FR');

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif' }}>

      {/* ===== Carte (fond) ===== */}
      <div className="absolute inset-0">
        {mapSlot ?? <div id="kwenda-map-container" className="w-full h-full" />}
      </div>

      {/* ===== Header flottant ===== */}
      <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none" style={{ paddingTop: 'env(safe-area-inset-top, 12px)' }}>
        <div className="flex items-center justify-between px-4 pt-2 pb-2">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center pointer-events-auto active:scale-95 transition-transform"
            style={{ touchAction: 'manipulation' }}
          >
            <ArrowLeft size={18} className="text-gray-800" />
          </button>

          {/* Pill ville */}
          <div className="bg-white rounded-full shadow-md px-4 py-2 flex items-center gap-2 pointer-events-auto">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-sm font-semibold text-gray-900">{cityLabel}</span>
          </div>

          <div className="w-10" /> {/* spacer */}
        </div>
      </div>

      {/* ===== Bouton GPS flottant ===== */}
      <div
        className="absolute z-20 right-4"
        style={{
          bottom: h + 16,
          transition: dragging ? 'none' : 'bottom 280ms cubic-bezier(0.32, 0.72, 0, 1)',
        }}
      >
        {recenterPulsing && (
          <div className="absolute inset-0 rounded-full border-4 border-blue-400 animate-ping opacity-75 pointer-events-none" />
        )}
        <button
          type="button"
          onClick={() => {
            setRecenterPulsing(true);
            setTimeout(() => setRecenterPulsing(false), 700);
            onRecenterMap?.();
            onUseGPS();
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            setRecenterPulsing(true);
            setTimeout(() => setRecenterPulsing(false), 700);
            onRecenterMap?.();
            onUseGPS();
          }}
          className="relative w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center active:scale-90 transition-transform duration-150"
          style={{ touchAction: 'manipulation' }}
        >
          <LocateFixed
            size={22}
            className={isMapCentered ? 'text-red-500' : 'text-gray-400'}
          />
        </button>
      </div>

      {/* ===== Bottom Sheet ===== */}
      <div
        ref={sheetRef}
        className="absolute left-0 right-0 bottom-0 bg-white rounded-t-[28px] shadow-2xl z-30 flex flex-col"
        style={{
          height: h,
          transition: dragging ? 'none' : 'height 280ms cubic-bezier(0.32, 0.72, 0, 1)',
          touchAction: 'none',
        }}
      >
        {/* Drag handle */}
        <div
          data-drag
          onMouseDown={e => onDragStart(e.clientY)}
          onMouseMove={e => dragging && onDragMove(e.clientY)}
          onMouseUp={onDragEnd}
          onMouseLeave={onDragEnd}
          className="pt-3 pb-2 flex justify-center cursor-grab active:cursor-grabbing select-none"
          style={{ touchAction: 'none' }}
        >
          <div className="w-9 h-1 rounded-full bg-gray-300" />
        </div>

        {/* Contenu scrollable */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <div className="px-5 pb-6">

            {/* ── Barre de recherche destination ── */}
            <button
              onClick={onSearchDestination}
              className="w-full flex items-center gap-3 bg-gray-50 hover:bg-gray-100 rounded-2xl px-4 py-3.5 mb-4 transition-colors active:bg-gray-100"
              style={{ touchAction: 'manipulation' }}
            >
              <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                <Search size={14} className="text-white" />
              </div>
              <div className="flex-1 text-left">
                {destinationLabel ? (
                  <>
                    <p className="text-xs text-gray-400 font-medium">Destination</p>
                    <p className="text-sm font-semibold text-gray-900 truncate">{destinationLabel}</p>
                  </>
                ) : (
                  <p className="text-sm font-medium text-gray-400">Où allez-vous ?</p>
                )}
              </div>
              <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
            </button>

            {/* ── Adresses favorites ── */}
            {savedPlaces.length > 0 && (
              <div className="flex gap-2 mb-5 overflow-x-auto pb-1 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
                {savedPlaces.map((p, i) => (
                  <button
                    key={i}
                    className="flex items-center gap-2 bg-gray-50 rounded-full px-3.5 py-2 flex-shrink-0 active:bg-gray-100 transition-colors"
                    style={{ touchAction: 'manipulation' }}
                  >
                    {p.icon === 'home' ? <Home size={14} className="text-gray-500" /> : <MapPin size={14} className="text-gray-500" />}
                    <span className="text-xs font-semibold text-gray-700">{p.label}</span>
                  </button>
                ))}
                <button
                  className="flex items-center gap-1.5 border border-dashed border-gray-300 rounded-full px-3.5 py-2 flex-shrink-0 active:bg-gray-50 transition-colors"
                  style={{ touchAction: 'manipulation' }}
                >
                  <Plus size={12} className="text-gray-400" />
                  <span className="text-xs text-gray-400">Ajouter</span>
                </button>
              </div>
            )}

            {/* ── Titre section véhicules ── */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-900">Choisir un véhicule</h3>
              {!hasDestination && (
                <span className="text-[10px] text-gray-400 font-medium">À partir de</span>
              )}
            </div>

            {/* ── Liste véhicules verticale ── */}
            <div className="space-y-2">
              {vehicleOptions.map((v) => {
                const isSelected = v.id === selectedVehicleId;
                const iconSrc = VEHICLE_SVG[v.id] || carSvg;

                return (
                  <button
                    key={v.id}
                    onClick={() => onSelectVehicle(v.id)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl transition-all active:scale-[0.98] ${
                      isSelected
                        ? 'bg-red-50 shadow-[0_0_0_2px_rgb(239,68,68)]'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                    style={{ touchAction: 'manipulation' }}
                  >
                    {/* Icône véhicule */}
                    {v.id === 'taxi_moto' || v.id === 'moto'
                      ? (
                        <div style={{ width: 64, height: 48, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <img src={iconSrc} alt="" style={{ width: 64, height: 48, objectFit: 'contain' }} />
                        </div>
                      ) : (
                        <img src={iconSrc} alt="" style={{ width: 80, height: 60, objectFit: 'contain', flexShrink: 0 }} />
                      )
                    }

                    {/* Infos */}
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${isSelected ? 'text-red-600' : 'text-gray-900'}`}>{v.label}</span>
                        {v.popular && (
                          <span className="text-[9px] font-bold text-white bg-red-500 rounded-full px-1.5 py-0.5 uppercase tracking-wider">
                            Top
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-400">
                        <Clock size={10} />
                        <span>{v.etaMinutes} min</span>
                      </div>
                    </div>

                    {/* Prix */}
                    <div className="text-right flex-shrink-0">
                      {v.basePrice !== null ? (
                        <p className={`text-sm font-bold ${isSelected ? 'text-red-600' : 'text-gray-900'}`}>
                          {formatPrice(v.basePrice)} {currency}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-400">—</p>
                      )}
                    </div>

                    {/* Check */}
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── CTA fixe en bas ── */}
        <div
          className="px-5 pt-3 pb-3 border-t border-gray-100 bg-white"
          style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 12px), 12px)' }}
        >
          <button
            onClick={hasDestination ? onBook : onSearchDestination}
            disabled={hasDestination && !selectedVehicleId}
            className={`w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-40 ${
              hasDestination
                ? 'bg-red-500 text-white shadow-lg shadow-red-500/25'
                : 'bg-gray-900 text-white'
            }`}
            style={{ touchAction: 'manipulation' }}
          >
            {hasDestination ? (
              <>
                Commander {selected?.label || ''}
                {selected?.basePrice && (
                  <span className="bg-white/20 rounded-lg px-2 py-0.5 text-sm">
                    {formatPrice(selected.basePrice)} {currency}
                  </span>
                )}
              </>
            ) : (
              'Choisir la destination'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
