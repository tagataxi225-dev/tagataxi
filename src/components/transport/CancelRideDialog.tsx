import { useState } from 'react';
import { X } from 'lucide-react';

const CANCEL_CSS = `
@keyframes kwenda-dialog-in {
  from { transform: translateY(100%); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
}
`;
let cssInjected = false;
function injectCSS() {
  if (cssInjected || typeof document === 'undefined') return;
  const el = document.createElement('style');
  el.textContent = CANCEL_CSS;
  document.head.appendChild(el);
  cssInjected = true;
}

const REASONS = [
  'Temps d\'attente trop long',
  'J\'ai changé d\'avis',
  'Erreur de destination',
  'Autre',
] as const;

interface CancelRideDialogProps {
  open: boolean;
  isCancelling?: boolean;
  onConfirm: (reason: string) => void;
  onBack: () => void;
}

export default function CancelRideDialog({ open, isCancelling, onConfirm, onBack }: CancelRideDialogProps) {
  injectCSS();
  const [selected, setSelected] = useState<string>(REASONS[0]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[400] flex flex-col justify-end" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div
        className="bg-white rounded-t-3xl px-5 pt-5 pb-safe"
        style={{
          paddingBottom: 'max(env(safe-area-inset-bottom, 20px), 20px)',
          animation: 'kwenda-dialog-in 0.28s cubic-bezier(0.32,0.72,0,1) both',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
        }}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-gray-900">Annuler la course</h3>
          <button type="button" onClick={onBack} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center" style={{ touchAction: 'manipulation' }}>
            <X size={16} className="text-gray-600" />
          </button>
        </div>

        <p className="text-sm text-gray-500 mb-4">Pourquoi annulez-vous ?</p>

        <div className="space-y-2 mb-6">
          {REASONS.map(reason => (
            <button
              key={reason}
              type="button"
              onClick={() => setSelected(reason)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all"
              style={{
                borderColor: selected === reason ? '#ef4444' : '#e5e7eb',
                background: selected === reason ? '#fef2f2' : '#fff',
                touchAction: 'manipulation',
              }}
            >
              <div
                className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                style={{ borderColor: selected === reason ? '#ef4444' : '#d1d5db' }}
              >
                {selected === reason && (
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#ef4444' }} />
                )}
              </div>
              <span className="text-sm font-medium text-gray-800 text-left">{reason}</span>
            </button>
          ))}
        </div>

        <div className="space-y-2">
          <button
            type="button"
            disabled={isCancelling}
            onClick={() => onConfirm(selected)}
            className="w-full py-4 rounded-2xl text-white font-bold text-base disabled:opacity-50"
            style={{ background: '#ef4444', touchAction: 'manipulation' }}
          >
            {isCancelling ? 'Annulation…' : 'Confirmer l\'annulation'}
          </button>
          <button
            type="button"
            onClick={onBack}
            className="w-full py-3 rounded-2xl border border-gray-200 text-gray-600 font-medium text-sm"
            style={{ touchAction: 'manipulation' }}
          >
            Garder la course
          </button>
        </div>
      </div>
    </div>
  );
}
