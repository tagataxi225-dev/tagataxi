import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { FoodFooterNav } from '@/components/food/FoodFooterNav';
import { FoodBackToTop } from '@/components/food/FoodBackToTop';
import { ArrowLeft, Flame, Tag, MapPin, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useFoodPromos, FoodPromoItem } from '@/hooks/useFoodPromos';
import { formatCurrency } from '@/utils/formatCurrency';
import { FOOD_CATEGORIES } from '@/config/foodCategories';
import { cn } from '@/lib/utils';

function CategoryChips({ active, onSelect }: { active: string | null; onSelect: (id: string | null) => void }) {
  const cats = [{ id: null, name: 'Tous', emoji: '🔥' }, ...FOOD_CATEGORIES.map(c => ({ id: c.id, name: c.name, emoji: c.emoji }))];
  return (
    <div className="flex gap-2 px-4 overflow-x-auto scrollbar-hide py-2">
      {cats.map((cat) => (
        <button
          key={cat.id ?? 'all'}
          onClick={() => onSelect(cat.id)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border",
            active === cat.id
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-muted/40 text-muted-foreground border-border/40 hover:bg-muted"
          )}
        >
          <span>{cat.emoji}</span>
          {cat.name}
        </button>
      ))}
    </div>
  );
}

function PromoCard({ promo, index }: { promo: FoodPromoItem; index: number }) {
  const navigate = useNavigate();
  const isHot = (promo.discount_percentage || 0) >= 30;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card
        className="overflow-hidden border border-border/40 hover:border-primary/40 transition-all cursor-pointer bg-card rounded-2xl shadow-sm hover:shadow-md"
        onClick={() => navigate(`/food?restaurant=${promo.restaurant_id}`)}
      >
        <div className="flex gap-3 p-3">
          {/* Image + Badge */}
          <div className="relative w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-muted">
            {promo.main_image_url ? (
              <img src={promo.main_image_url} alt={promo.name} className="w-full h-full object-cover" loading="lazy" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl">🍽️</div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            <Badge className="absolute top-1.5 right-1.5 bg-destructive text-destructive-foreground text-[11px] font-bold px-1.5 py-0.5 shadow-lg">
              -{promo.discount_percentage}%
            </Badge>
            {isHot && (
              <div className="absolute top-1.5 left-1.5">
                <Flame className="w-4 h-4 text-orange-400 drop-shadow-md" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
            <div>
              <h3 className="font-semibold text-foreground text-sm truncate">{promo.name}</h3>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                {promo.restaurant_logo ? (
                  <img src={promo.restaurant_logo} alt="" className="w-3.5 h-3.5 rounded-full object-cover" />
                ) : (
                  <MapPin className="w-3 h-3 shrink-0" />
                )}
                <span className="truncate">{promo.restaurant_name}</span>
                {promo.restaurant_city && (
                  <span className="text-muted-foreground/60">· {promo.restaurant_city}</span>
                )}
              </p>
              {promo.preparation_time && (
                <p className="text-[11px] text-muted-foreground/70 flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3" /> {promo.preparation_time} min
                </p>
              )}
            </div>

            {/* Pricing */}
            <div className="flex items-baseline gap-2 mt-1.5">
              {promo.original_price && (
                <span className="text-xs text-muted-foreground line-through">
                  {formatCurrency(promo.original_price)}
                </span>
              )}
              <span className="text-base font-bold text-primary">
                {formatCurrency(promo.price)}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

export default function FoodPromos() {
  const navigate = useNavigate();
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const { promos, loading, isEmpty } = useFoodPromos();

  const filtered = categoryFilter
    ? promos.filter(p => p.category === categoryFilter)
    : promos;

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="container max-w-2xl mx-auto px-4 pt-16 space-y-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
        <FoodFooterNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-lg border-b border-border/40">
        <div className="container max-w-2xl mx-auto px-4">
          <div className="flex items-center gap-2 h-14">
            <Button variant="ghost" size="icon" onClick={() => navigate('/food')} className="h-8 w-8 rounded-xl -ml-1">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-lg font-semibold text-foreground flex-1">
              Promos {promos.length > 0 && <span className="text-muted-foreground text-sm font-normal">({promos.length})</span>}
            </h1>
            <Flame className="w-5 h-5 text-destructive" />
          </div>
        </div>
        {/* Category chips */}
        {!isEmpty && (
          <div className="container max-w-2xl mx-auto">
            <CategoryChips active={categoryFilter} onSelect={setCategoryFilter} />
          </div>
        )}
      </div>

      <div className="container max-w-2xl mx-auto px-4 py-4">
        {isEmpty ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center px-6"
          >
            <motion.div
              animate={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 2, repeatDelay: 3 }}
              className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-5"
            >
              <Tag className="w-9 h-9 text-muted-foreground" />
            </motion.div>
            <h2 className="text-xl font-bold text-foreground mb-2">Pas encore de promos</h2>
            <p className="text-sm text-muted-foreground max-w-xs mb-6">
              Les restaurants préparent des offres pour vous ! Revenez bientôt 🔥
            </p>
            <Button variant="outline" onClick={() => navigate('/food/explore')} className="gap-2">
              Explorer les restaurants
            </Button>
          </motion.div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <p className="text-sm text-muted-foreground">Aucune promo dans cette catégorie</p>
            <Button variant="ghost" size="sm" onClick={() => setCategoryFilter(null)} className="mt-2">
              Voir toutes les promos
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-4">
              <Tag className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">
                Offres du moment ({filtered.length})
              </h2>
            </div>
            <div className="space-y-3">
              {filtered.map((promo, index) => (
                <PromoCard key={promo.id} promo={promo} index={index} />
              ))}
            </div>
          </>
        )}
      </div>

      <FoodBackToTop />
      <FoodFooterNav />
    </div>
  );
}
