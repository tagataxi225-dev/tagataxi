import { UtensilsCrossed, Leaf, Beef, Flame, Pizza, CupSoda, Cookie, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Category {
  id: string;
  name: string;
  icon: LucideIcon;
  categoryId: string | null;
}

const CATEGORIES: Category[] = [
  { id: 'all',        name: 'Tous',     icon: UtensilsCrossed, categoryId: null          },
  { id: 'entrees',    name: 'Entrées',  icon: Leaf,            categoryId: 'entrees'     },
  { id: 'plats',      name: 'Plats',    icon: Beef,            categoryId: 'plats'       },
  { id: 'grillades',  name: 'Grillades',icon: Flame,           categoryId: 'grillades'   },
  { id: 'pizza_pates',name: 'Pizza',    icon: Pizza,           categoryId: 'pizza_pates' },
  { id: 'boissons',   name: 'Boissons', icon: CupSoda,         categoryId: 'boissons'    },
  { id: 'desserts',   name: 'Desserts', icon: Cookie,          categoryId: 'desserts'    },
];

interface CategoryIconsSectionProps {
  activeCategory: string | null;
  onCategorySelect: (categoryId: string | null) => void;
}

export const CategoryIconsSection = ({
  activeCategory,
  onCategorySelect,
}: CategoryIconsSectionProps) => {
  return (
    <section className="py-2 bg-background relative">
      <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

      <div
        className="flex gap-3 px-4 overflow-x-auto scrollbar-hide scroll-smooth"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {CATEGORIES.map((category) => {
          const isActive = activeCategory === category.categoryId;
          const Icon = category.icon;

          return (
            <button
              key={category.id}
              type="button"
              onClick={() => onCategorySelect(category.categoryId)}
              style={{ scrollSnapAlign: 'start', touchAction: 'manipulation' }}
              className="flex flex-col items-center gap-1.5 shrink-0 transition-all duration-200"
            >
              {/* Cercle 48px */}
              <div className={cn(
                'w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200',
                isActive
                  ? 'bg-red-50 ring-2 ring-red-600'
                  : 'bg-neutral-100 hover:bg-neutral-200',
              )}>
                <Icon className={cn(
                  'w-5 h-5 transition-colors',
                  isActive ? 'text-red-600' : 'text-neutral-500',
                )} />
              </div>

              <span className={cn(
                'text-[11px] font-medium leading-tight transition-colors whitespace-nowrap',
                isActive ? 'text-red-600' : 'text-neutral-500',
              )}>
                {category.name}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
};
