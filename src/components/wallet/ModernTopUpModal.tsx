/**
 * ModernTopUpModal — Premium wallet top-up
 * 2 steps only: amount → phone number
 * No Dialog, pure bottom sheet with inline styles
 */
import { useState } from 'react';
import { X, Phone, CheckCircle, Loader2, ChevronRight } from 'lucide-react';
import { useWalletValidation } from '@/hooks/useWalletValidation';
import { SuccessConfetti } from './SuccessConfetti';
import { toast } from 'sonner';

type Operator = 'orange' | 'wave';

interface ModernTopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (amount: number) => void;
  userType?: 'client' | 'driver' | 'partner' | 'admin';
  initialAmount?: number;
  currency?: 'XOF' | 'XOF';
  targetUserId?: string;
}

const F = '-apple-system,BlinkMacSystemFont,"SF Pro Display","Segoe UI",sans-serif';
const fmt = (n: number) => n.toLocaleString('fr-FR');
const RED = '#E8353B';

const OPERATORS: Record<string, { name: string; color: string; bg: string }> = {
  orange: { name: 'Orange Money', color: '#FF6600', bg: '#FFF3E0' },
  wave:   { name: 'Wave',         color: '#1AA5E0', bg: '#E3F2FD' },
};

const QUICK: Record<string, number[]> = {
  XOF: [1000, 2000, 5000, 10000, 25000],
  CDF: [2000, 5000, 10000, 25000, 50000],
};

