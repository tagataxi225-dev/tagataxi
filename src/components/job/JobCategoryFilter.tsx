import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { JOB_CATEGORIES } from '@/types/jobs';
import { useLanguage } from '@/contexts/LanguageContext';
import * as Icons from 'lucide-react';

interface JobCategoryFilterProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

export const JobCategoryFilter = ({ selectedCategory, onCategoryChange }: JobCategoryFilterProps) => {
  const { language } = useLanguage();

  return (
    <div className="px-4 pb-3">
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {JOB_CATEGORIES.map((category, index) => {
          const IconComponent = (Icons as any)[category.icon] || Icons.Briefcase;
          const isSelected = selectedCategory === category.id;

          return (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Button
                variant={isSelected ? 'default' : 'outline'}
                size="sm"
                onClick={() => onCategoryChange(category.id)}
                className={`
                  whitespace-nowrap flex items-center gap-2 transition-all
                  ${isSelected 
                    ? 'bg-primary text-primary-foreground shadow-lg scale-105' 
                    : 'bg-background hover:bg-muted'
                  }
                `}
              >
                <IconComponent className="h-4 w-4" />
                {language === 'fr' ? category.name.fr : category.name.en}
              </Button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
