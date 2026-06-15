import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Crown, Star, Gift, TrendingUp, Check, Lock, Truck, Car, Home, Sparkles } from 'lucide-react';
import { usePartnerLoyalty } from '@/hooks/usePartnerLoyalty';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

const tierConfig: Record<string, { icon: React.ReactNode; color: string; progressColor: string; gradient: string }> = {
  bronze: {
    icon: <Star className="h-5 w-5" />,
    color: 'text-amber-700',
    progressColor: 'bg-amber-500',
    gradient: 'from-slate-800 to-slate-900',
  },
  silver: {
    icon: <Star className="h-5 w-5" />,
    color: 'text-slate-400',
    progressColor: 'bg-slate-400',
    gradient: 'from-slate-800 to-slate-900',
  },
  gold: {
    icon: <Crown className="h-5 w-5" />,
    color: 'text-yellow-400',
    progressColor: 'bg-yellow-400',
    gradient: 'from-slate-800 to-slate-900',
  },
  platinum: {
    icon: <Crown className="h-5 w-5" />,
    color: 'text-purple-400',
    progressColor: 'bg-purple-400',
    gradient: 'from-slate-800 to-slate-900',
  },
};

const tierBenefits: Record<string, string[]> = {
  bronze: ['Dashboard partenaire', 'Support email', 'Commission 5%'],
  silver: ['Support prioritaire', 'Commission 4%', 'Badge vérifié'],
  gold: ['Gestionnaire dédié', 'Commission 3%', 'Priorité affectations'],
  platinum: ['Commission 2%', 'Ligne directe', 'Événements VIP', 'Bonus annuel'],
};

const earnActions = [
  { icon: Car, label: 'Course complétée', pts: '+10', color: 'text-blue-500 bg-blue-500/10' },
  { icon: Truck, label: 'Livraison réussie', pts: '+15', color: 'text-emerald-500 bg-emerald-500/10' },
  { icon: Home, label: 'Location véhicule', pts: '+50', color: 'text-purple-500 bg-purple-500/10' },
];

export const PartnerLoyaltyProgram = () => {
  const { data, isLoading } = usePartnerLoyalty();

  if (isLoading) {
    return (
      <div className="space-y-4 p-1">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  const points = data?.points ?? 0;
  const tier = data?.tier ?? { id: 'bronze', name: 'Bronze', minPoints: 0, commission: '5%' };
  const nextTier = data?.nextTier ?? null;
  const progress = data?.progress ?? 0;
  const pointsToNext = data?.pointsToNext ?? 1000;
  const tiers = data?.tiers ?? [];
  const config = tierConfig[tier.id] || tierConfig.bronze;

  return (
    <div className="space-y-4 p-1">
      {/* Carte niveau actuel - dark slate */}
      <div className={cn("rounded-2xl p-5 bg-gradient-to-br text-white", config.gradient)}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={cn("p-2.5 rounded-xl bg-white/10", config.color)}>
              {config.icon}
            </div>
            <div>
              <p className="text-xs text-white/60">Niveau actuel</p>
              <h2 className="text-lg font-bold">{tier.name}</h2>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{points.toLocaleString()}</p>
            <p className="text-xs text-white/60">points</p>
          </div>
        </div>

        {nextTier ? (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-white/70">
              <span>Vers {nextTier.name}</span>
              <span>{pointsToNext.toLocaleString()} pts restants</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className={cn("h-full rounded-full", config.progressColor)}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
          </div>
        ) : (
          <p className="text-xs text-white/60 flex items-center gap-1">
            <Sparkles className="h-3 w-3" /> Niveau maximum atteint !
          </p>
        )}
      </div>

      {/* État vide */}
      {points === 0 && (
        <div className="text-center py-4 text-muted-foreground text-sm">
          <Gift className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
          Commencez à gagner des points avec vos activités !
        </div>
      )}

      {/* Comment gagner */}
      <div>
        <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
          <TrendingUp className="h-4 w-4 text-primary" />
          Comment gagner
        </h3>
        <div className="space-y-2">
          {earnActions.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="flex items-center justify-between p-2.5 rounded-xl bg-muted/50">
                <div className="flex items-center gap-2.5">
                  <div className={cn("p-1.5 rounded-lg", item.color)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-sm">{item.label}</span>
                </div>
                <Badge variant="secondary" className="font-mono text-xs">{item.pts}</Badge>
              </div>
            );
          })}
        </div>
      </div>

      {/* Niveaux */}
      <div>
        <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
          <Gift className="h-4 w-4 text-primary" />
          Niveaux
        </h3>
        <div className="space-y-2">
          {tiers.map((t) => {
            const isUnlocked = points >= t.minPoints;
            const isCurrent = t.id === tier.id;
            const tc = tierConfig[t.id] || tierConfig.bronze;
            const benefits = tierBenefits[t.id] || [];

            return (
              <div
                key={t.id}
                className={cn(
                  "p-3 rounded-xl border transition-all",
                  isCurrent && "border-primary bg-primary/5",
                  isUnlocked && !isCurrent && "border-border",
                  !isUnlocked && "border-border/40 opacity-50"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={isUnlocked ? tc.color : "text-muted-foreground"}>{tc.icon}</span>
                    <div>
                      <span className={cn("text-sm font-semibold", isUnlocked ? tc.color : "text-muted-foreground")}>
                        {t.name}
                      </span>
                      <span className="text-xs text-muted-foreground ml-2">{t.minPoints.toLocaleString()} pts</span>
                    </div>
                  </div>
                  {isCurrent ? (
                    <Badge className="bg-primary text-xs">Actuel</Badge>
                  ) : isUnlocked ? (
                    <Badge variant="outline" className="text-xs">✓</Badge>
                  ) : (
                    <Lock className="h-4 w-4 text-muted-foreground/50" />
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {benefits.map((b, i) => (
                    <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {b}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
