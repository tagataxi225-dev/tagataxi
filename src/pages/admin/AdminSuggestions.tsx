import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lightbulb,
  Bug,
  Palette,
  Sparkles,
  MessageCircle,
  Inbox,
  Loader2,
  User,
  Car,
  Store,
  UtensilsCrossed,
  Shield,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface Suggestion {
  id: string;
  user_id: string;
  user_type: string;
  category: string;
  message: string;
  created_at: string | null;
}

const CATEGORY_META: Record<
  string,
  { label: string; icon: React.ElementType; classes: string; dot: string }
> = {
  feature: {
    label: 'Fonctionnalité',
    icon: Sparkles,
    classes: 'bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-500/20',
    dot: 'bg-violet-500',
  },
  bug: {
    label: 'Bug',
    icon: Bug,
    classes: 'bg-red-50 text-red-700 ring-red-200 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/20',
    dot: 'bg-red-500',
  },
  ui: {
    label: 'Interface',
    icon: Palette,
    classes: 'bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-500/20',
    dot: 'bg-sky-500',
  },
  other: {
    label: 'Autre',
    icon: MessageCircle,
    classes: 'bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-500/10 dark:text-slate-300 dark:ring-slate-500/20',
    dot: 'bg-slate-500',
  },
};

const fallbackCategoryMeta = (cat: string) => ({
  label: cat,
  icon: MessageCircle,
  classes: 'bg-muted text-foreground/80 ring-border',
  dot: 'bg-muted-foreground',
});

const USER_TYPE_META: Record<string, { label: string; icon: React.ElementType }> = {
  client: { label: 'Client', icon: User },
  driver: { label: 'Chauffeur', icon: Car },
  partner: { label: 'Partenaire', icon: Store },
  restaurant: { label: 'Restaurant', icon: UtensilsCrossed },
  admin: { label: 'Admin', icon: Shield },
};

