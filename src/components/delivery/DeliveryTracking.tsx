import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  ArrowLeft, Phone, MessageSquare, MoreHorizontal, MapPin, Package,
  Navigation, Clock, X
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

type DeliveryStatus = 'searching' | 'driver_assigned' | 'picked_up' | 'in_transit' | 'delivered';

interface DeliveryTrackingProps {
  orderId: string;
  status: DeliveryStatus;
  etaMinutes: number | null;
  pickupLabel: string;
  destinationLabel: string;
  fareAmount: number;
  currency: 'XOF' | 'XOF';
  serviceLabel: string;
  packageLabel: string;
  driver?: {
    name: string;
    phone?: string;
    photoUrl?: string;
    vehiclePlate?: string;
  };
  recipientName: string;
  recipientPhone: string;
  senderPhone: string;
  onBack: () => void;
  onCallDriver: () => void;
  onMessageDriver: () => void;
  onCallRecipient: () => void;
  onCancel: () => void;
  mapSlot?: React.ReactNode;
}

// ============================================================================
// Constantes
// ============================================================================

const STATUS_STEPS: { key: DeliveryStatus; label: string }[] = [
  { key: 'driver_assigned', label: 'Acceptée' },
  { key: 'picked_up', label: 'Collectée' },
  { key: 'in_transit', label: 'En route' },
  { key: 'delivered', label: 'Livrée' },
];

function getStepIndex(status: DeliveryStatus): number {
  if (status === 'searching') return -1;
  return STATUS_STEPS.findIndex(s => s.key === status);
}

function getStatusLabel(status: DeliveryStatus): string {
  if (status === 'searching') return 'Recherche d\'un livreur';
  return STATUS_STEPS.find(s => s.key === status)?.label || status;
}

function getStatusColor(status: DeliveryStatus): string {
  switch (status) {
    case 'searching': return 'bg-amber-500';
    case 'driver_assigned': return 'bg-blue-500';
    case 'picked_up': return 'bg-purple-500';
    case 'in_transit': return 'bg-blue-600';
    case 'delivered': return 'bg-emerald-500';
  }
}

// ============================================================================
// Bottom Sheet
// ============================================================================

type Snap = 'peek' | 'half' | 'full';
const SNAPS: Record<Snap, number> = { peek: 200, half: 420, full: 620 };

// ============================================================================
// Composant principal
// ============================================================================

