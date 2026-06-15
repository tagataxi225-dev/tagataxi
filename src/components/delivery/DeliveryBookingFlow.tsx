import React, { useState, useMemo } from 'react';
import {
  ArrowLeft, MapPin, Package, FileText, Box, ShieldAlert,
  UtensilsCrossed, HelpCircle, Clock, ChevronRight, Search, Navigation
} from 'lucide-react';
import dMotoSvg from '@/assets/vehicle-icons/d-moto.svg';
import dFlexSvg from '@/assets/vehicle-icons/d-flex.svg';
import dMaxiSvg from '@/assets/vehicle-icons/d-maxi.svg';

// ============================================================================
// Types
// ============================================================================

interface DeliveryBookingProps {
  cityLabel: string;
  currency: 'CDF' | 'XOF';
  pickupAddress: string;
  destinationAddress: string;
  distanceKm: number | null;
  onBack: () => void;
  onSearchAddress: (type: 'pickup' | 'destination') => void;
  onUseMyLocation: () => void;
  onBook: (data: BookingData) => void;
}

interface BookingData {
  serviceType: 'flash' | 'flex' | 'maxi';
  packageType: string;
  senderPhone: string;
  recipientName: string;
  recipientPhone: string;
  instructions: string;
}

// ============================================================================
// SVG Vehicle Icons
// ============================================================================

function SvgIcon({ src, className }: { src: string; className?: string }) {
  return <img src={src} alt="" className={className || 'w-10 h-10'} />;
}

// ============================================================================
// Constantes
// ============================================================================

const SERVICES = [
  { id: 'flash' as const, label: 'Flash', desc: 'Moto · Express 30 min', Icon: (p: any) => <SvgIcon src={dMotoSvg} {...p} />, basePrice: 5000, perKm: 500, etaLabel: '~30 min', popular: true },
  { id: 'flex' as const, label: 'Flex', desc: 'Van · Flexible 2h', Icon: (p: any) => <SvgIcon src={dFlexSvg} {...p} />, basePrice: 7000, perKm: 400, etaLabel: '~2h', popular: false },
  { id: 'maxi' as const, label: 'Maxi', desc: 'Camion · Gros colis', Icon: (p: any) => <SvgIcon src={dMaxiSvg} {...p} />, basePrice: 12000, perKm: 600, etaLabel: '~3h', popular: false },
];

const PACKAGE_TYPES = [
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'small', label: 'Petit colis', icon: Package },
  { id: 'medium', label: 'Moyen colis', icon: Box },
  { id: 'fragile', label: 'Fragile', icon: ShieldAlert },
  { id: 'food', label: 'Nourriture', icon: UtensilsCrossed },
  { id: 'other', label: 'Autre', icon: HelpCircle },
];

// ============================================================================
// Composant principal
// ============================================================================

