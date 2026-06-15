import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Star, Clock, Car, MapPin, AlertTriangle, RefreshCw, Phone } from 'lucide-react';
import CancelRideDialog from './CancelRideDialog';
import carSvg from '@/assets/vehicle-icons/car.svg';

// ─── Types ───────────────────────────────────────────────────────────────────

interface SearchProgress {
  radius: number;
  driversFound: number;
  status: 'idle' | 'searching' | 'found' | 'failed';
}

interface AssignedDriver {
  driver_id: string;
  distance_km: number;
  score: number;
  driver_name?: string;
  driver_avatar?: string;
  driver_phone?: string;
  rating_average?: number;
  total_rides?: number;
  vehicle_plate?: string;
  vehicle_model?: string;
  vehicle_make?: string;
  vehicle_color?: string;
}

interface DriverSearchScreenProps {
  isSearching: boolean;
  searchProgress: SearchProgress;
  assignedDriver: AssignedDriver | null;
  bookingId?: string | null;
  pickupLabel?: string;
  destinationLabel?: string;
  retryCount?: number;
  maxRetries?: number;
  onClose?: () => void;
  onRetry?: () => void;
  onModifyPrice?: () => void;
  onTrackDriver?: (bookingId: string) => void;
}

// ─── Radar animation (pure CSS via inline keyframes injected once) ────────────

const RADAR_CSS = `
@keyframes kwenda-radar {
  0%   { transform: scale(0.6); opacity: 0.7; }
  100% { transform: scale(2.8); opacity: 0; }
}
@keyframes kwenda-car-float {
  0%, 100% { transform: translateY(0px); }
  50%       { transform: translateY(-4px); }
}
@keyframes kwenda-success-pop {
  0%   { transform: scale(0.5); opacity: 0; }
  70%  { transform: scale(1.12); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
@keyframes kwenda-slide-up {
  from { transform: translateY(40px); opacity: 0; }
  to   { transform: translateY(0); opacity: 1; }
}
`;

let cssInjected = false;
function injectCSS() {
  if (cssInjected || typeof document === 'undefined') return;
  const el = document.createElement('style');
  el.textContent = RADAR_CSS;
  document.head.appendChild(el);
  cssInjected = true;
}

// ─── Helper ──────────────────────────────────────────────────────────────────

const initials = (name?: string) =>
  (name || 'C').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

const etaMinutes = (distKm: number) => Math.max(2, Math.ceil(distKm * 2.5));

// ─── Component ───────────────────────────────────────────────────────────────

