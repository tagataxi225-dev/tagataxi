import { motion } from 'framer-motion';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface Category {
  id: string;
  name: string;
  emoji: string;
  gradient: string;
  isHot?: boolean;
}

const MARKETPLACE_CATEGORIES: Category[] = [
  { id: 'all', name: 'Tout', emoji: '🛍️', gradient: 'from-orange-500 to-amber-500', isHot: true },
  { id: 'electronics', name: 'Électronique', emoji: '📱', gradient: 'from-blue-500 to-cyan-500', isHot: true },
  { id: 'computers', name: 'Informatique', emoji: '💻', gradient: 'from-violet-500 to-purple-500' },
  { id: 'fashion', name: 'Mode', emoji: '👗', gradient: 'from-pink-500 to-rose-500', isHot: true },
  { id: 'home', name: 'Maison', emoji: '🏠', gradient: 'from-emerald-500 to-green-500' },
  { id: 'food', name: 'Alimentation', emoji: '🍔', gradient: 'from-orange-500 to-red-500' },
  { id: 'baby', name: 'Bébé', emoji: '🍼', gradient: 'from-sky-400 to-blue-400' },
  { id: 'sports', name: 'Sports', emoji: '⚽', gradient: 'from-lime-500 to-green-500' },
  { id: 'books', name: 'Livres', emoji: '📚', gradient: 'from-amber-600 to-yellow-500' },
  { id: 'office', name: 'Bureau', emoji: '💼', gradient: 'from-slate-500 to-gray-500' },
  { id: 'tools', name: 'Outils', emoji: '🔧', gradient: 'from-zinc-500 to-stone-500' },
  { id: 'automotive', name: 'Auto', emoji: '🚗', gradient: 'from-red-500 to-orange-500' },
  { id: 'music', name: 'Musique', emoji: '🎵', gradient: 'from-fuchsia-500 to-pink-500' },
];

interface CategoryScrollBarProps {
  selectedCategory: string;
  onCategoryChange: (categoryId: string) => void;
}

export const CategoryScrollBar = ({
  selectedCategory,
  onCategoryChange
}: CategoryScrollBarProps) => {
  return (
    <div className="sticky top-[132px] z-[130] bg-background/95 backdrop-blur-xl border-b py-3">
      <ScrollArea className="w-full">
        <div className="flex items-center gap-3 px-4">
          {MARKETPLACE_CATEGORIES.map((category, index) => {
            const isActive = selectedCategory === category.id;
            
            return (
              <motion.button
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                whileHover={{ scale: 1.08, y: -4 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onCategoryChange(category.id)}
                className={cn(
                  "relative flex flex-col items-center gap-1.5 px-4 py-3 rounded-2xl transition-all min-w-[90px]",
                  "border-2 shadow-lg",
                  isActive 
                    ? `bg-gradient-to-br ${category.gradient} text-white border-transparent shadow-xl` 
                    : "bg-card border-border hover:border-orange-300 hover:shadow-orange-200/50"
                )}
              >
                {/* Badge Hot */}
                {category.isHot && !isActive && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-1"
                  >
                    <Badge className="bg-gradient-to-r from-orange-500 to-rose-500 text-white text-[9px] px-1.5 py-0 font-bold shadow-lg">
                      🔥
                    </Badge>
                  </motion.div>
                )}
                
                {/* Emoji avec animation */}
                <motion.span 
                  className="text-3xl drop-shadow-lg"
                  animate={isActive ? { 
                    scale: [1, 1.2, 1],
                    rotate: [0, 10, -10, 0]
                  } : {}}
                  transition={{ duration: 0.5 }}
                >
                  {category.emoji}
                </motion.span>
                
                {/* Nom */}
                <span className={cn(
                  "text-xs font-bold whitespace-nowrap",
                  isActive ? "text-white" : "text-foreground"
                )}>
                  {category.name}
                </span>
                
                {/* Indicateur actif */}
                {isActive && (
                  <motion.div
                    layoutId="activeCategoryIndicator"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-white rounded-full shadow-lg"
                    transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
                  />
                )}
                
                {/* Glow effect au hover */}
                <motion.div
                  className={cn(
                    "absolute inset-0 rounded-2xl opacity-0 transition-opacity",
                    `bg-gradient-to-br ${category.gradient}`
                  )}
                  whileHover={{ opacity: 0.1 }}
                />
              </motion.button>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" className="invisible" />
      </ScrollArea>
    </div>
  );
};
