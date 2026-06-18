import { useState, useEffect } from 'react';
import { MapPin, Clock, Navigation, TrendingDown, TrendingUp, Zap, X } from 'lucide-react';

interface ModernBiddingCardProps {
  bookingId: string;
  pickupAddress: string;
  destinationAddress: string;
  distance: number;
  estimatedPrice: number;
  clientProposedPrice?: number;
  offerCount: number;
  biddingClosesAt?: string;
  distanceToPickup?: number;
  isBiddingMode?: boolean;
  onAcceptTembeaPrice: () => void;
  onMakeOffer: () => void;
  onIgnore: () => void;
}

export const ModernBiddingCard = ({
  pickupAddress, destinationAddress, distance, estimatedPrice,
  clientProposedPrice, biddingClosesAt, distanceToPickup = 0,
  onAcceptTembeaPrice, onMakeOffer, onIgnore,
}: ModernBiddingCardProps) => {
  const [timeLeft, setTimeLeft] = useState(0);
  useEffect(() => {
    if (!biddingClosesAt) return;
    const tick = () => setTimeLeft(Math.max(0, Math.floor((new Date(biddingClosesAt).getTime() - Date.now()) / 1000)));
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id);
  }, [biddingClosesAt]);

  const fmt = (n: number) => n.toLocaleString('fr-FR');
  const clientPrice = clientProposedPrice ?? estimatedPrice;
  const diff = clientPrice - estimatedPrice;
  const pct = estimatedPrice > 0 ? Math.abs(Math.round((diff / estimatedPrice) * 100)) : 0;
  const isBelow = diff < 0;
  const m = Math.floor(timeLeft / 60), s = timeLeft % 60;
  const urgent = timeLeft > 0 && timeLeft < 30;

  const font = '-apple-system,BlinkMacSystemFont,"SF Pro Display","Segoe UI",sans-serif';

  return (
    <div style={{ background: '#fff', borderRadius: 24, overflow: 'hidden', boxShadow: '0 8px 40px rgba(0,0,0,0.18)', fontFamily: font }}>

      {/* Header */}
      <div style={{ background: urgent ? '#FF3B30' : '#111', padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <Zap size={16} color="#F5C518" fill="#F5C518" />
          <span style={{ color: '#fff', fontSize: 15, fontWeight: 700 }}>Mode Enchères</span>
        </div>
        {timeLeft > 0 && (
          <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: '4px 12px', display: 'flex', alignItems: 'center', gap: 5 }}>
            <Clock size={11} color={urgent ? '#FFD60A' : '#aaa'} />
            <span style={{ color: urgent ? '#FFD60A' : '#fff', fontSize: 14, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
              {m}:{s.toString().padStart(2,'0')}
            </span>
          </div>
        )}
      </div>

      <div style={{ padding: '18px' }}>

        {/* Route */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, background: '#F7F7F9', borderRadius: 16, padding: '14px 14px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 3 }}>
            <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#34C759', flexShrink: 0 }} />
            <div style={{ width: 2, flex: 1, background: 'linear-gradient(#34C759,#E8353B)', margin: '3px 0', minHeight: 22 }} />
            <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#E8353B', flexShrink: 0 }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 10, color: '#8E8E93', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 2 }}>Départ</p>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#1C1C1E', marginBottom: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {pickupAddress || 'Position actuelle'}
            </p>
            <p style={{ fontSize: 10, color: '#8E8E93', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 2 }}>Arrivée</p>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#1C1C1E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {destinationAddress || 'Destination'}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 7, marginBottom: 16 }}>
          {[
            { Icon: MapPin, val: distance > 0 ? `${distance.toFixed(1)}` : '—', unit: 'km course' },
            { Icon: Navigation, val: distanceToPickup > 0 ? `${distanceToPickup.toFixed(1)}` : '—', unit: 'km de vous' },
            { Icon: Clock, val: distanceToPickup > 0 ? `~${Math.max(1,Math.round(distanceToPickup*2.5))}` : '—', unit: 'min arrivée' },
          ].map(({ Icon, val, unit }, i) => (
            <div key={i} style={{ background: '#F7F7F9', borderRadius: 12, padding: '10px 6px', textAlign: 'center' }}>
              <Icon size={12} color="#8E8E93" style={{ margin: '0 auto 4px' }} />
              <p style={{ fontSize: 15, fontWeight: 800, color: '#1C1C1E', lineHeight: 1.1 }}>{val}</p>
              <p style={{ fontSize: 9, color: '#8E8E93', marginTop: 2, fontWeight: 600 }}>{unit}</p>
            </div>
          ))}
        </div>

        {/* Prix */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 18 }}>
          <div style={{ background: '#F7F7F9', borderRadius: 16, padding: '14px 10px', textAlign: 'center' }}>
            <p style={{ fontSize: 10, color: '#8E8E93', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 }}>Prix TAGA</p>
            <p style={{ fontSize: 26, fontWeight: 900, color: '#1C1C1E', lineHeight: 1 }}>{fmt(estimatedPrice)}</p>
            <p style={{ fontSize: 10, color: '#8E8E93', marginTop: 3 }}>CDF</p>
          </div>
          <div style={{ background: clientPrice < estimatedPrice ? '#FFF1F0' : '#F7F7F9', borderRadius: 16, padding: '14px 10px', textAlign: 'center', position: 'relative' }}>
            {pct > 0 && (
              <div style={{ position: 'absolute', top: -8, right: -4, background: isBelow ? '#FF9500' : '#E8353B', borderRadius: 12, padding: '3px 8px', display: 'flex', alignItems: 'center', gap: 3 }}>
                {isBelow ? <TrendingDown size={9} color="#fff" /> : <TrendingUp size={9} color="#fff" />}
                <span style={{ fontSize: 10, fontWeight: 900, color: '#fff' }}>{isBelow ? '-' : '+'}{pct}%</span>
              </div>
            )}
            <p style={{ fontSize: 10, color: '#8E8E93', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 }}>
              {clientProposedPrice ? 'Offre client' : 'À proposer'}
            </p>
            <p style={{ fontSize: 26, fontWeight: 900, color: clientPrice < estimatedPrice ? '#E8353B' : '#1C1C1E', lineHeight: 1 }}>
              {clientProposedPrice ? fmt(clientPrice) : '—'}
            </p>
            <p style={{ fontSize: 10, color: '#8E8E93', marginTop: 3 }}>CDF</p>
          </div>
        </div>

        {/* CTA principal */}
        <button
          type="button"
          onClick={onAcceptTembeaPrice}
          onTouchEnd={(e) => { e.preventDefault(); onAcceptTembeaPrice(); }}
          style={{ width: '100%', padding: '16px', borderRadius: 16, background: '#E8353B', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 9 }}
          onMouseDown={e => (e.currentTarget.style.opacity='0.85')}
          onMouseUp={e => (e.currentTarget.style.opacity='1')}
        >
          <span style={{ fontSize: 17, fontWeight: 800, color: '#fff', letterSpacing: 0.2 }}>
            Accepter {fmt(clientPrice)} CDF
          </span>
        </button>

        {/* Secondaires */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <button
            type="button"
            onClick={onMakeOffer}
            onTouchEnd={(e) => { e.preventDefault(); onMakeOffer(); }}
            style={{ padding: '13px', borderRadius: 14, background: '#fff', border: '2px solid #E8353B', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            <Zap size={14} color="#E8353B" />
            <span style={{ fontSize: 14, fontWeight: 700, color: '#E8353B' }}>Contre-offre</span>
          </button>
          <button
            type="button"
            onClick={onIgnore}
            onTouchEnd={(e) => { e.preventDefault(); onIgnore(); }}
            style={{ padding: '13px', borderRadius: 14, background: '#F7F7F9', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            <X size={14} color="#636366" />
            <span style={{ fontSize: 14, fontWeight: 600, color: '#636366' }}>Ignorer</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default ModernBiddingCard;
