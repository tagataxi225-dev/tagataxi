/**
 * TaxiPaymentModal — Premium payment experience
 * Design: Clean iOS-style bottom sheet, Yango/Careem level
 */
import { useState } from 'react';
import { useWalletPayment } from '@/hooks/useWalletPayment';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Phone, Star, CheckCircle, AlertCircle, Wallet, Banknote, ChevronRight } from 'lucide-react';
import { RatingDialog } from '@/components/rating/RatingDialog';
import { ModernTopUpModal } from '@/components/wallet/ModernTopUpModal';

interface BookingData {
  id: string;
  pickup: { address: string };
  destination: { address: string };
  actualPrice: number;
  distance: number;
  duration: string;
  driverId: string;
  driverName?: string;
  driverRating: number;
  currency?: string;
}

interface TaxiPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingData: BookingData;
  onPaymentComplete: () => void;
}

const F = '-apple-system,BlinkMacSystemFont,"SF Pro Display","Segoe UI",sans-serif';
const fmt = (n: number) => n.toLocaleString('fr-FR');

export default function TaxiPaymentModal({ isOpen, onClose, bookingData, onPaymentComplete }: TaxiPaymentModalProps) {
  const { payWithWallet } = useWalletPayment();
  const { user } = useAuth();
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);
  const [lowBalance, setLowBalance] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [showTopUp, setShowTopUp] = useState(false);

  if (!isOpen) return null;

  const currency = bookingData.currency || 'XOF';
  const price = bookingData.actualPrice;

  const handleWallet = async () => {
    if (!user || paying) return;
    setPaying(true);
    setLowBalance(false);
    try {
      const r = await payWithWallet(user.id, price,
        `Course ${bookingData.pickup.address} → ${bookingData.destination.address}`,
        'transport_booking', bookingData.id);
      if (r?.success) {
        setPaid(true);
        setTimeout(() => setShowRating(true), 1200);
      } else if (r?.error === 'Solde insuffisant') {
        setLowBalance(true);
      } else {
        toast.error(r?.error || 'Échec du paiement');
      }
    } catch (e: any) {
      toast.error(e?.message || 'Erreur');
    } finally { setPaying(false); }
  };

  const handleCash = () => {
    toast.success('Paiement en espèces enregistré');
    setTimeout(() => setShowRating(true), 800);
  };

  return (
    <>
      {/* Backdrop */}
      <div onClick={paid ? undefined : onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }} />

      {/* Sheet */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 81,
        background: '#fff', borderRadius: '28px 28px 0 0',
        fontFamily: F,
        paddingBottom: 'max(env(safe-area-inset-bottom, 20px), 20px)',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.2)',
        animation: 'slideUp 0.32s cubic-bezier(0.32,0.72,0,1)',
      }}>
        <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>

        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: '#E5E5EA' }} />
        </div>

        {paid ? (
          /* ── SUCCESS STATE ── */
          <div style={{ padding: '20px 24px 32px', textAlign: 'center' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,#30D158,#28A745)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 8px 24px rgba(48,209,88,0.4)' }}>
              <CheckCircle size={36} color="#fff" strokeWidth={2.5} />
            </div>
            <p style={{ fontSize: 11, fontWeight: 800, color: '#8E8E93', textTransform: 'uppercase', letterSpacing: 2, margin: '0 0 8px' }}>Paiement confirmé</p>
            <p style={{ fontSize: 38, fontWeight: 900, color: '#1C1C1E', margin: '0 0 4px', letterSpacing: -1.5, lineHeight: 1 }}>
              {fmt(price)} <span style={{ fontSize: 16, fontWeight: 600, color: '#8E8E93' }}>{currency}</span>
            </p>
            <p style={{ fontSize: 13, color: '#8E8E93', margin: 0 }}>Via wallet TAGA</p>
          </div>
        ) : (
          <div style={{ padding: '8px 20px 24px' }}>
            {/* Title */}
            <p style={{ fontSize: 20, fontWeight: 900, color: '#1C1C1E', margin: '0 0 20px', letterSpacing: -0.5 }}>
              Paiement de la course
            </p>

            {/* Route summary */}
            <div style={{ background: '#F7F7F9', borderRadius: 18, padding: '14px 16px', marginBottom: 14 }}>
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 5, flexShrink: 0 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#30D158' }} />
                  <div style={{ width: 2, flex: 1, background: 'linear-gradient(#30D158,#E8353B)', margin: '3px 0', minHeight: 20 }} />
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#E8353B' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 11, color: '#8E8E93', fontWeight: 700, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: 0.4 }}>Départ</p>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#1C1C1E', margin: '0 0 10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{bookingData.pickup.address || 'Position actuelle'}</p>
                  <p style={{ fontSize: 11, color: '#8E8E93', fontWeight: 700, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: 0.4 }}>Arrivée</p>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#1C1C1E', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{bookingData.destination.address || 'Destination'}</p>
                </div>
              </div>
            </div>

            {/* Driver */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#F7F7F9', borderRadius: 16, padding: '12px 14px', marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#E8353B', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>{(bookingData.driverName || 'C').charAt(0).toUpperCase()}</span>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 800, color: '#1C1C1E', margin: 0 }}>{bookingData.driverName || 'Chauffeur'}</p>
                {bookingData.driverRating > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    <Star size={12} fill="#FF9F0A" color="#FF9F0A" />
                    <span style={{ fontSize: 12, color: '#636366', fontWeight: 600 }}>{bookingData.driverRating.toFixed(1)}</span>
                  </div>
                )}
              </div>
              {bookingData.distance > 0 && (
                <span style={{ fontSize: 13, color: '#8E8E93', fontWeight: 600 }}>{bookingData.distance.toFixed(1)} km</span>
              )}
            </div>

            {/* Price */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: '#FFF1F0', borderRadius: 16, marginBottom: 20 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#1C1C1E' }}>Total à payer</span>
              <span style={{ fontSize: 26, fontWeight: 900, color: '#E8353B', letterSpacing: -1 }}>
                {fmt(price)} <span style={{ fontSize: 14, fontWeight: 600 }}>{currency}</span>
              </span>
            </div>

            {/* Low balance warning */}
            {lowBalance && (
              <div style={{ background: '#FFF1F0', borderRadius: 16, padding: '14px 16px', marginBottom: 16, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <AlertCircle size={20} color="#E8353B" style={{ flexShrink: 0, marginTop: 1 }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 800, color: '#E8353B', margin: '0 0 4px' }}>Solde insuffisant</p>
                  <p style={{ fontSize: 13, color: '#636366', margin: '0 0 10px' }}>Rechargez votre wallet pour finaliser.</p>
                  <button onClick={() => setShowTopUp(true)}
                    style={{ width: '100%', padding: '12px', borderRadius: 12, background: '#E8353B', border: 'none', color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', touchAction: 'manipulation' }}>
                    Recharger maintenant
                  </button>
                </div>
              </div>
            )}

            {/* CTAs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Wallet */}
              <button onClick={handleWallet} disabled={paying}
                onTouchEnd={(e) => { e.preventDefault(); handleWallet(); }}
                style={{
                  width: '100%', padding: '16px 20px', borderRadius: 18,
                  background: paying ? '#C7C7CC' : '#E8353B',
                  border: 'none', cursor: 'pointer', touchAction: 'manipulation',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  boxShadow: paying ? 'none' : '0 6px 20px rgba(232,53,59,0.35)',
                  transition: 'background 0.15s',
                }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Wallet size={18} color="#fff" />
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <p style={{ fontSize: 15, fontWeight: 800, color: '#fff', margin: 0 }}>
                      {paying ? 'Traitement...' : 'Payer par wallet'}
                    </p>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', margin: 0 }}>Rapide et sécurisé</p>
                  </div>
                </div>
                {!paying && <ChevronRight size={20} color="rgba(255,255,255,0.7)" />}
              </button>

              {/* Cash */}
              <button onClick={handleCash}
                onTouchEnd={(e) => { e.preventDefault(); handleCash(); }}
                style={{
                  width: '100%', padding: '16px 20px', borderRadius: 18,
                  background: '#F7F7F9', border: 'none', cursor: 'pointer', touchAction: 'manipulation',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: '#E5E5EA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Banknote size={18} color="#636366" />
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <p style={{ fontSize: 15, fontWeight: 700, color: '#1C1C1E', margin: 0 }}>Payer en espèces</p>
                    <p style={{ fontSize: 12, color: '#8E8E93', margin: 0 }}>Remettez la somme au chauffeur</p>
                  </div>
                </div>
                <ChevronRight size={20} color="#C7C7CC" />
              </button>
            </div>
          </div>
        )}
      </div>

      <ModernTopUpModal isOpen={showTopUp} onClose={() => setShowTopUp(false)}
        onSuccess={() => { setShowTopUp(false); handleWallet(); }} />

      <RatingDialog open={showRating} onOpenChange={setShowRating}
        ratedUserId={bookingData.driverId}
        ratedUserName={bookingData.driverName || 'Chauffeur'}
        ratedUserType="driver" orderId={bookingData.id} orderType="transport"
        onSuccess={() => { setShowRating(false); onPaymentComplete(); }} />
    </>
  );
}
