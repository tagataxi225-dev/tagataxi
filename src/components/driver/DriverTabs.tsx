import React, { useState } from 'react';
import {
  TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  Info, Trophy, Zap, Crown, ChevronRight, Star, Gift,
  CheckCircle, AlertTriangle
} from 'lucide-react';

// ============================================================================
// GAINS TAB
// ============================================================================

interface Transaction {
  id: string;
  type: 'ride_earning' | 'delivery_earning' | 'recharge' | 'withdrawal' | 'commission' | 'bonus';
  label: string;
  amount: number;
  fees?: number;
  date: string;
  status?: 'completed' | 'pending' | 'failed';
}

interface GainsTabProps {
  walletBalance: number;
  bonusBalance: number;
  ecoCredits: number;
  kwendaPoints: number;
  currency: string;
  weeklyEarnings: number[];
  weeklyChange: number;
  transactions: Transaction[];
  onWithdraw: () => void;
  onRecharge: () => void;
  lowBalance?: boolean;
  lowBalanceThreshold?: number;
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length === 0) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const w = 200;
  const h = 50;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  });
  const linePath = `M${points.join(' L')}`;
  const areaPath = `${linePath} L${w},${h} L0,${h} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-12" preserveAspectRatio="none">
      <defs>
        <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#sparkGrad)" />
      <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function groupByDay(transactions: Transaction[]): { label: string; items: Transaction[] }[] {
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  const groups: Map<string, Transaction[]> = new Map();

  transactions.forEach(t => {
    const d = new Date(t.date).toDateString();
    const key = d === today ? "Aujourd'hui" : d === yesterday ? 'Hier' : new Date(t.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(t);
  });

  return Array.from(groups.entries()).map(([label, items]) => ({ label, items }));
}

export function GainsTab({
  walletBalance, bonusBalance, ecoCredits, kwendaPoints, currency,
  weeklyEarnings, weeklyChange, transactions,
  onWithdraw, onRecharge,
  lowBalance = false,
  lowBalanceThreshold = 1000,
}: GainsTabProps) {
  const formatPrice = (n: number) => n.toLocaleString('fr-FR');
  const grouped = groupByDay(transactions);
  const hasWeeklyData = weeklyEarnings.some(v => v > 0);

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Wallet card */}
      <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-3xl p-5 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-8 translate-x-8" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-6 -translate-x-6" />

        <div className="relative z-10">
          <p className="text-xs text-white/70 font-medium">Solde TembeaPay</p>
          <p className="text-3xl font-bold mt-1">{formatPrice(walletBalance)} <span className="text-lg text-white/70">{currency}</span></p>
          {bonusBalance > 0 && (
            <p className="text-xs text-white/60 mt-0.5">+ {formatPrice(bonusBalance)} bonus</p>
          )}

          <div className="flex gap-2 mt-4">
            <button
              onClick={onRecharge}
              className="flex-1 py-2.5 rounded-xl bg-white/20 text-white text-sm font-semibold active:bg-white/30 transition-colors"
              style={{ touchAction: 'manipulation' }}
            >
              Recharger
            </button>
            <button
              onClick={onWithdraw}
              className="flex-1 py-2.5 rounded-xl bg-white text-red-600 text-sm font-bold active:bg-gray-100 transition-colors"
              style={{ touchAction: 'manipulation' }}
            >
              Retirer
            </button>
          </div>
        </div>
      </div>

      {/* Alerte solde insuffisant */}
      {lowBalance && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-red-800">Solde insuffisant</p>
            <p className="text-sm text-red-700 mt-0.5">
              Votre solde est en dessous de {formatPrice(lowBalanceThreshold)} {currency}. Rechargez pour continuer à accepter des courses.
            </p>
            <button
              type="button"
              onClick={onRecharge}
              className="mt-3 inline-flex items-center min-h-[44px] px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold active:scale-95 transition-transform"
              style={{ touchAction: 'manipulation' }}
            >
              Recharger
            </button>
          </div>
        </div>
      )}

      {/* Crédit de bienvenue */}
      {bonusBalance > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-start gap-2">
          <span className="text-xl">🎁</span>
          <div>
            <p className="text-sm font-semibold text-green-800">Crédit de bienvenue Tembea</p>
            <p className="text-sm text-green-700">{formatPrice(bonusBalance)} CDF offerts pour démarrer — utilisés automatiquement pour vos commissions, utilisés en priorité avant votre solde réel</p>
          </div>
        </div>
      )}

      {/* Crédits + Points */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-white rounded-2xl p-3 border border-gray-100">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-gray-400 font-semibold uppercase">Éco-crédits</span>
            <Info size={12} className="text-gray-300" />
          </div>
          <p className="text-lg font-bold text-gray-900">{ecoCredits}</p>
        </div>
        <div className="bg-white rounded-2xl p-3 border border-gray-100">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-gray-400 font-semibold uppercase">Points</span>
            <Info size={12} className="text-gray-300" />
          </div>
          <p className="text-lg font-bold text-gray-900">{kwendaPoints}</p>
        </div>
      </div>

      {/* Chart 7 jours */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-gray-900">7 derniers jours</h3>
          {hasWeeklyData && (
            <div className={`flex items-center gap-1 text-xs font-semibold ${weeklyChange >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {weeklyChange >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {weeklyChange >= 0 ? '+' : ''}{weeklyChange}%
            </div>
          )}
        </div>
        {hasWeeklyData ? (
          <Sparkline data={weeklyEarnings} color="#EF4444" />
        ) : (
          <div className="text-center py-6">
            <p className="text-sm text-gray-400">Aucun gain cette semaine</p>
            <p className="text-xs text-gray-300 mt-1">Passez en ligne pour commencer</p>
          </div>
        )}
      </div>

      {/* Transactions */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-gray-900">Transactions</h3>
        {grouped.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 border border-gray-100 text-center">
            <p className="text-sm text-gray-400">Aucune transaction</p>
          </div>
        ) : (
          grouped.map(group => (
            <div key={group.label}>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">{group.label}</p>
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {group.items.map((t, i) => {
                  const isPositive = ['ride_earning', 'delivery_earning', 'recharge', 'bonus'].includes(t.type);
                  return (
                    <div key={t.id} className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? 'border-t border-gray-50' : ''}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isPositive ? 'bg-emerald-100' : 'bg-red-100'}`}>
                        {isPositive ? <ArrowUpRight size={14} className="text-emerald-600" /> : <ArrowDownRight size={14} className="text-red-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {t.label}
                          {t.fees ? <span className="text-xs text-gray-400"> (frais {formatPrice(t.fees)} inclus)</span> : null}
                        </p>
                        {t.status && t.status !== 'completed' && (
                          <span className={`text-[10px] font-bold ${t.status === 'pending' ? 'text-amber-500' : 'text-red-500'}`}>
                            {t.status === 'pending' ? 'En attente' : 'Échoué'}
                          </span>
                        )}
                      </div>
                      <span className={`text-sm font-bold ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                        {isPositive ? '+' : '-'}{formatPrice(Math.abs(t.amount))}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ============================================================================
// CHALLENGES TAB
// ============================================================================

interface Challenge {
  id: string;
  title: string;
  description: string;
  progress: number;
  goal: number;
  reward: string;
  rewardType: 'cash' | 'commission' | 'points';
  expiresAt?: string;
}

interface ChallengesTabProps {
  activeChallenges: Challenge[];
  completedChallenges: Challenge[];
  currency: string;
}

export function ChallengesTab({ activeChallenges, completedChallenges, currency }: ChallengesTabProps) {
  const [filter, setFilter] = useState<'active' | 'completed' | 'rewards'>('active');

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Filter pills */}
      <div className="flex gap-2">
        {(['active', 'completed', 'rewards'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
              filter === f ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-500'
            }`}
            style={{ touchAction: 'manipulation' }}
          >
            {f === 'active' ? 'En cours' : f === 'completed' ? 'Terminés' : 'Récompenses'}
          </button>
        ))}
      </div>

      {filter === 'active' && (
        <div className="space-y-3">
          {activeChallenges.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-gray-100 text-center">
              <Trophy size={32} className="text-gray-200 mx-auto mb-3" />
              <p className="text-sm font-semibold text-gray-900">Aucun défi actif</p>
              <p className="text-xs text-gray-400 mt-1">De nouveaux défis arrivent chaque semaine</p>
            </div>
          ) : (
            activeChallenges.map(c => (
              <div key={c.id} className="bg-white rounded-2xl p-4 border border-gray-100">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-gray-900">{c.title}</h4>
                    <p className="text-xs text-gray-400 mt-0.5">{c.description}</p>
                  </div>
                  <Zap size={16} className="text-amber-500 flex-shrink-0" />
                </div>
                <div className="mb-2">
                  <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                    <span>{c.progress}/{c.goal}</span>
                    <span>{Math.round((c.progress / c.goal) * 100)}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-400 to-red-500 transition-all duration-500"
                      style={{ width: `${Math.min(100, (c.progress / c.goal) * 100)}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-1.5 mt-2">
                  <Gift size={12} className="text-emerald-500" />
                  <span className="text-xs font-semibold text-emerald-600">{c.reward}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {filter === 'completed' && (
        <div className="space-y-3">
          {completedChallenges.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-gray-100 text-center">
              <p className="text-sm text-gray-400">Aucun défi terminé</p>
            </div>
          ) : (
            completedChallenges.map(c => (
              <div key={c.id} className="bg-white rounded-2xl p-4 border border-gray-100 opacity-70">
                <div className="flex items-center gap-3">
                  <CheckCircle size={20} className="text-emerald-500 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-gray-900">{c.title}</h4>
                    <p className="text-xs text-emerald-600">{c.reward}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {filter === 'rewards' && (
        <div className="bg-white rounded-2xl p-8 border border-gray-100 text-center">
          <Star size={32} className="text-gray-200 mx-auto mb-3" />
          <p className="text-sm font-semibold text-gray-900">Catalogue de récompenses</p>
          <p className="text-xs text-gray-400 mt-1">Bientôt disponible</p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// SUBSCRIPTION TAB
// ============================================================================

interface Plan {
  id: string;
  name: string;
  price: number;
  rides: number;
  commission: number;
  features: string[];
  popular?: boolean;
  premium?: boolean;
  isActive?: boolean;
}

interface SubscriptionTabProps {
  activePlan?: { name: string; expiresAt: string; ridesRemaining: number; ridesTotal: number };
  plans: Plan[];
  currency: string;
  walletBalance?: number;
  onSelectPlan: (planId: string) => void;
}

export function SubscriptionTab({ activePlan, plans, currency, walletBalance = 0, onSelectPlan }: SubscriptionTabProps) {
  const formatPrice = (n: number) => n.toLocaleString('fr-FR');
  const currentPlanName = activePlan?.name || plans.find(p => p.price === 0)?.name;

  return (
    <div className="px-4 py-4 space-y-4">
      <h2 className="text-lg font-bold text-gray-900">Abonnement</h2>

      {/* Bannière plan actuel */}
      {currentPlanName && (
        <div className="bg-gray-100 rounded-2xl px-4 py-3">
          <p className="text-sm text-gray-700">
            <span className="font-semibold">Plan actuel :</span> {currentPlanName}
          </p>
        </div>
      )}

      {/* Plan actif */}
      {activePlan && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-emerald-600" />
              <span className="text-sm font-bold text-emerald-900">{activePlan.name}</span>
            </div>
            <span className="text-[10px] text-emerald-600 font-medium">
              Expire le {new Date(activePlan.expiresAt).toLocaleDateString('fr-FR')}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-emerald-700">Courses restantes</span>
            <span className="text-sm font-bold text-emerald-900">
              {activePlan.ridesRemaining} / {activePlan.ridesTotal}
            </span>
          </div>
          <div className="h-1.5 bg-emerald-200 rounded-full overflow-hidden mt-2">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all"
              style={{ width: `${(activePlan.ridesRemaining / activePlan.ridesTotal) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Plans */}
      <div className="space-y-3">
        {plans.map(plan => {
          const isCurrentPlan = plan.isActive || (!activePlan && plan.price === 0);
          const insufficient = plan.price > 0 && walletBalance < plan.price;
          return (
          <div
            key={plan.id}
            className={`rounded-2xl p-4 border overflow-hidden relative ${
              plan.premium
                ? 'bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700 text-white'
                : isCurrentPlan
                  ? 'bg-white border-emerald-200'
                  : 'bg-white border-gray-100'
            }`}
          >
            {plan.popular && !plan.premium && (
              <span className="absolute top-3 right-3 text-[9px] font-bold text-white bg-red-500 rounded-full px-2 py-0.5">
                Populaire
              </span>
            )}
            {plan.premium && (
              <Crown size={16} className="absolute top-3 right-3 text-amber-400" />
            )}

            <h3 className={`text-base font-bold ${plan.premium ? 'text-white' : 'text-gray-900'}`}>{plan.name}</h3>

            <div className="flex items-baseline gap-1 mt-1 mb-3">
              <span className={`text-2xl font-bold ${plan.premium ? 'text-white' : 'text-gray-900'}`}>
                {formatPrice(plan.price)}
              </span>
              <span className={`text-xs ${plan.premium ? 'text-gray-400' : 'text-gray-400'}`}>{currency}/mois</span>
            </div>

            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold mb-3 ${
              plan.premium ? 'bg-amber-500/20 text-amber-400' : 'bg-red-50 text-red-600'
            }`}>
              <Zap size={10} />
              {plan.commission}% de commission
            </div>

            <div className="space-y-1.5 mb-4">
              {plan.features.map((f, i) => (
                <div key={i} className="flex items-center gap-2">
                  <CheckCircle size={12} className={plan.premium ? 'text-emerald-400' : 'text-emerald-500'} />
                  <span className={`text-xs ${plan.premium ? 'text-gray-300' : 'text-gray-600'}`}>{f}</span>
                </div>
              ))}
            </div>

            {isCurrentPlan ? (
              <div className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-100 text-emerald-700 text-sm font-semibold">
                <CheckCircle size={14} />
                Plan actif
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onSelectPlan(plan.id)}
                disabled={insufficient}
                className={`w-full py-2.5 rounded-xl font-semibold text-sm active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100 disabled:cursor-not-allowed ${
                  plan.premium
                    ? 'bg-amber-500 text-gray-900'
                    : 'bg-red-500 text-white'
                }`}
                style={{ touchAction: 'manipulation' }}
              >
                {insufficient
                  ? `Solde insuffisant (${formatPrice(plan.price)} ${currency} requis)`
                  : `Choisir ${plan.name}`}
              </button>
            )}
          </div>
          );
        })}
      </div>
    </div>
  );
}
