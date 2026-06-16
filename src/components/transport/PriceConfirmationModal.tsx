import { useState, useCallback } from 'react';
import { ArrowLeft, MapPin, Clock, Route, Wallet, ChevronDown, ChevronUp } from 'lucide-react';
import { getVehicle3dIcon } from '@/utils/vehicle3dIcons';

interface PriceConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicleType: string;
  pickup: { address: string; lat: number; lng: number };
  destination: { address: string; lat: number; lng: number };
  distance: number;
  duration: number;
  calculatedPrice: number;
  currency?: string;
  onConfirm: (proposedPrice?: number) => void;
  onBack: () => void;
}

const VEHICLE_NAMES: Record<string, string> = {
  'taxi_moto': 'Moto-taxi',
  'taxi_eco': 'Tembea Éco',
  'taxi_confort': 'Tembea Confort',
  'taxi_premium': 'Tembea Premium',
};

const fmt = (n: number) => Math.round(n).toLocaleString('fr-FR');
const snap = (value: number, step: number) => Math.round(value / step) * step;
const priceStep = (price: number) => (price >= 10000 ? 500 : price >= 2000 ? 100 : 50);

// ── CSS injected once ────────────────────────────────────────────────────────

const CONFIRM_CSS = `
@keyframes kwenda-confirm-in {
  from { transform: translateY(100%); }
  to   { transform: translateY(0); }
}
.kwenda-confirm-enter {
  animation: kwenda-confirm-in 0.32s cubic-bezier(0.32, 0.72, 0, 1) both;
}
input[type=range].kwenda-slider {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 4px;
  border-radius: 9999px;
  outline: none;
  cursor: pointer;
}
input[type=range].kwenda-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 24px; height: 24px;
  border-radius: 50%;
  background: #ef4444;
  border: 3px solid white;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  cursor: pointer;
}
input[type=range].kwenda-slider::-moz-range-thumb {
  width: 24px; height: 24px;
  border-radius: 50%;
  background: #ef4444;
  border: 3px solid white;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  cursor: pointer;
}
`;