export default function DeliveryTracking({
  orderId,
  status,
  etaMinutes,
  pickupLabel,
  destinationLabel,
  fareAmount,
  currency,
  serviceLabel,
  packageLabel,
  driver,
  recipientName,
  recipientPhone,
  senderPhone,
  onBack,
  onCallDriver,
  onMessageDriver,
  onCallRecipient,
  onCancel,
  mapSlot,
}: DeliveryTrackingProps) {
  const [snap, setSnap] = useState<Snap>('half');
  const [showMenu, setShowMenu] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const startY = useRef<number | null>(null);
  const startH = useRef(0);
  const [dragH, setDragH] = useState<number | null>(null);

  const onStart = useCallback((y: number) => { startY.current = y; startH.current = SNAPS[snap]; setDragH(SNAPS[snap]); }, [snap]);
  const onMove = useCallback((y: number) => { if (startY.current === null) return; setDragH(Math.max(SNAPS.peek, Math.min(SNAPS.full, startH.current + (startY.current - y)))); }, []);
  const onEnd = useCallback(() => { if (dragH === null) return; const best = (Object.entries(SNAPS) as [Snap, number][]).sort((a, b) => Math.abs(a[1] - dragH) - Math.abs(b[1] - dragH))[0][0]; setSnap(best); setDragH(null); startY.current = null; }, [dragH]);

  useEffect(() => {
    const el = ref.current?.querySelector<HTMLDivElement>('[data-drag]');
    if (!el) return;
    const ts = (e: TouchEvent) => { e.preventDefault(); onStart(e.touches[0].clientY); };
    const tm = (e: TouchEvent) => { if (startY.current !== null) { e.preventDefault(); onMove(e.touches[0].clientY); } };
    const te = (e: TouchEvent) => { e.preventDefault(); onEnd(); };
    el.addEventListener('touchstart', ts, { passive: false });
    el.addEventListener('touchmove', tm, { passive: false });
    el.addEventListener('touchend', te, { passive: false });
    return () => { el.removeEventListener('touchstart', ts); el.removeEventListener('touchmove', tm); el.removeEventListener('touchend', te); };
  }, [onStart, onMove, onEnd]);

  const h = dragH ?? SNAPS[snap];
  const dragging = dragH !== null;
  const stepIdx = getStepIndex(status);
  const canCancel = ['searching', 'driver_assigned', 'pending'].includes(status);
  const shortId = orderId.slice(-4).toUpperCase();
  const formatPrice = (n: number) => n.toLocaleString('fr-FR');

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif' }}>

      {/* Carte */}
      <div className="absolute inset-0 bg-gray-200">
        {mapSlot || <div className="w-full h-full" />}
      </div>

      {/* Header flottant */}
      <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none" style={{ paddingTop: 'env(safe-area-inset-top, 12px)' }}>
        <div className="flex items-center justify-between px-4 pt-2">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center pointer-events-auto active:scale-95 transition-transform"
            style={{ touchAction: 'manipulation' }}
          >
            <ArrowLeft size={18} className="text-gray-800" />
          </button>

          {/* Status pill */}
          <div className="bg-white rounded-full shadow-md px-4 py-2 flex items-center gap-2 pointer-events-auto">
            <div className={`w-2 h-2 rounded-full ${getStatusColor(status)} ${status === 'searching' ? 'animate-pulse' : ''}`} />
            <span className="text-sm font-semibold text-gray-900">
              {getStatusLabel(status)}
              {etaMinutes && ` · ${etaMinutes} min`}
            </span>
          </div>

          {/* Menu */}
          <div className="relative pointer-events-auto">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center active:scale-95 transition-transform"
              style={{ touchAction: 'manipulation' }}
            >
              <MoreHorizontal size={18} className="text-gray-800" />
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-12 z-20 bg-white rounded-2xl shadow-xl border border-gray-100 w-48 py-2">
                  <button
                    onClick={() => { setShowMenu(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 active:bg-gray-50"
                  >
                    Partager le suivi
                  </button>
                  <button
                    onClick={() => { setShowMenu(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 active:bg-gray-50"
                  >
                    Contacter le support
                  </button>
                  {canCancel && (
                    <button
                      onClick={() => { setShowMenu(false); onCancel(); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-600 active:bg-red-50"
                    >
                      Annuler la commande
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Sheet */}
      <div
        ref={ref}
        className="absolute left-0 right-0 bottom-0 bg-white rounded-t-3xl shadow-2xl z-30 flex flex-col"
        style={{
          height: h,
          transition: dragging ? 'none' : 'height 280ms cubic-bezier(0.32, 0.72, 0, 1)',
          touchAction: 'none',
        }}
      >
        <div
          data-drag
          onMouseDown={e => onStart(e.clientY)}
          onMouseMove={e => dragging && onMove(e.clientY)}
          onMouseUp={onEnd}
          onMouseLeave={() => dragging && onEnd()}
          className="pt-3 pb-2 flex justify-center cursor-grab active:cursor-grabbing select-none"
          style={{ touchAction: 'none' }}
        >
          <div className="w-9 h-1 rounded-full bg-gray-300" />
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-6">
          {/* Stepper horizontal */}
          <div className="flex items-center gap-1 mb-4">
            {STATUS_STEPS.map((s, i) => (
              <React.Fragment key={s.key}>
                <div className="flex flex-col items-center gap-1">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    i <= stepIdx
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-200 text-gray-400'
                  }`}>
                    {i <= stepIdx ? '✓' : i + 1}
                  </div>
                  <span className={`text-[9px] font-medium ${i <= stepIdx ? 'text-red-600' : 'text-gray-400'}`}>
                    {s.label}
                  </span>
                </div>
                {i < STATUS_STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 rounded-full mb-4 ${i < stepIdx ? 'bg-red-500' : 'bg-gray-200'}`} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Commande # */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-400">Commande #{shortId}</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">{serviceLabel}</span>
              <span className="text-xs text-gray-300">·</span>
              <span className="text-xs text-gray-400">{packageLabel}</span>
            </div>
          </div>

          {/* Livreur */}
          {driver && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl mb-3">
              <div className="w-11 h-11 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {driver.photoUrl ? (
                  <img src={driver.photoUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-gray-600 font-bold">{driver.name.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{driver.name}</p>
                {driver.vehiclePlate && (
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{driver.vehiclePlate}</span>
                )}
              </div>
              <button
                onClick={onMessageDriver}
                className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center active:scale-95"
                style={{ touchAction: 'manipulation' }}
              >
                <MessageSquare size={14} className="text-gray-600" />
              </button>
              <button
                onClick={onCallDriver}
                className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center active:scale-95"
                style={{ touchAction: 'manipulation' }}
              >
                <Phone size={14} className="text-white" />
              </button>
            </div>
          )}

          {/* Recherche en cours */}
          {status === 'searching' && (
            <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-2xl mb-3">
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-900">Recherche d'un livreur</p>
                <p className="text-xs text-amber-600">Nous cherchons le livreur le plus proche</p>
              </div>
            </div>
          )}

          {/* Trajet */}
          {(snap === 'half' || snap === 'full') && (
            <div className="bg-gray-50 rounded-2xl p-4 mb-3">
              <div className="flex gap-3">
                <div className="flex flex-col items-center pt-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                  <div className="w-0.5 flex-1 bg-gray-300 my-1 min-h-[20px]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                </div>
                <div className="flex-1 min-w-0 space-y-3">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Collecte</p>
                    <p className="text-sm font-medium text-gray-900 truncate">{pickupLabel}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Livraison</p>
                    <p className="text-sm font-medium text-gray-900 truncate">{destinationLabel}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Prix + Destinataire */}
          {(snap === 'half' || snap === 'full') && (
            <>
              <div className="flex items-center justify-between py-3 px-1 mb-2 border-t border-gray-100">
                <span className="text-sm text-gray-500">Montant</span>
                <span className="text-lg font-bold text-gray-900">{formatPrice(fareAmount)} {currency}</span>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
                <MapPin size={16} className="text-red-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400">Destinataire</p>
                  <p className="text-sm font-semibold text-gray-900 truncate">{recipientName}</p>
                </div>
                <button
                  onClick={onCallRecipient}
                  className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center active:scale-95"
                  style={{ touchAction: 'manipulation' }}
                >
                  <Phone size={14} className="text-white" />
                </button>
              </div>
            </>
          )}

          {/* Bouton Annuler visible */}
          {canCancel && (
            <button
              onClick={onCancel}
              className="w-full py-3 mt-4 rounded-xl border border-red-200 text-red-600 font-semibold text-sm active:bg-red-50"
            >
              Annuler la commande
            </button>
          )}

          {/* Livré */}
          {status === 'delivered' && (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <p className="text-lg font-bold text-gray-900">Livraison effectuée</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{formatPrice(fareAmount)} {currency}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
