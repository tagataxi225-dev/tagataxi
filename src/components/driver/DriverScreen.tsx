/**
 * DriverScreen — Premium driver UI
 * Design: Refined dark/light hybrid, iOS-native feel, Careem-level polish
 * All states: offline → idle → incoming → en_route → arrived → in_progress → completed
 */
import React, { useState } from 'react';
import { Phone, MessageSquare, Navigation, MapPin, Clock, DollarSign, Power, Zap } from 'lucide-react';

type DriverState = 'offline' | 'online_idle' | 'request_incoming' | 'en_route_to_pickup' | 'arrived_at_pickup' | 'in_progress' | 'completed';

interface RideRequest {
  id: string;
  pickupLabel: string;
  destinationLabel: string;
  pickupCoords?: { lat: number; lng: number };
  destinationCoords?: { lat: number; lng: number };
  fareAmount: number;
  currency: 'XOF' | 'XOF';
  distanceKm: number;
  clientName: string;
  clientPhone?: string;
  clientPhoto?: string;
  waitingFee?: number;
}

interface DriverStats { todayRides: number; todayEarnings: number; onlineHours: number; currency: string; }

interface Props {
  driverState: DriverState;
  driverFirstName: string;
  ride?: RideRequest;
  stats: DriverStats;
  countdownSeconds?: number;
  elapsedMinutes?: number;
  elapsedDistanceKm?: number;
  serviceType?: 'taxi' | 'delivery';
  onToggleOnline: () => void;
  onAcceptRide: () => void;
  onDeclineRide: () => void;
  onArrivedAtPickup: () => void;
  onStartRide: () => void;
  onCompleteRide: () => void;
  onCallClient: () => void;
  onMessageClient: () => void;
  onNavigate: (lat: number, lng: number) => void;
  onContinue: () => void;
  mapSlot?: React.ReactNode;
}

const F = '-apple-system,BlinkMacSystemFont,"SF Pro Display","Segoe UI",sans-serif';
const fmt = (n: number) => n.toLocaleString('fr-FR');

// ─── Pill button ────────────────────────────────────────────────
const Btn = ({ label, bg, color = '#fff', onPress, small }: { label: string; bg: string; color?: string; onPress: () => void; small?: boolean }) => {
  const [s, setS] = useState(false);
  return (
    <button type="button" onClick={onPress} onTouchStart={() => setS(true)}
      onTouchEnd={(e) => { e.preventDefault(); setS(false); onPress(); }}
      onMouseDown={() => setS(true)} onMouseUp={() => setS(false)}
      style={{
        width: '100%', padding: small ? '13px' : '17px', borderRadius: 18,
        background: bg, border: 'none', cursor: 'pointer',
        fontSize: small ? 14 : 16, fontWeight: 800, color,
        fontFamily: F, touchAction: 'manipulation',
        transform: s ? 'scale(0.97)' : 'scale(1)',
        transition: 'transform 0.12s cubic-bezier(0.34, 1.56, 0.64, 1)',
        boxShadow: bg === '#F2F2F7' ? 'none' : `0 6px 20px ${bg}55`,
        letterSpacing: 0.1,
      }}
    >{label}</button>
  );
};