let cssInjected = false;
function injectCSS() {
  if (cssInjected || typeof document === 'undefined') return;
  const el = document.createElement('style');
  el.textContent = CONFIRM_CSS;
  document.head.appendChild(el);
  cssInjected = true;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function PriceConfirmationModal({
  open,
  vehicleType,
  pickup,
  destination,
  distance,
  duration,
  calculatedPrice,
  currency = 'XOF',
  onConfirm,
  onBack,
}: PriceConfirmationModalProps) {
  injectCSS();

  const minPrice = snap(calculatedPrice * 0.7, priceStep(calculatedPrice));
  const maxPrice = snap(calculatedPrice * 1.5, priceStep(calculatedPrice));
  const step = priceStep(calculatedPrice);

  const [isBidding, setIsBidding] = useState(false);
  const [bidPrice, setBidPrice] = useState(() =>
    snap(calculatedPrice * 0.9, priceStep(calculatedPrice))
  );

  const handleToggleBid = useCallback(() => {
    setIsBidding(prev => !prev);
  }, []);

  const handleConfirm = useCallback(() => {
    onConfirm(isBidding ? bidPrice : undefined);
  }, [isBidding, bidPrice, onConfirm]);

  if (!open) return null;

  const vehicleName = VEHICLE_NAMES[vehicleType] || 'Course Taxi';
  const icon3d = getVehicle3dIcon(vehicleType);
  const durationMin = Math.max(1, Math.round(duration / 60));

  // Percent of slider position for gradient
  const pct = maxPrice > minPrice
    ? Math.round(((bidPrice - minPrice) / (maxPrice - minPrice)) * 100)
    : 50;
  const sliderGradient = `linear-gradient(to right, #ef4444 ${pct}%, #e5e7eb ${pct}%)`;

  return (
    <div
      className="fixed inset-0 z-[300] flex flex-col bg-white kwenda-confirm-enter"
      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif' }}
    >
      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-5 pt-safe pt-4 pb-3 border-b border-gray-100 flex-shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0"
          style={{ touchAction: 'manipulation' }}
        >
          <ArrowLeft size={16} className="text-gray-700" />
        </button>
        <div>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Confirmation</p>
          <p className="text-sm font-bold text-gray-900">{vehicleName}</p>
        </div>
        <div className="ml-auto">
          <img src={icon3d} alt="" className="w-14 h-9 object-contain" />
        </div>
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="px-5 py-5 space-y-4">

          {/* Route card */}
          <div className="bg-gray-50 rounded-2xl p-4">
            <div className="flex gap-3 items-stretch">
              <div className="flex flex-col items-center pt-0.5 gap-0 flex-shrink-0">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                <div className="flex-1 w-px bg-gray-300 my-1" />
                <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
              </div>
              <div className="flex-1 min-w-0 space-y-3">
                <div>
                  <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Départ</p>
                  <p className="text-sm font-semibold text-gray-900 truncate">{pickup.address}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Arrivée</p>
                  <p className="text-sm font-semibold text-gray-900 truncate">{destination.address}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Distance + duration */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-2xl p-3 flex items-center gap-2">
              <Route size={16} className="text-gray-400 flex-shrink-0" />
              <div>
                <p className="text-[10px] text-gray-400">Distance</p>
                <p className="text-sm font-bold text-gray-900">{distance.toFixed(1)} km</p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-2xl p-3 flex items-center gap-2">
              <Clock size={16} className="text-gray-400 flex-shrink-0" />
              <div>
                <p className="text-[10px] text-gray-400">Durée estimée</p>
                <p className="text-sm font-bold text-gray-900">{durationMin} min</p>
              </div>
            </div>
          </div>

          {/* Price section */}
          <div className="bg-red-50 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-red-400 font-semibold uppercase tracking-wider">Prix estimé</p>
              <p className="text-xs text-gray-400">Espèces · Mobile Money</p>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-gray-900 tracking-tight">
                {fmt(calculatedPrice)}
              </span>
              <span className="text-sm font-bold text-red-500">{currency}</span>
            </div>
          </div>

          {/* Bidding section */}
          <div className="border border-gray-200 rounded-2xl overflow-hidden">
            <button
              type="button"
              onClick={handleToggleBid}
              className="w-full flex items-center justify-between px-4 py-3.5 bg-white"
              style={{ touchAction: 'manipulation' }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: isBidding ? '#ef4444' : '#d1d5db' }}
                />
                <span className="text-sm font-semibold text-gray-800">
                  {isBidding ? 'Prix proposé activé' : 'Proposer un autre prix'}
                </span>
              </div>
              {isBidding ? (
                <ChevronUp size={16} className="text-gray-400" />
              ) : (
                <ChevronDown size={16} className="text-gray-400" />
              )}
            </button>

            {isBidding && (
              <div className="px-4 pb-4 bg-gray-50 border-t border-gray-100">
                <div className="flex items-baseline justify-between mt-3 mb-2">
                  <span className="text-xs text-gray-400">Min {fmt(minPrice)}</span>
                  <div className="text-center">
                    <span className="text-xl font-black text-red-500">{fmt(bidPrice)}</span>
                    <span className="text-xs font-bold text-red-400 ml-1">{currency}</span>
                  </div>
                  <span className="text-xs text-gray-400">Max {fmt(maxPrice)}</span>
                </div>
                <input
                  type="range"
                  className="kwenda-slider"
                  min={minPrice}
                  max={maxPrice}
                  step={step}
                  value={bidPrice}
                  onChange={e => setBidPrice(Number(e.target.value))}
                  style={{ background: sliderGradient }}
                />
                <p className="text-[11px] text-gray-400 text-center mt-2">
                  {bidPrice < calculatedPrice
                    ? `${Math.round((1 - bidPrice / calculatedPrice) * 100)}% sous le prix estimé — le chauffeur peut refuser`
                    : bidPrice > calculatedPrice
                    ? `${Math.round((bidPrice / calculatedPrice - 1) * 100)}% au-dessus — acceptation garantie`
                    : 'Prix normal'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── CTA fixe ── */}
      <div
        className="flex-shrink-0 px-5 pt-3 pb-safe pb-6 border-t border-gray-100 bg-white space-y-2"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 16px), 16px)' }}
      >
        <button
          type="button"
          onClick={handleConfirm}
          className="w-full py-4 rounded-2xl text-white font-bold text-base"
          style={{
            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
            boxShadow: '0 8px 24px rgba(239,68,68,0.25)',
            touchAction: 'manipulation',
          }}
        >
          {isBidding
            ? `Proposer ${fmt(bidPrice)} ${currency}`
            : `Confirmer · ${fmt(calculatedPrice)} ${currency}`}
        </button>
        <div className="flex items-center justify-center gap-1.5 opacity-50">
          <Wallet size={12} className="text-gray-500" />
          <p className="text-[11px] text-gray-500">Paiement après la course</p>
        </div>
      </div>
    </div>
  );
}