export const ModernTopUpModal: React.FC<ModernTopUpModalProps> = ({
  isOpen, onClose, onSuccess,
  initialAmount, currency = 'XOF',
}) => {
  const [amount, setAmount] = useState(initialAmount?.toString() || '');
  const [operator, setOperator] = useState<Operator | ''>('');
  const [phone, setPhone] = useState('');
  const [step, setStep] = useState<'amount' | 'confirm'>('amount');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const reset = () => {
    setAmount(initialAmount?.toString() || '');
    setOperator('');
    setPhone('');
    setStep('amount');
    setLoading(false);
    setDone(false);
  };

  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = async () => {
    if (!phone.trim() || !operator) { toast.error('Remplissez tous les champs'); return; }
    setLoading(true);
    try {
      await new Promise(r => setTimeout(r, 2000));
      setDone(true);
      setTimeout(() => { onSuccess(parseFloat(amount)); handleClose(); }, 2500);
    } catch {
      toast.error('Erreur de recharge');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;
  const num = parseFloat(amount) || 0;

  return (
    <>
      <div onClick={handleClose}
        style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }} />

      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 91,
        background: '#fff', borderRadius: '28px 28px 0 0',
        fontFamily: F, boxShadow: '0 -8px 40px rgba(0,0,0,0.18)',
        paddingBottom: 'max(env(safe-area-inset-bottom, 20px), 20px)',
        animation: 'slideUp 0.28s cubic-bezier(0.32,0.72,0,1)',
      }}>
        <style>{`@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>

        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: '#E5E5EA' }} />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px 4px' }}>
          <div>
            <p style={{ fontSize: 20, fontWeight: 900, color: '#1C1C1E', margin: 0, letterSpacing: -0.5 }}>
              {step === 'amount' ? 'Recharger le wallet' : 'Confirmer'}
            </p>
            <p style={{ fontSize: 12, color: '#8E8E93', margin: 0 }}>
              {step === 'amount' ? 'Choisissez un montant' : `${fmt(num)} ${currency} via ${OPERATORS[operator]?.name || ''}`}
            </p>
          </div>
          <button onClick={handleClose} style={{ width: 32, height: 32, borderRadius: '50%', background: '#F2F2F7', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <X size={16} color="#636366" />
          </button>
        </div>

        <div style={{ padding: '16px 20px 20px' }}>
          {done ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg,#30D158,#28A745)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 8px 24px rgba(48,209,88,0.4)' }}>
                <CheckCircle size={32} color="#fff" />
              </div>
              <p style={{ fontSize: 18, fontWeight: 800, color: '#1C1C1E', margin: 0 }}>Recharge en cours</p>
              <p style={{ fontSize: 13, color: '#8E8E93', margin: '4px 0 0' }}>Vous recevrez un SMS de confirmation</p>
            </div>

          ) : step === 'amount' ? (
            <>
              {/* Quick amounts */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
                {QUICK[currency].map(q => (
                  <button key={q} type="button"
                    onClick={() => setAmount(q.toString())}
                    style={{
                      padding: '12px 6px', borderRadius: 14, border: 'none', cursor: 'pointer',
                      background: amount === q.toString() ? RED : '#F7F7F9',
                      touchAction: 'manipulation', transition: 'background 0.12s',
                    }}>
                    <p style={{ fontSize: 15, fontWeight: 800, color: amount === q.toString() ? '#fff' : '#1C1C1E', margin: 0 }}>{fmt(q)}</p>
                    <p style={{ fontSize: 10, color: amount === q.toString() ? 'rgba(255,255,255,0.7)' : '#8E8E93', margin: 0 }}>{currency}</p>
                  </button>
                ))}
              </div>

              {/* Custom amount */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ position: 'relative' }}>
                  <input type="number" placeholder="Autre montant" value={amount}
                    onChange={e => setAmount(e.target.value)}
                    style={{ width: '100%', padding: '14px 16px', borderRadius: 16, border: '2px solid', borderColor: amount && !QUICK[currency].includes(parseFloat(amount)) ? RED : '#E5E5EA', fontSize: 16, fontWeight: 700, fontFamily: F, outline: 'none', boxSizing: 'border-box', color: '#1C1C1E' }}
                  />
                  <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: '#8E8E93', fontWeight: 700 }}>{currency}</span>
                </div>
              </div>

              {/* Operator */}
              <p style={{ fontSize: 13, fontWeight: 700, color: '#636366', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: 0.5 }}>Opérateur</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
                {Object.entries(OPERATORS).map(([key, op]) => (
                  <button key={key} type="button"
                    onClick={() => setOperator(key as Operator)}
                    style={{
                      padding: '12px 14px', borderRadius: 16, border: '2px solid',
                      borderColor: operator === key ? op.color : '#E5E5EA',
                      background: operator === key ? op.bg : '#fff',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                      touchAction: 'manipulation',
                    }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: op.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: operator === key ? op.color : '#1C1C1E' }}>{op.name}</span>
                  </button>
                ))}
              </div>

              <button type="button" disabled={!amount || !operator || parseFloat(amount) <= 0}
                onClick={() => setStep('confirm')}
                style={{
                  width: '100%', padding: '16px', borderRadius: 18,
                  background: (!amount || !operator) ? '#C7C7CC' : RED,
                  border: 'none', cursor: 'pointer', touchAction: 'manipulation',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  fontSize: 16, fontWeight: 800, color: '#fff',
                  boxShadow: (!amount || !operator) ? 'none' : `0 6px 20px ${RED}44`,
                }}>
                Continuer
                <ChevronRight size={18} color="#fff" />
              </button>
            </>

          ) : (
            <>
              {/* Confirm step */}
              <div style={{ background: '#F7F7F9', borderRadius: 18, padding: '16px', marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 14, color: '#636366' }}>Montant</span>
                  <span style={{ fontSize: 18, fontWeight: 900, color: RED, letterSpacing: -0.5 }}>{fmt(num)} {currency}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 14, color: '#636366' }}>Opérateur</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#1C1C1E' }}>{OPERATORS[operator]?.name}</span>
                </div>
              </div>

              {/* Phone */}
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#636366', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: 0.5 }}>Numéro Mobile Money</p>
                <div style={{ position: 'relative' }}>
                  <Phone size={16} color="#8E8E93" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                  <input type="tel" placeholder="07 XX XX XX XX" value={phone}
                    onChange={e => setPhone(e.target.value)}
                    style={{ width: '100%', padding: '14px 16px 14px 42px', borderRadius: 16, border: '2px solid #E5E5EA', fontSize: 16, fontWeight: 600, fontFamily: F, outline: 'none', boxSizing: 'border-box', color: '#1C1C1E' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={() => setStep('amount')}
                  style={{ flex: 1, padding: '15px', borderRadius: 16, background: '#F2F2F7', border: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 700, color: '#636366', touchAction: 'manipulation' }}>
                  Retour
                </button>
                <button type="button" onClick={handleSubmit} disabled={loading || !phone}
                  style={{
                    flex: 2, padding: '15px', borderRadius: 16, border: 'none', cursor: 'pointer',
                    background: (loading || !phone) ? '#C7C7CC' : RED,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    fontSize: 15, fontWeight: 800, color: '#fff',
                    boxShadow: (loading || !phone) ? 'none' : `0 6px 20px ${RED}44`,
                    touchAction: 'manipulation',
                  }}>
                  {loading ? <><Loader2 size={16} color="#fff" style={{ animation: 'spin 1s linear infinite' }} /> Traitement...</> : 'Confirmer'}
                  <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <SuccessConfetti show={done} />
    </>
  );
};