export default function DriverSearchScreen({
  isSearching,
  searchProgress,
  assignedDriver,
  bookingId,
  pickupLabel,
  destinationLabel,
  retryCount = 0,
  maxRetries = 3,
  onClose,
  onRetry,
  onModifyPrice,
  onTrackDriver,
}: DriverSearchScreenProps) {
  injectCSS();

  const visible =
    isSearching ||
    searchProgress.status === 'searching' ||
    searchProgress.status === 'found' ||
    searchProgress.status === 'failed';

  // Pulse counter for "Recherche..." dot animation
  const [dots, setDots] = useState(1);
  const dotsRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (searchProgress.status === 'searching') {
      dotsRef.current = setInterval(() => setDots(d => (d % 3) + 1), 500);
    } else {
      if (dotsRef.current) clearInterval(dotsRef.current);
      setDots(1);
    }
    return () => { if (dotsRef.current) clearInterval(dotsRef.current); };
  }, [searchProgress.status]);

  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const handleCancelConfirm = async (_reason: string) => {
    setIsCancelling(true);
    await onClose?.();
    setIsCancelling(false);
    setShowCancelDialog(false);
  };

  if (!visible) return null;

  const isMaxRetries = retryCount >= maxRetries;
  const eta = assignedDriver ? etaMinutes(assignedDriver.distance_km) : null;
  const vehicleLabel = [assignedDriver?.vehicle_make, assignedDriver?.vehicle_model]
    .filter(Boolean).join(' ') || 'Véhicule';
  const vehiclePlate = assignedDriver?.vehicle_plate || '';

  // ── Searching state ──
  if (searchProgress.status === 'searching' || (isSearching && searchProgress.status !== 'found' && searchProgress.status !== 'failed')) {
    return (
      <>
      <div
        className="fixed inset-0 z-[300] flex flex-col items-center justify-between"
        style={{
          background: 'linear-gradient(160deg, #0f0f1a 0%, #1a0a0a 60%, #0f0f1a 100%)',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
        }}
      >
        {/* Top section: route summary */}
        <div className="w-full pt-safe px-6 pt-10">
          <div className="bg-white/8 rounded-2xl px-4 py-3 border border-white/10">
            <div className="flex items-center gap-2 text-white/60 text-xs mb-2">
              <div className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
              <span className="truncate">{pickupLabel || 'Position actuelle'}</span>
            </div>
            <div className="w-px h-3 bg-white/20 ml-1 mb-2" />
            <div className="flex items-center gap-2 text-white/80 text-xs">
              <div className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
              <span className="truncate">{destinationLabel || 'Destination'}</span>
            </div>
          </div>
        </div>

        {/* Center: radar */}
        <div className="flex flex-col items-center">
          {/* Radar rings container */}
          <div className="relative w-40 h-40 flex items-center justify-center mb-8">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="absolute inset-0 rounded-full border border-red-500/40"
                style={{
                  animation: `kwenda-radar 2.4s ease-out ${i * 0.8}s infinite`,
                }}
              />
            ))}
            {/* Center circle */}
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(239,68,68,0.15)', boxShadow: '0 0 32px rgba(239,68,68,0.25)' }}
            >
              <img
                src={carSvg}
                alt=""
                className="w-24 h-16 object-contain"
                style={{ animation: 'kwenda-car-float 2s ease-in-out infinite' }}
              />
            </div>
          </div>

          <h2 className="text-white text-xl font-bold mb-2">
            Recherche en cours{'.'.repeat(dots)}
          </h2>
          <p className="text-white/50 text-sm text-center px-8">
            {retryCount > 0
              ? `Élargissement du rayon à ${searchProgress.radius} km`
              : 'Nous trouvons le meilleur chauffeur près de vous'}
          </p>

          {/* Stats pills */}
          <div className="flex gap-3 mt-6">
            <div className="bg-white/8 border border-white/10 rounded-full px-4 py-1.5 text-xs text-white/70">
              Rayon {searchProgress.radius} km
            </div>
            {searchProgress.driversFound > 0 && (
              <div className="bg-red-500/15 border border-red-500/30 rounded-full px-4 py-1.5 text-xs text-red-300">
                {searchProgress.driversFound} chauffeur{searchProgress.driversFound > 1 ? 's' : ''} trouvé{searchProgress.driversFound > 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>

        {/* Bottom: cancel */}
        <div className="w-full px-6 pb-safe pb-8">
          <button
            type="button"
            onClick={() => setShowCancelDialog(true)}
            onTouchEnd={e => { e.preventDefault(); setShowCancelDialog(true); }}
            className="w-full py-4 rounded-2xl border border-white/15 text-white/70 text-sm font-medium"
            style={{ background: 'rgba(255,255,255,0.05)', touchAction: 'manipulation' }}
          >
            Annuler la course
          </button>
        </div>
      </div>

      <CancelRideDialog
        open={showCancelDialog}
        isCancelling={isCancelling}
        onConfirm={handleCancelConfirm}
        onBack={() => setShowCancelDialog(false)}
      />
      </>
    );
  }

  // ── Found state ──
  if (searchProgress.status === 'found') {
    return (
      <div
        className="fixed inset-0 z-[300] flex flex-col"
        style={{
          background: 'linear-gradient(180deg, #f8fffe 0%, #ffffff 40%)',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
          animation: 'kwenda-slide-up 0.35s ease-out',
        }}
      >
        {/* Green success header */}
        <div
          className="flex-shrink-0 pt-12 pb-8 px-6 flex flex-col items-center"
          style={{ background: 'linear-gradient(180deg, #dcfce7 0%, transparent 100%)' }}
        >
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
            style={{
              background: '#22c55e',
              animation: 'kwenda-success-pop 0.5s ease-out',
              boxShadow: '0 8px 32px rgba(34,197,94,0.35)',
            }}
          >
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Chauffeur trouvé !</h2>
          <p className="text-sm text-gray-500">Votre chauffeur est en route</p>
        </div>

        {/* Driver card */}
        <div className="flex-1 px-5 overflow-y-auto">
          {assignedDriver ? (
            <div style={{ animation: 'kwenda-slide-up 0.4s ease-out 0.1s both' }}>
              {/* Avatar + name + rating */}
              <div className="bg-gray-50 rounded-3xl p-5 mb-4 flex items-center gap-4">
                {assignedDriver.driver_avatar ? (
                  <img
                    src={assignedDriver.driver_avatar}
                    alt=""
                    className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md flex-shrink-0"
                  />
                ) : (
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0 shadow-md"
                    style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}
                  >
                    {initials(assignedDriver.driver_name)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-bold text-gray-900 truncate">
                    {assignedDriver.driver_name || 'Chauffeur'}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                    <span className="text-sm font-semibold text-gray-800">
                      {(assignedDriver.rating_average ?? 5).toFixed(1)}
                    </span>
                    <span className="text-xs text-gray-400 ml-1">
                      · {assignedDriver.total_rides || 0} courses
                    </span>
                  </div>
                </div>
                {assignedDriver.driver_phone && (
                  <a
                    href={`tel:${assignedDriver.driver_phone}`}
                    className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0"
                  >
                    <Phone className="w-5 h-5 text-green-600" />
                  </a>
                )}
              </div>

              {/* Vehicle info */}
              <div className="bg-gray-50 rounded-3xl p-5 mb-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                    <Car className="w-4 h-4 text-red-500" />
                  </div>
                  <span className="text-sm font-semibold text-gray-700">Véhicule</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-base font-bold text-gray-900">{vehicleLabel}</p>
                    {assignedDriver.vehicle_color && (
                      <p className="text-xs text-gray-400 mt-0.5">{assignedDriver.vehicle_color}</p>
                    )}
                  </div>
                  {vehiclePlate && (
                    <div
                      className="px-3 py-1.5 rounded-xl"
                      style={{ background: '#1e293b', minWidth: 80, textAlign: 'center' }}
                    >
                      <span className="text-white font-bold text-sm tracking-widest">{vehiclePlate}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* ETA + distance */}
              {assignedDriver.distance_km > 0 && eta !== null && (
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-gray-50 rounded-2xl p-4 flex flex-col items-center">
                    <Clock className="w-5 h-5 text-red-500 mb-1" />
                    <span className="text-xs text-gray-400 mb-1">Arrivée dans</span>
                    <span className="text-xl font-bold text-gray-900">{eta} min</span>
                  </div>
                  <div className="bg-gray-50 rounded-2xl p-4 flex flex-col items-center">
                    <MapPin className="w-5 h-5 text-red-500 mb-1" />
                    <span className="text-xs text-gray-400 mb-1">Distance</span>
                    <span className="text-xl font-bold text-gray-900">{assignedDriver.distance_km.toFixed(1)} km</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center py-8 text-gray-400">
              <div className="w-8 h-8 border-2 border-gray-200 border-t-green-500 rounded-full animate-spin mb-3" />
              <p className="text-sm">Chargement des détails...</p>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="flex-shrink-0 px-5 pb-safe pb-6 pt-2">
          <button
            type="button"
            onClick={() => { if (bookingId) { onTrackDriver?.(bookingId); } }}
            className="w-full py-4 rounded-2xl text-white font-bold text-base"
            style={{
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              boxShadow: '0 8px 24px rgba(239,68,68,0.3)',
              touchAction: 'manipulation',
            }}
          >
            Suivre le chauffeur →
          </button>
        </div>
      </div>
    );
  }

  // ── Failed state ──
  return (
    <div
      className="fixed inset-0 z-[300] flex flex-col items-center justify-between px-6"
      style={{
        background: '#ffffff',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
        animation: 'kwenda-slide-up 0.3s ease-out',
      }}
    >
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-5">
          <AlertTriangle className="w-9 h-9 text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2 text-center">Aucun chauffeur disponible</h2>
        <p className="text-sm text-gray-500 text-center mb-6 max-w-xs">
          {isMaxRetries
            ? `Nous avons cherché dans un rayon de ${searchProgress.radius} km. Essayez un autre type de véhicule ou réessayez dans quelques minutes.`
            : `Aucun chauffeur trouvé dans ${searchProgress.radius} km. Nous pouvons élargir la recherche.`}
        </p>
        <div className="flex gap-2">
          <div className="bg-gray-100 rounded-full px-4 py-1.5 text-xs text-gray-500">
            Rayon : {searchProgress.radius} km
          </div>
          <div className="bg-gray-100 rounded-full px-4 py-1.5 text-xs text-gray-500">
            Tentative {retryCount + 1}/{maxRetries + 1}
          </div>
        </div>
      </div>

      <div className="w-full pb-safe pb-8 space-y-3">
        <button
          type="button"
          onClick={onRetry}
          className="w-full py-4 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2"
          style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', touchAction: 'manipulation' }}
        >
          <RefreshCw className="w-4 h-4" />
          Réessayer
        </button>
        {onModifyPrice && (
          <button
            type="button"
            onClick={onModifyPrice}
            className="w-full py-4 rounded-2xl border-2 border-red-200 text-red-500 font-semibold text-sm"
            style={{ touchAction: 'manipulation' }}
          >
            Modifier le prix
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-4 rounded-2xl border border-gray-200 text-gray-600 font-medium text-sm"
          style={{ touchAction: 'manipulation' }}
        >
          Annuler
        </button>
      </div>
    </div>
  );
}
