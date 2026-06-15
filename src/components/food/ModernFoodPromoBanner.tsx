import { Sparkles, ChevronRight } from 'lucide-react';

export const ModernFoodPromoBanner = () => {
  return (
    <div className="px-4">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-500 to-rose-600">
        {/* Subtle dot pattern */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)`,
            backgroundSize: '18px 18px',
          }}
        />

        <div className="relative flex items-center justify-between px-5 py-4 min-h-[100px]">
          {/* Texte */}
          <div className="flex-1 pr-4">
            <h3 className="text-xl font-bold text-white mb-0.5">Profitez des offres</h3>
            <p className="text-sm text-white/75 mb-3">Plats à prix réduits chaque jour</p>
            <button
              type="button"
              className="inline-flex items-center gap-1 px-4 py-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-semibold backdrop-blur-sm active:scale-95 transition-transform"
              style={{ touchAction: 'manipulation' }}
            >
              Voir
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Icône */}
          <div className="shrink-0 w-16 h-16 rounded-2xl bg-white/15 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
};
