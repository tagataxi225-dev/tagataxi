import { motion } from 'framer-motion';
import { 
  Briefcase, Car, Truck, Store, UtensilsCrossed
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

interface ModernJobFiltersProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  categoryCounts?: Record<string, number>;
}

// Catégories pertinentes pour la RDC
const JOB_CATEGORIES_SIMPLE = [
  { id: 'all', name: { fr: 'Tous', en: 'All' }, icon: Briefcase },
  { id: 'Transport & Logistique', name: { fr: 'Transport', en: 'Transport' }, icon: Car },
  { id: 'Livraison', name: { fr: 'Livraison', en: 'Delivery' }, icon: Truck },
  { id: 'Commerce & Vente', name: { fr: 'Commerce', en: 'Retail' }, icon: Store },
  { id: 'Restauration', name: { fr: 'Restauration', en: 'Food' }, icon: UtensilsCrossed },
];

export const ModernJobFilters = ({
  selectedCategory,
  onCategoryChange,
  categoryCounts = {},
}: ModernJobFiltersProps) => {
  const { language } = useLanguage();

  return (
    <div className="px-4 py-2">
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4">
        {JOB_CATEGORIES_SIMPLE.map((category, index) => {
          const IconComponent = category.icon;
          const isSelected = selectedCategory === category.id;
          const count = categoryCounts[category.id] || 0;
          
          return (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.02 }}
            >
              <Button
                variant="ghost"
                onClick={() => onCategoryChange(category.id)}
                className={`
                  h-8 px-3 rounded-lg shrink-0 gap-1.5 transition-all
                  ${isSelected 
                    ? 'bg-primary/10 text-primary hover:bg-primary/15' 
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                  }
                `}
              >
                <IconComponent className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">
                  {category.name[language]}
                </span>
                {count > 0 && (
                  <span className={`
                    text-[10px] ml-0.5 px-1.5 py-0.5 rounded-full
                    ${isSelected ? 'bg-primary/20' : 'bg-muted-foreground/10'}
                  `}>
                    {count}
                  </span>
                )}
              </Button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
