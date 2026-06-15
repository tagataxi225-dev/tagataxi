import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useUnifiedActivityRobust, UnifiedActivityItem } from '@/hooks/useUnifiedActivityRobust';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RefreshCw, TrendingUp, Package, ShoppingBag, CreditCard, ArrowLeftRight, Car } from 'lucide-react';
import { ModernActivityItem } from './ModernActivityItem';
import { ActivityDetailsSheet } from './ActivityDetailsSheet';
import { motion, AnimatePresence } from 'framer-motion';
import { isToday, isYesterday, isThisWeek, isThisMonth } from 'date-fns';

// ===== Regroupement par date =====
interface DateGroup {
  key: string;
  label: string;
  items: UnifiedActivityItem[];
}

function groupActivitiesByDate(activities: UnifiedActivityItem[]): DateGroup[] {
  const groups: Record<string, UnifiedActivityItem[]> = {
    today: [],
    yesterday: [],
    thisWeek: [],
    thisMonth: [],
    older: [],
  };

  for (const a of activities) {
    const d = new Date(a.timestamp);
    if (isToday(d)) groups.today.push(a);
    else if (isYesterday(d)) groups.yesterday.push(a);
    else if (isThisWeek(d)) groups.thisWeek.push(a);
    else if (isThisMonth(d)) groups.thisMonth.push(a);
    else groups.older.push(a);
  }

  const labels: Record<string, string> = {
    today: "Aujourd'hui",
    yesterday: 'Hier',
    thisWeek: 'Cette semaine',
    thisMonth: 'Ce mois',
    older: 'Plus ancien',
  };

  return Object.entries(groups)
    .filter(([, items]) => items.length > 0)
    .map(([key, items]) => ({ key, label: labels[key], items }));
}

interface ModernActivityScreenProps {
  onBack?: () => void;
}