// ─── Icon action button ──────────────────────────────────────────
const IconBtn = ({ icon, bg, onPress }: { icon: React.ReactNode; bg: string; onPress: () => void }) => (
  <button type="button" onClick={onPress} onTouchEnd={(e) => { e.preventDefault(); onPress(); }}
    style={{ width: 44, height: 44, borderRadius: '50%', background: bg, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', touchAction: 'manipulation', flexShrink: 0, boxShadow: `0 4px 12px ${bg}55` }}>
    {icon}
  </button>
);

export default function DriverScreen({ driverState, driverFirstName, ride, stats, countdownSeconds = 15, elapsedMinutes = 0, serviceType = 'taxi', onToggleOnline, onAcceptRide, onDeclineRide, onArrivedAtPickup, onStartRide, onCompleteRide, onCallClient, onMessageClient, onNavigate, onContinue, mapSlot }: Props) {

  const isInRide = ['en_route_to_pickup', 'arrived_at_pickup', 'in_progress'].includes(driverState);
  const pct = Math.max(0, countdownSeconds / 15);
  const C = 2 * Math.PI * 24;
  const RED = '#E8353B', GREEN = '#30D158', AMBER = '#FF9F0A', BLUE = '#0A84FF';

  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', fontFamily: F, background: '#1C1C1E' }}>

      {/* MAP */}
      <div style={{ position: 'absolute', inset: 0 }}>{mapSlot}</div>

      {/* FLOATING ONLINE TOGGLE */}
      {driverState !== 'request_incoming' && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20, paddingTop: 'env(safe-area-inset-top, 14px)', padding: '14px 16px 0', pointerEvents: 'none' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button onClick={onToggleOnline} onTouchEnd={(e) => { e.preventDefault(); onToggleOnline(); }}
              style={{
                borderRadius: 50, padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 7,
                background: driverState === 'offline' ? 'rgba(255,255,255,0.95)' : RED,
                color: driverState === 'offline' ? '#3C3C43' : '#fff',
                border: 'none', cursor: 'pointer', pointerEvents: 'auto', touchAction: 'manipulation',
                fontWeight: 800, fontSize: 13, fontFamily: F,
                boxShadow: '0 4px 20px rgba(0,0,0,0.25)', backdropFilter: 'blur(12px)',
              }}>
              <Power size={14} />
              {driverState === 'offline' ? 'Hors ligne' : 'En ligne'}
            </button>
            {!isInRide && (
              <div style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)', borderRadius: 50, padding: '9px 16px', fontSize: 13, fontWeight: 700, color: '#1C1C1E', boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}>
                {driverFirstName}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── IDLE / OFFLINE ── */}
      {(driverState === 'offline' || driverState === 'online_idle') && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 50,
          background: '#fff', borderRadius: '28px 28px 0 0',
          boxShadow: '0 -4px 40px rgba(0,0,0,0.18)',
          paddingBottom: 'calc(64px + max(env(safe-area-inset-bottom, 0px), 0px))',
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 6px' }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: '#E5E5EA' }} />
          </div>

          {driverState === 'online_idle' && (
            <div style={{ padding: '4px 20px 12px', textAlign: 'center' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#F0FDF4', padding: '7px 16px', borderRadius: 50, marginBottom: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: GREEN, boxShadow: `0 0 8px ${GREEN}` }} />
                <span style={{ fontSize: 14, fontWeight: 800, color: '#1A7A35' }}>En attente de courses</span>
              </div>
              <p style={{ fontSize: 12, color: '#8E8E93', margin: 0 }}>Restez proche des zones de forte demande</p>
            </div>
          )}

          {driverState === 'offline' && (
            <div style={{ padding: '8px 20px 12px', textAlign: 'center' }}>
              <p style={{ fontSize: 17, fontWeight: 800, color: '#1C1C1E', margin: '0 0 3px' }}>Bonjour {driverFirstName} 👋</p>
              <p style={{ fontSize: 13, color: '#8E8E93', margin: 0 }}>Passez en ligne pour recevoir des courses</p>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderTop: '1px solid #F2F2F7' }}>
            {[
              { val: fmt(stats.todayRides), sub: 'Courses', c: '#1C1C1E' },
              { val: fmt(stats.todayEarnings), sub: stats.currency, c: RED },
              { val: `${stats.onlineHours}h`, sub: 'En ligne', c: '#1C1C1E' },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: 'center', padding: '16px 8px', borderRight: i < 2 ? '1px solid #F2F2F7' : 'none' }}>
                <p style={{ fontSize: 24, fontWeight: 900, color: s.c, margin: 0, lineHeight: 1.1, letterSpacing: -0.5 }}>{s.val}</p>
                <p style={{ fontSize: 11, color: '#8E8E93', margin: '3px 0 0', fontWeight: 600 }}>{s.sub}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── REQUEST INCOMING ── */}
      {driverState === 'request_incoming' && ride && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.72)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <div style={{ background: '#fff', borderRadius: '32px 32px 0 0', padding: '28px 24px', paddingBottom: 'max(env(safe-area-inset-bottom, 24px), 24px)' }}>

            {/* Countdown */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
              <div style={{ position: 'relative', width: 72, height: 72 }}>
                <svg width="72" height="72" style={{ transform: 'rotate(-90deg)', position: 'absolute', top: 0, left: 0 }}>
                  <circle cx="36" cy="36" r="30" fill="none" stroke="#F2F2F7" strokeWidth="5" />
                  <circle cx="36" cy="36" r="30" fill="none" stroke={pct > 0.4 ? RED : AMBER} strokeWidth="5"
                    strokeDasharray={2 * Math.PI * 30} strokeDashoffset={2 * Math.PI * 30 * (1 - pct)}
                    strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s linear' }} />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 22, fontWeight: 900, color: pct > 0.4 ? RED : AMBER, letterSpacing: -1 }}>{countdownSeconds}</span>
                </div>
              </div>
            </div>

            <p style={{ textAlign: 'center', fontSize: 11, fontWeight: 800, color: '#8E8E93', textTransform: 'uppercase', letterSpacing: 1.5, margin: '0 0 6px' }}>
              {serviceType === 'delivery' ? 'Nouvelle livraison' : 'Nouvelle course'}
            </p>
            <p style={{ textAlign: 'center', fontSize: 38, fontWeight: 900, color: '#1C1C1E', margin: '0 0 20px', letterSpacing: -1.5, lineHeight: 1 }}>
              {fmt(ride.fareAmount)} <span style={{ fontSize: 18, fontWeight: 600, color: '#8E8E93', letterSpacing: 0 }}>{ride.currency}</span>
            </p>

            <div style={{ background: '#F7F7F9', borderRadius: 20, padding: '14px 16px', marginBottom: 20 }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 5, flexShrink: 0 }}>
                  <div style={{ width: 9, height: 9, borderRadius: '50%', background: GREEN }} />
                  <div style={{ width: 2, flex: 1, background: 'linear-gradient(#30D158,#E8353B)', margin: '4px 0', minHeight: 24 }} />
                  <div style={{ width: 9, height: 9, borderRadius: '50%', background: RED }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 11, color: '#8E8E93', fontWeight: 700, margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: 0.5 }}>Départ</p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#1C1C1E', margin: '0 0 12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ride.pickupLabel || 'Position actuelle'}</p>
                  <p style={{ fontSize: 11, color: '#8E8E93', fontWeight: 700, margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: 0.5 }}>Destination</p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#1C1C1E', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ride.destinationLabel || 'À définir'}</p>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <p style={{ fontSize: 18, fontWeight: 900, color: '#1C1C1E', margin: 0, letterSpacing: -0.5 }}>{ride.distanceKm.toFixed(1)}</p>
                  <p style={{ fontSize: 11, color: '#8E8E93', margin: 0 }}>km</p>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Btn label="Accepter" bg={GREEN} onPress={onAcceptRide} />
              <Btn label="Refuser" bg="#F2F2F7" color="#3C3C43" onPress={onDeclineRide} small />
            </div>
          </div>
        </div>
      )}

      {/* ── IN RIDE ── */}
      {isInRide && ride && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 60,
          background: '#fff', borderRadius: '28px 28px 0 0',
          boxShadow: '0 -4px 40px rgba(0,0,0,0.18)',
          paddingBottom: 'max(env(safe-area-inset-bottom, 16px), 16px)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px' }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: '#E5E5EA' }} />
          </div>

          <div style={{ padding: '4px 20px 8px' }}>
            {/* State label */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                background: driverState === 'en_route_to_pickup' ? BLUE : driverState === 'arrived_at_pickup' ? AMBER : RED,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 4px 12px ${driverState === 'en_route_to_pickup' ? BLUE : driverState === 'arrived_at_pickup' ? AMBER : RED}55`,
              }}>
                {driverState === 'en_route_to_pickup' && <Navigation size={14} color="#fff" />}
                {driverState === 'arrived_at_pickup' && <MapPin size={14} color="#fff" />}
                {driverState === 'in_progress' && <Zap size={14} color="#fff" />}
              </div>
              <div>
                <p style={{ fontSize: 16, fontWeight: 800, color: '#1C1C1E', margin: 0 }}>
                  {driverState === 'en_route_to_pickup' && 'En route vers le client'}
                  {driverState === 'arrived_at_pickup' && 'En attente du client'}
                  {driverState === 'in_progress' && 'Course en cours'}
                </p>
                <p style={{ fontSize: 12, color: '#8E8E93', margin: 0 }}>
                  {driverState === 'en_route_to_pickup' && `Arrivée dans ~${Math.ceil(ride.distanceKm * 2)} min`}
                  {driverState === 'arrived_at_pickup' && 'Confirmez quand le client monte'}
                  {driverState === 'in_progress' && `${elapsedMinutes} min en course`}
                </p>
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
              {[
                { val: `${ride.distanceKm.toFixed(1)}`, sub: 'km total', color: '#1C1C1E' },
                { val: `${elapsedMinutes}`, sub: 'min', color: '#1C1C1E' },
                { val: fmt(ride.fareAmount), sub: ride.currency, color: RED },
              ].map((s, i) => (
                <div key={i} style={{ background: '#F7F7F9', borderRadius: 14, padding: '10px 6px', textAlign: 'center' }}>
                  <p style={{ fontSize: 16, fontWeight: 900, color: s.color, margin: 0, letterSpacing: -0.3 }}>{s.val}</p>
                  <p style={{ fontSize: 10, color: '#8E8E93', margin: '2px 0 0', fontWeight: 600 }}>{s.sub}</p>
                </div>
              ))}
            </div>

            {/* Route */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 12, padding: '0 2px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 5, flexShrink: 0 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: driverState === 'in_progress' ? GREEN : BLUE }} />
                <div style={{ width: 2, height: 20, background: '#E5E5EA', margin: '3px 0' }} />
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: driverState === 'in_progress' ? RED : '#C7C7CC' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#1C1C1E', margin: '0 0 8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ride.pickupLabel}</p>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#8E8E93', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ride.destinationLabel}</p>
              </div>
            </div>

            {/* Client + actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#F7F7F9', borderRadius: 18, padding: '12px 14px', marginBottom: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: '50%', background: RED, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden', boxShadow: `0 4px 12px ${RED}44` }}>
                {ride.clientPhoto
                  ? <img src={ride.clientPhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: 17, fontWeight: 900, color: '#fff' }}>{ride.clientName.charAt(0).toUpperCase()}</span>
                }
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 800, color: '#1C1C1E', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ride.clientName}</p>
                <p style={{ fontSize: 11, color: '#8E8E93', margin: 0 }}>Client</p>
              </div>
              <IconBtn icon={<MessageSquare size={16} color="#636366" />} bg="#fff" onPress={onMessageClient} />
              <IconBtn icon={<Phone size={16} color="#fff" />} bg={GREEN} onPress={onCallClient} />
            </div>

            {/* Navigation */}
            {(driverState === 'en_route_to_pickup' || driverState === 'in_progress') && (
              <button onClick={() => { const c = driverState === 'en_route_to_pickup' ? ride.pickupCoords : ride.destinationCoords; if (c) onNavigate(c.lat, c.lng); }}
                onTouchEnd={(e) => { e.preventDefault(); const c = driverState === 'en_route_to_pickup' ? ride.pickupCoords : ride.destinationCoords; if (c) onNavigate(c.lat, c.lng); }}
                style={{ width: '100%', padding: '12px', borderRadius: 14, marginBottom: 10, background: '#EFF6FF', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 14, fontWeight: 700, color: BLUE, touchAction: 'manipulation' }}>
                <Navigation size={15} color={BLUE} />
                {driverState === 'en_route_to_pickup' ? 'Naviguer vers le client' : 'Naviguer vers la destination'}
              </button>
            )}

            {/* CTA */}
            {driverState === 'en_route_to_pickup' && <Btn label="✓  Je suis arrivé" bg={AMBER} onPress={onArrivedAtPickup} />}
            {driverState === 'arrived_at_pickup' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ background: '#FFF9ED', borderRadius: 14, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: AMBER, boxShadow: `0 0 8px ${AMBER}` }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#92400E' }}>En attente du client</span>
                  </div>
                  {(ride?.waitingFee ?? 0) > 0 && (
                    <span style={{ fontSize: 13, fontWeight: 800, color: AMBER }}>+{fmt(ride!.waitingFee!)} {ride!.currency}</span>
                  )}
                </div>
                <Btn label="✓  Client à bord — Démarrer" bg={GREEN} onPress={onStartRide} />
              </div>
            )}
            {driverState === 'in_progress' && <Btn label="✓  Course terminée" bg={RED} onPress={onCompleteRide} />}
          </div>
        </div>
      )}

      {/* ── COMPLETED ── */}
      {driverState === 'completed' && ride && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-end' }}>
          <div style={{ width: '100%', background: '#fff', borderRadius: '32px 32px 0 0', padding: '36px 24px', paddingBottom: 'max(env(safe-area-inset-bottom, 24px), 24px)', textAlign: 'center' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: `linear-gradient(135deg,${GREEN},#28A745)`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: `0 12px 32px ${GREEN}55` }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
            </div>
            <p style={{ fontSize: 12, fontWeight: 800, color: '#8E8E93', textTransform: 'uppercase', letterSpacing: 2, margin: '0 0 8px' }}>Terminée</p>
            <p style={{ fontSize: 44, fontWeight: 900, color: '#1C1C1E', margin: '0 0 4px', letterSpacing: -2, lineHeight: 1 }}>
              {fmt(ride.fareAmount)}<span style={{ fontSize: 20, fontWeight: 600, color: '#8E8E93', marginLeft: 6, letterSpacing: 0 }}>{ride.currency}</span>
            </p>
            <p style={{ fontSize: 14, color: '#8E8E93', margin: '0 0 28px' }}>{ride.distanceKm.toFixed(1)} km · {ride.clientName}</p>
            <Btn label="Continuer" bg="#1C1C1E" onPress={onContinue} />
          </div>
        </div>
      )}
    </div>
  );
}
