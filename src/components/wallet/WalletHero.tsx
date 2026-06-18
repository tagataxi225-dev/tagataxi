import React from 'react';
import { Gift, Star } from 'lucide-react';
import { AnimatedBalance } from './AnimatedBalance';
import { useLanguage } from '@/contexts/LanguageContext';

interface WalletHeroProps {
  balance: number;
  mainBalance: number;
  bonusBalance: number;
  currency: string;
  kwendaPoints?: number;
  status?: 'active' | 'limited' | 'suspended';
}

export const WalletHero: React.FC<WalletHeroProps> = ({
  balance,
  mainBalance,
  bonusBalance,
  currency,
  kwendaPoints = 0,
  status = 'active'
}) => {
  const { t } = useLanguage();
  const estimatedPointsValue = Math.round((kwendaPoints / 100) * 1000);

  return (
    <div className="px-4 pt-4 pb-6">
      <div className="relative rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 dark:from-slate-900 dark:to-black p-6 overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-accent/10 rounded-full blur-3xl" />

        {/* Status badge */}
        <div className="relative flex justify-end mb-4">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium text-white/60 bg-white/10">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            {status === 'active' ? 'Actif' : status}
          </span>
        </div>

        {/* Solde principal */}
        <div className="relative text-center mb-5">
          <p className="text-xs text-white/50 mb-1 tracking-wide font-medium uppercase">
            {t('wallet.available_balance')}
          </p>
          <AnimatedBalance
            value={balance}
            currency={currency}
            className="text-3xl font-bold text-white"
          />
        </div>

        {/* Chips bonus + points */}
        <div className="relative flex items-center justify-center gap-2.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-sm">
            <Gift className="h-3 w-3 text-white/50" />
            <span className="text-[11px] font-medium text-white/80">
              {bonusBalance.toLocaleString('fr-FR')} {currency}
            </span>
            <span className="text-[10px] text-white/40">bonus</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-sm">
            <Star className="h-3 w-3 text-white/50" />
            <span className="text-[11px] font-medium text-white/80">
              {kwendaPoints.toLocaleString('fr-FR')} pts
            </span>
            {kwendaPoints > 0 && (
              <span className="text-[10px] text-white/40">
                ~{estimatedPointsValue.toLocaleString('fr-FR')} {currency}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
