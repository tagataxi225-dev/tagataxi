import { useEffect } from 'react';
import { useClientBidding } from '@/hooks/useClientBidding';

interface BiddingStatusPanelProps {
  bookingId: string;
  estimatedPrice: number;
  currency: 'CDF' | 'XOF';
  onDriverAccepted: (driverId: string) => void;
  onCancel: () => void;
}

export default function BiddingStatusPanel({
  bookingId,
  estimatedPrice,
  currency,
  onDriverAccepted,
  onCancel,
}: BiddingStatusPanelProps) {
  const {
    loading,
    offers,
    proposedPrice,
    biddingActive,
    timeRemaining,
    directAcceptDriverId,
    increaseProposal,
    acceptCounterOffer,
    rejectCounterOffer,
  } = useClientBidding({ bookingId, estimatedPrice });

  const step = currency === 'XOF' ? 200 : 500;

  useEffect(() => {
    if (directAcceptDriverId) onDriverAccepted(directAcceptDriverId);
  }, [directAcceptDriverId, onDriverAccepted]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleIncreaseOffer = async () => {
    if (!proposedPrice) return;
    await increaseProposal(proposedPrice + step);
  };

  const handleAcceptOffer = async (offerId: string, driverId: string) => {
    const success = await acceptCounterOffer(offerId, driverId);
    if (success) onDriverAccepted(driverId);
  };

  const sortedOffers = [...offers].sort(
    (a, b) =>
      a.offeredPrice - b.offeredPrice ||
      (a.distanceToPickup ?? 999) - (b.distanceToPickup ?? 999)
  );

  const renderStars = (rating?: number) => {
    const r = Math.round(rating ?? 0);
    return (
      <span className="text-xs leading-none">
        {[1, 2, 3, 4, 5].map((i) => (
          <span key={i} className={i <= r ? 'text-yellow-400' : 'text-gray-300'}>
            ★
          </span>
        ))}
      </span>
    );
  };

  return (
    <div className="flex flex-col h-full max-h-[85vh] bg-white rounded-t-3xl overflow-hidden shadow-xl">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🎯</span>
            <h3 className="font-bold text-base text-gray-900">Mode Enchères</h3>
          </div>
          {biddingActive && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-900 text-white text-xs font-mono font-semibold">
              ⏱ {formatTime(timeRemaining)}
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-gray-500">
          {offers.length} offre{offers.length > 1 ? 's' : ''} reçue{offers.length > 1 ? 's' : ''}
          {proposedPrice ? ` • Votre offre : ${proposedPrice.toLocaleString()} ${currency}` : ''}
        </p>
      </div>

      {/* Scrollable offers */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {sortedOffers.length > 0 ? (
          sortedOffers.map((offer, index) => {
            const diffPct = Math.round(
              ((offer.offeredPrice - estimatedPrice) / estimatedPrice) * 100
            );
            const cheaper = diffPct <= 0;
            const initial = (offer.driverName || 'C').charAt(0).toUpperCase();
            return (
              <div
                key={offer.offerId}
                className="rounded-2xl border border-gray-200 bg-white p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {offer.driverAvatar ? (
                      <img src={offer.driverAvatar} alt={offer.driverName} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold flex-shrink-0">
                        {initial}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm text-gray-900 truncate">
                          {offer.driverName || 'Chauffeur'}
                        </p>
                        {index === 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-bold uppercase tracking-wide flex-shrink-0">
                            Meilleure offre
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {renderStars(offer.driverRating)}
                        {typeof offer.distanceToPickup === 'number' && (
                          <span className="text-xs text-gray-500">
                            📍 {offer.distanceToPickup.toFixed(1)} km
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xl font-bold text-gray-900 leading-none">
                      {offer.offeredPrice.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-gray-400">{currency}</p>
                    <span
                      className={`inline-block mt-1 text-[11px] font-semibold ${
                        cheaper ? 'text-green-600' : 'text-amber-600'
                      }`}
                    >
                      {diffPct > 0 ? `+${diffPct}` : diffPct}%
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleAcceptOffer(offer.offerId, offer.driverId)}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      handleAcceptOffer(offer.offerId, offer.driverId);
                    }}
                    disabled={loading}
                    style={{ touchAction: 'manipulation' }}
                    className="flex-1 h-11 rounded-xl bg-green-600 text-white text-sm font-bold disabled:opacity-50"
                  >
                    Accepter
                  </button>
                  <button
                    type="button"
                    onClick={() => rejectCounterOffer(offer.offerId)}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      rejectCounterOffer(offer.offerId);
                    }}
                    disabled={loading}
                    style={{ touchAction: 'manipulation' }}
                    className="flex-1 h-11 rounded-xl bg-gray-100 text-gray-700 text-sm font-semibold disabled:opacity-50"
                  >
                    Refuser
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-12">
            <div className="text-5xl animate-pulse">⏱️</div>
            <p className="mt-4 text-sm font-medium text-gray-600">
              En attente des chauffeurs
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Les offres apparaîtront ici dès leur réception
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-100 px-4 py-3 space-y-2 bg-white">
        <button
          type="button"
          onClick={handleIncreaseOffer}
          onTouchEnd={(e) => {
            e.preventDefault();
            handleIncreaseOffer();
          }}
          disabled={loading || !proposedPrice}
          style={{ touchAction: 'manipulation' }}
          className="w-full h-12 rounded-xl bg-amber-500 text-white text-sm font-bold disabled:opacity-50"
        >
          Augmenter mon offre +{step.toLocaleString()} {currency}
        </button>
        <button
          type="button"
          onClick={onCancel}
          onTouchEnd={(e) => {
            e.preventDefault();
            onCancel();
          }}
          disabled={loading}
          style={{ touchAction: 'manipulation' }}
          className="w-full h-10 text-sm text-gray-500 font-medium disabled:opacity-50"
        >
          Annuler
        </button>
      </div>
    </div>
  );
}