const AdminSuggestions = () => {
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const { data: suggestions, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['admin', 'user_suggestions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_suggestions' as any)
        .select('id, user_id, user_type, category, message, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Suggestion[];
    },
  });

  const categories = useMemo(() => {
    const set = new Set<string>();
    suggestions?.forEach((s) => set.add(s.category));
    return Array.from(set).sort();
  }, [suggestions]);

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: suggestions?.length ?? 0 };
    suggestions?.forEach((s) => {
      map[s.category] = (map[s.category] ?? 0) + 1;
    });
    return map;
  }, [suggestions]);

  const filtered = useMemo(() => {
    if (!suggestions) return [];
    if (activeCategory === 'all') return suggestions;
    return suggestions.filter((s) => s.category === activeCategory);
  }, [suggestions, activeCategory]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50/40 via-background to-background dark:from-red-500/5">
      <div className="mx-auto max-w-3xl px-4 py-6 sm:py-10">
        <header className="mb-6 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-500/10 text-red-600 ring-1 ring-red-500/20 dark:text-red-400">
              <Lightbulb className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Suggestions <span className="text-red-500">utilisateurs</span>
              </h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Retours envoyés depuis l’app TAGA.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="rounded-xl border border-border/60 bg-background/80 px-3 py-2 text-xs font-medium text-foreground/80 backdrop-blur-sm transition-colors hover:bg-muted/60 disabled:opacity-50"
          >
            {isRefetching ? 'Actualisation…' : 'Actualiser'}
          </button>
        </header>

        <div className="mb-5 flex flex-wrap gap-2">
          <FilterChip
            label="Tous"
            count={counts.all}
            active={activeCategory === 'all'}
            onClick={() => setActiveCategory('all')}
          />
          {categories.map((cat) => {
            const meta = CATEGORY_META[cat] ?? fallbackCategoryMeta(cat);
            return (
              <FilterChip
                key={cat}
                label={meta.label}
                count={counts[cat] ?? 0}
                active={activeCategory === cat}
                onClick={() => setActiveCategory(cat)}
                dot={meta.dot}
              />
            );
          })}
        </div>

        {isLoading ? (
          <LoadingState />
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : filtered.length === 0 ? (
          <EmptyState filtered={activeCategory !== 'all'} />
        ) : (
          <AnimatePresence mode="popLayout">
            <motion.ul layout className="space-y-3">
              {filtered.map((s) => (
                <SuggestionCard key={s.id} suggestion={s} />
              ))}
            </motion.ul>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

interface FilterChipProps {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  dot?: string;
}

const FilterChip = ({ label, count, active, onClick, dot }: FilterChipProps) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ring-1',
      active
        ? 'bg-red-500 text-white ring-red-500 shadow-[0_4px_14px_-4px_rgba(239,68,68,0.5)]'
        : 'bg-background text-foreground/70 ring-border hover:bg-muted/60'
    )}
  >
    {dot && !active && <span className={cn('h-1.5 w-1.5 rounded-full', dot)} />}
    <span>{label}</span>
    <span
      className={cn(
        'rounded-full px-1.5 py-px text-[10px] font-semibold',
        active ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'
      )}
    >
      {count}
    </span>
  </button>
);

const SuggestionCard = ({ suggestion }: { suggestion: Suggestion }) => {
  const catMeta = CATEGORY_META[suggestion.category] ?? fallbackCategoryMeta(suggestion.category);
  const userMeta = USER_TYPE_META[suggestion.user_type] ?? { label: suggestion.user_type, icon: User };
  const CategoryIcon = catMeta.icon;
  const UserIcon = userMeta.icon;
  const when = suggestion.created_at
    ? formatDistanceToNow(new Date(suggestion.created_at), { addSuffix: true, locale: fr })
    : '—';

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.18 }}
      className="group rounded-2xl border border-border/50 bg-background/80 p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] backdrop-blur-sm transition-shadow hover:shadow-[0_8px_24px_-12px_rgba(0,0,0,0.12)]"
    >
      <div className="mb-2.5 flex items-center justify-between gap-3">
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1',
            catMeta.classes
          )}
        >
          <CategoryIcon className="h-3 w-3" strokeWidth={2.4} />
          {catMeta.label}
        </span>
        <time className="shrink-0 text-[11px] text-muted-foreground">{when}</time>
      </div>

      <p className="whitespace-pre-wrap break-words text-[14px] leading-relaxed text-foreground/90">
        {suggestion.message}
      </p>

      <div className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <UserIcon className="h-3.5 w-3.5" />
        <span className="font-medium text-foreground/70">{userMeta.label}</span>
        <span className="text-muted-foreground/60">·</span>
        <code className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
          {suggestion.user_id.slice(0, 8)}
        </code>
      </div>
    </motion.li>
  );
};

const LoadingState = () => (
  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-background/40 py-16 text-muted-foreground">
    <Loader2 className="h-6 w-6 animate-spin text-red-500" />
    <p className="mt-3 text-sm">Chargement des suggestions…</p>
  </div>
);

const EmptyState = ({ filtered }: { filtered: boolean }) => (
  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-background/40 px-6 py-16 text-center">
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
      <Inbox className="h-6 w-6" />
    </div>
    <h2 className="mt-4 text-base font-semibold text-foreground">
      {filtered ? 'Aucune suggestion dans cette catégorie' : 'Pas encore de suggestion'}
    </h2>
    <p className="mt-1 max-w-sm text-sm text-muted-foreground">
      {filtered
        ? 'Essayez un autre filtre — les utilisateurs ont peut-être écrit ailleurs.'
        : 'Les retours envoyés depuis l’app s’afficheront ici en temps réel.'}
    </p>
  </div>
);

const ErrorState = ({ onRetry }: { onRetry: () => void }) => (
  <div className="flex flex-col items-center justify-center rounded-2xl border border-red-200 bg-red-50/60 px-6 py-12 text-center dark:border-red-500/30 dark:bg-red-500/5">
    <h2 className="text-base font-semibold text-red-700 dark:text-red-300">
      Impossible de charger les suggestions
    </h2>
    <p className="mt-1 max-w-sm text-sm text-red-700/70 dark:text-red-300/70">
      Vérifiez votre connexion ou réessayez dans un instant.
    </p>
    <button
      type="button"
      onClick={onRetry}
      className="mt-4 rounded-xl bg-red-500 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-red-600"
    >
      Réessayer
    </button>
  </div>
);

export default AdminSuggestions;