export default function DeliveryBookingFlow({
  cityLabel,
  currency,
  pickupAddress,
  destinationAddress,
  distanceKm,
  onBack,
  onSearchAddress,
  onUseMyLocation,
  onBook,
}: DeliveryBookingProps) {
  const [step, setStep] = useState(1);
  const [serviceType, setServiceType] = useState<'flash' | 'flex' | 'maxi'>('flash');
  const [packageType, setPackageType] = useState('small');
  const [senderPhone, setSenderPhone] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [instructions, setInstructions] = useState('');

  const selectedService = SERVICES.find(s => s.id === serviceType)!;
  const price = useMemo(() => {
    if (!distanceKm) return selectedService.basePrice;
    return Math.round(selectedService.basePrice + distanceKm * selectedService.perKm);
  }, [distanceKm, selectedService]);

  const formatPrice = (n: number) => n.toLocaleString('fr-FR');

  const canProceedStep1 = pickupAddress && destinationAddress;
  const canProceedStep2 = packageType && senderPhone.length >= 8;
  const canSubmit = recipientName && recipientPhone.length >= 8;

  const handleSubmit = () => {
    onBook({ serviceType, packageType, senderPhone, recipientName, recipientPhone, instructions });
  };

  return (
    <div className="min-h-screen bg-white flex flex-col" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif' }}>

      {/* ── Header ── */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-100" style={{ paddingTop: 'env(safe-area-inset-top, 8px)' }}>
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={step > 1 ? () => setStep(step - 1) : onBack}
            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center active:bg-gray-200 transition-colors"
            style={{ touchAction: 'manipulation' }}
          >
            <ArrowLeft size={18} className="text-gray-700" />
          </button>
          <div className="flex-1">
            <h1 className="text-base font-bold text-gray-900">Livraison</h1>
            <p className="text-[11px] text-gray-400">{cityLabel} · Étape {step}/3</p>
          </div>
        </div>

        {/* Stepper */}
        <div className="flex gap-1 px-4 pb-3">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className={`flex-1 h-1 rounded-full transition-all duration-300 ${
                i <= step ? 'bg-red-500' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>

      {/* ── Contenu ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-5 py-5">

          {/* ===== ÉTAPE 1 : Adresses + Service ===== */}
          {step === 1 && (
            <div className="space-y-5">
              {/* Adresses */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Adresses</p>

                {/* Pickup */}
                <button
                  onClick={() => onSearchAddress('pickup')}
                  className="w-full flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-3 active:bg-gray-100 transition-colors"
                  style={{ touchAction: 'manipulation' }}
                >
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-[10px] text-gray-400 font-medium">Point de collecte</p>
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {pickupAddress || 'Choisir l\'adresse de collecte'}
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
                </button>

                {/* Destination */}
                <button
                  onClick={() => onSearchAddress('destination')}
                  className="w-full flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-3 active:bg-gray-100 transition-colors"
                  style={{ touchAction: 'manipulation' }}
                >
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-[10px] text-gray-400 font-medium">Point de livraison</p>
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {destinationAddress || 'Choisir la destination'}
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
                </button>

                {distanceKm && (
                  <p className="text-xs text-gray-400 text-center">{distanceKm.toFixed(1)} km estimés</p>
                )}
              </div>

              {/* Services */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Type de livraison</p>
                {SERVICES.map(s => {
                  const isSelected = s.id === serviceType;
                  const svcPrice = distanceKm
                    ? Math.round(s.basePrice + distanceKm * s.perKm)
                    : s.basePrice;

                  return (
                    <button
                      key={s.id}
                      onClick={() => setServiceType(s.id)}
                      className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl transition-all active:scale-[0.98] ${
                        isSelected ? 'bg-red-50 ring-2 ring-red-500' : 'bg-gray-50'
                      }`}
                      style={{ touchAction: 'manipulation' }}
                    >
                      <div className="w-14 h-10 flex items-center justify-center flex-shrink-0">
                        <s.Icon className="w-full h-full" />
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-gray-900">{s.label}</span>
                          {s.popular && (
                            <span className="text-[9px] font-bold text-white bg-red-500 rounded-full px-1.5 py-0.5">Top</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Clock size={10} className="text-gray-400" />
                          <span className="text-xs text-gray-400">{s.etaLabel}</span>
                          <span className="text-xs text-gray-300">·</span>
                          <span className="text-xs text-gray-400">{s.desc}</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`text-sm font-bold ${isSelected ? 'text-red-600' : 'text-gray-900'}`}>
                          {formatPrice(svcPrice)}
                        </p>
                        <p className="text-[10px] text-gray-400">{currency}</p>
                      </div>
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
          )}

          {/* ===== ÉTAPE 2 : Colis + Expéditeur ===== */}
          {step === 2 && (
            <div className="space-y-5">
              {/* Type de colis */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Type de colis</p>
                <div className="grid grid-cols-3 gap-2">
                  {PACKAGE_TYPES.map(p => {
                    const isSelected = p.id === packageType;
                    const Icon = p.icon;
                    return (
                      <button
                        key={p.id}
                        onClick={() => setPackageType(p.id)}
                        className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl transition-all active:scale-95 ${
                          isSelected ? 'bg-red-50 ring-2 ring-red-500' : 'bg-gray-50'
                        }`}
                        style={{ touchAction: 'manipulation' }}
                      >
                        <Icon size={20} className={isSelected ? 'text-red-500' : 'text-gray-400'} />
                        <span className={`text-[11px] font-semibold ${isSelected ? 'text-red-600' : 'text-gray-600'}`}>
                          {p.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Téléphone expéditeur */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Votre téléphone</label>
                <input
                  type="tel"
                  value={senderPhone}
                  onChange={e => setSenderPhone(e.target.value)}
                  placeholder="Ex: 0855354014"
                  className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-300 outline-none focus:ring-2 focus:ring-red-500/30 transition-all"
                />
              </div>

              {/* Instructions */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Instructions livreur</label>
                <textarea
                  value={instructions}
                  onChange={e => setInstructions(e.target.value)}
                  placeholder="Code porte, étage, repère, bâtiment..."
                  rows={2}
                  className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-300 outline-none focus:ring-2 focus:ring-red-500/30 transition-all resize-none"
                />
              </div>
            </div>
          )}

          {/* ===== ÉTAPE 3 : Destinataire + Récap ===== */}
          {step === 3 && (
            <div className="space-y-5">
              {/* Destinataire */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Destinataire</p>
                <input
                  type="text"
                  value={recipientName}
                  onChange={e => setRecipientName(e.target.value)}
                  placeholder="Nom du destinataire"
                  className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-300 outline-none focus:ring-2 focus:ring-red-500/30 transition-all"
                />
                <input
                  type="tel"
                  value={recipientPhone}
                  onChange={e => setRecipientPhone(e.target.value)}
                  placeholder="Téléphone destinataire"
                  className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-300 outline-none focus:ring-2 focus:ring-red-500/30 transition-all"
                />
              </div>

              {/* Récapitulatif */}
              <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Récapitulatif</p>

                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center pt-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                    <div className="w-0.5 h-6 bg-gray-300 my-0.5" />
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  </div>
                  <div className="flex-1 space-y-3 min-w-0">
                    <p className="text-sm text-gray-900 truncate">{pickupAddress}</p>
                    <p className="text-sm text-gray-900 truncate">{destinationAddress}</p>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Service</span>
                    <span className="font-semibold text-gray-900">{selectedService.label}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Colis</span>
                    <span className="font-semibold text-gray-900">{PACKAGE_TYPES.find(p => p.id === packageType)?.label}</span>
                  </div>
                  {distanceKm && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Distance</span>
                      <span className="font-semibold text-gray-900">{distanceKm.toFixed(1)} km</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Destinataire</span>
                    <span className="font-semibold text-gray-900">{recipientName || '—'}</span>
                  </div>
                  {instructions && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Instructions</span>
                      <span className="font-semibold text-gray-900 text-right max-w-[180px] truncate">{instructions}</span>
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-200 pt-3 flex justify-between items-baseline">
                  <span className="text-sm font-medium text-gray-500">Total estimé</span>
                  <div className="text-right">
                    <span className="text-xl font-bold text-gray-900">{formatPrice(price)}</span>
                    <span className="text-xs text-gray-400 ml-1">{currency}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── CTA fixe en bas ── */}
      <div className="border-t border-gray-100 bg-white px-5 pt-3 pb-3" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 12px), 12px)' }}>
        {step === 1 && (
          <button
            onClick={() => setStep(2)}
            disabled={!canProceedStep1}
            className="w-full py-4 rounded-2xl bg-gray-900 text-white font-bold text-base active:bg-gray-800 transition-colors disabled:opacity-40"
            style={{ touchAction: 'manipulation' }}
          >
            Continuer
          </button>
        )}
        {step === 2 && (
          <button
            onClick={() => setStep(3)}
            disabled={!canProceedStep2}
            className="w-full py-4 rounded-2xl bg-gray-900 text-white font-bold text-base active:bg-gray-800 transition-colors disabled:opacity-40"
            style={{ touchAction: 'manipulation' }}
          >
            Voir le récapitulatif
          </button>
        )}
        {step === 3 && (
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full py-4 rounded-2xl bg-red-500 text-white font-bold text-base active:bg-red-600 transition-colors disabled:opacity-40 shadow-lg shadow-red-500/20"
            style={{ touchAction: 'manipulation' }}
          >
            Confirmer · {formatPrice(price)} {currency}
          </button>
        )}
      </div>
    </div>
  );
}
