import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { getCategoryTheme } from '@/utils/categoryThemes';

interface Category {
  id: string;
  name: string;
}

interface RentalCategoryBarProps {
  categories: Category[];
  selectedCategory: string | null;
  onCategoryChange: (categoryId: string | null) => void;
  vehicleCounts: Record<string, number>;
  totalVehicles: number;
}

export const RentalCategoryBar: React.FC<RentalCategoryBarProps> = ({
  categories,
  selectedCategory,
  onCategoryChange,
  vehicleCounts,
  totalVehicles,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);


  // Auto-scroll to selected category
  useEffect(() => {
    if (selectedCategory && scrollRef.current) {
      const selectedElement = scrollRef.current.querySelector(`[data-category-id="${selectedCategory}"]`);
      if (selectedElement) {
        selectedElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center',
        });
      }
    }
  }, [selectedCategory]);

  const handleCategoryClick = (categoryId: string | null) => {
    onCategoryChange(categoryId);
  };

  return (
    <div className="sticky top-[155px] z-40 bg-background/95 backdrop-blur-md border-b border-border/50">
      <div className="max-w-7xl mx-auto px-3 py-3">
        <ScrollArea className="w-full" ref={scrollRef}>
          <div className="flex gap-2 pb-2">
            {/* Badge TOUS */}
            <motion.button
              onClick={() => handleCategoryClick(null)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`
                flex items-center gap-2 px-3.5 py-2 rounded-full font-medium text-sm whitespace-nowrap
                transition-all duration-200 shrink-0
                ${selectedCategory === null
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-transparent text-primary border border-primary/20 hover:bg-primary/10'
                }
              `}
              aria-label="Voir tous les véhicules"
              aria-pressed={selectedCategory === null}
            >
              <span className="text-base">🌐</span>
              <span>Tous</span>
              <span className={`
                px-1.5 py-0.5 rounded-full text-xs font-semibold
                ${selectedCategory === null 
                  ? 'bg-white/25 text-white' 
                  : 'bg-primary/10 text-primary'
                }
              `}>
                {totalVehicles}
              </span>
            </motion.button>

            {/* Catégories scrollables */}
            {categories.map((category) => {
              const count = vehicleCounts[category.id] || 0;
              if (count === 0) return null;
              
              const theme = getCategoryTheme(category.name);
              const isActive = selectedCategory === category.id;
              
              return (
                <motion.button
                  key={category.id}
                  data-category-id={category.id}
                  onClick={() => handleCategoryClick(category.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`
                    flex items-center gap-2 px-3.5 py-2 rounded-full font-medium text-sm whitespace-nowrap
                    transition-all duration-200 shrink-0
                    ${isActive
                      ? `bg-gradient-to-r ${theme.gradient} text-white shadow-sm`
                      : 'bg-transparent text-primary border border-primary/20 hover:bg-primary/10'
                    }
                  `}
                  aria-label={`Filtrer par ${category.name}`}
                  aria-pressed={isActive}
                >
                  <span className="text-base">{theme.icon}</span>
                  <span>{category.name.trim()}</span>
                  <span className={`
                    px-1.5 py-0.5 rounded-full text-xs font-semibold
                    ${isActive 
                      ? 'bg-white/25 text-white' 
                      : 'bg-primary/10 text-primary'
                    }
                  `}>
                    {count}
                  </span>
                </motion.button>
              );
            })}
          </div>
          
          <ScrollBar orientation="horizontal" className="h-2" />
        </ScrollArea>
      </div>
    </div>
  );
};