export const ModernActivityScreen = ({ onBack }: ModernActivityScreenProps) => {
  const { activities, loading, error, refresh, stats, isFromCache } = useUnifiedActivityRobust();
  const [filter, setFilter] = useState<'all' | 'transport' | 'delivery' | 'marketplace' | 'payment' | 'wallet_transfer'>('all');
  const [selected, setSelected] = useState<UnifiedActivityItem | null>(null);
  const [visibleCount, setVisibleCount] = useState(20);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filtered = activities.filter(a => {
    if (filter === 'all') return true;
    if (filter === 'transport') return a.type === 'transport';
    if (filter === 'delivery') return a.type === 'delivery';
    if (filter === 'marketplace') return a.type === 'marketplace_purchase' || a.type === 'marketplace_sale';
    if (filter === 'payment') return a.type === 'payment';
    if (filter === 'wallet_transfer') return a.type === 'wallet_transfer';
    return true;
  });

  const dateGroups = useMemo(() => {
    const visible = filtered.slice(0, visibleCount);
    return groupActivitiesByDate(visible);
  }, [filtered, visibleCount]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 100) {
      setVisibleCount(prev => Math.min(prev + 20, filtered.length));
    }
  };

  useEffect(() => {
    setVisibleCount(20);
  }, [filter]);

  const filters = [
    { key: 'all', label: 'Tous', icon: TrendingUp },
    { key: 'transport', label: 'Transport', icon: Car },
    { key: 'delivery', label: 'Livraisons', icon: Package },
    { key: 'marketplace', label: 'Achats', icon: ShoppingBag },
    { key: 'wallet_transfer', label: 'Transferts', icon: ArrowLeftRight },
    { key: 'payment', label: 'Paiements', icon: CreditCard },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border/40 shadow-sm pt-[env(safe-area-inset-top)]">
        <div className="px-4 pt-3 pb-2">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={onBack} className="h-9 w-9 rounded-full">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-lg font-semibold text-foreground">Activité</h1>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span>{activities.length} transactions</span>
                  {isFromCache && (
                    <>
                      <span className="w-1 h-1 rounded-full bg-amber-500" />
                      <span className="text-amber-600">cache</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={loading} className="h-9 w-9 rounded-full">
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-2 mb-2">
            <div className="text-center p-2.5 rounded-xl bg-muted/40 border border-border/30">
              <div className="text-base font-bold text-foreground">{stats.total}</div>
              <div className="text-[10px] text-muted-foreground">Total</div>
            </div>
            <div className="text-center p-2.5 rounded-xl bg-muted/40 border border-border/30">
              <div className="text-base font-bold text-foreground">{stats.completed}</div>
              <div className="text-[10px] text-muted-foreground">Terminés</div>
            </div>
            <div className="text-center p-2.5 rounded-xl bg-muted/40 border border-border/30">
              <div className="text-base font-bold text-foreground">{stats.pending}</div>
              <div className="text-[10px] text-muted-foreground">En cours</div>
            </div>
            <div className="text-center p-2.5 rounded-xl bg-muted/40 border border-border/30">
              <div className="text-sm font-bold text-foreground">
                {stats.totalAmount >= 1000000 
                  ? `${(stats.totalAmount / 1000000).toFixed(1)}M` 
                  : `${Math.round(stats.totalAmount / 1000)}K`}
              </div>
              <div className="text-[10px] text-muted-foreground">CDF</div>
            </div>
          </div>

          {/* Filtres */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {filters.map(({ key, label, icon: Icon }) => (
              <Button
                key={key}
                variant="ghost"
                size="sm"
                onClick={() => setFilter(key as any)}
                className={`rounded-full flex-shrink-0 h-8 px-3 transition-all duration-200 ${
                  filter === key 
                    ? 'bg-primary text-primary-foreground shadow-sm' 
                    : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Icon className="h-3.5 w-3.5 mr-1.5" />
                <span className="text-xs">{label}</span>
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mx-4 mt-4">
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/30">
              <p className="text-sm text-amber-700 dark:text-amber-400">{error}</p>
              <Button variant="ghost" size="sm" onClick={handleRefresh} className="mt-2 h-7 text-xs text-amber-600">Réessayer</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading skeleton */}
      {loading && activities.length === 0 && (
        <div className="p-4 space-y-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="p-3 rounded-xl bg-card border border-border/30">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-muted/60 rounded-xl animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-muted/60 rounded-full w-2/3 animate-pulse" />
                  <div className="h-2.5 bg-muted/40 rounded-full w-1/3 animate-pulse" />
                </div>
                <div className="w-14 h-8 bg-muted/60 rounded-lg animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Liste groupée par date */}
      {(!loading || activities.length > 0) && (
        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-4 py-3"
        >
          <AnimatePresence>
            {filtered.length === 0 && !loading ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 bg-muted/40 rounded-2xl flex items-center justify-center">
                  <TrendingUp className="h-7 w-7 text-muted-foreground/50" />
                </div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Aucune activité</h3>
                <p className="text-xs text-muted-foreground/70">Vos transactions apparaîtront ici</p>
              </motion.div>
            ) : (
              <div className="space-y-1">
                {dateGroups.map((group) => (
                  <div key={group.key}>
                    {/* Séparateur de date */}
                    <div className="flex items-center gap-3 py-3">
                      <div className="flex-1 h-px bg-border/40" />
                      <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                        {group.label}
                      </span>
                      <div className="flex-1 h-px bg-border/40" />
                    </div>

                    {/* Activités du groupe */}
                    <div className="space-y-2">
                      {group.items.map((item, index) => (
                        <motion.div
                          key={`${item.type}-${item.id}`}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: Math.min(index * 0.03, 0.2) }}
                        >
                          <ModernActivityItem item={item} onClick={setSelected} />
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ))}
                
                {visibleCount < filtered.length && (
                  <div className="py-6 text-center">
                    <div className="w-5 h-5 mx-auto border-2 border-primary/40 border-t-primary rounded-full animate-spin" />
                  </div>
                )}
                
                {filtered.length > 0 && visibleCount >= filtered.length && (
                  <p className="text-center text-xs text-muted-foreground py-6">
                    Toutes les activités affichées
                  </p>
                )}
              </div>
            )}
          </AnimatePresence>
        </div>
      )}

      <ActivityDetailsSheet open={!!selected} item={selected} onOpenChange={(v) => !v && setSelected(null)} />
    </div>
  );
};
