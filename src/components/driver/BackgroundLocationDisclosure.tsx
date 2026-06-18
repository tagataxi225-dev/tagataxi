import React from 'react';
import { MapPin } from 'lucide-react';

interface BackgroundLocationDisclosureProps {
  open: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export const BackgroundLocationDisclosure: React.FC<BackgroundLocationDisclosureProps> = ({
  open,
  onAccept,
  onDecline,
}) => {
  if (!open) return null;

  const handleAccept = () => {
    // Déclenche la popup native Chrome de permission géolocalisation
    navigator.geolocation.getCurrentPosition(
      () => {},
      () => {},
      { enableHighAccuracy: true, timeout: 10000 }
    );
    onAccept();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Overlay sombre */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Card modale */}
      <div className="relative z-10 bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-5">

        {/* Icône */}
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center">
            <MapPin className="w-10 h-10 text-red-600" strokeWidth={2} />
          </div>
        </div>

        {/* Titre */}
        <h2 className="text-center text-xl font-bold text-gray-900">
          Localisation requise
        </h2>

        {/* Description courte */}
        <p className="text-center text-sm text-gray-500 leading-relaxed">
          TAGA a besoin de votre position pour vous attribuer des courses et permettre aux clients de vous suivre en temps réel. Partagée uniquement quand vous êtes en ligne.
        </p>

        {/* Boutons */}
        <div className="space-y-3 pt-1">
          <button
            type="button"
            onClick={handleAccept}
            className="w-full bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            Continuer
          </button>
          <button
            type="button"
            onClick={onDecline}
            className="w-full bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-600 font-medium py-3 rounded-xl transition-colors"
          >
            Refuser
          </button>
        </div>

      </div>
    </div>
  );
};
