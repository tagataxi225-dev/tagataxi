/**
 * RideTrackingScreen — Premium client tracking
 * Design: Clean white with dynamic status colors, iOS-native feel
 * Features: draggable sheet, ETA, waiting timer, driver info
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Phone, MessageSquare, Share2, X, Shield, Star, MapPin, Navigation } from 'lucide-react';
import CancelRideDialog from './CancelRideDialog';

type RideStatus = 'searching' | 'accepted' | 'arriving' | 'arrived' | 'en_route' | 'completed';

interface Driver {
  name: string;
  rating: number;
  photoUrl?: string;
  vehicle?: { plate: string; model: string; color: string };
}

interface RideTrackingProps {
  status: RideStatus;
  etaMinutes: number;
  progressPercent: number;
  pickupLabel: string;
  destinationLabel: string;
  fareAmount: number;
  fareCurrency: 'XOF' | 'XOF';
  driverArrivedAt?: string | null;
  driver: Driver;
  bookingId?: string;
  onBack: () => void;
  onCall: () => void;
  onMessage: () => void;
  onCancel: () => void;
  onShare: () => void;
  onEmergency: () => void;
  mapSlot?: React.ReactNode;
}

const F = '-apple-system,BlinkMacSystemFont,"SF Pro Display","Segoe UI",sans-serif';
const fmt = (n: number) => n.toLocaleString('fr-FR');

type Snap = 'peek' | 'half' | 'full';
const SNAPS: Record<Snap, number> = { peek: 200, half: 400, full: 640 };

const STATUS: Record<RideStatus, { label: string; sub: string; color: string; dot: string }> = {
  searching: { label: "Recherche d'un chauffeur", sub: 'Nous cherchons le meilleur chauffeur', color: '#FF9F0A', dot: '#FF9F0A' },
  accepted:  { label: 'Chauffeur en approche',   sub: 'Il se dirige vers vous',                color: '#0A84FF', dot: '#0A84FF' },
  arriving:  { label: 'Le chauffeur arrive',      sub: 'Préparez-vous à monter',                color: '#0A84FF', dot: '#0A84FF' },
  arrived:   { label: 'Le chauffeur est arrivé',  sub: 'Il vous attend',                        color: '#30D158', dot: '#30D158' },
  en_route:  { label: 'En route vers destination', sub: 'Bonne route !',                        color: '#0A84FF', dot: '#0A84FF' },
  completed: { label: 'Course terminée',           sub: 'Merci d\'avoir utilisé Tembea',         color: '#30D158', dot: '#30D158' },
};

const FREE_MIN = 5;

export default function RideTrackingScreen({
  status, etaMinutes, progressPercent, pickupLabel, destinationLabel,
  fareAmount, fareCurrency, driverArrivedAt, driver,
  bookingId,
  onBack, onCall, onMessage, onCancel, onShare, onEmergency, mapSlot,
}: RideTrackingProps) {

  // Waiting timer
  const [waitSec, setWaitSec] = useState(0);
  useEffect(() => {
    if (status !== 'arrived' || !driverArrivedAt) { setWaitSec(0); return; }
    const t = setInterval(() => {
      const secs = Math.floor((Date.now() - new Date(driverArrivedAt).getTime()) / 1000);
      setWaitSec(secs);
      // Save waiting_fee to DB every 30s so driver sees the same amount
      if (secs > 0 && secs % 30 === 0 && bookingId) {
        const mins = Math.floor(secs / 60);
        const fee = Math.max(0, mins - FREE_MIN) * (fareCurrency === 'XOF' ? 100 : 500);
        supabase.from('transport_bookings')
          .update({ waiting_fee: fee, waiting_started_at: driverArrivedAt })
          .eq('id', bookingId)
          .then(() => {});
      }
    }, 1000);
    return () => clearInterval(t);
  }, [status, driverArrivedAt, bookingId, fareCurrency]);
  const waitMin = Math.floor(waitSec / 60), waitRem = waitSec % 60;
  const extraFee = Math.max(0, waitMin - FREE_MIN) * (fareCurrency === 'XOF' ? 100 : 500);

  // Draggable sheet
  const [snap, setSnap] = useState<Snap>('half');
  const [dragH, setDragH] = useState<number | null>(null);
  const dragY = useRef<number | null>(null);
  const dragBase = useRef(0);
  const sheetRef = useRef<HTMLDivElement>(null);

  const onDragStart = useCallback((y: number) => { dragY.current = y; dragBase.current = SNAPS[snap]; setDragH(SNAPS[snap]); }, [snap]);
  const onDragMove = useCallback((y: number) => { if (dragY.current === null) return; setDragH(Math.max(SNAPS.peek, Math.min(SNAPS.full, dragBase.current + dragY.current - y))); }, []);
  const onDragEnd = useCallback(() => {
    if (dragH === null) return;
    const nearest = (Object.entries(SNAPS) as [Snap, number][]).sort((a, b) => Math.abs(a[1] - dragH) - Math.abs(b[1] - dragH))[0][0];
    setSnap(nearest); setDragH(null); dragY.current = null;
  }, [dragH]);

  useEffect(() => {
    const h = sheetRef.current?.querySelector<HTMLElement>('[data-drag-handle]');
    if (!h) return;
    const ts = (e: TouchEvent) => { e.preventDefault(); onDragStart(e.touches[0].clientY); };
    const tm = (e: TouchEvent) => { if (dragY.current !== null) { e.preventDefault(); onDragMove(e.touches[0].clientY); } };
    const te = (e: TouchEvent) => { e.preventDefault(); onDragEnd(); };
    h.addEventListener('touchstart', ts, { passive: false });
    h.addEventListener('touchmove', tm, { passive: false });
    h.addEventListener('touchend', te, { passive: false });
    return () => { h.removeEventListener('touchstart', ts); h.removeEventListener('touchmove', tm); h.removeEventListener('touchend', te); };
  }, [onDragStart, onDragMove, onDragEnd]);

  const [showCancel, setShowCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const handleCancelConfirm = async (_r: string) => { setCancelling(true); try { await onCancel(); } finally { setCancelling(false); setShowCancel(false); } };

  const height = dragH ?? SNAPS[snap];
  const isDrag = dragH !== null;
  const S = STATUS[status];
  const showDetails = snap !== 'peek';
  const pct = Math.max(0, Math.min(100, progressPercent));

  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', fontFamily: F, background: '#F2F2F7' }}>

      {/* MAP */}
      <div style={{ position: 'absolute', inset: 0 }}>
        {mapSlot || <div style={{ width: '100%', height: '100%', background: '#E8E8E8' }} />}
      </div>

      {/* Top controls */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20, padding: '14px 16px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', pointerEvents: 'none' }}>
        {[
          { icon: <ArrowLeft size={20} color="#1C1C1E" />, action: onBack },
          { icon: <Share2 size={18} color="#1C1C1E" />, action: onShare },
        ].map(({ icon, action }, i) => (
          <button key={i} onClick={action} onTouchEnd={(e) => { e.preventDefault(); action(); }}
            style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', touchAction: 'manipulation', pointerEvents: 'auto', boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}>
            {icon}
          </button>
        ))}
      </div>

      {/* Status pill */}
      <div style={{
        position: 'absolute', top: 72, left: '50%', transform: 'translateX(-50%)',
        zIndex: 20, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)',
        borderRadius: 50, padding: '8px 18px',
        display: 'flex', alignItems: 'center', gap: 8,
        boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
        whiteSpace: 'nowrap',
      }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: S.dot, boxShadow: `0 0 8px ${S.dot}` }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: '#1C1C1E' }}>
          {status === 'arrived' ? `${S.label} · ${String(waitMin).padStart(2,'0')}:${String(waitRem).padStart(2,'0')}` : `${S.label} · ${etaMinutes} min`}
        </span>
      </div>

      {/* SHEET */}
      <div ref={sheetRef}
        style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: '#fff', borderRadius: '28px 28px 0 0',
          boxShadow: '0 -4px 40px rgba(0,0,0,0.15)',
          height, transition: isDrag ? 'none' : 'height 280ms cubic-bezier(0.32,0.72,0,1)',
          zIndex: 30, display: 'flex', flexDirection: 'column',
          touchAction: 'none',
        }}>

        {/* Drag handle */}
        <div data-drag-handle
          onMouseDown={(e) => onDragStart(e.clientY)}
          onMouseMove={(e) => isDrag && onDragMove(e.clientY)}
          onMouseUp={onDragEnd} onMouseLeave={onDragEnd}
          style={{ padding: '12px 0 6px', display: 'flex', justifyContent: 'center', cursor: 'grab', touchAction: 'none' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: '#E5E5EA' }} />
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 20px 24px' }}>

          {/* Status + progress */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div>
                <p style={{ fontSize: 20, fontWeight: 900, color: '#1C1C1E', margin: 0, letterSpacing: -0.5 }}>{S.label}</p>
                <p style={{ fontSize: 13, color: '#8E8E93', margin: '2px 0 0' }}>
                  {status === 'arrived' ? (
                    <span style={{ color: waitMin >= FREE_MIN ? '#E8353B' : '#FF9F0A', fontWeight: 700 }}>
                      ⏱ {String(waitMin).padStart(2,'0')}:{String(waitRem).padStart(2,'0')}
                      {waitMin >= FREE_MIN ? ` (+${fmt(extraFee)} ${fareCurrency})` : ` (${FREE_MIN - waitMin} min gratuites)`}
                    </span>
                  ) : S.sub}
                </p>
              </div>
              {status !== 'searching' && status !== 'completed' && (
                <div style={{ background: '#F7F7F9', borderRadius: 50, padding: '6px 14px' }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: S.color }}>{etaMinutes} min</span>
                </div>
              )}
            </div>
            {/* Progress bar */}
            <div style={{ height: 4, background: '#F2F2F7', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg,${S.color},${S.dot})`, borderRadius: 2, transition: 'width 600ms ease' }} />
            </div>
          </div>

          {/* Driver card */}
          <div style={{ background: '#F7F7F9', borderRadius: 20, padding: '14px 16px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: '#E8353B', flexShrink: 0, overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(232,53,59,0.35)',
            }}>
              {driver.photoUrl
                ? <img src={driver.photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: 20, fontWeight: 900, color: '#fff' }}>{driver.name.charAt(0).toUpperCase()}</span>
              }
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 15, fontWeight: 800, color: '#1C1C1E', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{driver.name}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                <Star size={12} fill="#FF9F0A" color="#FF9F0A" />
                <span style={{ fontSize: 13, color: '#636366', fontWeight: 600 }}>{driver.rating.toFixed(1)}</span>
                {driver.vehicle?.plate && (
                  <><span style={{ color: '#C7C7CC' }}>·</span>
                  <span style={{
                    fontSize: 12, fontWeight: 800, color: '#1C1C1E',
                    background: '#F2F2F7', borderRadius: 8, padding: '3px 8px',
                    letterSpacing: 1.5, fontFamily: 'monospace',
                    border: '1px solid #E5E5EA'
                  }}>{driver.vehicle.plate}</span></>
                )}
              </div>
            </div>
            <button onClick={onMessage} onTouchEnd={(e) => { e.preventDefault(); onMessage(); }}
              style={{ width: 44, height: 44, borderRadius: '50%', background: '#fff', border: '1.5px solid #E5E5EA', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', touchAction: 'manipulation', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <MessageSquare size={17} color="#636366" />
            </button>
            <button onClick={onCall} onTouchEnd={(e) => { e.preventDefault(); onCall(); }}
              style={{ width: 44, height: 44, borderRadius: '50%', background: '#0A84FF', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', touchAction: 'manipulation', boxShadow: '0 4px 14px rgba(10,132,255,0.4)' }}>
              <Phone size={17} color="#fff" />
            </button>
          </div>

          {showDetails && (
            <>
              {/* Route */}
              <div style={{ background: '#F7F7F9', borderRadius: 18, padding: '14px 16px', marginBottom: 12 }}>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 5, flexShrink: 0 }}>
                    <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#30D158' }} />
                    <div style={{ width: 2, flex: 1, background: 'linear-gradient(#30D158,#E8353B)', margin: '4px 0', minHeight: 22 }} />
                    <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#E8353B' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 11, color: '#8E8E93', fontWeight: 700, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: 0.5 }}>Départ</p>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#1C1C1E', margin: '0 0 10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pickupLabel}</p>
                    <p style={{ fontSize: 11, color: '#8E8E93', fontWeight: 700, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: 0.5 }}>Destination</p>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#1C1C1E', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{destinationLabel}</p>
                  </div>
                </div>
              </div>

              {/* Fare */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 4px', borderTop: '1px solid #F2F2F7', marginBottom: 12 }}>
                <span style={{ fontSize: 14, color: '#636366', fontWeight: 600 }}>Prix de la course</span>
                <span style={{ fontSize: 20, fontWeight: 900, color: '#1C1C1E', letterSpacing: -0.5 }}>{fmt(fareAmount)} <span style={{ fontSize: 13, fontWeight: 600, color: '#8E8E93' }}>{fareCurrency}</span></span>
              </div>

              {/* Cancel */}
              {['searching', 'accepted', 'arriving'].includes(status) && (
                <button type="button" onClick={() => setShowCancel(true)} onTouchEnd={(e) => { e.preventDefault(); setShowCancel(true); }}
                  style={{ width: '100%', padding: '13px', borderRadius: 14, background: '#FFF1F0', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 14, fontWeight: 700, color: '#E8353B', marginBottom: 10, touchAction: 'manipulation' }}>
                  <X size={15} color="#E8353B" />
                  Annuler la course
                </button>
              )}
            </>
          )}

          {snap === 'full' && (
            <button type="button" onClick={onEmergency} onTouchEnd={(e) => { e.preventDefault(); onEmergency(); }}
              style={{ width: '100%', padding: '13px', borderRadius: 14, background: '#FFF1F0', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 14, fontWeight: 700, color: '#E8353B', touchAction: 'manipulation' }}>
              <Shield size={15} color="#E8353B" />
              Urgence
            </button>
          )}
        </div>
      </div>

      <CancelRideDialog open={showCancel} isCancelling={cancelling} onConfirm={handleCancelConfirm} onBack={() => setShowCancel(false)} />
    </div>
  );
}
